import { useState } from 'react'
import { useAutoDismiss, useFocusRegistry } from './hooks'

export interface Confirmation {
  type: 'success' | 'info'
  title: string
  message: string
}

/**
 * Shared read, edit, saving, failed and confirmation flow for one section.
 * Focus targets are registered by name: edit, first, summary, failure, confirmation.
 */
export function useSectionFlow() {
  const { register, focus } = useFocusRegistry()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)

  useAutoDismiss(confirmation !== null, () => setConfirmation(null))

  return {
    register,
    focus,
    editing,
    saving,
    failed,
    confirmation,
    startEdit() {
      setConfirmation(null)
      setFailed(false)
      setEditing(true)
      focus('first')
    },
    cancel() {
      setEditing(false)
      setFailed(false)
      setSaving(false)
      focus('edit')
    },
    beginSave() {
      setFailed(false)
      setSaving(true)
    },
    invalid() {
      setSaving(false)
      focus('summary')
    },
    succeed(next: Confirmation) {
      setSaving(false)
      setFailed(false)
      setEditing(false)
      setConfirmation(next)
      focus('confirmation')
    },
    fail() {
      setSaving(false)
      setFailed(true)
      focus('failure')
    },
    /** Finishes a save that stays in edit mode (a multi-step form moving to its next step). */
    succeedStep(focusTarget: string) {
      setSaving(false)
      setFailed(false)
      focus(focusTarget)
    },
  }
}

export type SectionFlow = ReturnType<typeof useSectionFlow>
