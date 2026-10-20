import { cva } from 'class-variance-authority'
import {
  type ComponentPropsWithRef,
  type ReactElement,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { Popover } from '../overlays/Popover'
import { Button } from '../primitives/Button'
import { controlSize } from '../primitives/control-size'
import { Icon, type IconName } from '../primitives/Icon'
import { COLLAPSE_BELOW, Pill, PillText } from '../primitives/Pill'
import {
  SearchList,
  type SearchListAction,
  type SearchListItem,
  type SearchListLabels,
  type SearchListLayout,
  type SearchListState,
} from './SearchList'

/** The props every variant of `PickerPill` shares. */
export interface PickerPillBaseProps {
  /** What is being chosen ("Project"); the accessible name is "<label>: <value>". */
  label: string
  /** The sentences of the list in the panel; see `SearchListLabels`. */
  listLabels: SearchListLabels
  /** The current choice as the pill shows it. */
  value: string
  items: readonly SearchListItem[]
  /**
   * The id of the current choice — and the one thing that closes an open panel from outside.
   *
   * Changing it closes the panel: that is how the action row ends. "Map toevoegen…" opens the
   * host's folder dialog, whose outcome this component cannot see, so it waits and treats the
   * arrival of a new choice as the end of the job. Cancel the dialog and nothing changes, so the
   * list is still there to pick from.
   *
   * The known consequence: anything else that changes this value also closes the panel. A pill fed
   * from core over the control stream (the model pill, where a run activating can report another
   * model) can therefore shut under the reader's hands; whoever builds that pill decides whether
   * to hold the value steady while its own panel is open.
   */
  selectedId: string | null
  onSelect(id: string): void
  searchable?: boolean
  action?: SearchListAction
  /** Passed to the list: a picker whose items are still on their way, or did not arrive. */
  state?: SearchListState
  /** Passed to the list: a quiet line above the rows about the list as a whole. */
  notice?: ReactNode
  /** Passed to the list: where the `detail` of a row goes, beside the label or under it. */
  layout?: SearchListLayout
  /**
   * A remark about the value the pill shows — why it is not the one that was asked for.
   *
   * Not a reason to be off: the pill stays a control, and this only says something extra about
   * what it says (the access level the agent cannot enforce). It reaches everyone by two roads at
   * once, because neither one alone gets there: the `title` of the span around the pill, which is
   * the hover, and a visually hidden run of text the trigger names with `aria-describedby`, which
   * is the keyboard and the screen reader. A `title` on an *ancestor* contributes nothing to the
   * name or the description of the control inside it, so without the second road this sentence
   * would exist for the mouse alone — and in the read-only form, where there is no control to
   * describe at all, it simply joins the text the pill is named by.
   *
   * `disabledReason` takes the `title` when a caller passes both ("you cannot do this right now"
   * is the more urgent of the two, and one element carries one title), and the description stays.
   */
  note?: string
  /**
   * A tooltip on the pill that says what its value means, for a word that needs one (Eigen
   * werkkopie). Handed to the `Popover`, whose trigger is the pill: two
   * Radix triggers only share one button when they are nested there.
   */
  tooltip?: string
  /**
   * Fixed for this chat: renders as quiet text, not as a control.
   *
   * Wins from `disabledReason` when a caller passes both: a choice that is never coming back
   * should not look like one that is merely off for now.
   */
  readOnly?: boolean
  /** Turns the pill off and says why; shown in `title` on the span around it. */
  disabledReason?: string
  /**
   * How much room the value may take before it loses its tail: `wide` (160px), `narrow` (104px)
   * or `free` (no cap of its own).
   *
   * `wide` by default, and in the toolbar it is the model's: that value carries two names once a
   * reader has more than one agent ("Fake · Fake groot"), where the reasoning level and the access
   * level are short by nature and take the narrow cap. Three pills at their caps ask for 586px of
   * toolbar, and the composer's surface in a 900px window is 562px — see `COLLAPSE_BELOW` for what
   * happens at that edge.
   *
   * `free` is for a pill that does not share its row with anything: the project on the line under
   * the composer has the whole column to itself, and a cap there would cut a name short in front of
   * 500px of empty line. It still truncates — the value is `truncate` whatever the cap, and the
   * pill is `min-w-0` — only at the width it really has instead of at a number decided here.
   */
  width?: 'wide' | 'narrow' | 'free'
  /**
   * How the trigger is drawn: `ghost` (default), quiet text until hover, as in the composer's row
   * of pills; or `plain`, the value in the foreground with a quiet chevron, no fill and no outline
   * at rest, at the height of a tab pill.
   *
   * `plain` is for a picker that stands alone at the head of a panel, under a tab strip. It was
   * filled first; a fill read as heavy there, so it is drawn the way Codex draws it. The read-only form is the same for both.
   *
   * `field` is for a row of the settings screen, where the controls stand in one column on the
   * right: framed like a `Select` (border, `surface`, 28px) at one width of 224px, the value
   * filling it and the chevron at its end, so it reads as a control beside switches and number
   * fields rather than as a label.
   *
   * `pill` is the `Pill` with a border, for the row of controls in the composer's
   * toolbar: the access level and the Expert beside the model. `width` caps the
   * value there only for a pill that collapses; `collapse` works as in the other frames.
   */
  frame?: 'ghost' | 'plain' | 'field' | 'pill'
  /**
   * With `frame="pill"`: the quiet pill of a chat that has started, without border and plane at
   * rest. The read-only form of `pill` is always quiet, as `PillText`.
   */
  quiet?: boolean
  /**
   * A small drawing before the value that says it once more in shape — the bars of a reasoning
   * level (`LevelBars`). Decorative: the value stays the words.
   */
  glyph?: ReactNode
  /**
   * With `frame="pill"` and an `icon`: the pill as its glyph alone, the value in the tooltip and
   * the accessible name (`Pill`'s `bare`). The access level beside the model pill (design E + F).
   */
  bare?: boolean
}

/** The everyday pill: muted, and an icon only if it helps. */
export interface NeutralPickerPillProps extends PickerPillBaseProps {
  tone?: 'neutral'
  icon?: IconName
  /**
   * Never here: collapsing is a member of its own, because there it can demand the icon.
   *
   * `never` rather than absent, so the union is exclusive: an object literal is checked for excess
   * properties against the union as a whole, and without this line `collapse` alone (no icon)
   * would quietly match this member.
   */
  collapse?: never
}

/**
 * Draws attention without the words changing: the access level "full".
 *
 * `icon` is required here, and that is the guideline in the type: a state is never carried by
 * colour alone, so the caller that asks for the colour also supplies the sign that survives
 * without it.
 */
export interface AttentionPickerPillProps extends PickerPillBaseProps {
  tone: 'attention'
  icon: IconName
  /** See `NeutralPickerPillProps.collapse`: a collapsing pill is the third member. */
  collapse?: never
}

/**
 * The pill that gives way first when the toolbar runs out of room: below a container width of
 * 588px its value leaves the screen and the icon stands alone.
 *
 * A member of its own rather than a flag on the other two, because that is the one place the type
 * can demand the `icon` that is left over — the neutral pill has `icon?`, so a flag there would
 * allow a pill that collapses into nothing. Both tones are open here: the access level is quiet at
 * three of its four steps and `attention` at the widest one, and it has to be able to give way in
 * either state.
 *
 * @see COLLAPSE_BELOW for where the 588px comes from
 */
export interface CollapsingPickerPillProps extends PickerPillBaseProps {
  tone?: 'neutral' | 'attention'
  collapse: true
  icon: IconName
}

/** Exported whole, so a feature can say `Pick<PickerPillProps, 'items' | 'onSelect'>`. */
export type PickerPillProps =
  | NeutralPickerPillProps
  | AttentionPickerPillProps
  | CollapsingPickerPillProps

/*
 * Where `COLLAPSE_BELOW` comes from: the container width below which a collapsing pill falls back
 * to its icon, 588px of toolbar.
 *
 * Measured rather than guessed (a 264px sidebar and a column that stops at 768px): the
 * toolbar is a block over the full width of the composer, so it follows the window — 562px in a
 * 900px window, 622px at 960px, 662px at 1000px, and 742px from about 1080px on, where the column
 * reaches its maximum. The row holds three pills, and the number is what they need with every
 * value at its cap: the model 194px (160px of value and 34px of pill around it), the reasoning
 * level 138px (104 + 34), the access level 158px (104 + 34, plus the 20px its glyph and gap take),
 * 8px of gaps between the three, 8px more to the right-hand half, and the 80px that attachment,
 * mention and the send button take there. That is 586px, and 588 is the first step of the 4px grid
 * above it.
 *
 * The number was 640px while the project was a fourth pill in this row; it left for a line of its
 * own under the surface, and the toolbar has been 54px less crowded ever since. Collapsing is still
 * needed at the smallest window the app allows (880px, a toolbar of 542px), and the word is back
 * from a window of 926px — where it used to take 978px.
 *
 * The query itself stands on the toolbar (`data-nt-composer-toolbar`), a block over the full
 * width, and never on the box of pills inside it: that box is a shrink-to-fit flex item, and
 * `container-type: inline-size` would have it measure its own width, which is then zero. No
 * JavaScript measures anything here.
 *
 * One literal class, because Tailwind finds utilities by scanning source text: a name assembled at
 * runtime is never generated, and the element would simply lack the style — see `control-size.ts`.
 * It lives in `Pill.tsx` (`COLLAPSE_BELOW`), because the framed pill collapses by it too.
 */

/**
 * The value, capped so a long name loses its tail instead of the toolbar losing its shape.
 *
 * 160px is roughly twenty characters at 12px: enough for an agent and a model together, which is
 * what the widest value in the toolbar holds. 104px is the cap for the values that are short by
 * nature — a reasoning level, an access level — and the two together are what keeps a full toolbar
 * inside a 900px window. `free` has no cap at all, for the one pill that stands alone on its line
 * and can simply use the room it has.
 *
 * The cap sits here and not on `Button`, because it is a decision of the pill rather than of every
 * button in the app — and because a child element keeps its own box, where a bare text child would
 * be handed one by `Button` itself.
 *
 * A cap is a *maximum*, not a width: the pill itself may shrink (`shrink` on its trigger, `min-w-0`
 * on the read-only span), so in a row that has run out of room the value gives up its tail well
 * before the cap. Without that the row would not wrap but simply run past its own right edge,
 * pushing the send button out of the surface.
 *
 * The chevron stands *outside* this cap, deliberately: the same value must show the same characters
 * whether the pill can be opened or has become text, and a cap that included the sign would truncate
 * a whisker earlier in the one case than in the other.
 *
 * `neutral` carries no colour at all: it inherits the `text-muted` of the ghost button (or of the
 * read-only span), which is what makes the pill quiet.
 */
const pillValue = cva('truncate', {
  variants: {
    tone: { neutral: '', attention: 'text-attention' },
    width: { wide: 'max-w-40', narrow: 'max-w-26', free: '' },
    // `sr-only` takes the value out of the flow altogether, so it costs no pixel and no gap — and
    // it stays in the document, which is what the read-only form needs: its accessible name is the
    // text standing in it, not an `aria-label`.
    collapse: { true: COLLAPSE_BELOW, false: '' },
  },
  defaultVariants: { tone: 'neutral', width: 'wide', collapse: false },
})

/**
 * The trigger of a `field` pill: the frame of `Select`, at one fixed width so every such control
 * in a column of settings rows starts and ends on the same lines.
 */
const FIELD = `no-drag inline-flex w-56 shrink-0 items-center gap-1.5 rounded-md border border-border bg-surface px-2 text-fg outline-focus hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40 aria-expanded:bg-surface-hover ${controlSize.md}`

/** The props of `PickerFieldTrigger`. */
export interface PickerFieldTriggerProps
  extends Omit<ComponentPropsWithRef<'button'>, 'className' | 'style' | 'children'> {
  /** What is being chosen; the accessible name is "<label>: <value>". */
  label: string
  value: string
  icon?: IconName
  tone?: 'neutral' | 'attention'
}

/**
 * The trigger of a `field` picker on its own: framed like a `Select`, 224px, the value filling it
 * and the chevron at its end (see `PickerPill`'s `frame`).
 *
 * Exported for a picker that opens a panel of its own from a settings row — the model picker of
 * the default model — so the row looks the same whichever list it opens. Every prop of a button and
 * the ref pass through, so it works as the `asChild` trigger of a `Popover`.
 */
export function PickerFieldTrigger({
  label,
  value,
  icon,
  tone = 'neutral',
  type = 'button',
  ...props
}: PickerFieldTriggerProps) {
  const { className: _className, style: _style, ...rest } = props as ComponentPropsWithRef<'button'>
  return (
    <button
      type={type}
      data-nt-pill
      data-nt-pill-frame="field"
      aria-label={`${label}: ${value}`}
      className={FIELD}
      {...rest}
    >
      {icon ? (
        <span data-nt-pill-icon className={glyph({ tone })}>
          <Icon name={icon} size="sm" />
        </span>
      ) : null}
      <span data-nt-pill-value className="min-w-0 flex-1 truncate text-left">
        {value}
      </span>
      <span data-nt-pill-chevron className="flex shrink-0 text-muted">
        <Icon name="chevron-down" size="xs" />
      </span>
    </button>
  )
}

/**
 * The glyph beside the value. Colour goes on this box rather than on the glyph.
 *
 * `Icon` knows only `default` and `danger`, and a colour on whatever holds it would lose to the
 * `text-*` class the control paints itself with — see the note in `Icon.tsx`. A box of its own with
 * the token on it wins, and `shrink-0` keeps the glyph round while the value beside it shrinks.
 */
const glyph = cva('flex shrink-0', {
  variants: { tone: { neutral: '', attention: 'text-attention' } },
  defaultVariants: { tone: 'neutral' },
})

/**
 * A quiet pill that opens a small searchable list: the one control for every choice about a chat —
 * the three of the composer's toolbar (agent and model, the reasoning level, the access level) and
 * the project on the line under it.
 *
 * **The name says what is being chosen, the pill only shows the choice.** `aria-label` is
 * `"<label>: <value>"` ("Project: webshop") while the visible text is the value alone: a row of
 * pills would otherwise spend half the toolbar repeating words the reader can see from the icon.
 *
 * **The chevron is the one thing that says it can be opened.** 12px, muted, after the value. The
 * pills are quiet by design, but without a sign a row of them reads as one muted sentence — and,
 * worse, the toolbar would look exactly the same after the first message, when half of it has
 * stopped working. That is what the chevron carries: read-only text does not have one.
 *
 * **Giving way.** With `collapse` the value steps out of sight once the toolbar is narrower than
 * 588px (`COLLAPSE_BELOW`) and the icon stands alone — the last pill, the access level, makes
 * room so the two beside it keep their words. What does not go is the name: the control has its
 * `aria-label` and the read-only form keeps the value as hidden text, so both forms still say
 * which level applies. Nor does the chevron go: a pill of 48px is still something to press, and
 * without that sign it would read as the quiet text beside it in exactly the row where there is
 * least to go on. The colour stays too, and it is never alone — the icon is the level. And from
 * that moment on this is the one pill that does *not* shrink: it has nothing left to truncate, so
 * its neighbours give way on its behalf (see `give`).
 *
 * **Closing.** The panel closes on Escape, on a click outside, and when a row is chosen; the focus
 * then goes back to the pill, which is what `Popover` does for every layer. It also closes when
 * `selectedId` changes from the outside, and that is the whole contract for the action row: "Map
 * toevoegen…" opens the host's folder dialog, which this component cannot see the end of, so it
 * simply stays up while `action.busy` and closes when the one thing that matters has happened —
 * the choice it shows has changed. Cancel the dialog and the list is still there to pick from.
 *
 * **Read-only** is the same pill after the first message, when project and agent are fixed: the
 * same box (same height, same left edge for the value) so the toolbar does not shift when a chat
 * starts, but a `span` rather than a control — nothing to tab to, nothing to press. Its accessible
 * text comes from a visually hidden prefix: `aria-label` on a generic `span` is prohibited by ARIA
 * (axe reports `aria-prohibited-attr`), and `role="text"` never made it into ARIA at all (WebKit
 * only), so a hidden run of text is the one form every screen reader reads as written.
 */
export function PickerPill({
  label,
  listLabels,
  value: chosen,
  icon,
  glyph: shape,
  items,
  selectedId,
  onSelect,
  searchable,
  action,
  state,
  notice,
  layout,
  note,
  tooltip,
  readOnly,
  disabledReason,
  tone = 'neutral',
  width = 'wide',
  collapse,
  frame = 'ghost',
  quiet = false,
  bare = false,
}: PickerPillProps): ReactElement {
  const [open, setOpen] = useState(false)
  const shown = useRef(selectedId)
  const noteId = useId()

  useEffect(() => {
    if (shown.current === selectedId) return
    shown.current = selectedId
    setOpen(false)
  }, [selectedId])

  /**
   * Whether this pill gives up room when the row runs out of it — and the one pill that does not.
   *
   * Every other pill shrinks rather than letting the last one fall off the row, and its value
   * truncates. A collapsing pill has nothing to truncate: once the container query has taken its
   * value out of the flow, what is left is the icon and the chevron, so shrinking would squeeze
   * those two glyphs in exactly the row that has the least room. Its neighbours give way on its
   * behalf, and Orbit's end-to-end tests measure the box that comes out of it.
   *
   * Two complete class strings, never pieces joined at runtime: Tailwind scans source text.
   */
  const give = collapse ? 'shrink-0' : 'min-w-0'

  /**
   * The note as text, hidden from the screen and not from the accessibility tree.
   *
   * It lives beside the trigger rather than inside it: inside, it would join the button's *name*
   * and be read out every time the pill is announced. As a description it follows the name, which
   * is where a reason belongs.
   */
  const described: ReactNode = note ? (
    <span id={noteId} data-nt-pill-note className="sr-only">
      {note}
    </span>
  ) : null

  const body: ReactNode = (
    <>
      {shape ? (
        <span data-nt-pill-glyph className="flex shrink-0">
          {shape}
        </span>
      ) : null}
      {icon ? (
        <span data-nt-pill-icon className={glyph({ tone })}>
          <Icon name={icon} size="sm" />
        </span>
      ) : null}
      {/* `collapse` is `true` or absent — the union has no `false` — so the variant gets a real
          boolean here rather than an `undefined` the caller never wrote. */}
      <span data-nt-pill-value className={pillValue({ tone, width, collapse: collapse ?? false })}>
        {chosen}
      </span>
    </>
  )

  // A read-only pill says its note twice, on purpose: once as a `title` for the mouse and once as
  // hidden text inside its own name. A `span` can be given neither an accessible label nor a
  // description, so dropping either half would leave one of the two readers without the sentence;
  // this is not duplication to tidy up.
  if (readOnly && frame === 'pill') {
    // In the toolbar a fact stands in the box of the quiet pills beside it, so the row of a
    // started chat reads as one line of the same height.
    return (
      <PillText
        label={label}
        {...(icon ? { icon } : {})}
        {...(shape ? { glyph: shape } : {})}
        tone={tone}
        {...(note ? { note } : {})}
        bare={bare}
      >
        {chosen}
      </PillText>
    )
  }

  if (readOnly) {
    return (
      // Every measurement of the ghost `Button` at size `sm` it has to match: `controlSize.sm` for
      // the height token and the text size (read from the same map the button reads, so the two
      // cannot drift), the padding, gap and weight beside it, and the same giving-way rule as the
      // trigger — after the first message a whole toolbar of these stands there, and it has to fit
      // the same window. Its own `title` rather than a wrapper's: this is text, it keeps its
      // pointer events, and a span around a span would be furniture for nothing. What it does not
      // get is the chevron: nothing opens here.
      <span
        data-nt-pill
        {...(note ? { title: note } : {})}
        className={`${controlSize.sm} inline-flex ${give} items-center gap-1.5 whitespace-nowrap rounded-md px-2 font-medium text-muted`}
      >
        {/* Out of the flow (`sr-only` is absolutely positioned), so it costs no pixel and adds no
            gap, and it stands before the value so the line reads "Project: webshop". */}
        <span className="sr-only">{`${label}: `}</span>
        {body}
        {/* Part of the name here, not a description: a `span` can be given neither, so the only
            way this sentence reaches anyone but a mouse is by being text inside the pill. It
            follows the value, so the line reads "Toegang: Handmatig. Deze agent kan …". */}
        {note ? <span data-nt-pill-note className="sr-only">{` ${note}`}</span> : null}
      </span>
    )
  }

  const trigger =
    frame === 'pill' ? (
      <Pill
        data-nt-pill
        label={label}
        {...(icon ? { icon } : {})}
        {...(shape ? { glyph: shape } : {})}
        tone={tone}
        quiet={quiet}
        bare={bare}
        // A collapsing pill keeps its cap (the Expert pill); the access level keeps its word whole
        // whatever its `width` says.
        {...(collapse ? { collapse: true, ...(width === 'free' ? {} : { cap: width }) } : {})}
        {...(note ? { 'aria-describedby': noteId } : {})}
        {...(disabledReason ? { disabled: true } : {})}
      >
        {chosen}
      </Pill>
    ) : frame === 'field' ? (
      <PickerFieldTrigger
        label={label}
        value={chosen}
        {...(icon ? { icon } : {})}
        tone={tone}
        {...(note ? { 'aria-describedby': noteId } : {})}
        {...(disabledReason ? { disabled: true } : {})}
      />
    ) : (
      <Button
        data-nt-pill
        variant={frame}
        size={frame === 'plain' ? 'md' : 'sm'}
        // The row of pills is the one place in the app where the controls together ask for more room
        // than there is; every one of them gives up a little rather than the last one falling off —
        // except the one that has already given up its value (see `give`).
        shrink={!collapse}
        aria-label={`${label}: ${chosen}`}
        {...(note ? { 'aria-describedby': noteId } : {})}
        {...(disabledReason ? { disabled: true } : {})}
      >
        {body}
        {/* Muted whatever the tone is: the colour of an `attention` pill belongs to what it says, not
          to the furniture that opens it. `Icon` is decorative already, so there is nothing here for
          a screen reader — the button's own `aria-haspopup` says a panel is coming. */}
        <span
          data-nt-pill-chevron
          // On a plain pill the value takes the foreground and the chevron stays quiet beside it.
          className={frame === 'plain' ? 'flex shrink-0 text-muted' : 'flex shrink-0'}
        >
          <Icon name="chevron-down" size="xs" />
        </span>
      </Button>
    )

  if (disabledReason) {
    // The title sits on the wrapper, not on the button: a disabled control takes no pointer events,
    // so its own `title` would never appear. The same shape as the send button of the composer; a
    // real Tooltip may replace both later. No `Popover` around it either — a pill that cannot be
    // pressed has no panel to hold. A `note` loses the `title` here — one element carries one, and
    // "you cannot do this right now" is the more urgent — but not its description: why this pill
    // shows what it shows stays readable while a turn runs.
    return (
      <span className={`flex ${give}`} title={disabledReason}>
        {trigger}
        {described}
      </span>
    )
  }

  const panel = (
    <Popover
      trigger={trigger}
      label={label}
      open={open}
      onOpenChange={setOpen}
      {...(tooltip ? { tooltip } : {})}
    >
      {/* A fixed width, so the panel does not breathe with the longest name in it and a pill in the
          toolbar always opens the same shape. The height is the panel's own business (`PANEL`). */}
      <div className="w-64">
        <SearchList
          items={items}
          selectedId={selectedId}
          onSelect={(id) => {
            setOpen(false)
            onSelect(id)
          }}
          label={label}
          labels={listLabels}
          {...(searchable === undefined ? {} : { searchable })}
          {...(state === undefined ? {} : { state })}
          {...(action ? { action } : {})}
          {...(notice === undefined ? {} : { notice })}
          {...(layout === undefined ? {} : { layout })}
        />
      </div>
    </Popover>
  )

  // The same wrapper as a pill that is off, for the same reason: a title belongs on an element
  // that keeps its pointer events, and one shape for both states is one shape to reason about.
  // The hidden sentence rides along, because a `title` up here reaches only the mouse.
  if (!note) return panel
  return (
    <span className={`flex ${give}`} title={note}>
      {panel}
      {described}
    </span>
  )
}
