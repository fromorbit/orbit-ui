import { Children, type ReactNode } from 'react'
import { Popover } from '../overlays/Popover'
import { Tooltip } from '../overlays/Tooltip'
import { Icon, type IconName } from '../primitives/Icon'
import { IconButton } from '../primitives/IconButton'

/** The props of `Chip`. */
export interface ChipProps {
  /**
   * `sm` is the chip above the composer: 24px, a 16px
   * thumbnail, and its cross only on hover or focus, since a row of crosses reads as a row of
   * errors. `md` (default) everywhere else, the conversation included.
   */
  size?: 'sm' | 'md'
  /** What the chip is, in words: its visible text and the name of its button. */
  label: string
  /**
   * The source of a thumbnail before the words, usually a `data:` URL of a crop.
   *
   * Decorative on purpose (`alt=""`): the label already says what the picture shows, and a second
   * name would be read out twice.
   */
  image?: string
  /**
   * A small glyph before the words, such as the type icon of a file (`PierreFileIcon`) or the
   * folder of `Icon`. Decorative like the thumbnail: the label says what it is.
   */
  icon?: ReactNode
  /**
   * The whole truth behind short words, in the `title` of the chip's body: the full path of a file
   * whose chip shows only its name.
   */
  title?: string
  /**
   * Its place in a numbered row ("2"), shown small before the words.
   *
   * The eye gets the digit alone; `label` is the whole phrase ("Aanwijzing 2 van 3") and opens the
   * chip's name, since a bare "2" read out before the words would say nothing about what it counts.
   */
  number?: { value: number; label: string }
  /**
   * A quiet sign after the words, a dimmed icon, with `label` as the tooltip that says what it
   * means ("2 aanpassingen"). A description rather than part of the name: the name says what the
   * chip is, the mark says something about it.
   */
  mark?: { icon: IconName; label: string }
  /**
   * What a click on the chip opens: a `Popover` with this name and `children` as its content.
   *
   * Without it the chip is plain text — a chip that looks clickable and does nothing would be a
   * dead button.
   */
  panel?: {
    label: string
    /** A panel for a document rather than a crop or a note: a file's preview. */
    wide?: boolean
  }
  /**
   * What a click on the chip does instead of opening a popover: the chip becomes a button that
   * leads somewhere else (the panel at the side). Not together with `panel`.
   */
  onOpen?: () => void
  /**
   * The name of the chip's button when it differs from its words: a file chip shows its name and
   * is called "Bestand: <path>", so two chips of an `index.ts` can be told apart.
   */
  name?: string
  /** The panel's content; only read with `panel`. */
  children?: ReactNode
  /**
   * A cross at the end that takes the chip away. The label is the cross's own name and should say
   * which chip it removes ("Haal weg: …"), since a row of crosses all called "remove" cannot be
   * told apart by a screen reader.
   */
  remove?: {
    label: string
    onRemove(): void
    /** Keeps the cross in place but off, while the list it belongs to cannot change. */
    disabled?: boolean
  }
}

const FRAME =
  'inline-flex h-(--nt-control-md) max-w-88 min-w-0 items-center rounded-md border border-border bg-surface text-[12px] text-fg'
/** The frame of a `sm` chip; `group/chip` so its cross can wait for hover or focus. */
const FRAME_SM =
  'group/chip inline-flex h-(--nt-control-sm) max-w-88 min-w-0 items-center rounded-md border border-border bg-surface text-[12px] text-fg'
const BODY =
  'flex h-full min-w-0 items-center gap-1.5 rounded-md pr-2 pl-1 outline-focus focus-visible:outline-2 focus-visible:outline-offset-2'

/**
 * A small token for one piece of content: a thumbnail, a few words, optionally a panel behind a
 * click and a cross that takes it away.
 *
 * Built for the attachments of a message: a pick or a screenshot above the
 * composer, and the same thing afterwards in the conversation, and later for
 * files. It lives in `patterns/` because it combines a `Popover` with a control of its own.
 *
 * **Two targets, never nested.** The body opens the panel and the cross removes; they are two
 * sibling buttons inside one frame, because a button inside a button is invalid HTML and a click
 * on the cross would open the panel as well.
 */
export function Chip({
  label,
  image,
  icon,
  title,
  name,
  number,
  mark,
  panel,
  onOpen,
  children,
  remove,
  size = 'md',
}: ChipProps) {
  const small = size === 'sm'
  const frame = small ? FRAME_SM : FRAME
  const content = (
    <>
      {number ? (
        <>
          <span data-nt-chip-number aria-hidden="true" className="shrink-0 text-muted tabular-nums">
            {number.value}
          </span>
          <span className="sr-only">{`${number.label}:`}</span>{' '}
        </>
      ) : null}
      {image ? (
        <img
          src={image}
          alt=""
          className={
            small
              ? 'size-4 shrink-0 rounded-sm border border-border object-cover'
              : 'size-5 shrink-0 rounded-sm border border-border object-cover'
          }
        />
      ) : null}
      {icon ? (
        <span data-nt-chip-icon aria-hidden="true" className="flex shrink-0 text-muted">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 truncate">{label}</span>
      {mark ? (
        <span data-nt-chip-mark className="flex shrink-0 text-muted">
          <Icon name={mark.icon} size="xs" />
        </span>
      ) : null}
    </>
  )
  const text = (
    <span className={BODY} {...(title ? { title } : {})}>
      {content}
    </span>
  )
  // Without a panel there is nothing to focus: the mark explains itself to a pointer only.
  const plain = mark ? <Tooltip label={mark.label}>{text}</Tooltip> : text
  return (
    <span data-nt-chip className={remove ? `${frame} pr-0.5` : frame}>
      {panel ? (
        <Popover
          label={panel.label}
          {...(panel.wide ? { wide: true } : {})}
          {...(mark ? { tooltip: mark.label } : {})}
          trigger={
            <button
              type="button"
              {...(title ? { title } : {})}
              {...(name ? { 'aria-label': name } : {})}
              className={`${BODY} no-drag cursor-default hover:bg-surface-hover`}
            >
              {content}
            </button>
          }
        >
          {children}
        </Popover>
      ) : onOpen ? (
        <button
          type="button"
          {...(title ? { title } : {})}
          {...(name ? { 'aria-label': name } : {})}
          onClick={onOpen}
          className={`${BODY} no-drag cursor-default hover:bg-surface-hover`}
        >
          {content}
        </button>
      ) : (
        plain
      )}
      {remove ? (
        // The name of the cross as a tooltip too.
        <span
          data-nt-chip-remove
          className={
            small
              ? 'flex opacity-0 group-focus-within/chip:opacity-100 group-hover/chip:opacity-100'
              : 'flex'
          }
        >
          <Tooltip label={remove.label}>
            <IconButton
              icon="x"
              size={small ? 'xs' : 'sm'}
              label={remove.label}
              {...(remove.disabled ? { disabled: true } : {})}
              onClick={remove.onRemove}
            />
          </Tooltip>
        </span>
      ) : null}
    </span>
  )
}

/** The props of `ChipRow`. */
export interface ChipRowProps {
  /** The name of the row as a list ("Bijlagen"). */
  label: string
  /** The chips, in the order they came; each becomes one list item. */
  children: ReactNode
}

/**
 * A row of chips that wraps onto a next line instead of scrolling or cutting one off.
 *
 * A list, so a screen reader says how many there are before it reads the first; the order is the
 * order the caller hands them in, which is the order they will be sent in.
 */
export function ChipRow({ label, children }: ChipRowProps) {
  return (
    <ul aria-label={label} className="flex min-w-0 flex-wrap gap-1">
      {Children.toArray(children).map((child, index) => (
        // The children carry their own keys; `toArray` prefixes them, so the index is only a
        // fallback for a child that came without one.
        <li key={(child as { key?: string | null }).key ?? index} className="flex min-w-0">
          {child}
        </li>
      ))}
    </ul>
  )
}
