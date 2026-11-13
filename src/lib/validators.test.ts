import { describe, expect, it } from 'vitest'
import { maskEmail, maskPhone } from './format'
import { isValidZip, normalizePhone, validateAddress, validateCode, validateEmail } from './validators'

describe('normalizePhone', () => {
  it.each([
    ['202-555-0148', '2025550148'],
    ['(202) 555-0193', '2025550193'],
    ['202 555 0176', '2025550176'],
    ['4155550124', '4155550124'],
  ])('accepts %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected)
  })

  it.each(['202-555-01', '', '202-555-01489', 'call me', '202.555.0148'])('rejects %s', (input) => {
    expect(normalizePhone(input)).toBeNull()
  })
})

describe('validateEmail', () => {
  it('accepts a normal address', () => {
    expect(validateEmail('avery.new@example.test')).toBeNull()
  })

  it.each(['avery.new@example', 'avery', '@example.com', 'a b@example.com', ''])('rejects %s', (input) => {
    expect(validateEmail(input)).toBe('Enter a valid email address, like name@example.com')
  })
})

describe('validateCode', () => {
  it('requires exactly six digits', () => {
    expect(validateCode('123456')).toBeNull()
    expect(validateCode('12345')).not.toBeNull()
    expect(validateCode('1234567')).not.toBeNull()
    expect(validateCode('12345a')).not.toBeNull()
  })
})

describe('ZIP and address validation', () => {
  it('accepts five digits or nine digits with a dash', () => {
    expect(isValidZip('22201')).toBe(true)
    expect(isValidZip('94105-1234')).toBe(true)
    expect(isValidZip('941051234')).toBe(false)
    expect(isValidZip('9410')).toBe(false)
  })

  it('flags empty lines and bad ZIP codes per field', () => {
    const errors = validateAddress({ line1: ' ', line2: '', city: '', state: 'V', postalCode: '123' })
    expect(Object.keys(errors).sort()).toEqual(['city', 'line1', 'postalCode', 'state'])
  })

  it('passes a complete address', () => {
    expect(
      validateAddress({ line1: '42 Example Street', line2: '', city: 'Arlington', state: 'VA', postalCode: '22201' }),
    ).toEqual({})
  })
})

describe('masking', () => {
  it('keeps the last four phone digits', () => {
    expect(maskPhone('2025550148')).toBe('(•••) •••-0148')
  })

  it('keeps the first email character and the domain', () => {
    expect(maskEmail('avery.morgan@example.test')).toBe('a***@example.test')
  })
})
