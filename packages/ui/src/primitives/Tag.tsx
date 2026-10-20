import { cva } from 'class-variance-authority'
import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

/**
 * `success` is a tint only (no `-subtle` token exists for it, unlike `attention` and `danger`),
 * used for a single confirmed state such as an authenticated provider.
 */
const tag = cva(
  'inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[11px] font-medium',
  {
    variants: {
      tone: {
        neutral: 'border-border bg-surface text-fg',
        success: 'border-border text-success',
        attention: 'border-attention-border bg-attention-subtle text-fg',
        danger: 'border-danger-border bg-danger-subtle text-fg',
      },
      mono: { true: 'font-mono' },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

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
