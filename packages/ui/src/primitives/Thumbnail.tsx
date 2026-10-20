import type { ComponentPropsWithRef } from 'react'

/** The props of `Thumbnail`. */
export interface ThumbnailProps
  extends Omit<ComponentPropsWithRef<'button'>, 'className' | 'style' | 'children'> {
  /** What a press opens, for the ear: the image itself is decorative here. */
  label: string
  /** The image as a data URL, or `null` while it loads — the frame then stands empty. */
  src: string | null
}

/**
 * A small image that opens large: a button of 56×32 with a 1px border, the top of the image
 * filling it (a screen is read from the top). The finding of an audit shows its first image this
 * way; a press is the caller's — a dialog with the image large.
 *
 * Its name comes from `label`, never from the image, which is `alt=""`: the row around it already
 * says what the image is of.
 */
export function Thumbnail({ label, src, type = 'button', ...rest }: ThumbnailProps) {
  return (
    <button
      type={type}
      aria-label={label}
      {...rest}
      className="no-drag h-8 w-14 shrink-0 overflow-hidden rounded-sm border border-border bg-surface outline-focus focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40"
    >
      {src ? (
        <img src={src} alt="" className="block h-full w-full object-cover object-top" />
      ) : null}
    </button>
  )
}
