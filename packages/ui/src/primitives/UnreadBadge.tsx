/** The props of `UnreadBadge`. */
export interface UnreadBadgeProps {
  /** How many messages are unread. At 0 or below the badge is not drawn at all. */
  count: number
  /**
   * The count in words, already translated ("3 ongelezen berichten"): what a screen reader hears
   * instead of the bare digit, which says nothing about what it counts.
   */
  label: string
  /** Above this the badge shows "<max>+", so it never grows wider than the row allows. Default 99. */
  max?: number
}

/**
 * The count of unread messages at the end of a row: 18px high and at least as wide, round, the
 * digits in 11px DM Mono at 500 in `accent-fg` on `bg-unread`.
 *
 * The one count in the kit with a fill: a count that asks to be read (Von Restorff), where the
 * count of a `SideNav` row is quiet meta. Shape and figure carry it, the colour only marks it. The
 * digits are hidden from a screen reader, which hears `label` instead.
 */
export function UnreadBadge({ count, label, max = 99 }: UnreadBadgeProps) {
  if (count <= 0) return null
  return (
    <span
      data-nt-unread-badge
      className="inline-grid h-[18px] min-w-[18px] shrink-0 place-items-center rounded-full bg-unread px-[5px] font-mono text-[11px] leading-none font-medium text-accent-fg tabular-nums"
    >
      <span aria-hidden="true">{count > max ? `${max}+` : count}</span>
      <span className="sr-only">{label}</span>
    </span>
  )
}
