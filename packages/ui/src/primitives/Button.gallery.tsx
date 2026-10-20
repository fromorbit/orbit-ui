import { useState } from 'react'
import type { Story } from '../gallery/story'
import { Button } from './Button'

function GhostToggle() {
  const [pressed, setPressed] = useState(false)
  return (
    <Button variant="ghost" aria-pressed={pressed} onClick={() => setPressed((value) => !value)}>
      Toggle
    </Button>
  )
}

export default {
  group: 'primitives',
  title: 'Button',
  states: {
    Variants: () => (
      <div className="flex gap-2">
        <Button variant="primary">Send</Button>
        <Button>Cancel</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
    ),
    Sizes: () => (
      <div className="flex items-center gap-2">
        <Button size="xs">Tiny</Button>
        <Button size="sm">Small</Button>
        <Button>Medium</Button>
        <Button size="lg">Large</Button>
      </div>
    ),
    Disabled: () => (
      <div className="flex gap-2">
        <Button variant="primary" disabled>
          Send
        </Button>
        <Button disabled>Cancel</Button>
      </div>
    ),
    Loading: () => (
      // Each pair shares a label, variant and size: at rest next to loading, so the equal width
      // is visible rather than just asserted.
      <div className="flex gap-2">
        <Button variant="primary">Send</Button>
        <Button variant="primary" loading>
          Send
        </Button>
        <Button>Cancel</Button>
        <Button loading>Cancel</Button>
      </div>
    ),
    Block: () => (
      <div className="w-48">
        <Button block>New chat</Button>
      </div>
    ),
    'Long label': () => (
      // A column narrower than either label: the `block` button must cut its label off with an
      // ellipsis instead of wrapping over the row below, and the one that sizes to its content
      // stays a single line and simply grows past the column.
      <div className="flex w-48 flex-col items-start gap-2">
        <Button block>Start a chat about the checkout</Button>
        <Button>Start a chat about the checkout</Button>
      </div>
    ),
    Shrink: () => (
      // Two buttons in a row that is too narrow for both, with `min-w-0` on the row so a flex item
      // may go below its content. The first is allowed to give up width and loses its tail; the
      // second keeps every pixel of its label and pushes the row past its own right edge — which
      // is what a toolbar of pills used to do to the send button beside them.
      <div className="flex w-64 flex-col gap-2">
        <div className="flex min-w-0 gap-2 rounded-md border border-border p-1">
          <Button shrink>Start a chat about the checkout</Button>
          <Button variant="primary">Send</Button>
        </div>
        <div className="flex min-w-0 gap-2 rounded-md border border-border p-1">
          <Button>Start a chat about the checkout</Button>
          <Button variant="primary">Send</Button>
        </div>
      </div>
    ),
    'Ghost as a toggle': () => <GhostToggle />,
    // Last, so it moves no reference above it. The key inside the button: on the
    // accent as a dark plane of 16%, Enter as its icon; quiet on the other variants. The last one
    // is `aria-disabled`: dimmed, but still a tab stop. Wrapped inside 256px: the widest state
    // sets the width of every state of a story, and this one must not move their references.
    'With a key': () => (
      <div className="flex max-w-64 flex-wrap items-center gap-2">
        <Button variant="primary" shortcut="Enter">
          Send
        </Button>
        <Button variant="primary" shortcut="⌘Enter">
          Queue
        </Button>
        <Button shortcut="⌘O">Open</Button>
        <Button variant="ghost" shortcut="⇧Enter">
          New line
        </Button>
        <Button variant="primary" shortcut="Enter" aria-disabled="true">
          Send
        </Button>
      </div>
    ),
  },
} satisfies Story
