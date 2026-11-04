/**
 * The rules of a payment card's number, expiry and security code, as pure functions: the brand
 * from the first digits, the grouping per brand, the Luhn check, an expiry in the future and the
 * length of the code. `CreditCardField` draws with them; a host can use them to check a value
 * before it sends it to its payment provider. Nothing here talks to one.
 */

/** The brands the field tells apart; `generic` is any other number. */
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'maestro' | 'generic'

/** What a brand fixes: the lengths a number may have, its grouping and the code's length. */
export interface CardBrandRule {
  brand: CardBrand
  /** The name as the issuer writes it, shown on the card and beside the number. */
  name: string
  /** Every length a complete number of this brand may have. */
  lengths: readonly number[]
  /** The sizes of the groups the number is written in: 4-4-4-4, or 4-6-5 for Amex. */
  groups: readonly number[]
  /** How many digits the security code has. */
  cvcLength: number
}

/**
 * The rules per brand, as a table; the order matters, since the first pattern that matches wins.
 *
 * Mastercard is 51–55 and 2221–2720; Amex 34 and 37; Maestro the prefixes that are not one of the
 * others (50, 56–58, 6304, 6759, 6761–6763). Visa is every 4.
 */
const RULES: readonly (CardBrandRule & { pattern: RegExp })[] = [
  {
    brand: 'amex',
    name: 'American Express',
    pattern: /^3[47]/,
    lengths: [15],
    groups: [4, 6, 5],
    cvcLength: 4,
  },
  {
    brand: 'visa',
    name: 'Visa',
    pattern: /^4/,
    lengths: [13, 16, 19],
    groups: [4, 4, 4, 4, 3],
    cvcLength: 3,
  },
  {
    brand: 'mastercard',
    name: 'Mastercard',
    pattern: /^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d\d|27[01]\d|2720)/,
    lengths: [16],
    groups: [4, 4, 4, 4],
    cvcLength: 3,
  },
  {
    brand: 'maestro',
    name: 'Maestro',
    pattern: /^(50|5[6-8]|6304|6759|676[1-3])/,
    lengths: [12, 13, 14, 15, 16, 17, 18, 19],
    groups: [4, 4, 4, 4, 3],
    cvcLength: 3,
  },
]

/** Any number no brand above claims. */
const GENERIC: CardBrandRule = {
  brand: 'generic',
  name: '',
  lengths: [12, 13, 14, 15, 16, 17, 18, 19],
  groups: [4, 4, 4, 4, 3],
  cvcLength: 3,
}

/** Only the digits of a text, in order. */
export function digitsOf(text: string): string {
  return text.replace(/\D/g, '')
}

/** The rule of the brand a number starts like; `generic` until the first digits say more. */
export function cardBrandOf(number: string): CardBrandRule {
  const digits = digitsOf(number)
  const found = RULES.find((rule) => rule.pattern.test(digits))
  if (!found) return GENERIC
  const { pattern: _pattern, ...rule } = found
  return rule
}

/** The most digits a number of this brand may have. */
export function maxCardLength(rule: CardBrandRule): number {
  return Math.max(...rule.lengths)
}

/**
 * A number as it is written on the card: its digits in the brand's groups, cut to its longest
 * length. "4242424242424242" gives "4242 4242 4242 4242", "378282246310005" gives
 * "3782 822463 10005".
 */
export function formatCardNumber(number: string): string {
  const rule = cardBrandOf(number)
  const digits = digitsOf(number).slice(0, maxCardLength(rule))
  const parts: string[] = []
  let at = 0
  for (const size of rule.groups) {
    if (at >= digits.length) break
    parts.push(digits.slice(at, at + size))
    at += size
  }
  if (at < digits.length) parts.push(digits.slice(at))
  return parts.join(' ')
}

/** The Luhn check every card number carries in its last digit. */
export function luhnValid(number: string): boolean {
  const digits = digitsOf(number)
  if (digits.length === 0) return false
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let digit = Number(digits[digits.length - 1 - i])
    if (i % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

/** "MMJJ" as it is typed, written "MM/JJ"; a first digit above 1 is a month on its own ("4" → "04"). */
export function formatExpiry(text: string): string {
  let digits = digitsOf(text)
  if (digits.length === 1 && Number(digits) > 1) digits = `0${digits}`
  digits = digits.slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

/** Why a card's value is not complete or not right; `undefined` per field means it is fine. */
export interface CardProblems {
  number?: 'incomplete' | 'invalid'
  expiry?: 'incomplete' | 'invalid' | 'expired'
  cvc?: 'incomplete'
  name?: 'missing'
}

/** A card as the field holds it: only digits in `number`, `expiry` (MMJJ) and `cvc`. */
export interface CardValue {
  number: string
  expiry: string
  cvc: string
  name: string
}

/** An empty card. */
export const EMPTY_CARD: CardValue = { number: '', expiry: '', cvc: '', name: '' }

/**
 * Checks a card: a number of a length its brand allows that passes Luhn, an expiry whose month has
 * not ended before `now`, a code as long as the brand's and a name. A card is valid through the
 * last day of the month on it.
 */
export function cardProblems(card: CardValue, now: Date = new Date()): CardProblems {
  const problems: CardProblems = {}
  const rule = cardBrandOf(card.number)
  const number = digitsOf(card.number)
  if (!rule.lengths.includes(number.length)) problems.number = 'incomplete'
  else if (!luhnValid(number)) problems.number = 'invalid'

  const expiry = digitsOf(card.expiry)
  if (expiry.length < 4) problems.expiry = 'incomplete'
  else {
    const month = Number(expiry.slice(0, 2))
    const year = 2000 + Number(expiry.slice(2, 4))
    if (month < 1 || month > 12) problems.expiry = 'invalid'
    else if (year * 12 + month < now.getFullYear() * 12 + now.getMonth() + 1) {
      problems.expiry = 'expired'
    }
  }

  if (digitsOf(card.cvc).length !== rule.cvcLength) problems.cvc = 'incomplete'
  if (card.name.trim() === '') problems.name = 'missing'
  return problems
}

/**
 * The number as the picture of the card shows it: a dot for every digit, in the brand's groups,
 * and only the last four digits in the clear once there are at least twelve. Never more than four
 * digits of a number appear, so a picture over someone's shoulder gives nothing away.
 */
export function maskedCardNumber(number: string): string {
  const rule = cardBrandOf(number)
  const length = rule.brand === 'amex' ? 15 : 16
  const digits = digitsOf(number).slice(0, maxCardLength(rule))
  const reveal = digits.length >= 12 ? digits.slice(-4) : ''
  const slots = Math.max(length, digits.length)
  const signs = Array.from({ length: slots }, (_, index) => {
    const fromEnd = digits.length - 1 - index
    return index < digits.length && fromEnd < reveal.length ? (digits[index] ?? '•') : '•'
  }).join('')
  const parts: string[] = []
  let at = 0
  for (const size of rule.groups) {
    if (at >= signs.length) break
    parts.push(signs.slice(at, at + size))
    at += size
  }
  if (at < signs.length) parts.push(signs.slice(at))
  return parts.join(' ')
}
