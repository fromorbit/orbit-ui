import { Dialog as RadixDialog } from 'radix-ui'
import { type ReactNode, useRef } from 'react'
import { focusHeldElsewhere } from '../primitives/hand-back'
import { IconButton } from '../primitives/IconButton'
import { SHEET_PANEL_END, SHEET_PANEL_START } from './panel'
import { usePortalContainer } from './portal'
import { Tooltip } from './Tooltip'

/** The props of `Sheet`. */
export interface SheetProps {
  open: boolean
  /** Called with `false` on Escape, the close button and a click beside the panel. */
  onOpenChange(open: boolean): void
  /** The heading of the panel and its accessible name. */
  title: string
  /** Its accessible description, under the heading. */
  description?: string
  closeLabel: string
  /** What scrolls between the header and the footer. */
  children: ReactNode
  /** Buttons at the bottom, which stay in view. */
  footer?: ReactNode
  /** The edge it slides in from: `end` (right, default) or `start` (left). */
  side?: 'start' | 'end'
}

/**
 * A panel along the edge of the window, over the page: the details of a row, a log, a filter.
 *
 * The same layer as `Dialog` (Radix Dialog, modal, the focus kept inside and handed back), with a
 * different shape and one different rule: a click beside it closes it. A sheet shows something
 * about the page behind it and gets out of the way when the reader turns back to that page; a form
 * whose half answer must not fall away belongs in a `Dialog`. It appears by fading, like every
 * layer here, rather than sliding: a slide asks the eye to follow something that is already there.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  children,
  footer,
  side = 'end',
}: SheetProps) {
  const container = usePortalContainer()
  const cameFrom = useRef<HTMLElement | null>(null)
  const panel = useRef<HTMLDivElement>(null)
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal container={container}>
        <RadixDialog.Overlay
          data-nt-sheet-overlay
          className="no-drag fixed inset-0 z-(--nt-z-dialog) bg-scrim"
        />
        <RadixDialog.Content
          ref={panel}
          className={side === 'start' ? SHEET_PANEL_START : SHEET_PANEL_END}
          data-nt-layer="modal"
          data-side={side}
          {...(description === undefined ? { 'aria-describedby': undefined } : {})}
          // The panel itself takes the focus, not its first control: that is the close button,
          // whose tooltip would open on focus and take the first Escape for itself. Tab goes on
          // from here into the content.
          onOpenAutoFocus={(event) => {
            const active = document.activeElement
            cameFrom.current = active instanceof HTMLElement ? active : null
            event.preventDefault()
            panel.current?.focus()
          }}
          onCloseAutoFocus={(event) => {
            const back = cameFrom.current
            cameFrom.current = null
            if (focusHeldElsewhere()) {
              event.preventDefault()
              return
            }
            if (back?.isConnected) {
              event.preventDefault()
              back.focus()
            }
          }}
        >
          <div className="flex shrink-0 items-start gap-2 px-5 pt-5 pb-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <RadixDialog.Title className="m-0 text-[15px] leading-6 font-heading text-fg">
                {title}
              </RadixDialog.Title>
              {description === undefined ? null : (
                <RadixDialog.Description className="m-0 text-[12px] text-muted">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <Tooltip label={closeLabel}>
              <RadixDialog.Close asChild>
                <IconButton icon="x" label={closeLabel} size="sm" />
              </RadixDialog.Close>
            </Tooltip>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 text-[13px]">
            {children}
          </div>
          {footer === undefined ? null : (
            <div className="flex shrink-0 items-center justify-end gap-2 px-5 pt-2 pb-5">
              {footer}
            </div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
