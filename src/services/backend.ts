import { useSyncExternalStore } from 'react'
import seed from '../data/sample-member-records.json'
import { describePhones, formatAddressOneLine, formatPhone, sameAddress } from '../lib/format'
import type {
  Address,
  AddressSavePayload,
  AuditEntry,
  Member,
  OutboxMessage,
  PendingEmail,
  Phone,
  PhoneSavePayload,
  SaveResult,
  SectionName,
  Settings,
  VerifyResult,
} from '../lib/types'

export const CODE_TTL_MS = 10 * 60 * 1000
export const RESEND_COOLDOWN_MS = 30 * 1000
export const PLACEHOLDER_WORDING_VERSION = 'COMPLIANCE_TEXT_PENDING'
const RETENTION_YEARS = 7

interface PendingInternal extends PendingEmail {
  code: string
}

interface State {
  members: Record<string, Member>
  pending: Record<string, PendingInternal>
  audit: AuditEntry[]
  outbox: OutboxMessage[]
  settings: Settings
  clockOffsetMs: number
}

const DEFAULT_SETTINGS: Settings = { failSaves: false, forcePostalSuggestion: false, latencyMs: 600 }

let state: State = createInitialState()
const listeners = new Set<() => void>()
let idCounter = 0

function nextId(prefix: string) {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

function normalizeSeedPhone(value: string) {
  return value.replace(/\D/g, '')
}

function loadMembers(): Record<string, Member> {
  const members: Record<string, Member> = {}
  for (const record of seed.records) {
    const member = structuredClone(record) as unknown as Member
    member.phones = member.phones.map((phone) => ({ ...phone, number: normalizeSeedPhone(phone.number) }))
    members[member.memberId] = member
  }
  return members
}

function generateCode() {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
}

function createInitialState(): State {
  const members = loadMembers()
  const now = Date.now()
  const pending: Record<string, PendingInternal> = {}
  const pendingRecord = seed.records.find((record) => 'pendingChange' in record.primaryEmail)
  if (pendingRecord) {
    const change = (pendingRecord.primaryEmail as { pendingChange: { newAddress: string } }).pendingChange
    // Seeded timestamps are stale, so the demo change starts fresh; the code is generated, never stored.
    pending[pendingRecord.memberId] = {
      newAddress: change.newAddress,
      code: generateCode(),
      sentAt: now,
      expiresAt: now + CODE_TTL_MS,
      resendAvailableAt: now + RESEND_COOLDOWN_MS,
    }
  }
  return { members, pending, audit: [], outbox: [], settings: { ...DEFAULT_SETTINGS }, clockOffsetMs: 0 }
}

function setState(update: (current: State) => State) {
  state = update(state)
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useBackend(): State {
  return useSyncExternalStore(subscribe, () => state)
}

export function backendNow() {
  return Date.now() + state.clockOffsetMs
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

async function latency() {
  await wait(state.settings.latencyMs)
}

export class ServiceUnavailableError extends Error {
  constructor() {
    super('The save service is unavailable.')
    this.name = 'ServiceUnavailableError'
  }
}

async function guardedSave() {
  await latency()
  if (state.settings.failSaves) throw new ServiceUnavailableError()
}

function memberOrThrow(memberId: string): Member {
  const member = state.members[memberId]
  if (!member) throw new Error(`Unknown member ${memberId}`)
  if (!member.canEditOwnContactInfo) throw new Error('This member cannot edit contact information.')
  return member
}

function writeAudit(member: Member, section: SectionName, oldValue: string, newValue: string) {
  const at = new Date(backendNow())
  const retainUntil = new Date(at)
  retainUntil.setFullYear(retainUntil.getFullYear() + RETENTION_YEARS)
  const entry: AuditEntry = {
    id: nextId('audit'),
    memberId: member.memberId,
    section,
    changedBy: `${member.name.given} ${member.name.family} (member)`,
    at: at.toISOString(),
    oldValue,
    newValue,
    retainUntil: retainUntil.toISOString(),
  }
  setState((current) => ({ ...current, audit: [entry, ...current.audit] }))
}

function sendMessage(message: Omit<OutboxMessage, 'id' | 'at'>) {
  const entry: OutboxMessage = { ...message, id: nextId('msg'), at: new Date(backendNow()).toISOString() }
  setState((current) => ({ ...current, outbox: [entry, ...current.outbox] }))
}

function patchMember(memberId: string, patch: Partial<Member>) {
  setState((current) => ({
    ...current,
    members: { ...current.members, [memberId]: { ...current.members[memberId], ...patch } },
  }))
}

export function getMember(memberId: string): Member | undefined {
  return state.members[memberId]
}

export async function savePhones(memberId: string, payload: PhoneSavePayload): Promise<SaveResult> {
  const member = memberOrThrow(memberId)
  await guardedSave()

  const previous = member.phones
  const phones: Phone[] = payload.phones.map((entry, index) => {
    const wantsConsent = index === 0 && payload.textConsent
    const prior = previous.find((phone) => phone.number === entry.number)
    const keepRecord = wantsConsent && prior?.smsConsent.granted
    return {
      type: entry.type,
      number: entry.number,
      preferred: index === payload.preferredIndex,
      smsConsent: wantsConsent
        ? keepRecord
          ? prior.smsConsent
          : {
              granted: true,
              wordingVersion: PLACEHOLDER_WORDING_VERSION,
              recordedAt: new Date(backendNow()).toISOString(),
            }
        : { granted: false, wordingVersion: null, recordedAt: null },
    }
  })

  const before = describePhones(previous)
  const after = describePhones(phones)
  if (before === after) return { changed: false, confirmation: '' }

  const oldPreferred = previous.find((phone) => phone.preferred) ?? previous[0]
  patchMember(memberId, { phones })
  writeAudit(member, 'phone', before, after)
  if (oldPreferred) {
    sendMessage({
      channel: 'sms',
      to: formatPhone(oldPreferred.number),
      subject: 'Phone numbers changed',
      body: 'Your phone number settings were changed. If this was not you, contact member services.',
    })
  }
  return { changed: true, confirmation: 'We sent a confirmation to your previous phone number.' }
}

export async function saveAddresses(memberId: string, payload: AddressSavePayload): Promise<SaveResult> {
  const member = memberOrThrow(memberId)
  await guardedSave()

  const describe = (home: Address, mailing: AddressSavePayload['mailing']) =>
    `Home: ${formatAddressOneLine(home)}; Mailing: ${
      mailing.sameAsHome || !mailing.address ? 'same as home' : formatAddressOneLine(mailing.address)
    }`

  const before = describe(member.addresses.home, member.addresses.mailing)
  const after = describe(payload.home, payload.mailing)
  if (before === after) return { changed: false, confirmation: '' }

  patchMember(memberId, { addresses: { home: payload.home, mailing: payload.mailing } })
  writeAudit(member, 'address', before, after)
  sendMessage({
    channel: 'email',
    to: member.primaryEmail.address,
    subject: 'Mailing address changed',
    body: 'Your home or mailing address was changed. If this was not you, contact member services.',
  })
  return { changed: true, confirmation: 'We sent a confirmation to your email on file.' }
}

/** Returns a "close match" suggestion from the mock postal service, or null when the address is already standard. */
export async function lookupAddress(address: Address): Promise<Address | null> {
  await latency()
  const abbreviations: [RegExp, string][] = [
    [/\bStreet\b/gi, 'St'],
    [/\bAvenue\b/gi, 'Ave'],
    [/\bRoad\b/gi, 'Rd'],
    [/\bLane\b/gi, 'Ln'],
    [/\bBoulevard\b/gi, 'Blvd'],
    [/\bDrive\b/gi, 'Dr'],
  ]
  let line1 = address.line1.trim()
  for (const [pattern, replacement] of abbreviations) line1 = line1.replace(pattern, replacement)
  let postalCode = address.postalCode.trim()
  if (state.settings.forcePostalSuggestion && /^\d{5}$/.test(postalCode)) postalCode = `${postalCode}-2210`

  const suggestion: Address = {
    line1,
    line2: address.line2.trim(),
    city: address.city.trim(),
    state: address.state.trim().toUpperCase(),
    postalCode,
  }
  return sameAddress(suggestion, address) ? null : suggestion
}

export function getPendingEmail(memberId: string): PendingEmail | undefined {
  const pending = state.pending[memberId]
  if (!pending) return undefined
  const { code: _code, ...rest } = pending
  return rest
}

function issueCode(memberId: string, newAddress: string) {
  const now = backendNow()
  const code = generateCode()
  const pending: PendingInternal = {
    newAddress,
    code,
    sentAt: now,
    expiresAt: now + CODE_TTL_MS,
    resendAvailableAt: now + RESEND_COOLDOWN_MS,
  }
  setState((current) => ({ ...current, pending: { ...current.pending, [memberId]: pending } }))
  sendMessage({
    channel: 'email',
    to: newAddress,
    subject: 'Your verification code',
    body: `Your six-digit verification code is ${code}. It expires in 10 minutes.`,
  })
  return getPendingEmail(memberId) as PendingEmail
}

export async function requestEmailChange(memberId: string, newAddress: string): Promise<PendingEmail> {
  memberOrThrow(memberId)
  await latency()
  return issueCode(memberId, newAddress.trim())
}

export class CooldownError extends Error {
  constructor() {
    super('Resend is not available yet.')
    this.name = 'CooldownError'
  }
}

export async function resendEmailCode(memberId: string): Promise<PendingEmail> {
  memberOrThrow(memberId)
  const pending = state.pending[memberId]
  if (!pending) throw new Error('No email change in progress.')
  if (backendNow() < pending.resendAvailableAt) throw new CooldownError()
  await latency()
  return issueCode(memberId, pending.newAddress)
}

export function cancelEmailChange(memberId: string) {
  setState((current) => {
    const { [memberId]: _removed, ...rest } = current.pending
    return { ...current, pending: rest }
  })
}

export async function verifyEmailCode(memberId: string, code: string): Promise<VerifyResult> {
  const member = memberOrThrow(memberId)
  await guardedSave()
  const pending = state.pending[memberId]
  if (!pending) return { ok: false, reason: 'none' }
  if (backendNow() > pending.expiresAt) return { ok: false, reason: 'expired' }
  if (pending.code !== code.trim()) return { ok: false, reason: 'wrong' }

  const oldAddress = member.primaryEmail.address
  patchMember(memberId, { primaryEmail: { address: pending.newAddress, verified: true } })
  cancelEmailChange(memberId)
  writeAudit(member, 'email', oldAddress, pending.newAddress)
  sendMessage({
    channel: 'email',
    to: oldAddress,
    subject: 'Your email address was changed',
    body: 'The primary email on your account was changed. If this was not you, contact member services.',
  })
  return { ok: true }
}

export function updateSettings(patch: Partial<Settings>) {
  setState((current) => ({ ...current, settings: { ...current.settings, ...patch } }))
}

export function advanceClock(ms: number) {
  setState((current) => ({ ...current, clockOffsetMs: current.clockOffsetMs + ms }))
}

export function resetBackend() {
  state = createInitialState()
  listeners.forEach((listener) => listener())
}

export function getDevCode(memberId: string): string | undefined {
  return state.pending[memberId]?.code
}
