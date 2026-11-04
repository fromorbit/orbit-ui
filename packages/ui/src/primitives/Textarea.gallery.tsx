import type { Story } from '../gallery/story'
import { Input } from './Input'
import { Textarea } from './Textarea'

export default {
  group: 'primitives',
  title: 'Textarea',
  states: {
    Empty: () => <Textarea label="Bericht" placeholder="Schrijf een bericht…" />,
    'Grows with content': () => (
      <Textarea label="Bericht" defaultValue={'Eerste regel\nTweede regel\nDerde regel'} />
    ),
    'Scrolls past maxRows': () => (
      <Textarea
        label="Bericht"
        maxRows={3}
        defaultValue={'One\nTwo\nThree\nFour\nFive\nSix\nSeven'}
      />
    ),
    Disabled: () => <Textarea label="Bericht" disabled defaultValue="Dit kun je niet bewerken" />,
    // How the composer uses it: the surface around the field owns the border and the focus ring,
    // so the field itself brings none of its own.
    'Bare inside a surface': () => (
      // Narrower than the widest state above, so adding this one leaves their references alone.
      <div className="w-full max-w-80 rounded-lg border border-border bg-surface p-2 focus-within:border-border-focus">
        <Textarea label="Bericht" variant="bare" placeholder="Send a message" />
      </div>
    ),
    // Same md Input next to a one-row Textarea, to prove they line up: see the height assertion
    // in Orbit's end-to-end gallery test, which happy-dom cannot measure.
    'Next to an Input (same height)': () => (
      <div className="flex items-start gap-2">
        <Input label="Titel" placeholder="Titel" />
        <Textarea label="Bericht" placeholder="Eén regel" />
      </div>
    ),
  },
} satisfies Story
