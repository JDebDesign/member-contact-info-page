import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { advanceClock, getDevCode, resetBackend, updateSettings } from './services/backend'

const setup = () => ({ user: userEvent.setup(), ...render(<App />) })

beforeEach(() => {
  resetBackend()
  updateSettings({ latencyMs: 0 })
})

describe('read mode', () => {
  it('masks phone and email by default and reveals on request', async () => {
    const { user } = setup()
    expect(screen.getByText('(•••) •••-0148')).toBeInTheDocument()
    expect(screen.getByText('a***@example.test')).toBeInTheDocument()
    expect(screen.queryByText('avery.morgan@example.test')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show email, primary email' }))
    expect(screen.getByText('avery.morgan@example.test')).toBeInTheDocument()
  })

  it('names each Edit action by its section', () => {
    setup()
    for (const name of ['Edit phone', 'Edit email', 'Edit mailing address']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
  })

  it('hides Edit actions and explains who manages a dependent under 18', async () => {
    const { user } = setup()
    await user.selectOptions(screen.getByLabelText('Signed-in view'), 'MEM-1002')
    expect(screen.queryByRole('button', { name: /^Edit/ })).not.toBeInTheDocument()
    expect(screen.getByText('The account holder manages these details')).toBeInTheDocument()
    expect(screen.getByText(/Avery Morgan, the primary account holder/)).toBeInTheDocument()
  })
})

describe('phone section', () => {
  it('shows a summary and inline error for a short number and keeps the form open', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Edit phone' }))
    const field = screen.getByLabelText('Phone number', { selector: '#phone-1-number' })
    await user.clear(field)
    await user.type(field, '202-555-01')
    await user.click(screen.getByRole('button', { name: 'Save phone numbers' }))

    const summary = await screen.findByRole('alert')
    expect(within(summary).getByText('There is 1 problem with your phone numbers')).toBeInTheDocument()
    expect(within(summary).getByRole('link', { name: 'Phone number 1: Enter a 10 digit phone number' })).toBeInTheDocument()
    expect(field).toHaveAccessibleDescription(/Enter a 10 digit phone number/)
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(summary).toHaveFocus()
  })

  it('leaves text consent unchecked by default', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Edit phone' }))
    expect(screen.getByRole('checkbox', { name: /send text messages to phone number 1/ })).not.toBeChecked()
  })

  it('saves, returns to read mode and moves focus to the confirmation', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Edit phone' }))
    const field = screen.getByLabelText('Phone number', { selector: '#phone-1-number' })
    await user.clear(field)
    await user.type(field, '(202) 555-0100')
    await user.click(screen.getByRole('button', { name: 'Save phone numbers' }))

    const confirmation = await screen.findByText('Phone number updated')
    await waitFor(() => expect(confirmation.closest('[role="status"]')).toHaveFocus())
    expect(screen.getByText('(•••) •••-0100')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit phone' })).toBeInTheDocument()
  })

  it('keeps entered values and offers Try again when the save fails', async () => {
    const { user } = setup()
    updateSettings({ failSaves: true })
    await user.click(screen.getByRole('button', { name: 'Edit phone' }))
    const field = screen.getByLabelText('Phone number', { selector: '#phone-1-number' })
    await user.clear(field)
    await user.type(field, '2025550100')
    await user.click(screen.getByRole('button', { name: 'Save phone numbers' }))

    expect(await screen.findByText('We could not save your changes')).toBeInTheDocument()
    expect(field).toHaveValue('2025550100')
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})

describe('email section', () => {
  it('rejects an invalid address with the plain-language message', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Edit email' }))
    await user.type(screen.getByLabelText('New email address'), 'avery.new@example')
    await user.click(screen.getByRole('button', { name: 'Send verification code' }))
    expect((await screen.findAllByText('Enter a valid email address, like name@example.com')).length).toBeGreaterThan(0)
  })

  it('keeps the old email until the right code is entered, then swaps it', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Edit email' }))
    await user.type(screen.getByLabelText('New email address'), 'avery.new@example.test')
    await user.click(screen.getByRole('button', { name: 'Send verification code' }))

    expect(await screen.findByText('Check your email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send a new code' })).toBeDisabled()

    const code = getDevCode('MEM-1001')!
    await user.type(screen.getByLabelText('Six-digit code'), code === '000000' ? '111111' : '000000')
    await user.click(screen.getByRole('button', { name: 'Verify and save email' }))
    expect((await screen.findAllByText(/does not match/)).length).toBeGreaterThan(0)
    expect(screen.queryByText('Email updated')).not.toBeInTheDocument()

    const field = screen.getByLabelText('Six-digit code')
    await user.clear(field)
    await user.type(field, code)
    await user.click(screen.getByRole('button', { name: 'Verify and save email' }))
    expect(await screen.findByText('Email updated')).toBeInTheDocument()
    expect(screen.getByText('a***@example.test')).toBeInTheDocument()
  })

  it('rejects a code after ten minutes and allows resend after the cooldown', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Edit email' }))
    await user.type(screen.getByLabelText('New email address'), 'avery.new@example.test')
    await user.click(screen.getByRole('button', { name: 'Send verification code' }))
    await screen.findByText('Check your email')

    advanceClock(30 * 1000)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send a new code' })).toBeEnabled())

    advanceClock(10 * 60 * 1000)
    await user.type(screen.getByLabelText('Six-digit code'), getDevCode('MEM-1001')!)
    await user.click(screen.getByRole('button', { name: 'Verify and save email' }))
    expect((await screen.findAllByText(/has expired/)).length).toBeGreaterThan(0)
    expect(screen.queryByText('Email updated')).not.toBeInTheDocument()
  })
})

describe('address section', () => {
  async function openAddressEditor(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: 'Edit mailing address' }))
  }

  it('lists invalid fields in a linked summary', async () => {
    const { user } = setup()
    await openAddressEditor(user)
    await user.clear(screen.getByLabelText('Street address', { selector: '#home-line1' }))
    await user.clear(screen.getByLabelText('ZIP code', { selector: '#home-postalCode' }))
    await user.type(screen.getByLabelText('ZIP code', { selector: '#home-postalCode' }), '123')
    await user.click(screen.getByRole('button', { name: 'Save mailing address' }))

    const summary = await screen.findByRole('alert')
    expect(within(summary).getAllByRole('link')).toHaveLength(2)
  })

  it('offers the suggested address or the entered one', async () => {
    const { user } = setup()
    await openAddressEditor(user)
    await user.click(screen.getByRole('button', { name: 'Save mailing address' }))
    expect(await screen.findByText('We found a close match')).toBeInTheDocument()
    expect(screen.getByText(/42 Example St,/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Use suggested address' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Keep what I entered' })).toBeInTheDocument()
  })

  it('warns when the home state changes and still lets the member save', async () => {
    const { user } = setup()
    await user.selectOptions(screen.getByLabelText('Signed-in view'), 'MEM-1004')
    await openAddressEditor(user)
    const state = screen.getByLabelText('State', { selector: '#home-state' })
    await user.clear(state)
    await user.type(state, 'UT')
    await user.click(screen.getByRole('button', { name: 'Save mailing address' }))

    expect(await screen.findByText('Coverage options may change')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save mailing address' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Save mailing address' }))
    expect(await screen.findByText('Mailing address updated')).toBeInTheDocument()
  })
})
