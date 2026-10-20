import { type ReactNode, useState } from 'react'
import type { Story } from '../gallery/story'
import { Button } from '../primitives/Button'
import { ConfirmDialog } from './ConfirmDialog'

/**
 * A box wide and tall enough to hold the panel that lands in the middle of the window.
 *
 * Unlike a `Popover` or a `DropdownMenu`, this panel hangs on no trigger: it is `fixed` and centred
 * on the viewport. A reference image is cropped to the state's own box, so a state that renders only
 * the dialog has an empty box and yields an empty image — which is what this story once did,
 * unnoticed until someone looked at the picture. The box is therefore large enough that the centred panel
 * falls inside it wherever the stage has scrolled to, and the dimmed overlay is part of the
 * reference too.
 */
function Stage({ children }: { children: ReactNode }) {
  return <div className="h-[30rem] w-[40rem]">{children}</div>
}

/** The plain case: the trigger, and a dialog that is not up yet. */
function Closed() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Uitloggen</Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Uitloggen"
        body="Je moet opnieuw inloggen om verder te gaan."
        confirmLabel="Uitloggen"
        cancelLabel="Annuleren"
        onConfirm={() => setOpen(false)}
      />
    </>
  )
}

/**
 * Open from the first render, the default tone.
 *
 * The one state here that starts open: `Popover.gallery.tsx` explains why an open layer stands
 * alone in its own state rather than beside another one that also opens on mount.
 */
function Open() {
  const [open, setOpen] = useState(true)
  return (
    <Stage>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Uitloggen"
        body="Je moet opnieuw inloggen om verder te gaan."
        confirmLabel="Uitloggen"
        cancelLabel="Annuleren"
        onConfirm={() => setOpen(false)}
      />
    </Stage>
  )
}

/**
 * `tone="danger"` colours the confirming action for something that cannot be undone.
 *
 * Closed at rest, and opened by whoever reads the gallery — the same choice
 * `Popover.gallery.tsx` makes for its long list. Two of these standing open in one story is not a
 * thing this component does: both panels are centred on the same spot and both trap the focus, so
 * the second would paint over the first and appear in its reference as well. The colours of this
 * tone are pinned in `ConfirmDialog.test.tsx` instead of in a picture.
 */
function Dangerous() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Chat verwijderen</Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Chat verwijderen"
        body="Dit kan niet ongedaan worden gemaakt."
        confirmLabel="Verwijderen"
        cancelLabel="Annuleren"
        onConfirm={() => setOpen(false)}
        tone="danger"
      />
    </>
  )
}

export default {
  group: 'overlays',
  title: 'ConfirmDialog',
  states: { Closed, Open, Dangerous },
} satisfies Story
