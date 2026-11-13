import { useState, type FormEvent } from 'react'
import { Button, Checkbox, ErrorSummary, FormField, Fieldset, Notice, SectionCard, type SummaryItem } from '../components/ui'
import { formatAddressLines, formatAddressOneLine, sameAddress } from '../lib/format'
import type { Address, Member } from '../lib/types'
import { useSectionFlow } from '../lib/useSectionFlow'
import { isBlankAddress, validateAddress, type AddressField } from '../lib/validators'
import { lookupAddress, saveAddresses } from '../services/backend'

const EMPTY_ADDRESS: Address = { line1: '', line2: '', city: '', state: '', postalCode: '' }

type AddressErrors = Partial<Record<AddressField, string>>
type Which = 'home' | 'mailing'

const FIELD_LABELS: Record<AddressField, string> = {
  line1: 'Street address',
  line2: 'Apartment, suite or unit (optional)',
  city: 'City',
  state: 'State',
  postalCode: 'ZIP code',
}

interface Suggestion {
  which: Which
  suggested: Address
}

function AddressFields({
  which,
  value,
  errors,
  onChange,
  firstRef,
}: {
  which: Which
  value: Address
  errors: AddressErrors
  onChange: (field: AddressField, next: string) => void
  firstRef?: (element: HTMLInputElement | null) => void
}) {
  const field = (name: AddressField, extra: Partial<Parameters<typeof FormField>[0]> = {}) => (
    <FormField
      id={`${which}-${name}`}
      label={FIELD_LABELS[name]}
      value={value[name]}
      onChange={(next) => onChange(name, next)}
      error={errors[name]}
      {...extra}
    />
  )
  return (
    <div className="stack">
      {field('line1', { autoComplete: `${which === 'home' ? 'shipping' : 'billing'} address-line1`, inputRef: firstRef })}
      {field('line2', { autoComplete: `${which === 'home' ? 'shipping' : 'billing'} address-line2` })}
      {field('city', { autoComplete: `${which === 'home' ? 'shipping' : 'billing'} address-level2` })}
      {field('state', { autoComplete: `${which === 'home' ? 'shipping' : 'billing'} address-level1`, maxLength: 2 })}
      {field('postalCode', { autoComplete: `${which === 'home' ? 'shipping' : 'billing'} postal-code`, inputMode: 'numeric' })}
    </div>
  )
}

export function AddressSection({ member }: { member: Member }) {
  const flow = useSectionFlow()
  const [home, setHome] = useState<Address>(member.addresses.home)
  const [sameAsHome, setSameAsHome] = useState(member.addresses.mailing.sameAsHome)
  const [mailing, setMailing] = useState<Address>(member.addresses.mailing.address ?? EMPTY_ADDRESS)
  const [errors, setErrors] = useState<{ home: AddressErrors; mailing: AddressErrors }>({ home: {}, mailing: {} })
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const [stateChangeWarning, setStateChangeWarning] = useState(false)
  const [checking, setChecking] = useState(false)

  const canEdit = member.canEditOwnContactInfo

  function openEditor() {
    setHome(member.addresses.home)
    setSameAsHome(member.addresses.mailing.sameAsHome)
    setMailing(member.addresses.mailing.address ?? EMPTY_ADDRESS)
    setErrors({ home: {}, mailing: {} })
    setSuggestion(null)
    setStateChangeWarning(false)
    flow.startEdit()
  }

  function closeEditor() {
    setSuggestion(null)
    setStateChangeWarning(false)
    flow.cancel()
  }

  const stateChanged = home.state.trim().toUpperCase() !== member.addresses.home.state.toUpperCase()

  async function persist(nextHome: Address, nextMailing: Address) {
    flow.beginSave()
    try {
      const result = await saveAddresses(member.memberId, {
        home: nextHome,
        mailing: sameAsHome
          ? { sameAsHome: true, address: null }
          : { sameAsHome: false, address: isBlankAddress(nextMailing) ? null : nextMailing },
      })
      setSuggestion(null)
      setStateChangeWarning(false)
      flow.succeed(
        result.changed
          ? { type: 'success', title: 'Mailing address updated', message: result.confirmation }
          : { type: 'info', title: 'No changes to save', message: 'Your addresses are the same as before.' },
      )
    } catch {
      flow.fail()
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (flow.saving || checking) return

    const nextErrors = {
      home: validateAddress(home),
      mailing: sameAsHome || isBlankAddress(mailing) ? {} : validateAddress(mailing),
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors.home).length > 0 || Object.keys(nextErrors.mailing).length > 0) {
      setSuggestion(null)
      flow.invalid()
      return
    }

    // The warning is shown before the first save attempt; submitting again confirms it.
    const needsStateWarning = stateChanged && !stateChangeWarning
    if (needsStateWarning) setStateChangeWarning(true)

    if (!suggestion) {
      setChecking(true)
      const homeSuggestion = await lookupAddress(home)
      const mailingSuggestion =
        !homeSuggestion && !sameAsHome && !isBlankAddress(mailing) ? await lookupAddress(mailing) : null
      setChecking(false)
      const found = homeSuggestion
        ? ({ which: 'home', suggested: homeSuggestion } as const)
        : mailingSuggestion
          ? ({ which: 'mailing', suggested: mailingSuggestion } as const)
          : null
      if (found) {
        setSuggestion(found)
        flow.invalid()
        return
      }
    }

    if (needsStateWarning) {
      flow.invalid()
      return
    }
    await persist(home, mailing)
  }

  function useSuggested() {
    if (!suggestion) return
    if (suggestion.which === 'home') setHome(suggestion.suggested)
    else setMailing(suggestion.suggested)
    setSuggestion(null)
  }

  function keepEntered() {
    // Suppress further lookups for the entered value by clearing the prompt; the member's text is saved as typed.
    setSuggestion(null)
    void persistAfterKeep()
  }

  async function persistAfterKeep() {
    if (stateChanged && !stateChangeWarning) {
      setStateChangeWarning(true)
      flow.invalid()
      return
    }
    await persist(home, mailing)
  }

  const summaryItems: SummaryItem[] = [
    ...(Object.entries(errors.home) as [AddressField, string][]).map(([name, message]) => ({
      fieldId: `home-${name}`,
      message: `Home address, ${FIELD_LABELS[name].replace(' (optional)', '').toLowerCase()}: ${message}`,
    })),
    ...(Object.entries(errors.mailing) as [AddressField, string][]).map(([name, message]) => ({
      fieldId: `mailing-${name}`,
      message: `Mailing address, ${FIELD_LABELS[name].replace(' (optional)', '').toLowerCase()}: ${message}`,
    })),
  ]

  const editButton =
    canEdit && !flow.editing ? (
      <Button variant="secondary" onClick={openEditor} ref={flow.register('edit')}>
        Edit mailing address
      </Button>
    ) : null

  const savedMailing = member.addresses.mailing

  return (
    <SectionCard id="address" title="Mailing address" action={editButton}>
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
        <form noValidate onSubmit={handleSubmit} className="stack" aria-label="Edit mailing address">
          <p className="card__intro">
            Your home address is required. We check it with the postal service before saving.
          </p>

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
                  ? 'There is 1 problem with your address'
                  : `There are ${summaryItems.length} problems with your address`
              }
              items={summaryItems}
            />
          ) : null}

          {suggestion ? (
            <Notice
              type="info"
              title="We found a close match"
              role="alert"
              focusRef={flow.register('summary')}
              actions={
                <>
                  <Button onClick={useSuggested}>Use suggested address</Button>
                  <Button variant="secondary" onClick={keepEntered}>
                    Keep what I entered
                  </Button>
                </>
              }
            >
              {suggestion.which === 'mailing' ? 'Mailing address suggested: ' : 'Suggested: '}
              {formatAddressOneLine(suggestion.suggested)}
            </Notice>
          ) : null}

          {stateChangeWarning ? (
            <Notice
              type="warning"
              title="Coverage options may change"
              role="alert"
              focusRef={suggestion ? undefined : flow.register('summary')}
            >
              You changed the state on your home address. Coverage options may change, and a care team member will
              follow up. You can still save.
            </Notice>
          ) : null}

          <Fieldset legend="Home address (required)">
            <AddressFields
              which="home"
              value={home}
              errors={errors.home}
              onChange={(name, next) => {
                setHome((current) => ({ ...current, [name]: next }))
                setSuggestion(null)
              }}
              firstRef={flow.register('first')}
            />
          </Fieldset>

          <Fieldset legend="Mailing address (optional)">
            <Checkbox
              id="mailing-same-as-home"
              label="My mailing address is the same as my home address"
              checked={sameAsHome}
              onChange={(checked) => {
                setSameAsHome(checked)
                setSuggestion(null)
              }}
            />
            {sameAsHome ? null : (
              <AddressFields
                which="mailing"
                value={mailing}
                errors={errors.mailing}
                onChange={(name, next) => {
                  setMailing((current) => ({ ...current, [name]: next }))
                  setSuggestion(null)
                }}
              />
            )}
          </Fieldset>

          <div className="actions">
            <Button type="submit" disabled={flow.saving || checking}>
              {checking
                ? 'Checking address…'
                : flow.saving
                  ? 'Saving…'
                  : flow.failed
                    ? 'Try again'
                    : 'Save mailing address'}
            </Button>
            <Button variant="secondary" onClick={closeEditor} disabled={flow.saving || checking}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="address-grid">
          <div className="stack">
            <p className="bold">Home address</p>
            <p className="value-lg">
              {formatAddressLines(member.addresses.home).map((line) => (
                <span key={line} style={{ display: 'block' }}>
                  {line}
                </span>
              ))}
            </p>
          </div>
          <div className="stack">
            <p className="bold">Mailing address</p>
            {savedMailing.sameAsHome || !savedMailing.address || sameAddress(savedMailing.address, member.addresses.home) ? (
              <p className="value-lg">Same as home address</p>
            ) : (
              <p className="value-lg">
                {formatAddressLines(savedMailing.address).map((line) => (
                  <span key={line} style={{ display: 'block' }}>
                    {line}
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  )
}
