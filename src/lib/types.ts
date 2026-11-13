export type PhoneType = 'mobile' | 'home'

export interface SmsConsent {
  granted: boolean
  wordingVersion: string | null
  recordedAt: string | null
}

export interface Phone {
  type: PhoneType
  /** Ten digits, no formatting. */
  number: string
  preferred: boolean
  smsConsent: SmsConsent
}

export interface Address {
  line1: string
  line2: string
  city: string
  state: string
  postalCode: string
}

export interface MailingAddress {
  sameAsHome: boolean
  address: Address | null
}

export interface Member {
  memberId: string
  name: { given: string; family: string }
  accountRole: 'primary' | 'dependent'
  ageGroup: 'adult' | 'under18'
  canEditOwnContactInfo: boolean
  managedByMemberId?: string
  phones: Phone[]
  primaryEmail: { address: string; verified: boolean }
  addresses: { home: Address; mailing: MailingAddress }
}

export interface PhoneSavePayload {
  phones: { number: string; type: PhoneType }[]
  preferredIndex: number
  textConsent: boolean
}

export interface AddressSavePayload {
  home: Address
  mailing: MailingAddress
}

export interface PendingEmail {
  newAddress: string
  sentAt: number
  expiresAt: number
  resendAvailableAt: number
}

export type SectionName = 'phone' | 'email' | 'address'

export interface AuditEntry {
  id: string
  memberId: string
  section: SectionName
  changedBy: string
  at: string
  oldValue: string
  newValue: string
  retainUntil: string
}

export interface OutboxMessage {
  id: string
  at: string
  channel: 'email' | 'sms'
  to: string
  subject: string
  body: string
}

export interface Settings {
  failSaves: boolean
  forcePostalSuggestion: boolean
  latencyMs: number
}

export interface SaveResult {
  changed: boolean
  /** Sentence naming where the change confirmation was sent; empty when nothing changed. */
  confirmation: string
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: 'wrong' | 'expired' | 'none' }
