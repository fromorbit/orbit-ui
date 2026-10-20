import { Dialog as RadixDialog } from 'radix-ui'
import { type ReactNode, useRef } from 'react'
import { SPOTLIGHT_PANEL } from './panel'
import { usePortalContainer } from './portal'

/** The props of `Spotlight`. */
export interface SpotlightProps {
  open: boolean
  /** Called with `false` on Escape and on a click beside the panel. */
  onOpenChange(open: boolean): void
  /**
   * Called once the layer has closed *and* handed the focus back — later than `onOpenChange`,
   * which Radix calls before the focus moves. What a choice does belongs here: a command that puts
   * the caret somewhere (a new chat, the address bar) would otherwise lose it to the focus coming
   * back a moment after.
   */
  onClosed?(): void
  /** The accessible name of the layer; there is no visible heading. */
  label: string
  /** A field and what it finds; the field gets the focus. */
  children: ReactNode
}

/**
 * A layer for one search field and its results, high in the middle of the window: the frame of the
 * command palette.
 *
 * Radix `Dialog`, modal, beside `Dialog` in this folder, and different from it where the content
 * asks for it: no header, no close button and no footer — a field says what it is — and a click
 * beside the panel **does** close it, since nothing here is a half-given answer that could fall
 * away (Raycast, Linear). Escape closes it too; Radix marks that Escape as handled, so the composer
 * and the register leave it alone.
 *
 * The focus goes to the first field inside on opening and back to where it was on closing, like
 * `Dialog`: someone who pressed ⌘K in the composer gets the caret back there. It lands in the portal
 * container and says `data-nt-layer="modal"`, so a hosted view freezes while it is open: a native view
 * would otherwise be drawn over the palette.
 */
export function Spotlight({ open, onOpenChange, onClosed, label, children }: SpotlightProps) {
  const container = usePortalContainer()
  const panel = useRef<HTMLDivElement>(null)
  /** Where the focus was when the layer opened, to hand it back on closing. */
  const cameFrom = useRef<HTMLElement | null>(null)

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal container={container}>
        <RadixDialog.Overlay
          data-nt-spotlight-overlay
          className="no-drag fixed inset-0 z-(--nt-z-dialog) bg-scrim"
        />
        <RadixDialog.Content
          ref={panel}
          className={SPOTLIGHT_PANEL}
          data-nt-layer="modal"
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => {
            const active = document.activeElement
            cameFrom.current = active instanceof HTMLElement ? active : null
            event.preventDefault()
            panel.current?.querySelector<HTMLElement>('input')?.focus()
          }}
          onCloseAutoFocus={(event) => {
            const back = cameFrom.current
            cameFrom.current = null
            // Always handled here: Radix would otherwise move the focus once more after this
            // handler, over whatever `onClosed` gave it. Without a place to go back to, the focus
            // goes where Radix would have put it, the body.
            event.preventDefault()
            if (back?.isConnected) back.focus()
            onClosed?.()
          }}
        >
          <RadixDialog.Title className="sr-only">{label}</RadixDialog.Title>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
