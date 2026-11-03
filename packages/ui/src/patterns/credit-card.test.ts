import { describe, expect, test } from 'vitest'
import {
  cardBrandOf,
  cardProblems,
  EMPTY_CARD,
  formatCardNumber,
  formatExpiry,
  luhnValid,
  maskedCardNumber,
} from './credit-card'

describe('cardBrandOf', () => {
  test.each([
    ['4242424242424242', 'visa', 3],
    ['4', 'visa', 3],
    ['5555555555554444', 'mastercard', 3],
    ['2223003122003222', 'mastercard', 3],
    ['378282246310005', 'amex', 4],
    ['34', 'amex', 4],
    ['6759649826438453', 'maestro', 3],
    ['5018', 'maestro', 3],
    ['9999', 'generic', 3],
    ['', 'generic', 3],
  ] as const)('%s is %s with a code of %i', (number, brand, cvc) => {
    const rule = cardBrandOf(number)
    expect(rule.brand).toBe(brand)
    expect(rule.cvcLength).toBe(cvc)
  })
})

describe('formatCardNumber', () => {
  test.each([
    ['4242424242424242', '4242 4242 4242 4242'],
    ['42424', '4242 4'],
    ['4242 4242-4242', '4242 4242 4242'],
    ['378282246310005', '3782 822463 10005'],
    ['3782822', '3782 822'],
    ['55555555555544449999', '5555 5555 5555 4444'],
    ['', ''],
  ])('%s is written %s', (number, written) => {
    expect(formatCardNumber(number)).toBe(written)
  })
})

describe('luhnValid', () => {
  test.each([
    ['4242424242424242', true],
    ['5555555555554444', true],
    ['378282246310005', true],
    ['4242424242424241', false],
    ['', false],
  ])('%s: %s', (number, valid) => {
    expect(luhnValid(number)).toBe(valid)
  })
})

describe('formatExpiry', () => {
  test.each([
    ['1', '1'],
    ['4', '04'],
    ['12', '12'],
    ['122', '12/2'],
    ['1228', '12/28'],
    ['12/289', '12/28'],
  ])('%s is written %s', (typed, written) => {
    expect(formatExpiry(typed)).toBe(written)
  })
})

describe('cardProblems', () => {
  const now = new Date(2026, 10, 3)
  const valid = { number: '4242424242424242', expiry: '1228', cvc: '123', name: 'Noor de Vries' }

  test('a complete card has none', () => {
    expect(cardProblems(valid, now)).toEqual({})
  })

  test('an empty card misses everything', () => {
    expect(cardProblems(EMPTY_CARD, now)).toEqual({
      number: 'incomplete',
      expiry: 'incomplete',
      cvc: 'incomplete',
      name: 'missing',
    })
  })

  test('a number of the right length that fails Luhn is invalid', () => {
    expect(cardProblems({ ...valid, number: '4242424242424241' }, now).number).toBe('invalid')
  })

  test('the expiry: month 13 is invalid, last month expired, this month still valid', () => {
    expect(cardProblems({ ...valid, expiry: '1328' }, now).expiry).toBe('invalid')
    expect(cardProblems({ ...valid, expiry: '1026' }, now).expiry).toBe('expired')
    expect(cardProblems({ ...valid, expiry: '1126' }, now).expiry).toBeUndefined()
  })

  test('the code is as long as the brand says', () => {
    expect(cardProblems({ ...valid, cvc: '1234' }, now).cvc).toBe('incomplete')
    const amex = { ...valid, number: '378282246310005' }
    expect(cardProblems({ ...amex, cvc: '123' }, now).cvc).toBe('incomplete')
    expect(cardProblems({ ...amex, cvc: '1234' }, now).cvc).toBeUndefined()
  })
})

describe('maskedCardNumber', () => {
  test.each([
    ['4242424242424242', '•••• •••• •••• 4242'],
    ['378282246310005', '•••• •••••• •0005'],
    ['4242', '•••• •••• •••• ••••'],
    ['', '•••• •••• •••• ••••'],
  ])('%s is shown %s', (number, shown) => {
    expect(maskedCardNumber(number)).toBe(shown)
  })

  test('never shows more than the last four digits, at any length', () => {
    const full = '4242424242424242424'
    for (let length = 0; length <= full.length; length++) {
      const typed = full.slice(0, length)
      const visible = maskedCardNumber(typed).replace(/\D/g, '')
      expect(visible.length).toBeLessThanOrEqual(4)
      if (visible.length > 0) expect(typed.endsWith(visible)).toBe(true)
    }
  })
})
