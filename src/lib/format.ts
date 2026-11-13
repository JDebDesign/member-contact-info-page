import type { Address, Phone, PhoneType } from './types'

export function formatPhone(digits: string): string {
  if (digits.length !== 10) return digits
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

export function maskPhone(digits: string): string {
  return `(•••) •••-${digits.slice(-4)}`
}

export function maskEmail(address: string): string {
  const [local = '', domain = ''] = address.split('@')
  return `${local.charAt(0)}***@${domain}`
}

export function phoneTypeLabel(type: PhoneType): string {
  return type === 'mobile' ? 'Mobile' : 'Home'
}

export function formatAddressOneLine(address: Address): string {
  const street = [address.line1, address.line2].filter(Boolean).join(', ')
  return `${street}, ${address.city}, ${address.state} ${address.postalCode}`
}

export function formatAddressLines(address: Address): string[] {
  return [
    [address.line1, address.line2].filter(Boolean).join(', '),
    `${address.city}, ${address.state} ${address.postalCode}`,
  ]
}

export function describePhones(phones: Phone[]): string {
  return phones
    .map(
      (phone) =>
        `${formatPhone(phone.number)} ${phone.type}${phone.preferred ? ' (preferred)' : ''}${
          phone.smsConsent.granted ? ' [text consent]' : ''
        }`,
    )
    .join('; ')
}

export function sameAddress(a: Address, b: Address): boolean {
  return (
    a.line1.trim() === b.line1.trim() &&
    a.line2.trim() === b.line2.trim() &&
    a.city.trim() === b.city.trim() &&
    a.state.trim().toUpperCase() === b.state.trim().toUpperCase() &&
    a.postalCode.trim() === b.postalCode.trim()
  )
}
