import { Dialog as RadixDialog } from 'radix-ui'
import { type ReactNode, type RefObject, useRef } from 'react'
import { focusHeldElsewhere } from '../primitives/hand-back'
import { IconButton } from '../primitives/IconButton'
import { DIALOG_PANEL, WIDE_DIALOG_PANEL } from './panel'
import { usePortalContainer } from './portal'
import { Tooltip } from './Tooltip'

/** The props of `Dialog`. */
export interface DialogProps {
  open: boolean
  /**
   * Called with `false` on Escape and on the close button — never on a click beside it. The caller
   * decides what closing means; closing is never an answer by itself.
   */
  onOpenChange(open: boolean): void
  /** Becomes the dialog's accessible name, and its heading. */
  title: string
  /** Becomes the dialog's accessible description; left out, there is none to announce. */
  description?: string
  /** The name of the close button in the header, which shows only an icon. */
  closeLabel: string
  /** What scrolls between the header and the footer. */
  children: ReactNode
  /** The buttons at the bottom, right-aligned; they stay in view while the body scrolls. */
  footer?: ReactNode
  /**
   * What gets the focus when the dialog opens: a control, or `'panel'` for the panel itself.
   * Left out, the first control of the body gets it, then the first of the footer.
   *
   * `'panel'` is for a dialog that opens by itself while someone may be typing: a key meant for
   * the field (an Enter, a digit) may then not press a control or pick an option. Tab goes on to
   * the content.
   */
  initialFocus?: RefObject<HTMLElement | null> | 'panel'
  /**
   * `wide` for a form of two columns: up to 60rem and a height of its own, so the content can
   * scroll per column. Left out, the narrow dialog of 32rem.
   */
  size?: 'default' | 'wide'
}

/** Everything a keyboard can land on, the way Radix' own focus scope looks for it. */
const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** The first control a keyboard can land on inside `root`, or `null`. */
function firstControl(root: HTMLElement | null): HTMLElement | null {
  const found = root?.querySelector(FOCUSABLE)
  return found instanceof HTMLElement ? found : null
}

/**
 * A popup above the whole window that does not close by accident: the fourth layer of
 * `shared/ui/overlays/`, next to `Popover`, `DropdownMenu` and `ConfirmDialog`.
 *
 * Radix `Dialog` underneath, modal, with its own overlay. Where it differs from `ConfirmDialog`:
 * it holds content rather than one question — a form, a plan to read — so it has a header with a
 * close button, a body that scrolls, and a footer that stays. Escape and the close button close
 * it and report that through `onOpenChange(false)`; a click on the overlay does **not**: half an
 * answer may never fall away because a click landed beside the panel. Radix marks the Escape as
 * handled, so the composer (stop the turn) and the register leave it alone: one Escape closes one layer.
 *
 * **Focus.** On opening it goes to the first control of the body (or what `initialFocus` names),
 * not to the close button: what there is to answer comes first. On closing it goes back to where
 * it was when the dialog opened — a dialog opened by a request rather than by a trigger would
 * otherwise leave the focus on the page, and someone who was typing in the composer gets their
 * field back with the caret in it.
 *
 * It lands in the portal container, so a hosted view in the right panel freezes while it is open
 * (`layers.ts` counts a `dialog` as covering the window).
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  children,
  footer,
  initialFocus,
  size = 'default',
}: DialogProps) {
  const container = usePortalContainer()
  const body = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  /** Where the focus was when the dialog opened, to hand it back on closing. */
  const cameFrom = useRef<HTMLElement | null>(null)

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal container={container}>
        <RadixDialog.Overlay className="no-drag fixed inset-0 z-(--nt-z-dialog) bg-scrim" />
        <RadixDialog.Content
          ref={panel}
          className={size === 'wide' ? WIDE_DIALOG_PANEL : DIALOG_PANEL}
          // Radix sets no `aria-modal` on a dialog; this says to `layers.ts` that it covers the
          // window, on top of the overlay that already does.
          data-nt-layer="modal"
          {...(description === undefined ? { 'aria-describedby': undefined } : {})}
          onOpenAutoFocus={(event) => {
            // Read before anything moves: the focus scope has mounted, nothing has been focused yet.
            const active = document.activeElement
            cameFrom.current = active instanceof HTMLElement ? active : null
            event.preventDefault()
            const target =
              initialFocus === 'panel'
                ? panel.current
                : (initialFocus?.current ??
                  firstControl(body.current) ??
                  firstControl(footerRef.current))
            target?.focus()
          }}
          onCloseAutoFocus={(event) => {
            const back = cameFrom.current
            cameFrom.current = null
            // The trap went with the panel and this runs a task later, late under load: an answer
            // that opened something whose field took the focus keeps it. Only a focus that went
            // down with the panel — Escape, the close button, a footer button — comes back.
            if (focusHeldElsewhere()) {
              event.preventDefault()
              return
            }
            if (back?.isConnected) {
              event.preventDefault()
              back.focus()
            }
          }}
          // A click beside the panel is not a choice: the overlay stays and so does the answer.
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <div className="flex shrink-0 items-start gap-2 px-4 pt-3.5 pb-2">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <RadixDialog.Title className="m-0 font-heading text-fg">{title}</RadixDialog.Title>
              {description === undefined ? null : (
                <RadixDialog.Description className="m-0 text-[12px] text-muted">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            {/* Room for the close button, which comes last in the focus order (below). */}
            <span aria-hidden="true" className="size-6 shrink-0" />
          </div>
          <div ref={body} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3">
            {children}
          </div>
          {footer === undefined ? null : (
            <div
              ref={footerRef}
              className="flex shrink-0 items-center justify-end gap-2 border-border border-t px-4 py-2.5"
            >
              {footer}
            </div>
          )}
          {/* Last in the DOM, so Tab from the panel reaches what there is to answer first; drawn
          top right, where a close button is looked for. */}
          <div className="absolute top-3.5 right-4">
            {/* The name of the cross as a tooltip too, as on every icon button. */}
            <Tooltip label={closeLabel}>
              <RadixDialog.Close asChild>
                <IconButton icon="x" label={closeLabel} size="sm" />
              </RadixDialog.Close>
            </Tooltip>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
