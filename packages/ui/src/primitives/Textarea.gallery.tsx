import type { Story } from '../gallery/story'
import { Input } from './Input'
import { Textarea } from './Textarea'

export default {
  group: 'primitives',
  title: 'Textarea',
  states: {
    Leeg: () => <Textarea label="Bericht" placeholder="Schrijf een bericht…" />,
    'Groeit met de inhoud': () => (
      <Textarea label="Bericht" defaultValue={'Eerste regel\nTweede regel\nDerde regel'} />
    ),
    'Scrolt na drie regels': () => (
      <Textarea
        label="Bericht"
        maxRows={3}
        defaultValue={
          'Eerste regel\nTweede regel\nDerde regel\nVierde regel\nVijfde regel\nZesde regel\nZevende regel'
        }
      />
    ),
    Uitgeschakeld: () => (
      <Textarea label="Bericht" disabled defaultValue="Dit kun je niet bewerken" />
    ),
    // How the composer uses it: the surface around the field owns the border and the focus ring,
    // so the field itself brings none of its own.
    'Kaal in een vlak': () => (
      // Narrower than the widest state above, so adding this one leaves their references alone.
      <div className="w-full max-w-80 rounded-lg border border-border bg-surface p-2 focus-within:border-border-focus">
        <Textarea label="Bericht" variant="bare" placeholder="Schrijf een bericht…" />
      </div>
    ),
    // Same md Input next to a one-row Textarea, to prove they line up: see the height assertion
    // in Orbit's end-to-end gallery test, which happy-dom cannot measure.
    'Naast een Input (zelfde hoogte)': () => (
      <div className="flex items-start gap-2">
        <Input label="Titel" placeholder="Titel" />
        <Textarea label="Bericht" placeholder="Eén regel" />
      </div>
    ),
    // Last, so the states above keep their reference images. A wrapped line grows the field too,
    // not only a line break.
    'Groeit mee met afgebroken regels': () => (
      <div className="w-full max-w-64">
        <Textarea
          label="Bericht"
          grow
          maxRows={4}
          defaultValue="Een lange zin in een smalle kolom breekt af en het veld groeit mee, tot vier regels."
        />
      </div>
    ),
  },
} satisfies Story
