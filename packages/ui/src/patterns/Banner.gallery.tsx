import type { ReactNode } from 'react'
import type { Story } from '../gallery/story'
import { Button } from '../primitives/Button'
import { Banner } from './Banner'

/** The width of the panel a banner spans in the app, so wrapping happens here as it does there. */
function Panel({ children }: { children: ReactNode }) {
  return <div className="w-96">{children}</div>
}

/**
 * One state per tone, and no state that switches tone on a mounted bar.
 *
 * That is the pattern's own contract: a tone decides the role, a role is read when the element
 * enters the accessibility tree, so a caller renders a fresh `Banner` per tone (`key={tone}`).
 * A story that toggled tone in place would put the wrong example on the wall.
 */
export default {
  group: 'patterns',
  title: 'Banner',
  states: {
    Attention: () => (
      <Panel>
        <Banner tone="attention">Core is restarting</Banner>
      </Panel>
    ),
    'Attention, busy': () => (
      <Panel>
        <Banner tone="attention" busy>
          Core is restarting
        </Banner>
      </Panel>
    ),
    'Attention, announced elsewhere': () => (
      <Panel>
        <Banner tone="attention" announce={false}>
          Core is restarting
        </Banner>
      </Panel>
    ),
    Danger: () => (
      <Panel>
        <Banner tone="danger">The command could not be sent</Banner>
      </Panel>
    ),
    'Danger with an action': () => (
      <Panel>
        <Banner
          tone="danger"
          action={
            <Button size="sm" variant="secondary">
              Try again
            </Button>
          }
        >
          The command could not be sent
        </Banner>
      </Panel>
    ),
    'A long message wraps to a second line': () => (
      <Panel>
        <Banner
          tone="danger"
          action={
            <Button size="sm" variant="secondary">
              Try again
            </Button>
          }
        >
          The run could not be started because the provider did not answer within thirty seconds
        </Banner>
      </Panel>
    ),
  },
} satisfies Story
