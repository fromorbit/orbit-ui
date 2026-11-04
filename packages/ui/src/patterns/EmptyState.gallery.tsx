import type { Story } from '../gallery/story'
import { Button } from '../primitives/Button'
import { EmptyState } from './EmptyState'

export default {
  group: 'patterns',
  title: 'EmptyState',
  states: {
    'Alleen een titel': () => <EmptyState icon="message-circle" title="Nog geen gesprekken" />,
    // The form a whole panel uses: the same drawing, with the title as the document's heading.
    'Als kop van een paneel': () => (
      <EmptyState icon="message-circle" title="Waar wil je aan werken?" titleAs="h1" />
    ),
    'Met een actie': () => (
      <EmptyState
        icon="message-circle"
        title="Nog geen gesprekken"
        description="Begin er een en hij staat hier, per project."
        action={
          <Button variant="primary" size="sm">
            Nieuw gesprek
          </Button>
        }
      />
    ),
    'Niets gevonden': () => (
      <EmptyState
        icon="search"
        title="Niets gevonden"
        description="Probeer een kortere zoekterm."
      />
    ),
  },
} satisfies Story
