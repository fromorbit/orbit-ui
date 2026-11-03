import { type ChangeEvent, useLayoutEffect, useRef, useState } from 'react'
import { FormField } from '../primitives/FormField'
import { Input } from '../primitives/Input'
import { OrbitSymbol } from '../primitives/OrbitSymbol'
import {
  type CardBrand,
  type CardProblems,
  type CardValue,
  cardBrandOf,
  cardProblems,
  digitsOf,
  formatCardNumber,
  formatExpiry,
  maskedCardNumber,
} from './credit-card'

/** The words of `CreditCardField`. */
export interface CreditCardFieldLabels {
  number: string
  expiry: string
  /** The placeholder of the expiry, in the reader's letters: "MM/JJ". */
  expiryPlaceholder: string
  cvc: string
  /** A line under the code that says where to find it: "De laatste 3 cijfers achterop". */
  cvcHint(length: number): string
  name: string
  namePlaceholder: string
  /** What the picture of the card says where the name is still empty: "NAAM OP DE KAART". */
  cardNamePlaceholder: string
  /** The small word above the expiry on the picture: "Geldig tot". */
  cardExpiry: string
  /** The name of a card whose brand the first digits do not tell: "Kaart". */
  genericBrand: string
  errors: {
    numberIncomplete: string
    numberInvalid: string
    expiryIncomplete: string
    expiryInvalid: string
    expiryExpired: string
    cvcIncomplete(length: number): string
    nameMissing: string
  }
}

/** The props of `CreditCardField`. */
export interface CreditCardFieldProps {
  value: CardValue
  onValueChange(value: CardValue): void
  labels: CreditCardFieldLabels
  /**
   * Shows every problem at once, also of fields nobody has left yet: set it after a submit. Without
   * it a field shows its problem only once the reader has left it, never while typing.
   */
  showErrors?: boolean
  /** The moment the expiry is checked against; now by default. For a test or a story. */
  now?: Date
  /** Leaves the picture of the card out, for a narrow column. */
  hideCard?: boolean
}

/** The fields of a card, in the order they stand. */
type CardPart = keyof CardValue

/**
 * Keeps the caret behind the same digit while a field reformats itself.
 *
 * A formatted field rewrites its own text on every key ("42424" becomes "4242 4"), and a
 * controlled input whose value changes puts the caret at the end. Someone who corrects a digit in
 * the middle would then type the next one at the end. This remembers how many digits stood before
 * the caret and puts it back behind as many in the new text.
 */
function useCaret() {
  const pending = useRef<{ input: HTMLInputElement; digits: number } | null>(null)
  useLayoutEffect(() => {
    const target = pending.current
    pending.current = null
    if (!target || document.activeElement !== target.input) return
    const text = target.input.value
    let seen = 0
    let at = 0
    while (at < text.length && seen < target.digits) {
      if (/\d/.test(text[at] ?? '')) seen++
      at++
    }
    target.input.setSelectionRange(at, at)
  })
  return (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    const before = input.value.slice(0, input.selectionStart ?? input.value.length)
    pending.current = { input, digits: digitsOf(before).length }
  }
}

/** The brand as a word mark on the card, in the card's own letters; never the issuer's logo. */
function BrandMark({ brand, generic }: { brand: CardBrand; generic: string }) {
  switch (brand) {
    case 'visa':
      return <span className="font-heading text-[20px] italic">VISA</span>
    case 'mastercard':
      return <span className="font-heading text-[13px] tracking-tight">mastercard</span>
    case 'amex':
      return <span className="font-heading text-[12px] tracking-[0.2em]">AMEX</span>
    case 'maestro':
      return <span className="font-heading text-[13px] italic">maestro</span>
    default:
      return <span className="font-medium text-[12px]">{generic}</span>
  }
}

/** The props of `CreditCardVisual`. */
export interface CreditCardVisualProps {
  value: CardValue
  /** Shows the back, with the code, as while the code field has the focus. */
  flipped: boolean
  labels: Pick<CreditCardFieldLabels, 'cardNamePlaceholder' | 'cardExpiry' | 'genericBrand'>
}

/**
 * A picture of the card that fills in as the reader types: the number masked down to its last four
 * digits, the name, the expiry and the brand on the front, the code on the back.
 *
 * Decorative (`aria-hidden`): every value is in the fields, which a screen reader reads; the
 * picture would only say it all a second time, and the number then whole. It turns to its back
 * while the code field has the focus, the way one turns a card over to read it, with a turn of
 * half a second that `prefers-reduced-motion` replaces by a cut. The card wears the family's night
 * gradient and Orbit's symbol in both themes: a card is an object, not a surface of the page.
 */
export function CreditCardVisual({ value, flipped, labels }: CreditCardVisualProps) {
  const rule = cardBrandOf(value.number)
  const expiry = formatExpiry(value.expiry)
  const cvc = digitsOf(value.cvc)
  const face =
    'absolute inset-0 flex flex-col overflow-hidden rounded-lg bg-(image:--nt-brand-gradient) text-(--nt-brand-paper) shadow-menu backface-hidden'
  return (
    <div
      aria-hidden="true"
      data-nt-credit-card
      data-flipped={flipped}
      className="aspect-[1.586] w-full max-w-80 perspective-[1000px]"
    >
      <div
        className={`relative size-full transform-3d transition-transform duration-(--nt-duration) ease-(--nt-ease) motion-reduce:transition-none ${flipped ? 'rotate-y-180' : ''}`}
      >
        <div data-nt-card-front className={`${face} justify-between p-5`}>
          <div className="flex items-start justify-between">
            <OrbitSymbol className="size-7 text-(--nt-brand-paper)" />
            <BrandMark brand={rule.brand} generic={labels.genericBrand} />
          </div>
          <div className="h-7 w-10 rounded-md bg-(--nt-brand-mist) opacity-70" />
          <p data-nt-card-number className="m-0 font-mono text-[20px] tracking-wide">
            {maskedCardNumber(value.number)}
          </p>
          <div className="flex items-end justify-between gap-4">
            <span className="min-w-0 truncate font-medium text-[13px]">
              {value.name.trim() === '' ? labels.cardNamePlaceholder : value.name}
            </span>
            <span className="flex shrink-0 flex-col items-end">
              <span className="text-[11px] opacity-70">{labels.cardExpiry}</span>
              <span className="font-mono text-[13px]">{expiry === '' ? '••/••' : expiry}</span>
            </span>
          </div>
        </div>
        <div data-nt-card-back className={`${face} rotate-y-180 gap-4 py-5`}>
          <div className="h-10 w-full bg-(--nt-brand-midnight-bottom)" />
          <div className="flex items-center gap-3 px-5">
            <div className="h-8 flex-1 rounded-sm bg-(--nt-brand-mist) opacity-80" />
            <span
              data-nt-card-cvc
              className="flex h-8 w-14 items-center justify-center rounded-sm bg-(--nt-brand-paper) font-mono text-(--nt-brand-midnight) text-[13px]"
            >
              {'•'.repeat(cvc.length).padEnd(rule.cvcLength, '·')}
            </span>
          </div>
          <div className="mt-auto flex justify-end px-5">
            <BrandMark brand={rule.brand} generic={labels.genericBrand} />
          </div>
        </div>
      </div>
    </div>
  )
}

/** The message of each problem, from the labels. */
function messageOf(
  part: CardPart,
  problems: CardProblems,
  labels: CreditCardFieldLabels,
  cvcLength: number,
): string | undefined {
  const { errors } = labels
  switch (part) {
    case 'number':
      return problems.number === 'incomplete'
        ? errors.numberIncomplete
        : problems.number === 'invalid'
          ? errors.numberInvalid
          : undefined
    case 'expiry':
      return problems.expiry === 'incomplete'
        ? errors.expiryIncomplete
        : problems.expiry === 'invalid'
          ? errors.expiryInvalid
          : problems.expiry === 'expired'
            ? errors.expiryExpired
            : undefined
    case 'cvc':
      return problems.cvc ? errors.cvcIncomplete(cvcLength) : undefined
    case 'name':
      return problems.name ? errors.nameMissing : undefined
  }
}

/**
 * The fields of a payment card, with a picture of the card above them: number, expiry, code and
 * the name on it.
 *
 * The number groups itself as it is typed (4-4-4-4, 4-6-5 for Amex) and says its brand beside it
 * from the first digits; the expiry writes its own slash; the code takes as many digits as the
 * brand has. Every field carries the `autocomplete` a browser fills a saved card from (`cc-number`,
 * `cc-exp`, `cc-csc`, `cc-name`) and a number keyboard on a phone. The checks are those of
 * `cardProblems` (length, Luhn, an expiry still to come, the code's length), shown through
 * `FormField` once a field has been left, or all at once with `showErrors`.
 *
 * Presentation only: it holds no card and sends nothing anywhere. A host passes the value to its
 * payment provider's own fields or API, which is where a real card belongs.
 */
export function CreditCardField({
  value,
  onValueChange,
  labels,
  showErrors = false,
  now,
  hideCard = false,
}: CreditCardFieldProps) {
  const [left, setLeft] = useState<ReadonlySet<CardPart>>(() => new Set())
  const [flipped, setFlipped] = useState(false)
  const numberCaret = useCaret()
  const expiryCaret = useCaret()
  const rule = cardBrandOf(value.number)
  const problems = cardProblems(value, now)
  const errorOf = (part: CardPart) =>
    showErrors || left.has(part) ? messageOf(part, problems, labels, rule.cvcLength) : undefined
  const leave = (part: CardPart) => () =>
    setLeft((parts) => (parts.has(part) ? parts : new Set([...parts, part])))
  const set = (part: CardPart, text: string) => onValueChange({ ...value, [part]: text })
  const errorProps = (part: CardPart) => {
    const error = errorOf(part)
    return error === undefined ? {} : { error }
  }

  return (
    <div data-nt-credit-card-field className="flex w-full max-w-80 flex-col gap-6">
      {hideCard ? null : <CreditCardVisual value={value} flipped={flipped} labels={labels} />}
      <div className="flex flex-col gap-4">
        <FormField label={labels.number} required {...errorProps('number')}>
          {(field) => (
            <Input
              label={labels.number}
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="1234 1234 1234 1234"
              value={formatCardNumber(value.number)}
              {...(rule.brand === 'generic' ? {} : { suffix: rule.name })}
              onChange={(event) => {
                numberCaret(event)
                set('number', digitsOf(event.target.value).slice(0, 19))
              }}
              onBlur={leave('number')}
              {...field}
            />
          )}
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label={labels.expiry} required {...errorProps('expiry')}>
            {(field) => (
              <Input
                label={labels.expiry}
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder={labels.expiryPlaceholder}
                value={formatExpiry(value.expiry)}
                onChange={(event) => {
                  expiryCaret(event)
                  set('expiry', digitsOf(formatExpiry(event.target.value)))
                }}
                onBlur={leave('expiry')}
                {...field}
              />
            )}
          </FormField>
          <FormField
            label={labels.cvc}
            description={labels.cvcHint(rule.cvcLength)}
            required
            {...errorProps('cvc')}
          >
            {(field) => (
              <Input
                label={labels.cvc}
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder={'0'.repeat(rule.cvcLength)}
                value={digitsOf(value.cvc).slice(0, rule.cvcLength)}
                onChange={(event) => set('cvc', digitsOf(event.target.value).slice(0, 4))}
                onFocus={() => setFlipped(true)}
                onBlur={() => {
                  setFlipped(false)
                  leave('cvc')()
                }}
                {...field}
              />
            )}
          </FormField>
        </div>
        <FormField label={labels.name} required {...errorProps('name')}>
          {(field) => (
            <Input
              label={labels.name}
              autoComplete="cc-name"
              autoCapitalize="characters"
              placeholder={labels.namePlaceholder}
              value={value.name}
              onChange={(event) => set('name', event.target.value)}
              onBlur={leave('name')}
              {...field}
            />
          )}
        </FormField>
      </div>
    </div>
  )
}
