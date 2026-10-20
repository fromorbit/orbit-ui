import { type ReactNode, useEffect, useState } from 'react'
import type { Story } from '../gallery/story'
import { Button } from '../primitives/Button'
import { Popover } from './Popover'

const PROJECTS = ['nt-agent', 'design-system', 'provider-claude', 'docs', 'scratch']

const MODELS = ['Sonnet', 'Opus', 'Haiku']

/** Thirty of something, which is what makes a panel run out of room. */
const BRANCHES = Array.from({ length: 30 }, (_, index) => `feature/branch-${index + 1}`)

/**
 * The rows a picker puts in a panel: real controls, as `PickerPill` will use.
 *
 * Buttons rather than spans on purpose. A panel with nothing focusable in it parks the focus on
 * itself, and then the story never exercises what every caller of this layer does — move into the
 * list with the keyboard and come back out again.
 */
function Rows({ names }: { names: readonly string[] }) {
  return (
    <div className="flex w-56 flex-col">
      {names.map((name) => (
        <Button key={name} variant="ghost" block>
          {name}
        </Button>
      ))}
    </div>
  )
}

/**
 * A box tall enough to hold its own open panel.
 *
 * A screenshot reference is clipped to the state's box, and the panel floats: without the height it
 * would hang over the state below this one and show up in that state's image instead of this one's.
 */
function Stage({ children }: { children: ReactNode }) {
  return <div className="h-56 w-72">{children}</div>
}

/** The plain case: a control, and a panel that is not up yet. */
function Closed() {
  return (
    <Popover trigger={<Button>Projects</Button>} label="Projects">
      <Rows names={PROJECTS} />
    </Popover>
  )
}

/**
 * Open from the first render, with text under it that the panel has to cover completely.
 *
 * The only state in this story that starts open, and that is a property of layers rather than a
 * choice: a second panel takes the focus, and a panel that loses the focus closes. Two of them
 * standing open beside each other is not a thing this component does — `Popover.test.tsx` pins
 * that — so every other state here opens on a click.
 */
function Open() {
  const [open, setOpen] = useState(true)
  return (
    <Stage>
      <Popover
        trigger={<Button>Projects</Button>}
        label="Projects"
        open={open}
        onOpenChange={setOpen}
      >
        <Rows names={PROJECTS} />
      </Popover>
      <p data-nt-popover-behind className="mt-3 text-[12px] text-muted">
        Text that the panel covers: a layer is opaque, never a hole in the window material.
      </p>
    </Stage>
  )
}

/**
 * More rows than fit: opened, the panel stops at its maximum and takes the overflow itself.
 *
 * Closed at rest, so its screenshot shows only the control — `Open` above is already the one layer
 * this story may have standing open. The cap and the scroll are measured in Orbit's end-to-end gallery test,
 * which opens this one the way a reader does.
 */
function LongList() {
  return (
    <Popover trigger={<Button>Branches</Button>} label="Branches">
      <Rows names={BRANCHES} />
    </Popover>
  )
}

/**
 * The Escape order, made visible: two counters, one per phase of the same key.
 *
 * The bubble counter stands in for the composer (Escape stops the turn) and for `App` (Escape
 * closes the settings): both listen on the window and both skip an Escape that is already
 * `defaultPrevented`. The capture counter shows the limit of that rule — the capture path runs
 * window → document → target, so a listener registered with `capture: true` runs before the layer
 * and sees an Escape nothing has claimed yet.
 */
function BesideAField() {
  const [bubbled, setBubbled] = useState(0)
  const [captured, setCaptured] = useState(0)
  useEffect(() => {
    function onBubble(event: KeyboardEvent) {
      if (event.key === 'Escape' && !event.defaultPrevented) setBubbled((value) => value + 1)
    }
    function onCapture(event: KeyboardEvent) {
      if (event.key === 'Escape' && !event.defaultPrevented) setCaptured((value) => value + 1)
    }
    window.addEventListener('keydown', onBubble)
    window.addEventListener('keydown', onCapture, true)
    return () => {
      window.removeEventListener('keydown', onBubble)
      window.removeEventListener('keydown', onCapture, true)
    }
  }, [])
  return (
    // A column, not a row: the counters stand under the control rather than beside it, so this
    // state stays as wide as the others and does not stretch every screenshot in the story.
    <div className="flex w-72 flex-col items-start gap-2">
      <Popover trigger={<Button>Model</Button>} label="Model">
        <Rows names={MODELS} />
      </Popover>
      <p className="m-0 text-[12px] text-muted">
        Unclaimed Escapes — bubble: <span data-nt-escape-count>{bubbled}</span>, capture:{' '}
        <span data-nt-escape-capture-count>{captured}</span>
      </p>
    </div>
  )
}

export default {
  group: 'overlays',
  title: 'Popover',
  states: {
    Closed,
    Open,
    'A long list scrolls inside the panel': LongList,
    'Inside a field that also listens to Escape': BesideAField,
  },
} satisfies Story
