import { useState, type FormEvent } from 'react'
import { Button, ErrorSummary, FormField, LinkButton, MaskedRow, Notice, SectionCard, Tag } from '../components/ui'
import { maskEmail } from '../lib/format'
import { useNow } from '../lib/hooks'
import type { Member } from '../lib/types'
import { useSectionFlow } from '../lib/useSectionFlow'
import { validateCode, validateEmail } from '../lib/validators'
import {
  CooldownError,
  cancelEmailChange,
  getPendingEmail,
  requestEmailChange,
  resendEmailCode,
  useBackend,
  verifyEmailCode,
} from '../services/backend'

type Step = 'enter' | 'verify'

export function EmailSection({ member }: { member: Member }) {
  useBackend()
  const flow = useSectionFlow()
  const [revealed, setRevealed] = useState(false)
  const [step, setStep] = useState<Step>('enter')
  const [newEmail, setNewEmail] = useState('')
  const [code, setCode] = useState('')
  const [emailError, setEmailError] = useState<string | undefined>()
  const [codeError, setCodeError] = useState<string | undefined>()
  const [resendNotice, setResendNotice] = useState('')

  const pending = getPendingEmail(member.memberId)
  const canEdit = member.canEditOwnContactInfo
  const now = useNow(flow.editing && step === 'verify')
  const secondsUntilResend = pending ? Math.max(0, Math.ceil((pending.resendAvailableAt - now) / 1000)) : 0
  const codeExpired = pending ? now > pending.expiresAt : false

  function openEditor() {
    const inProgress = getPendingEmail(member.memberId)
    setNewEmail(inProgress?.newAddress ?? '')
    setCode('')
    setEmailError(undefined)
    setCodeError(undefined)
    setResendNotice('')
    setStep(inProgress ? 'verify' : 'enter')
    flow.startEdit()
  }

  function closeEditor() {
    cancelEmailChange(member.memberId)
    setEmailError(undefined)
    setCodeError(undefined)
    flow.cancel()
  }

  async function handleSend(event: FormEvent) {
    event.preventDefault()
    if (flow.saving) return
    const message = validateEmail(newEmail)
    setEmailError(message ?? undefined)
    if (message) {
      flow.invalid()
      return
    }
    flow.beginSave()
    try {
      await requestEmailChange(member.memberId, newEmail)
      setStep('verify')
      setCode('')
      setCodeError(undefined)
      setResendNotice('')
      flow.succeedStep('code')
    } catch {
      flow.fail()
    }
  }

  async function handleVerify(event: FormEvent) {
    event.preventDefault()
    if (flow.saving) return
    const message = validateCode(code)
    setCodeError(message ?? undefined)
    if (message) {
      flow.invalid()
      return
    }
    flow.beginSave()
    try {
      const result = await verifyEmailCode(member.memberId, code)
      if (result.ok) {
        flow.succeed({
          type: 'success',
          title: 'Email updated',
          message: 'We sent a confirmation to your previous email address.',
        })
        return
      }
      setCodeError(
        result.reason === 'expired'
          ? 'That code has expired. Ask for a new code.'
          : result.reason === 'none'
            ? 'Ask for a new code, then try again.'
            : 'That code does not match. Check the email and try again.',
      )
      flow.invalid()
    } catch {
      flow.fail()
    }
  }

  async function handleResend() {
    setResendNotice('')
    try {
      await resendEmailCode(member.memberId)
      setCode('')
      setCodeError(undefined)
      setResendNotice('We sent a new code. The old one no longer works.')
      flow.focus('code')
    } catch (error) {
      if (!(error instanceof CooldownError)) flow.fail()
    }
  }

  const editButton =
    canEdit && !flow.editing ? (
      <Button variant="secondary" onClick={openEditor} ref={flow.register('edit')}>
        Edit email
      </Button>
    ) : null

  return (
    <SectionCard id="email" title="Email" action={editButton}>
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
        step === 'enter' ? (
          <form noValidate onSubmit={handleSend} className="stack" aria-label="Change email, step 1 of 2">
            <p className="badge-step">Step 1 of 2</p>
            <p className="card__intro">Your current email stays on file until you verify the new one.</p>
            <p>
              <span className="bold">Current email:</span> {maskEmail(member.primaryEmail.address)}
            </p>

            {flow.failed ? (
              <Notice type="error" title="We could not save your changes" role="alert" focusRef={flow.register('failure')}>
                Your entries are still here. Try again in a few minutes.
              </Notice>
            ) : null}

            {emailError ? (
              <ErrorSummary
                focusRef={flow.register('summary')}
                title="There is 1 problem with your email"
                items={[{ fieldId: 'email-new', message: `New email address: ${emailError}` }]}
              />
            ) : null}

            <FormField
              id="email-new"
              label="New email address"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={newEmail}
              onChange={setNewEmail}
              error={emailError}
              inputRef={flow.register('first')}
            />

            <div className="actions">
              <Button type="submit" disabled={flow.saving}>
                {flow.saving ? 'Sending…' : flow.failed ? 'Try again' : 'Send verification code'}
              </Button>
              <Button variant="secondary" onClick={closeEditor} disabled={flow.saving}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <form noValidate onSubmit={handleVerify} className="stack" aria-label="Change email, step 2 of 2">
            <p className="badge-step">Step 2 of 2</p>

            <Notice type="info" title="Check your email" role="status">
              We sent a six-digit code to {pending?.newAddress ?? newEmail}. It expires in 10 minutes.
            </Notice>
            <p className="card__intro">Your current email stays on file until the code is verified.</p>

            {flow.failed ? (
              <Notice type="error" title="We could not save your changes" role="alert" focusRef={flow.register('failure')}>
                Your entries are still here. Try again in a few minutes.
              </Notice>
            ) : null}

            {codeError ? (
              <ErrorSummary
                focusRef={flow.register('summary')}
                title="There is 1 problem with your code"
                items={[{ fieldId: 'email-code', message: `Six-digit code: ${codeError}` }]}
              />
            ) : null}

            {resendNotice ? (
              <p className="small bold" role="status">
                {resendNotice}
              </p>
            ) : null}

            <FormField
              id="email-code"
              label="Six-digit code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(value) => setCode(value.replace(/\D/g, ''))}
              error={codeError}
              helper="Enter the code exactly as it appears in the email."
              className="code-field"
              inputRef={(element) => {
                flow.register('first')(element)
                flow.register('code')(element)
              }}
            />

            <p className="small muted" aria-live="polite">
              {codeExpired
                ? 'This code has expired. Ask for a new code.'
                : secondsUntilResend > 0
                  ? `You can ask for a new code in ${secondsUntilResend} seconds.`
                  : 'You can ask for a new code now.'}
            </p>

            <div className="actions">
              <Button type="submit" disabled={flow.saving}>
                {flow.saving ? 'Verifying…' : flow.failed ? 'Try again' : 'Verify and save email'}
              </Button>
              <Button variant="secondary" onClick={handleResend} disabled={flow.saving || secondsUntilResend > 0}>
                Send a new code
              </Button>
              <Button variant="secondary" onClick={closeEditor} disabled={flow.saving}>
                Cancel
              </Button>
            </div>
          </form>
        )
      ) : (
        <MaskedRow
          tags={
            <>
              <Tag>Primary</Tag>
              {member.primaryEmail.verified ? <Tag accent>Verified</Tag> : null}
            </>
          }
          masked={maskEmail(member.primaryEmail.address)}
          revealed={member.primaryEmail.address}
          isRevealed={revealed}
          onToggle={() => setRevealed((current) => !current)}
          showLabel="Show email"
          hideLabel="Hide email"
          context="primary email"
        />
      )}

      {!flow.editing && pending && canEdit ? (
        <Notice
          type="info"
          title="Email change waiting for a code"
          actions={
            <LinkButton onClick={openEditor}>Enter the code for {pending.newAddress}</LinkButton>
          }
        >
          Your current email stays on file until you verify the new one.
        </Notice>
      ) : null}
    </SectionCard>
  )
}
