// A consumer of the built package, typechecked by `tests/consumer-types.test.ts` against `dist/`:
// it fills `ShortcutIds` from the root module, as Orbit does with its shortcut catalogue.
import {
  Button,
  type ButtonProps,
  type ConfirmDialogProps,
  type ShortcutIds,
  type ShortcutLabel,
} from '@fromorbit/ui'
import { galleryLabels, type Story } from '@fromorbit/ui/gallery'
import { renderWithUi } from '@fromorbit/ui/testing'

declare module '@fromorbit/ui' {
  interface ShortcutIds {
    'demo.x': true
  }
}

/** A known id: completion offers it, and it is a key of the merged interface. */
export const known: keyof ShortcutIds = 'demo.x'

// @ts-expect-error: an id the consumer never declared is not a key of ShortcutIds.
export const unknown: keyof ShortcutIds = 'demo.y'

/** Any string still passes as a label: a literal key, for one. */
export const literal: ShortcutLabel = 'Mod+K'

export const button = <Button shortcut="demo.x">Run</Button>
export const words: string = galleryLabels.copy.copiedLabel
export const story: Story | undefined = undefined
export const render: typeof renderWithUi = renderWithUi

/** The props of a component are public, for a host that wraps one. */
export const props: ButtonProps = { variant: 'primary', shortcut: 'demo.x' }

/** A text is a prop the host must give: leaving `confirmLabel` out does not compile. */
// @ts-expect-error: confirmLabel is required.
export const unlabelled: Omit<ConfirmDialogProps, 'onConfirm' | 'onOpenChange'> = {
  open: true,
  title: 'Delete',
  cancelLabel: 'Cancel',
}
