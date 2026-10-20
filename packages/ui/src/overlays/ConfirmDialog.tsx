import { cva } from 'class-variance-authority'
import { AlertDialog as RadixAlertDialog } from 'radix-ui'
import { Button } from '../primitives/Button'
import { controlSize } from '../primitives/control-size'
import { PANEL } from './panel'
import { usePortalContainer } from './portal'

/** The props of `ConfirmDialog`. */
export interface ConfirmDialogProps {
  open: boolean
  onOpenChange(open: boolean): void
  /** Becomes the dialog's accessible name. */
  title: string
  /**
   * Becomes the dialog's accessible description. Left out, the title is the whole question: one
   * line, and no description for a reader to announce.
   */
  body?: string
  confirmLabel: string
  cancelLabel: string
  /** Called once, only when the confirming action is chosen; never on Escape or a click beside it. */
  onConfirm(): void
  /** `danger` colours the confirm button for a destructive action; `default` (the default) does not. */
  tone?: 'default' | 'danger'
}

/**
 * The confirm button's own colours: `Button` has no `danger` variant (that is one component this
 * dialog does not get to add to), so this stays local to the one caller that needs it.
 * `danger` borrows the same palette `Banner` and `Tag` already use for the tone, rather than a new
 * pair of colours invented for one button.
 */
const confirm = cva(
  `no-drag inline-flex items-center rounded-md px-3 font-medium outline-focus focus-visible:outline-2 focus-visible:outline-offset-2 ${controlSize.md}`,
  {
    variants: {
      tone: {
        default: 'bg-accent text-accent-fg hover:brightness-110',
        danger: 'border border-danger-border bg-danger-subtle text-danger hover:brightness-110',
      },
    },
    defaultVariants: { tone: 'default' },
  },
)

/**
 * The question before something you cannot undo: the third layer of `shared/ui/overlays/`, next to
 * `Popover` and `DropdownMenu`. Radix `AlertDialog` underneath, not the `Dialog` that does not exist
 * yet — a confirmation has a mandatory title and description, takes the focus, and (unlike a
 * `Popover`) does **not** close on a click beside it or on the overlay: those are exactly the
 * properties `AlertDialog` has and `Dialog` would not enforce.
 *
 * Always controlled, unlike `DropdownMenu`: a caller that asks "are you sure" already knows what it
 * is asking about and must be able to open the same dialog again for a different chat, so there is
 * no uncontrolled variant to fall back to.
 *
 * **The focus lands on Cancel, not Confirm.** Radix does this on its own — `AlertDialogContent`
 * keeps a `cancelRef` from its nearest `AlertDialogCancel` and focuses it in its own
 * `onOpenAutoFocus` — so rendering exactly one `AlertDialogCancel` is what this wrapper relies on
 * rather than an `autoFocus` or a ref of its own. The safe action is what an Enter still in someone's
 * fingers lands on.
 *
 * **Escape and an outside click.** `AlertDialogContent` already calls `event.preventDefault()` in
 * both `onPointerDownOutside` and `onInteractOutside`, so neither dismisses it; Escape still closes
 * it (`onOpenChange(false)`), same as every other layer, but reports nothing — cancelling is not a
 * choice `onConfirm` hears about.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  tone = 'default',
}: ConfirmDialogProps) {
  const container = usePortalContainer()
  return (
    <RadixAlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixAlertDialog.Portal container={container}>
        <RadixAlertDialog.Overlay className="no-drag fixed inset-0 z-(--nt-z-popover) bg-scrim" />
        <RadixAlertDialog.Content
          className={`${PANEL} fixed top-1/2 left-1/2 w-96 max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 p-4`}
          // Without a body there is no description; Radix is told so rather than pointing at none.
          {...(body === undefined ? { 'aria-describedby': undefined } : {})}
        >
          <RadixAlertDialog.Title className="m-0 font-medium text-fg">
            {title}
          </RadixAlertDialog.Title>
          {body === undefined ? null : (
            <RadixAlertDialog.Description className="mt-1.5 text-[12px] text-muted">
              {body}
            </RadixAlertDialog.Description>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <RadixAlertDialog.Cancel asChild>
              <Button variant="secondary">{cancelLabel}</Button>
            </RadixAlertDialog.Cancel>
            <RadixAlertDialog.Action asChild>
              <button type="button" onClick={onConfirm} className={confirm({ tone })}>
                {confirmLabel}
              </button>
            </RadixAlertDialog.Action>
          </div>
        </RadixAlertDialog.Content>
      </RadixAlertDialog.Portal>
    </RadixAlertDialog.Root>
  )
}
