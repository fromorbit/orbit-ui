import type { Story } from '../gallery/story'
import { Input } from './Input'
import { Textarea } from './Textarea'

export default {
  group: 'primitives',
  title: 'Textarea',
  states: {
    Empty: () => <Textarea label="Message" placeholder="Write a message…" />,
    'Grows with content': () => (
      <Textarea label="Message" defaultValue={'First line\nSecond line\nThird line'} />
    ),
    'Scrolls past maxRows': () => (
      <Textarea
        label="Message"
        maxRows={3}
        defaultValue={'One\nTwo\nThree\nFour\nFive\nSix\nSeven'}
      />
    ),
    Disabled: () => <Textarea label="Message" disabled defaultValue="Cannot edit this" />,
    // How the composer uses it: the surface around the field owns the border and the focus ring,
    // so the field itself brings none of its own.
    'Bare inside a surface': () => (
      // Narrower than the widest state above, so adding this one leaves their references alone.
      <div className="w-80 rounded-lg border border-border bg-surface p-2 focus-within:border-border-focus">
        <Textarea label="Message" variant="bare" placeholder="Send a message" />
      </div>
    ),
    // Same md Input next to a one-row Textarea, to prove they line up: see the height assertion
    // in Orbit's end-to-end gallery test, which happy-dom cannot measure.
    'Next to an Input (same height)': () => (
      <div className="flex items-start gap-2">
        <Input label="Title" placeholder="Title" />
        <Textarea label="Message" placeholder="One row" />
      </div>
    ),
  },
} satisfies Story
