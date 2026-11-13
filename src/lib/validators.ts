import type { Address } from './types'

export const PHONE_ERROR = 'Enter a 10 digit phone number'
export const EMAIL_ERROR = 'Enter a valid email address, like name@example.com'
export const CODE_FORMAT_ERROR = 'Enter the 6 digit code from the email'

/** Strips spaces, dashes and parentheses; returns null unless exactly ten digits remain. */
export function normalizePhone(input: string): string | null {
  const trimmed = input.trim()
  if (!/^[\d\s\-()]+$/.test(trimmed)) return null
  const digits = trimmed.replace(/\D/g, '')
  return digits.length === 10 ? digits : null
}

export function validatePhone(input: string): string | null {
  return normalizePhone(input) ? null : PHONE_ERROR
}

export function validateEmail(input: string): string | null {
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(input.trim()) ? null : EMAIL_ERROR
}

export function validateCode(input: string): string | null {
  return /^\d{6}$/.test(input.trim()) ? null : CODE_FORMAT_ERROR
}

export function isValidZip(input: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(input.trim())
}

export type AddressField = keyof Address

export function validateAddress(address: Address): Partial<Record<AddressField, string>> {
  const errors: Partial<Record<AddressField, string>> = {}
  if (!address.line1.trim()) errors.line1 = 'Enter a street address'
  if (!address.city.trim()) errors.city = 'Enter a city'
  if (!/^[A-Za-z]{2}$/.test(address.state.trim())) errors.state = 'Enter a 2 letter state, like VA'
  if (!isValidZip(address.postalCode)) {
    errors.postalCode = 'Enter a 5 digit ZIP code, or 9 digits with a dash, like 12345-6789'
  }
  return errors
}

export function isBlankAddress(address: Address): boolean {
  return Object.values(address).every((value) => !value.trim())
}
