import { cva } from 'class-variance-authority'
import type { ReactNode } from 'react'
import { Icon } from '../primitives/Icon'

/**
 * The two shapes, with no shared layout classes between them.
 *
 * Every class sits in a variant rather than in the base: with no class-merging tool in this
 * project, a base `flex-col` and a variant `flex-row` would both end up in the list and leave the
 * winner to Tailwind's generation order.
 */
const errorState = cva('', {
  variants: {
    size: {
      md: 'flex flex-col items-center gap-2 px-4 py-8 text-center',
      sm: 'flex flex-row items-center gap-2 px-2 py-1.5 text-left',
    },
  },
  defaultVariants: { size: 'md' },
})

/** The props of `ErrorState`. */
export interface ErrorStateProps {
  /** Already translated: the caller resolves `errors.<code>`; this pattern translates nothing. */
  title: string
  /** The machine-readable code beside the sentence, for a bug report. */
  code?: string
  /**
   * What the source itself said, shown exactly as it said it and never translated.
   *
   * A code is a closed vocabulary only where the app owns it; a provider invents its own
   * (`authentication_failed`, `billing_error`), so `errors.<code>` falls back to a generic
   * sentence and this line is the only place the user learns they are logged out or over quota.
   * Content stays content: the app translates codes, not the words of a provider or a tool.
   * Blank or whitespace-only counts as absent, so an empty message leaves no empty line.
   */
  detail?: string
  /** `sm` is the compact line for inside a list or a popover; `md` fills a panel. */
  size?: 'md' | 'sm'
  /** What to do about it, e.g. a `Button` that retries. */
  action?: ReactNode
}

/**
 * Something failed, said in words, with the code that belongs to it.
 *
 * `role="alert"` because this replaces content the user was waiting for: it arrives after the
 * page, so it has to interrupt rather than wait to be found. The code stays mono and muted — it is
 * evidence for a bug report, not the message.
 */
export function ErrorState({ title, code, detail, size, action }: ErrorStateProps) {
  const small = size === 'sm'
  const words = detail?.trim() ? detail : undefined
  return (
    // A compact row that carries the source's own sentence wraps, so that sentence gets a line of
    // its own (`basis-full` below) instead of competing with the title for the same width.
    <div role="alert" className={`${errorState({ size })}${small && words ? ' flex-wrap' : ''}`}>
      <span className="text-danger">
        <Icon name="alert-triangle" size={small ? 'sm' : 'md'} />
      </span>
      <p className={small ? 'm-0 text-[12px] text-fg' : 'm-0 text-[13px] font-medium text-fg'}>
        {title}
      </p>
      {code ? <p className="m-0 font-mono text-[11px] text-muted">{code}</p> : null}
      {words ? (
        <p
          className={
            small
              ? 'm-0 basis-full font-mono text-[12px] break-words text-muted select-text'
              : 'm-0 min-w-0 font-mono text-[12px] break-words text-muted select-text'
          }
        >
          {words}
        </p>
      ) : null}
      {action ? <div className={small ? 'ml-auto' : 'mt-1'}>{action}</div> : null}
    </div>
  )
}
