import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { FieldErrorIcon, NoticeIcon } from './icons'

export function Tag({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
  return <span className={`tag${accent ? ' tag--accent' : ''}`}>{children}</span>
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  ref?: Ref<HTMLButtonElement>
}

export function Button({ variant = 'primary', className = '', type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={`btn btn--${variant} ${className}`.trim()} {...rest} />
}

export function LinkButton({ className = '', type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={`link-button ${className}`.trim()} {...rest} />
}

export type NoticeType = 'info' | 'success' | 'warning' | 'error'

interface NoticeProps {
  type: NoticeType
  title: string
  children?: ReactNode
  actions?: ReactNode
  role?: 'status' | 'alert'
  focusRef?: Ref<HTMLDivElement>
  id?: string
}

export function Notice({ type, title, children, actions, role, focusRef, id }: NoticeProps) {
  return (
    <div
      id={id}
      ref={focusRef}
      tabIndex={focusRef ? -1 : undefined}
      role={role}
      className={`notice notice--${type}`}
    >
      <NoticeIcon type={type} />
      <div className="notice__body">
        <p className="notice__title">{title}</p>
        {children ? <div className="notice__message">{children}</div> : null}
        {actions ? <div className="notice__actions">{actions}</div> : null}
      </div>
    </div>
  )
}

export interface SummaryItem {
  fieldId: string
  message: string
}

interface ErrorSummaryProps {
  title: string
  items: SummaryItem[]
  focusRef: Ref<HTMLDivElement>
}

export function ErrorSummary({ title, items, focusRef }: ErrorSummaryProps) {
  return (
    <div ref={focusRef} tabIndex={-1} role="alert" className="notice notice--error">
      <NoticeIcon type="error" />
      <div className="notice__body">
        <p className="notice__title">{title}</p>
        <ul className="notice__list">
          {items.map((item) => (
            <li key={item.fieldId}>
              <a
                href={`#${item.fieldId}`}
                onClick={(event) => {
                  event.preventDefault()
                  const target = document.getElementById(item.fieldId)
                  target?.focus()
                  target?.scrollIntoView?.({ block: 'center' })
                }}
              >
                {item.message}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

interface FormFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  helper?: string
  inputMode?: 'text' | 'tel' | 'numeric' | 'email'
  type?: 'text' | 'tel' | 'email'
  autoComplete?: string
  maxLength?: number
  disabled?: boolean
  inputRef?: Ref<HTMLInputElement>
  className?: string
}

export function FormField({
  id,
  label,
  value,
  onChange,
  error,
  helper,
  inputMode,
  type = 'text',
  autoComplete,
  maxLength,
  disabled,
  inputRef,
  className = '',
}: FormFieldProps) {
  const helperId = `${id}-helper`
  const errorId = `${id}-error`
  const describedBy = [helper ? helperId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined
  return (
    <div className={`field ${className}`.trim()}>
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      {helper ? (
        <p id={helperId} className="field__helper">
          {helper}
        </p>
      ) : null}
      <input
        id={id}
        ref={inputRef}
        className={`field__input${error ? ' field__input--error' : ''}`}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={maxLength}
        disabled={disabled}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <p id={errorId} className="field__error">
          <FieldErrorIcon />
          <span>
            <span className="sr-only">Error: </span>
            {error}
          </span>
        </p>
      ) : null}
    </div>
  )
}

interface ChoiceProps {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  name?: string
  describedBy?: string
  disabled?: boolean
}

export function Radio({ id, label, checked, onChange, name, describedBy, disabled }: ChoiceProps) {
  return (
    <label htmlFor={id} className="choice">
      <input
        id={id}
        type="radio"
        name={name}
        checked={checked}
        disabled={disabled}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  )
}

export function Checkbox({ id, label, checked, onChange, describedBy, disabled }: ChoiceProps) {
  return (
    <label htmlFor={id} className="choice choice--check">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  )
}

export function Fieldset({
  legend,
  hint,
  hintId,
  children,
}: {
  legend: string
  hint?: string
  hintId?: string
  children: ReactNode
}) {
  return (
    <fieldset className="fieldset" aria-describedby={hint ? hintId : undefined}>
      <legend className="fieldset__legend">{legend}</legend>
      {hint ? (
        <p id={hintId} className="field__helper">
          {hint}
        </p>
      ) : null}
      {children}
    </fieldset>
  )
}

interface SectionCardProps {
  id: string
  title: string
  action?: ReactNode
  children: ReactNode
}

export function SectionCard({ id, title, action, children }: SectionCardProps) {
  return (
    <section className="card" aria-labelledby={`${id}-title`}>
      <header className="card__header">
        <h2 id={`${id}-title`} className="display card__title">
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  )
}

interface MaskedRowProps {
  tags: ReactNode
  masked: string
  revealed: string
  isRevealed: boolean
  onToggle: () => void
  showLabel: string
  hideLabel: string
  /** Distinguishes repeated toggles for assistive technology, for example "mobile". */
  context: string
}

export function MaskedRow({ tags, masked, revealed, isRevealed, onToggle, showLabel, hideLabel, context }: MaskedRowProps) {
  const visibleLabel = isRevealed ? hideLabel : showLabel
  return (
    <div className="row">
      <div className="row__details">
        <div className="tags">{tags}</div>
        <p className="value-lg">{isRevealed ? revealed : masked}</p>
      </div>
      <LinkButton onClick={onToggle} aria-label={`${visibleLabel}, ${context}`}>
        {visibleLabel}
      </LinkButton>
    </div>
  )
}
