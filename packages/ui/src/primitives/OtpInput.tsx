import { type ChangeEvent, Fragment, useState } from 'react'

/** Which signs a code may hold. */
export type OtpCharset = 'digits' | 'alphanumeric'

/** The props of `OtpInput`. */
export interface OtpInputProps {
  /** Accessible name: "Verificatiecode". */
  label: string
  value: string
  /** The cleaned code: only allowed signs, never longer than `length`, letters in capitals. */
  onValueChange(value: string): void
  /** Called once when the last box is filled, with the whole code: to verify it at once. */
  onComplete?(code: string): void
  /** How many boxes; default 6. */
  length?: number
  /** Digits only (default, with a number keyboard on a phone) or letters and digits. */
  charset?: OtpCharset
  /** Puts a gap after this many boxes, as a code of six reads as two threes; default none. */
  groupAfter?: number
  disabled?: boolean
  /** Set by `FormField`: the visible label wins over `label`. */
  'aria-labelledby'?: string | undefined
  'aria-describedby'?: string | undefined
  /** Set by `FormField` when the code was refused: danger borders. */
  'aria-invalid'?: boolean | undefined
  'aria-required'?: boolean | undefined
  id?: string | undefined
}

/** Keeps only the signs a code may hold, in capitals, cut to `length`. */
export function cleanOtp(text: string, length: number, charset: OtpCharset): string {
  const allowed = charset === 'digits' ? /[0-9]/ : /[0-9A-Za-z]/
  return [...text]
    .filter((sign) => allowed.test(sign))
    .join('')
    .toUpperCase()
    .slice(0, length)
}

/**
 * A one-time code in separate boxes: the six digits of a sign-in mail.
 *
 * One real `<input>` lies over the boxes, invisible, and the boxes only draw what it holds. That
 * is what keeps everything a code field must do working without a line of key handling: pasting
 * "123 456" fills every box (spaces and dashes are dropped), the browser and a phone offer the code
 * from a text message (`autocomplete="one-time-code"`), Backspace removes the last sign, and a
 * screen reader meets one field with one name instead of six. The box where the next sign goes
 * carries the focus ring while the field has the focus.
 */
export function OtpInput({
  label,
  value,
  onValueChange,
  onComplete,
  length = 6,
  charset = 'digits',
  groupAfter,
  disabled,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  id,
}: OtpInputProps) {
  const [focused, setFocused] = useState(false)
  const code = cleanOtp(value, length, charset)
  const current = Math.min(code.length, length - 1)

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const next = cleanOtp(event.target.value, length, charset)
    onValueChange(next)
    if (next.length === length && code.length !== length) onComplete?.(next)
  }

  /** The caret always stands at the end: a code is typed in order, never edited in the middle. */
  function toEnd(input: HTMLInputElement) {
    const end = input.value.length
    input.setSelectionRange(end, end)
  }

  return (
    <span
      className={`no-drag relative inline-flex items-center gap-2 ${disabled ? 'opacity-40' : ''}`}
    >
      {Array.from({ length }, (_, index) => {
        const sign = code[index]
        const active = focused && index === current
        const box = ariaInvalid
          ? 'flex h-(--nt-control-lg) w-(--nt-control-lg) items-center justify-center rounded-md border border-danger bg-surface font-mono text-[20px] text-fg tabular-nums'
          : active
            ? 'flex h-(--nt-control-lg) w-(--nt-control-lg) items-center justify-center rounded-md border border-accent-border bg-surface font-mono text-[20px] text-fg tabular-nums outline-2 outline-focus outline-offset-2'
            : 'flex h-(--nt-control-lg) w-(--nt-control-lg) items-center justify-center rounded-md border border-border bg-surface font-mono text-[20px] text-fg tabular-nums'
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: a fixed row of boxes, never reordered.
          <Fragment key={index}>
            {groupAfter !== undefined && index === groupAfter ? (
              <span aria-hidden="true" className="w-1" />
            ) : null}
            <span aria-hidden="true" data-nt-otp-box data-active={active} className={box}>
              {sign ??
                (active ? <span className="h-5 w-px bg-fg motion-safe:animate-pulse" /> : null)}
            </span>
          </Fragment>
        )
      })}
      <input
        type="text"
        inputMode={charset === 'digits' ? 'numeric' : 'text'}
        autoComplete="one-time-code"
        spellCheck={false}
        aria-label={label}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        aria-required={ariaRequired}
        id={id}
        disabled={disabled}
        value={code}
        onChange={onChange}
        onFocus={(event) => {
          setFocused(true)
          toEnd(event.currentTarget)
        }}
        onBlur={() => setFocused(false)}
        onSelect={(event) => toEnd(event.currentTarget)}
        className="absolute inset-0 h-full w-full cursor-text opacity-0 disabled:cursor-not-allowed"
      />
    </span>
  )
}
