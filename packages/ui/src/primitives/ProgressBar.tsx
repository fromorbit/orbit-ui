/** The props of `ProgressBar`. */
export interface ProgressBarProps {
  /** What is under way: "Uploaden van rapport.pdf". */
  label: string
  /** How far it is, from 0 to `max`; left out while nobody knows yet (a pulsing bar). */
  value?: number
  max?: number
  /** The value in words for a screen reader: "40 procent". Left out, the percentage is read. */
  valueText?(value: number, max: number): string
}

/**
 * A bar for a task that is running: an upload, a build, a copy.
 *
 * `role="progressbar"`, where `ProgressMeter` is a `meter`: this one moves while the reader watches
 * and ends when the task does. Without a `value` it is indeterminate: the whole bar pulses (the
 * `nt-shimmer` of `Skeleton`, which stands still under reduced motion) and no value is announced.
 * The fill is the accent, the colour of what is happening now; the track is the plane of a mark.
 */
export function ProgressBar({ label, value, max = 100, valueText }: ProgressBarProps) {
  const known = value !== undefined
  const share = known && max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      {...(known ? { 'aria-valuenow': value } : {})}
      {...(known && valueText ? { 'aria-valuetext': valueText(value, max) } : {})}
      className="relative h-1.5 w-full min-w-0 overflow-hidden rounded-full bg-mark"
    >
      {known ? (
        <div
          data-nt-progress-fill
          className="absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-200 motion-reduce:transition-none"
          // The one value no class can hold: the share itself.
          style={{ width: `${Math.round(share * 100)}%` }}
        />
      ) : (
        <div data-nt-progress-fill className="nt-shimmer absolute inset-0 rounded-full bg-accent" />
      )}
    </div>
  )
}
