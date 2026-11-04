import { cva } from 'class-variance-authority'
import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

/**
 * A tag is a tinted plane without a frame. `success` is the exception: its words alone, in the
 * success colour inside a hairline, used for a single confirmed state such as an authenticated
 * provider. No plane, because the deep green of light falls under AA on any tint (4.2:1 on the
 * frame), and no `-subtle` token exists for it, unlike `attention` and `danger`.
 */
const tag = cva('inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium', {
  variants: {
    tone: {
      neutral: 'bg-surface-hover text-fg',
      success: 'border border-border text-success',
      attention: 'bg-attention-subtle text-fg',
      danger: 'bg-danger-subtle text-fg',
    },
    mono: { true: 'font-mono' },
  },
  defaultVariants: { tone: 'neutral' },
})

/** The props of `Tag`. */
export interface TagProps {
  tone?: 'neutral' | 'success' | 'attention' | 'danger'
  /** Shown decoratively before the text. */
  icon?: IconName
  /** For a value that must line up, such as a short id. */
  mono?: boolean
  /** A status tag with no words does not exist: text is required, colour never carries it alone. */
  children: ReactNode
}

/** A small labelled badge, e.g. for an item's status. */
export function Tag({ tone, icon, mono, children }: TagProps) {
  return (
    <span className={tag({ tone, mono })}>
      {icon ? <Icon name={icon} size="sm" /> : null}
      {children}
    </span>
  )
}
