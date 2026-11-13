import { useState, type FormEvent } from 'react'
import { Button, Checkbox, ErrorSummary, FormField, Fieldset, MaskedRow, Notice, Radio, SectionCard, Tag, type SummaryItem } from '../components/ui'
import { formatPhone, maskPhone, phoneTypeLabel } from '../lib/format'
import type { Member, PhoneType } from '../lib/types'
import { useSectionFlow } from '../lib/useSectionFlow'
import { PHONE_ERROR, normalizePhone } from '../lib/validators'
import { savePhones } from '../services/backend'

interface PhoneDraft {
  number: string
  type: PhoneType
}

type PhoneErrors = Partial<Record<0 | 1, string>>

function draftsFromMember(member: Member): PhoneDraft[] {
  const drafts: PhoneDraft[] = member.phones.map((phone) => ({ number: formatPhone(phone.number), type: phone.type }))
  while (drafts.length < 2) drafts.push({ number: '', type: 'home' })
  return drafts
}

export function PhoneSection({ member }: { member: Member }) {
  const flow = useSectionFlow()
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})
  const [drafts, setDrafts] = useState<PhoneDraft[]>(() => draftsFromMember(member))
  const [preferredIndex, setPreferredIndex] = useState(() => Math.max(0, member.phones.findIndex((p) => p.preferred)))
  const [textConsent, setTextConsent] = useState(() => member.phones[0]?.smsConsent.granted ?? false)
  const [errors, setErrors] = useState<PhoneErrors>({})

  const canEdit = member.canEditOwnContactInfo
  const consentOnFile = member.phones.some((phone) => phone.smsConsent.granted)

  function openEditor() {
    setDrafts(draftsFromMember(member))
    setPreferredIndex(Math.max(0, member.phones.findIndex((p) => p.preferred)))
    setTextConsent(member.phones[0]?.smsConsent.granted ?? false)
    setErrors({})
    flow.startEdit()
  }

  function closeEditor() {
    setErrors({})
    flow.cancel()
  }

  function updateDraft(index: number, patch: Partial<PhoneDraft>) {
    setDrafts((current) => current.map((draft, i) => (i === index ? { ...draft, ...patch } : draft)))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (flow.saving) return

    const next: PhoneErrors = {}
    const normalized: (string | null)[] = drafts.map((draft) => normalizePhone(draft.number))
    if (!normalized[0]) next[0] = PHONE_ERROR
    if (drafts[1].number.trim() && !normalized[1]) next[1] = PHONE_ERROR
    setErrors(next)
    if (next[0] || next[1]) {
      flow.invalid()
      return
    }

    const entries = drafts
      .map((draft, index) => ({ number: normalized[index], type: draft.type, index }))
      .filter((entry): entry is { number: string; type: PhoneType; index: number } => Boolean(entry.number))
    const preferred = entries.findIndex((entry) => entry.index === preferredIndex)

    flow.beginSave()
    try {
      const result = await savePhones(member.memberId, {
        phones: entries.map(({ number, type }) => ({ number, type })),
        preferredIndex: preferred === -1 ? 0 : preferred,
        textConsent,
      })
      flow.succeed(
        result.changed
          ? { type: 'success', title: 'Phone number updated', message: result.confirmation }
          : { type: 'info', title: 'No changes to save', message: 'Your phone numbers are the same as before.' },
      )
    } catch {
      flow.fail()
    }
  }

  const summaryItems: SummaryItem[] = (['0', '1'] as const).flatMap((key) => {
    const index = Number(key) as 0 | 1
    const message = errors[index]
    return message ? [{ fieldId: `phone-${index + 1}-number`, message: `Phone number ${index + 1}: ${message}` }] : []
  })

  const editButton =
    canEdit && !flow.editing ? (
      <Button variant="secondary" onClick={openEditor} ref={flow.register('edit')}>
        Edit phone
      </Button>
    ) : null

  return (
    <SectionCard id="phone" title="Phone" action={editButton}>
      {flow.confirmation ? (
        <Notice
          type={flow.confirmation.type === 'success' ? 'success' : 'info'}
          title={flow.confirmation.title}
          role="status"
          focusRef={flow.register('confirmation')}
        >
          {flow.confirmation.message}
        </Notice>
      ) : null}

      {flow.editing ? (
        <form noValidate onSubmit={handleSubmit} className="stack" aria-label="Edit phone numbers">
          <p className="card__intro">Add up to two numbers. Changes here do not affect your email or address.</p>

          {flow.failed ? (
            <Notice type="error" title="We could not save your changes" role="alert" focusRef={flow.register('failure')}>
              Your entries are still here. Try again in a few minutes.
            </Notice>
          ) : null}

          {summaryItems.length > 0 ? (
            <ErrorSummary
              focusRef={flow.register('summary')}
              title={
                summaryItems.length === 1
                  ? 'There is 1 problem with your phone numbers'
                  : `There are ${summaryItems.length} problems with your phone numbers`
              }
              items={summaryItems}
            />
          ) : null}

          <div className="two-col">
            {[0, 1].map((index) => (
              <div className="stack" key={index}>
                <p className="bold">Phone number {index + 1}</p>
                <FormField
                  id={`phone-${index + 1}-number`}
                  label="Phone number"
                  type="tel"
                  inputMode="tel"
                  autoComplete={index === 0 ? 'tel-national' : 'off'}
                  value={drafts[index].number}
                  onChange={(value) => updateDraft(index, { number: value })}
                  error={errors[index as 0 | 1]}
                  helper="Use digits, spaces, dashes or parentheses."
                  inputRef={index === 0 ? flow.register('first') : undefined}
                />
                <Fieldset legend="Type">
                  <Radio
                    id={`phone-${index + 1}-type-mobile`}
                    name={`phone-${index + 1}-type`}
                    label="Mobile"
                    checked={drafts[index].type === 'mobile'}
                    onChange={() => updateDraft(index, { type: 'mobile' })}
                  />
                  <Radio
                    id={`phone-${index + 1}-type-home`}
                    name={`phone-${index + 1}-type`}
                    label="Home"
                    checked={drafts[index].type === 'home'}
                    onChange={() => updateDraft(index, { type: 'home' })}
                  />
                </Fieldset>
              </div>
            ))}
          </div>

          <Fieldset
            legend="Preferred number"
            hint="We use this number for appointment reminders."
            hintId="phone-preferred-hint"
          >
            <Radio
              id="phone-preferred-1"
              name="phone-preferred"
              label="Phone number 1"
              checked={preferredIndex === 0}
              onChange={() => setPreferredIndex(0)}
            />
            <Radio
              id="phone-preferred-2"
              name="phone-preferred"
              label="Phone number 2"
              checked={preferredIndex === 1}
              disabled={!drafts[1].number.trim()}
              onChange={() => setPreferredIndex(1)}
            />
          </Fieldset>

          <Fieldset
            legend="Text messages"
            hint="Text consent is separate and optional. It is never turned on for you."
            hintId="phone-sms-hint"
          >
            <Checkbox
              id="phone-sms-consent"
              label="Yes, send text messages to phone number 1."
              checked={textConsent}
              onChange={setTextConsent}
              describedBy="phone-sms-wording"
            />
            <p id="phone-sms-wording" className="field__helper">
              Placeholder: compliance-approved consent and opt-out wording is pending (Dana, Privacy and Compliance).
            </p>
          </Fieldset>

          <div className="actions">
            <Button type="submit" disabled={flow.saving}>
              {flow.saving ? 'Saving…' : flow.failed ? 'Try again' : 'Save phone numbers'}
            </Button>
            <Button variant="secondary" onClick={closeEditor} disabled={flow.saving}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <>
          {member.phones.map((phone, index) => (
            <div className="stack" key={`${phone.number}-${index}`}>
              {index > 0 ? <hr /> : null}
              <MaskedRow
                tags={
                  <>
                    <Tag>{phoneTypeLabel(phone.type)}</Tag>
                    {phone.preferred ? <Tag accent>Preferred for reminders</Tag> : null}
                  </>
                }
                masked={maskPhone(phone.number)}
                revealed={formatPhone(phone.number)}
                isRevealed={Boolean(revealed[index])}
                onToggle={() => setRevealed((current) => ({ ...current, [index]: !current[index] }))}
                showLabel="Show number"
                hideLabel="Hide number"
                context={`${phoneTypeLabel(phone.type).toLowerCase()} phone`}
              />
            </div>
          ))}
          <p className="small muted">Text messages: {consentOnFile ? 'signed up' : 'not signed up'}</p>
        </>
      )}
    </SectionCard>
  )
}
