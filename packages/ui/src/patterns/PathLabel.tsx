import { cva } from 'class-variance-authority'
import type { ReactElement } from 'react'

/** Both separators, so a path typed on Windows splits where a Windows user expects it to. */
const SEPARATORS = ['/', '\\']

/**
 * Splits a path into the part that may lose characters and the part that may not.
 *
 * The tail carries its own leading separator, so the two halves still read as one path once the
 * head is down to an ellipsis (`/work/…/nt-agent` rather than `/work/…nt-agent`). A path without a
 * separator, or one that is nothing but a root (`/work`, `/work/`), is all tail: there is nothing in
 * front of the last segment to give away.
 *
 * Separators at the very end are skipped before the cut is looked for. A path written `/work/x/`
 * would otherwise cut after the last one and leave the name in the head and a bare `/` as the tail —
 * the ellipsis would then eat the one thing this component exists to protect.
 */
function split(path: string): { head: string; tail: string } {
  let end = path.length
  while (end > 0 && SEPARATORS.includes(path[end - 1] as string)) end--
  const cut = Math.max(...SEPARATORS.map((separator) => path.lastIndexOf(separator, end - 1)))
  return cut > 0 ? { head: path.slice(0, cut), tail: path.slice(cut) } : { head: '', tail: path }
}

/** The props of `PathLabel`. */
export interface PathLabelProps {
  /** An absolute or relative path, shown as it is; never shortened in the string itself. */
  path: string
  /**
   * Whether the name stands out from the folder it is in.
   *
   * `none` (the default) gives the path no colour at all: it takes the one of its row. `name` is a
   * file as the main text of a row, the way the changes tab lists it — the folder quiet, the name
   * bright and a size up, so the eye lands on the name. `gone` is the same file after it was
   * deleted: quiet all over, and the name struck through, so "gone" is a shape and not only a
   * shade of grey.
   */
  emphasis?: 'none' | 'name' | 'gone'
  /**
   * Where the folder loses characters: at its `end` (the default, so the path keeps where it
   * begins) or at its `start`, for the head of a document, where the folders nearest the name say
   * more than the root. The name never shrinks either way.
   */
  cut?: 'end' | 'start'
}

/**
 * The three parts per emphasis, each a whole class string: Tailwind finds a class by scanning the
 * source, so a name put together at runtime would never be generated.
 */
const label = cva('inline-flex min-w-0 max-w-full items-baseline text-left font-mono', {
  variants: { emphasis: { none: 'text-[11px]', name: 'text-[12px]', gone: 'text-[12px]' } },
  defaultVariants: { emphasis: 'none' },
})
const head = cva('min-w-0 truncate', {
  variants: { emphasis: { none: '', name: 'text-muted', gone: 'text-muted' } },
  defaultVariants: { emphasis: 'none' },
})
const tail = cva('shrink-0', {
  variants: { emphasis: { none: '', name: 'text-fg', gone: 'text-muted line-through' } },
  defaultVariants: { emphasis: 'none' },
})

/**
 * A path in mono and muted, cut in the middle when the column is too narrow.
 *
 * Truncating at the end is the wrong cut for a path: every checkout under `/work/klanten/…` starts
 * the same, and what tells them apart — the last segment — is exactly what an ellipsis at the end
 * eats first. So the head truncates and the tail never shrinks, and the reader keeps both where
 * the path begins and which folder it is.
 *
 * The cut is CSS, not string surgery: the text stays the whole path in the DOM (so it is copied,
 * read and searched whole) and the browser decides per render how much of the head fits. That also
 * means the element must be allowed to shrink — it is `max-w-full` with `min-w-0`, and whatever
 * holds it needs `min-w-0` as well, or a flex row will happily grow to the full path instead.
 *
 * `title` carries the whole path until a `Tooltip` takes that over.
 *
 * **It has no colour of its own** by default, deliberately: it takes the one of the row it stands in. A path
 * is a detail *of* something, and a detail that stayed muted on a highlighted row would be 3.71:1
 * against that row's fill — under the 4.5:1 body text owes. Whoever places
 * one decides how loud it is; in a list that is `SearchList`, which mutes a detail on every row
 * except the one the keyboard stands on. The exception is a path that *is* the row's main text,
 * a file in the changes tab: there `emphasis` quiets the folder and brightens the name.
 *
 * Between the head's ellipsis and the tail's separator there is sometimes a sliver of space, up to
 * one character wide. That is Chromium rounding `text-overflow` to whole characters: it drops the
 * last one that would not fit beside the ellipsis and leaves the remainder blank. The trick that
 * closes it — an RTL direction with a `&lrm;` around the text — is deliberately not used here: it
 * changes the order in which the path is selected and read out, and a path that copies backwards is
 * a worse bargain than a few pixels.
 */
export function PathLabel({ path, emphasis = 'none', cut = 'end' }: PathLabelProps): ReactElement {
  const parts = split(path)
  return (
    <span
      data-nt-path
      title={path}
      // `text-left` of its own: a path reads left to right, and the head can only lose its tail
      // end when it is aligned that way. A row that right-aligns its detail column would otherwise
      // push the ellipsis away from the separator and leave a gap in the middle of the path.
      className={label({ emphasis })}
    >
      {parts.head ? (
        <span
          data-nt-path-head
          className={cut === 'start' ? `${head({ emphasis })} [direction:rtl]` : head({ emphasis })}
        >
          {/* Cut from the start: the box runs right to left so its ellipsis stands first, while the
              text inside stays an isolated left-to-right run — it reads, copies and is spoken in
              its own order, which is what kept the RTL trick out of the default above. */}
          {cut === 'start' ? <bdi dir="ltr">{parts.head}</bdi> : parts.head}
        </span>
      ) : null}
      <span data-nt-path-tail className={tail({ emphasis })}>
        {parts.tail}
      </span>
    </span>
  )
}
