import { Button } from '../primitives/Button'
import { IconButton } from '../primitives/IconButton'
import { Select } from '../primitives/Select'

/** The words of `Pagination`. */
export interface PaginationLabels {
  /** The name of the landmark: "Pagina's". */
  label: string
  previous: string
  next: string
  /** The name of a page's button: "Pagina 3". */
  page(page: number): string
  /** The count at the start: "1–25 van 128". Left out, no count. */
  range?(from: number, to: number, total: number): string
  /** The name of the page size: "Per pagina". */
  perPage?: string
}

/** The props of `Pagination`. */
export interface PaginationProps {
  /** The page on screen, from 1. */
  page: number
  /** How many rows there are in all. */
  total: number
  /** How many rows a page holds. */
  pageSize: number
  onPageChange(page: number): void
  labels: PaginationLabels
  /** The sizes to choose from; with `onPageSizeChange`, a choice of the page size. */
  pageSizes?: readonly number[]
  onPageSizeChange?(size: number): void
}

/** One place in the row of pages: a page number, or a gap of pages left out. */
export type PageItem = number | 'gap'

/**
 * The pages to show around `page` out of `count`: always the first and the last, the page and one
 * on each side, and a gap where pages are left out; never a gap of a single page (that page is
 * shown instead). Seven places at most.
 */
export function pageItems(page: number, count: number): PageItem[] {
  if (count <= 7) return Array.from({ length: count }, (_, index) => index + 1)
  const near = new Set([1, count, page - 1, page, page + 1])
  if (page <= 4) for (let p = 2; p <= 5; p++) near.add(p)
  if (page >= count - 3) for (let p = count - 4; p < count; p++) near.add(p)
  const shown = [...near].filter((p) => p >= 1 && p <= count).sort((a, b) => a - b)
  const items: PageItem[] = []
  shown.forEach((p, index) => {
    const before = shown[index - 1]
    if (before !== undefined && p - before === 2) items.push(before + 1)
    else if (before !== undefined && p - before > 2) items.push('gap')
    items.push(p)
  })
  return items
}

/**
 * Paging through a long list: the count of what is shown, the page before and after, the pages
 * around the current one, and optionally how many rows a page holds.
 *
 * A `nav` landmark with a name of its own; the current page carries `aria-current="page"`, the
 * others say "Pagina 3" in full rather than a bare "3". The buttons before and after are disabled
 * at the ends. The page is the caller's: this component only asks for another one.
 */
export function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
  labels,
  pageSizes,
  onPageSizeChange,
}: PaginationProps) {
  const count = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(Math.max(1, page), count)
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1
  const to = Math.min(total, current * pageSize)
  return (
    <nav
      aria-label={labels.label}
      className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-muted"
    >
      <span className="flex items-center gap-3">
        {labels.range ? (
          <span className="tabular-nums">{labels.range(from, to, total)}</span>
        ) : null}
        {pageSizes && onPageSizeChange && labels.perPage ? (
          <Select
            label={labels.perPage}
            size="sm"
            value={String(pageSize)}
            options={pageSizes.map((size) => ({ value: String(size), label: String(size) }))}
            onValueChange={(size) => onPageSizeChange(Number(size))}
          />
        ) : null}
      </span>
      <span className="flex items-center gap-1">
        <IconButton
          icon="chevron-left"
          size="sm"
          label={labels.previous}
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
        />
        {pageItems(current, count).map((item, index) =>
          item === 'gap' ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: a gap has no page of its own; its place is its key.
            <span key={`gap-${index}`} aria-hidden="true" className="px-1 tabular-nums">
              …
            </span>
          ) : (
            <Button
              key={item}
              size="sm"
              variant={item === current ? 'secondary' : 'ghost'}
              aria-label={labels.page(item)}
              aria-current={item === current ? 'page' : undefined}
              onClick={() => {
                if (item !== current) onPageChange(item)
              }}
            >
              <span className="tabular-nums">{item}</span>
            </Button>
          ),
        )}
        <IconButton
          icon="chevron-right"
          size="sm"
          label={labels.next}
          disabled={current >= count}
          onClick={() => onPageChange(current + 1)}
        />
      </span>
    </nav>
  )
}
