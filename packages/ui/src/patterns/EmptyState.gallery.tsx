import type { Story } from '../gallery/story'
import { Button } from '../primitives/Button'
import { EmptyState } from './EmptyState'

export default {
  group: 'patterns',
  title: 'EmptyState',
  states: {
    'Title only': () => <EmptyState icon="message-circle" title="No chats yet" />,
    // The form a whole panel uses: the same drawing, with the title as the document's heading.
    'As the heading of a panel': () => (
      <EmptyState icon="message-circle" title="What do you want to work on?" titleAs="h1" />
    ),
    'With an action': () => (
      <EmptyState
        icon="message-circle"
        title="No chats yet"
        description="Start one and it appears here, grouped by project."
        action={
          <Button variant="primary" size="sm">
            New chat
          </Button>
        }
      />
    ),
    'Nothing found': () => (
      <EmptyState icon="search" title="No results" description="Try a shorter search." />
    ),
  },
} satisfies Story
