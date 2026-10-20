import { type ReactNode, useState } from 'react'
import type { Story } from '../gallery/story'
import { Button } from '../primitives/Button'
import { Dialog } from './Dialog'

/**
 * A box large enough to hold the panel that lands in the middle of the window.
 *
 * The same reason as `ConfirmDialog.gallery.tsx`: the panel is `fixed` and hangs on no trigger,
 * and a reference image is cropped to the state's own box, so an empty box would yield an empty
 * image. The dimmed overlay is part of the reference too.
 */
function Stage({ children }: { children: ReactNode }) {
  return <div className="h-[30rem] w-[48rem]">{children}</div>
}

/**
 * Open from the first render: a title, a description, a body and a footer with two buttons.
 *
 * The one state here that starts open. Two open dialogs in one story would both be centred on the
 * same spot and both hold the focus, so the second would paint over the first — the reasoning of
 * `ConfirmDialog.gallery.tsx`.
 */
function Open() {
  const [open, setOpen] = useState(true)
  return (
    <Stage>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Plan ter goedkeuring"
        description="Stap 1 van 2"
        closeLabel="Later"
        footer={
          <>
            <Button variant="secondary">Blijf plannen</Button>
            <Button variant="primary">Voer uit</Button>
          </>
        }
      >
        <p className="m-0 text-fg">1. Lees de notities in /work/notities.</p>
        <p className="m-0 text-fg">2. Schrijf een samenvatting.</p>
      </Dialog>
    </Stage>
  )
}

/** Forty made-up steps: more than the window has room for. */
const STEPS = Array.from(
  { length: 40 },
  (_, index) => `${index + 1}. Een stap van het plan in /work/notities`,
)

/**
 * A body longer than the window allows: it scrolls between a header and a footer that stay.
 *
 * Closed at rest and opened by whoever reads the gallery, for the reason `Open` gives.
 */
function Long() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Lang plan</Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Plan ter goedkeuring"
        closeLabel="Later"
        footer={<Button variant="primary">Voer uit</Button>}
      >
        {STEPS.map((step) => (
          <p key={step} className="m-0 py-0.5 text-fg">
            {step}
          </p>
        ))}
      </Dialog>
    </>
  )
}

export default {
  group: 'overlays',
  title: 'Dialog',
  states: { Open, Long },
} satisfies Story
