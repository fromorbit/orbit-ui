import { type ReactNode, useState } from 'react'
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
function Stage({ children }: { children: ReactNode }) {
  return <div className="h-[30rem] w-[48rem]">{children}</div>
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
      <Input label="Search" placeholder="Search" icon="search" variant="bare" />
      <div aria-hidden="true" className="h-px bg-border" />
      {['First measurement', 'Shopping cart totals', 'New chat'].map((line) => (
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
  const [open, setOpen] = useState(true)
  return (
    <Stage>
      <Spotlight open={open} onOpenChange={setOpen} label="Search">
        <Content />
      </Spotlight>
    </Stage>
  )
}

/** Closed at rest and opened by whoever reads the gallery; a click beside it closes it again. */
function Closed() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Search</Button>
      <Spotlight open={open} onOpenChange={setOpen} label="Search">
        <Content />
      </Spotlight>
    </>
  )
}

export default {
  group: 'overlays',
  title: 'Spotlight',
  states: { Open, Closed },
} satisfies Story
