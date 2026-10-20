import { cva } from 'class-variance-authority'
import { Children, type ComponentPropsWithRef, type ReactNode } from 'react'
import { useUi } from '../provider/UiProvider'
import type { ControlSize } from './control-size'
import { controlSize } from './control-size'
import { Kbd } from './Kbd'
import { Spinner } from './Spinner'
import type { ShortcutLabel } from './shortcut'

/** The props of `Button`. */
export interface ButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'className' | 'style'> {
  /**
   * primary: the one action that matters. secondary: everything else. ghost: no border, for a
   * toolbar or a toggle — `aria-pressed` then reads as its active state. quiet: a ghost that also
   * takes the foreground on keyboard focus, as it does on hover. plain: a ghost whose words are in
   * the foreground at rest, for a picker that stands alone at the head of a panel — no fill and no
   * outline until hover. idle: the quiet plane of a primary action that cannot act yet — the empty
   * Verstuur of the composer — which keeps its full strength while
   * `aria-disabled`, so its words stay readable where every other variant dims.
   */
  variant?: 'primary' | 'secondary' | 'ghost' | 'quiet' | 'plain' | 'idle'
  /**
   * `xs` (20 px, 11 px words) is only for a quiet button inside a thin bar, such as the moment
   * button in a diff's footer; it lights up on keyboard focus as it does on hover, since at that
   * size the focus ring alone is easy to miss. Not a `ControlSize`: nothing else is that small.
   */
  size?: ControlSize | 'xs'
  /** Full width with its content left-aligned, for a button that stands alone in a column. */
  block?: boolean
  /**
   * Centres a `Spinner` over the button and blocks the click; the label stays in the DOM
   * (invisible, via `opacity-0`) so the button keeps both its width and its accessible name.
   */
  loading?: boolean
  /**
   * Lets the button give up width in a row that has run out of it; its label then truncates.
   *
   * Off by default, and that is the safer half: a button that shrinks below its label hides what
   * it does, which is almost never what a row wants. The composer's toolbar is the case that wants
   * it — its three pills and the buttons beside them ask for 586px with every value at its cap,
   * and the toolbar in a 900px window is 562px — and a pill giving up its tail is what keeps the
   * send button inside the surface.
   */
  shrink?: boolean
  /**
   * Starts the content 8px in, the start padding of a list row, instead of the size's own padding.
   *
   * For a button that stands in a column of `List` rows, such as "Nieuwe chat" and the project
   * picker in the sidebar: its icon or word then lands on the line of the status shapes below,
   * while the button itself keeps the rows' edge, so its hover fill lines up with theirs. The end
   * keeps the size's padding, so a trailing `Kbd` stays where it was.
   */
  rowInset?: boolean
  /**
   * The key that does what the button does, drawn inside it after the label ("Verstuur" and the
   * Enter icon of the composer): a command of the host's catalogue, read through the `ShortcutPort` of
   * `UiProvider` — which in a story may also take a written-out key. Without a provider nothing
   * is drawn and nothing is announced.
   *
   * On `primary` it lies on the accent as `Kbd` `on-accent` (a dark plane of 16%), where muted
   * would sink into the blue; on every other variant it lies on a quiet plane of the same shape
   * (`plane`), so Stop's esc and Verstuur's Enter are the same kind of cap. It is part of the look, not of
   * the name: the keys are hidden from assistive technology, so the button is still called by its
   * words, and a command of the catalogue reaches a screen reader as `aria-keyshortcuts` instead.
   */
  shortcut?: ShortcutLabel
}

/**
 * The classes per variant and size, as a single `cva` call.
 *
 * Kept as one call (rather than a lookup object per axis, as before) so the two axes combine
 * without a template string, and so a new size or variant is one line here instead of a change at
 * every call site.
 */
const button = cva(
  // No `justify-*` here: with no class-merging tool in this project (no tailwind-merge), a
  // base-level `justify-center` and the `block` variant's `justify-start` would both end up in
  // the class list, relying on Tailwind's generation order (not CSS specificity, which ties for
  // two classes of equal weight) to pick a winner. The `block` variant below is exhaustive
  // (`true`/`false`) so exactly one `justify-*` class is ever emitted. `relative` positions the
  // `Spinner` overlay while `loading`; it does nothing otherwise. `whitespace-nowrap` keeps the
  // label on one line: the height comes from a size token, so a second line does not make the
  // button taller — it spills out of it, over whatever stands below.
  // The dimming of `aria-disabled` sits in each variant rather than here: `idle` must stay at full
  // strength, and a base class cannot be taken back by a variant without a class-merging tool.
  'no-drag relative inline-flex items-center whitespace-nowrap rounded-md font-medium outline-focus transition-[filter,background-color] duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none aria-disabled:hover:filter-none',
  {
    variants: {
      variant: {
        // A primary that cannot act yet looks like the empty Verstuur (`idle`), never a faded accent:
        // the accent is for what a press does now. A button
        // that is `loading` is disabled as well, but busy with its own press: it keeps the accent.
        primary:
          'bg-accent text-accent-fg hover:brightness-110 aria-disabled:bg-pill aria-disabled:text-muted disabled:not-aria-busy:bg-pill disabled:not-aria-busy:text-muted disabled:aria-busy:opacity-40',
        secondary:
          'border border-border text-fg hover:bg-surface-hover aria-disabled:opacity-40 disabled:opacity-40',
        ghost:
          'text-muted hover:bg-surface hover:text-fg aria-pressed:bg-surface-hover aria-pressed:text-fg aria-disabled:opacity-40 disabled:opacity-40',
        // A ghost that also comes forward on keyboard focus, for a row of quiet toggles that carry
        // a word, such as the foot of the sidebar. Its own variant rather than a change to `ghost`:
        // a focused ghost trigger (a popover's) keeps the look its references were taken with.
        quiet:
          'text-muted hover:bg-surface hover:text-fg focus-visible:text-fg aria-pressed:bg-surface-hover aria-pressed:text-fg aria-disabled:opacity-40 disabled:opacity-40',
        // A filled picker read as a block in the panel, so it rests on nothing and only its words
        // say it is there; hover takes the fill of an active tab pill.
        plain: 'text-fg hover:bg-surface-hover aria-disabled:opacity-40 disabled:opacity-40',
        // The empty Verstuur: the plane of a pill, the words muted, never the accent and never
        // dimmed — it is a tab stop that says what it will do.
        idle: 'bg-pill text-muted',
      },
      size: {
        // The horizontal padding is not here but in `compoundVariants`, beside `rowInset`: one
        // `px-*` next to a `ps-*` would leave the winner to Tailwind's output order.
        xs: 'h-(--nt-control-xs) text-[11px] focus-visible:text-fg',
        sm: controlSize.sm,
        md: controlSize.md,
        lg: controlSize.lg,
      },
      rowInset: { true: '', false: '' },
      // `text-left` beside `justify-start`: a `<button>` centres its text by default, which a
      // truncated label in a full-width button would inherit.
      block: { true: 'w-full min-w-0 justify-start text-left', false: 'justify-center' },
      // Exhaustive, for the same reason as `block`: with no class-merging tool, `shrink-0` in the
      // base and `shrink` in a variant would both be emitted and the winner would be whichever
      // Tailwind generated last. `min-w-0` is what actually lets a flex item go below its content.
      shrink: { true: 'min-w-0 shrink', false: 'shrink-0' },
    },
    compoundVariants: [
      { size: 'xs', rowInset: false, class: 'px-1.5' },
      { size: 'sm', rowInset: false, class: 'px-2' },
      { size: 'md', rowInset: false, class: 'px-3' },
      { size: 'lg', rowInset: false, class: 'px-3.5' },
      { size: 'xs', rowInset: true, class: 'ps-2 pe-1.5' },
      { size: 'sm', rowInset: true, class: 'ps-2 pe-2' },
      { size: 'md', rowInset: true, class: 'ps-2 pe-3' },
      { size: 'lg', rowInset: true, class: 'ps-2 pe-3.5' },
    ],
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
      block: false,
      shrink: false,
      rowInset: false,
    },
  },
)

/**
 * Gives every run of text among the children a box of its own, so a label can lose its tail.
 *
 * A bare text node inside a flex row becomes an anonymous flex item, and `text-overflow` never
 * reaches one: measured in Chromium, such a label is clipped hard, with no ellipsis, however much
 * `truncate` the row around it carries. A span of its own is the only box an ellipsis can appear
 * in, and it is the button's job to make one rather than every caller's.
 *
 * Only direct children are seen: `Children.map` does not descend into a fragment, so text inside
 * a `<>…</>` keeps wrapping instead of truncating — pass a label as a direct child of `Button`.
 */
function withTruncatableText(children: ReactNode): ReactNode {
  return Children.map(children, (child) =>
    typeof child === 'string' || typeof child === 'number' ? (
      <span className="min-w-0 truncate">{child}</span>
    ) : (
      child
    ),
  )
}

/**
 * The button of the design system.
 *
 * `className` is not accepted, so every button looks the same. It carries `no-drag` so it stays
 * clickable inside a drag region, and defaults to `type="button"` so it never submits a form by
 * accident. Accepts a `ref` to the native element (React 19 passes it through as a plain prop, no
 * `forwardRef` needed), which `Popover.Trigger asChild` and focus management rely on.
 */
export function Button({
  variant,
  size,
  block,
  shrink,
  rowInset,
  loading,
  type = 'button',
  disabled,
  shortcut,
  children,
  ...props
}: ButtonProps) {
  // `className` and `style` are not part of `ButtonProps`, but a caller working around the type
  // (or plain JS) could still pass either; drop them explicitly so they can never leak past the
  // variant classes.
  const { className: _className, style: _style, ...rest } = props as ComponentPropsWithRef<'button'>
  const { shortcuts } = useUi()
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-keyshortcuts={shortcut === undefined ? undefined : shortcuts.aria(shortcut)}
      className={button({ variant, size, block, shrink, rowInset })}
      {...rest}
    >
      {/* The row the children stand in, with the space between an icon and its label: Tailwind's
          reset gives an `<svg>` `display: block`, so without this row every caller with an icon
          has to build the same wrapper by hand. `min-w-0` lets that row shrink inside a
          full-width button, which is what lets the label inside it truncate.
          `w-full` only for `block`: without it this row hugs its own content and `justify-start`
          leaves the rest of the button empty, which is exactly what a `block` caller wants for a
          label alone — but it also means a trailing child (a `Kbd`) sits right after the label
          instead of at the button's own edge. `w-full` gives a `flex-1` child in between (the
          sidebar's "Nieuwe chat" label) real room to grow into, so the trailing child lands
          flush right instead. A non-`block` button stays centred exactly as before: `w-full`
          here is moot when the button itself hugs its content.
          `opacity-0`, not `visibility:hidden` or removing it: the label keeps its layout box (so
          the button keeps its width) and stays in the accessibility tree (so it stays the
          accessible name) while loading — only its paint is suppressed. */}
      <span
        className={`inline-flex min-w-0 items-center gap-1.5 ${block ? 'w-full' : ''} ${loading ? 'opacity-0' : ''}`}
      >
        {withTruncatableText(children)}
        {shortcut ? (
          <span aria-hidden="true" className="flex shrink-0">
            {/* `idle` takes the key cap of the accent as well: the empty Verstuur and the ready one
                are the same button in two moods, and a key of another width would move the
                toolbar the moment the first letter is typed. */}
            <Kbd
              shortcut={shortcut}
              tone={variant === 'primary' || variant === 'idle' ? 'on-accent' : 'plane'}
            />
          </span>
        ) : null}
      </span>
      {loading ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner size="sm" decorative />
        </span>
      ) : null}
    </button>
  )
}
