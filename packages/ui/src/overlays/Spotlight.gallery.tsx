import { type ReactNode, useState } from 'react'
import { LayerStage } from '../gallery/layer-stage'
import type { Story } from '../gallery/story'
import { Button } from '../primitives/Button'
import { Input } from '../primitives/Input'
import { Spotlight } from './Spotlight'

/**
 * A box large enough to hold the panel that hangs high in the middle of the window.
 *
 * The reason of `Dialog.gallery.tsx`: the panel is `fixed` and hangs on no trigger, and a reference
 * image is cropped to the state's own box.
 */
function Stage({
  children,
}: {
  children: (open: boolean, setOpen: (open: boolean) => void) => ReactNode
}) {
  // Its own containing block and not modal (`LayerStage`): the open layer and its scrim stay in
  // this box, and the gallery around it stays in reach, for the keyboard too.
  return (
    <div className="w-full max-w-[48rem]">
      <LayerStage height={480} reopenLabel="Zoeken">
        {children}
      </LayerStage>
    </div>
  )
}

/**
 * What stands in the layer here: a bare field and a few lines under it.
 *
 * Only primitives, because a layer imports only downward; the command palette itself, with its
 * `SearchList`, has a story of its own in `features/palette/`.
 */
function Content() {
  return (
    <div className="flex flex-col gap-1">
      <Input label="Zoeken" placeholder="Zoek" icon="search" variant="bare" />
      <div aria-hidden="true" className="h-px bg-border" />
      {['Eerste meting', 'Totalen van de winkelmand', 'Nieuw gesprek'].map((line) => (
        <p key={line} className="m-0 flex h-(--nt-control-md) items-center px-2 text-[12px]">
          {line}
        </p>
      ))}
    </div>
  )
}

/**
 * Open from the first render.
 *
 * The one state here that starts open, for the reason `Dialog.gallery.tsx` gives: two open layers in
 * one story would both hold the focus.
 */
function Open() {
  return (
    <Stage>
      {(open, setOpen) => (
        <Spotlight open={open} onOpenChange={setOpen} label="Zoeken">
          <Content />
        </Spotlight>
      )}
    </Stage>
  )
}

/** Closed at rest and opened by whoever reads the gallery; a click beside it closes it again. */
function Closed() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Zoeken</Button>
      <Spotlight open={open} onOpenChange={setOpen} label="Zoeken">
        <Content />
      </Spotlight>
    </>
  )
}

export default {
  group: 'overlays',
  title: 'Spotlight',
  states: { Open: Open, Dicht: Closed },
} satisfies Story
