import { Popover as RadixPopover } from 'radix-ui'
import { type ReactElement, type ReactNode, useRef } from 'react'
import { focusHeldElsewhere, handBackOnlyLostFocus } from '../primitives/hand-back'
import type { ShortcutLabel } from '../primitives/shortcut'
import { PANEL, WIDE_PANEL } from './panel'
import { usePortalContainer } from './portal'
import { Tooltip } from './Tooltip'

/** The props every variant of `Popover` shares. */
export interface PopoverBaseProps {
  /**
   * The element that opens it; must be one focusable control.
   *
   * Rendered `asChild`, so it keeps its own looks and receives the aria wiring
   * (`aria-haspopup`, `aria-expanded`, `aria-controls`) plus the ref the panel returns focus to.
   * Every control in this library forwards a `ref` and spreads the rest, so any of them will do.
   */
  trigger: ReactElement
  children: ReactNode
  /** Accessible name of the panel. */
  label: string
  side?: 'top' | 'bottom'
  align?: 'start' | 'end'
  /**
   * A `Tooltip` on the trigger, for something the trigger shows only as a sign (a chip's mark).
   *
   * Here rather than around the trigger at the call site: both Radix triggers render `asChild`,
   * and only nested inside each other do both hand their props to the one button — a `Tooltip`
   * passed in as the trigger would swallow the popover's.
   */
  tooltip?: string
  /** The command whose key the {@link tooltip} shows beside its words, as `Tooltip.shortcut`. */
  tooltipShortcut?: ShortcutLabel
  /** A panel for a document rather than rows, such as a file's preview; see `WIDE_PANEL`. */
  wide?: boolean
}

/** Keeps its own state. A caller may still listen in, without taking the decision over. */
export interface UncontrolledPopoverProps extends PopoverBaseProps {
  open?: undefined
  onOpenChange?(open: boolean): void
}

/**
 * The caller decides whether it is open.
 *
 * `onOpenChange` is then required, not optional: the panel closes itself on Escape, on a click
 * outside and when focus leaves by *asking*, and a caller that does not listen would leave a panel
 * standing that no key and no click can shut.
 */
export interface ControlledPopoverProps extends PopoverBaseProps {
  open: boolean
  onOpenChange(open: boolean): void
}

/** The props of `Popover`. */
export type PopoverProps = UncontrolledPopoverProps | ControlledPopoverProps

/**
 * A panel anchored to its trigger: the first layer of `shared/ui/overlays/`.
 *
 * It closes on Escape, on a click outside and when focus leaves, and hands focus back to the
 * trigger, so the reader never ends up on the body with nothing selected. Radix Popover underneath,
 * wrapped once here per the UI guidelines. What the panel itself fixes is in `PANEL` (`./panel`).
 *
 * **Where it mounts.** Into the container of the surrounding `PortalContainerProvider` (`./portal`):
 * in the app a box inside the app root, in the gallery its stage. `document.body` would put the
 * panel outside the subtree that carries the app's background and stacking, and outside what axe
 * checks and what a screenshot is clipped to. The panel is positioned `fixed` by Radix, so it is
 * never clipped by the scroll container it lives in, and Radix's own collision handling flips it
 * above the trigger when there is no room below — `side` is a preference, not a promise, and that
 * behaviour is Radix's, not this wrapper's.
 *
 * **Escape.** The rule is "Escape closes the topmost open layer, and only that one"; only with no
 * layer open does the key reach the composer (which stops the turn) or `App` (which closes the
 * settings). Both look at `event.defaultPrevented`, so closing is not enough: the key must also be
 * marked as handled. This layer does not do that itself, and deliberately so — Radix's
 * `DismissableLayer` already does exactly this, in this order, and doing it a second time would
 * fight it. Its handler sits on the document in the capture phase and, for the highest layer only,
 * runs `onEscapeKeyDown` first and then `event.preventDefault(); onDismiss()`.
 *
 * That order beats every listener in the bubble phase — on the window, on the document or on the
 * field itself — which is every Escape listener this app has. It does **not** beat a listener
 * registered on `window` with `capture: true`: the capture path runs window → document → target, so
 * such a listener sees the event before the layer has touched it and must check the open layers
 * itself. `Popover.test.tsx` pins both halves.
 *
 * The trap is the other direction: calling `preventDefault()` inside `onEscapeKeyDown` means "do
 * *not* dismiss" to Radix, which would leave the panel open and still swallow the key. Hence no
 * `onEscapeKeyDown` here at all.
 */
export function Popover({
  trigger,
  children,
  open,
  onOpenChange,
  label,
  side = 'bottom',
  align = 'start',
  tooltip,
  tooltipShortcut,
  wide = false,
}: PopoverProps) {
  const container = usePortalContainer()
  return (
    <RadixPopover.Root
      {...(open === undefined ? {} : { open })}
      {...(onOpenChange ? { onOpenChange } : {})}
    >
      {tooltip ? (
        <Tooltip label={tooltip} {...(tooltipShortcut ? { shortcut: tooltipShortcut } : {})}>
          <RadixPopover.Trigger asChild>{trigger}</RadixPopover.Trigger>
        </Tooltip>
      ) : (
        <RadixPopover.Trigger asChild>{trigger}</RadixPopover.Trigger>
      )}
      <RadixPopover.Portal container={container}>
        <RadixPopover.Content
          aria-label={label}
          side={side}
          align={align}
          // 4px of air between the control and its panel, the smallest step of the grid: enough to
          // read as a separate surface, little enough to still belong to the trigger.
          sideOffset={4}
          // Never flush against the window edge when Radix flips or slides the panel to fit.
          collisionPadding={8}
          className={wide ? WIDE_PANEL : PANEL}
          // Radix hands the focus back a task after the close, late under load: after a row opened
          // something that took the focus, or after the panel was opened again. It only rescues a
          // focus that went down with the panel.
          onCloseAutoFocus={handBackOnlyLostFocus}
        >
          {children}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  )
}

/** The props of `AnchoredPopover`. */
export interface AnchoredPopoverProps {
  /** The element the panel stands beside, and that gets the focus back when it closes. */
  anchor: HTMLElement
  /** Called when the panel asks to close: Escape, a click outside, the focus leaving. */
  onClose(): void
  /** Accessible name of the panel. */
  label: string
  children: ReactNode
  wide?: boolean
  /**
   * Focuses the panel itself when it opens, not its first control: for content that scrolls and
   * moves the focus inward once it is drawn (a file's preview). Tab still reaches every control.
   */
  focusPanel?: boolean
}

/**
 * A panel that stands beside an element it was not opened from as a trigger: a path in an answer,
 * which opens a preview through the chat rather than through a Radix trigger of its own.
 *
 * Open for as long as it is mounted. It closes like every `Popover` — Escape, a click outside —
 * and hands the focus back to `anchor`, since there is no trigger for Radix to return it to.
 */
export function AnchoredPopover({
  anchor,
  onClose,
  label,
  children,
  wide = false,
  focusPanel = false,
}: AnchoredPopoverProps) {
  const container = usePortalContainer()
  const panel = useRef<HTMLDivElement>(null)
  return (
    <RadixPopover.Root open onOpenChange={(open) => (open ? undefined : onClose())}>
      <RadixPopover.Anchor virtualRef={{ current: anchor }} />
      <RadixPopover.Portal container={container}>
        <RadixPopover.Content
          aria-label={label}
          side="bottom"
          align="start"
          sideOffset={4}
          collisionPadding={8}
          className={wide ? WIDE_PANEL : PANEL}
          ref={panel}
          {...(focusPanel
            ? {
                onOpenAutoFocus: (event: Event) => {
                  event.preventDefault()
                  panel.current?.focus({ preventScroll: true })
                },
              }
            : {})}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            // A click in a field beside the panel closes it and focuses that field before this
            // runs, a task later: the anchor only gets back a focus that went down with the panel.
            if (!focusHeldElsewhere()) anchor.focus()
          }}
        >
          {children}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  )
}
