import { Tooltip as RadixTooltip } from 'radix-ui'
import { type ComponentProps, createContext, type ReactElement, useContext } from 'react'
import { Kbd } from '../primitives/Kbd'
import type { ShortcutLabel } from '../primitives/shortcut'
import { usePortalContainer } from './portal'

/** Whether a `TooltipProvider` stands above: a `Tooltip` without one brings its own. */
const Provided = createContext(false)

/**
 * Groups every `Tooltip` under it behind one hover delay, per Radix's own timing model.
 *
 * Once one tooltip has opened, a second trigger the pointer moves to opens instantly for a short
 * grace period — the delay is for the *first* tooltip a reader hovers, not for every one of them.
 * One `TooltipProvider` near the app root is enough; `Tooltip` itself carries no delay of its own.
 * Without one, a `Tooltip` is its own provider (see there), so the grouping is what it adds.
 */
export function TooltipProvider(props: ComponentProps<typeof RadixTooltip.Provider>) {
  return (
    <Provided.Provider value={true}>
      <RadixTooltip.Provider {...props} />
    </Provided.Provider>
  )
}

/**
 * The frame of a tooltip: the material of `PANEL`, without what `PANEL` does for a list of rows.
 *
 * `PANEL`'s `min-w-40` keeps a two-row list from looking like a tooltip, so on a tooltip it is
 * exactly wrong: it stretched a short label to 160px and left the room on the right empty. Its
 * `max-h-72`, scroll and `p-1` are for rows too. Rather than override those classes — which of two
 * utilities on the same property wins is up to Tailwind's order, not the class string — the tooltip
 * spells its own frame. `max-w-80` is where a long label starts to wrap. Change the material in
 * `panel.ts`, change it here too.
 */
const TOOLTIP_PANEL =
  'no-drag nt-fade-in z-(--nt-z-popover) flex max-w-80 items-center gap-2 rounded-lg border border-border bg-overlay px-2 py-1 text-[12px] text-fg shadow-menu outline-none'

/** The props of `Tooltip`. */
export interface TooltipProps {
  /**
   * What the tooltip says; becomes the trigger's accessible *description*, never its name.
   *
   * Radix wires this through `aria-describedby` on its own, as long as the content keeps its
   * default `role="tooltip"` — which is why this component never passes an `aria-label` to
   * `Tooltip.Content` (that would turn the description into a visually hidden second name instead).
   */
  label: string
  /**
   * The command whose key is shown to the right of the label, as a `Kbd` in the convention of the
   * platform, read through the host's `ShortcutPort` (which may also take a written-out key).
   */
  shortcut?: ShortcutLabel
  /** The trigger; keeps its own name and its own look. `Tooltip` only adds the description. */
  children: ReactElement
  /**
   * Forces it open from the first render.
   *
   * A tooltip has no visible trigger of its own in a story — nothing to hover or focus — so the
   * gallery reaches for this instead of pretending a pointer moved. Not meant for a real screen: an
   * app caller never has a reason to start a tooltip open.
   */
  defaultOpen?: boolean
  /**
   * The element the tooltip must stay inside; the window when left out.
   *
   * Inside a hosted tab this is the column above the view: a tooltip is a passive layer that never
   * freezes the view, so it has to flip away from it instead of falling over
   * it, where the native view would draw over the tooltip.
   */
  collisionBoundary?: Element | null
}

/**
 * A floating description for its trigger: the first layer of `shared/ui/overlays/` besides
 * `Popover`, and deliberately in this layer rather than `primitives/` — it floats, it portals, and
 * `primitives/` may not import from `overlays/` (see `Select.tsx`).
 *
 * It opens on hover **and** on keyboard focus: a `title` attribute only ever shows to a mouse, and
 * a reader who tabs to an icon-only button deserves the same explanation a mouse gets for free
 * from the keyboard. Radix's own trigger already does this — focus
 * opens it at once, hover opens it after `TooltipProvider`'s delay — this wrapper only supplies the
 * portal target and the look.
 *
 * **It never takes the focus.** Unlike `Popover`, its content carries no focus scope: the reader
 * stays exactly where they were, and Escape or a blur simply lets it go.
 *
 * **Escape is a known compromise, not a design choice.** The library's Escape order
 * (the topmost layer answers and marks the key as handled, via Radix's `DismissableLayer`) is meant
 * for a layer like `Popover` that holds the focus. A tooltip is not that: it can be open merely
 * because the pointer is resting on an icon while the reader is typing elsewhere, and eating their
 * Escape (stopping a turn, closing settings) would be a bug, not a feature. Radix's
 * `Tooltip.Content` always wraps in a `DismissableLayer` with its own `onDismiss`, which is not
 * exposed as a prop to turn off: whenever this tooltip is the topmost open layer, closing it on
 * Escape unavoidably marks the key `defaultPrevented` too, through no `onEscapeKeyDown` this
 * wrapper could pass — confirmed empirically, not just read from the source. Avoiding that would
 * mean dropping `Tooltip.Content` — and with it the ARIA wiring and the portal positioning it
 * carries — for a bespoke floating box. That trade was judged worse than the compromise.
 *
 * **It needs no provider above it.** Radix throws for a tooltip outside its provider; this one
 * then brings a provider of its own, so a building block that carries a tooltip (the copy button,
 * the cross of a chip) can stand in any screen and any test. Under the app's
 * `TooltipProvider` it joins the shared delay as before.
 *
 * **It is a passive layer.** It carries `data-nt-layer="passive"`, so a hosted view under it does
 * not freeze: a page that froze on every hover over the address bar would be worse than a tooltip
 * that may not fall over it.
 */
export function Tooltip({
  label,
  shortcut,
  children,
  defaultOpen,
  collisionBoundary,
}: TooltipProps) {
  const container = usePortalContainer()
  const provided = useContext(Provided)
  const tooltip = (
    <RadixTooltip.Root {...(defaultOpen ? { defaultOpen } : {})}>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal container={container}>
        <RadixTooltip.Content
          side="top"
          sideOffset={4}
          collisionPadding={8}
          {...(collisionBoundary ? { collisionBoundary } : {})}
          // Never counted as a layer over a hosted view: see `collisionBoundary`.
          data-nt-layer="passive"
          className={TOOLTIP_PANEL}
        >
          <span>{label}</span>
          {shortcut === undefined || shortcut === '' ? null : <Kbd shortcut={shortcut} />}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  )
  return provided ? tooltip : <RadixTooltip.Provider>{tooltip}</RadixTooltip.Provider>
}
