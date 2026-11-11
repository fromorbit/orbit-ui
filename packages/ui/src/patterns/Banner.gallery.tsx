import type { ReactNode } from 'react'
import type { Story } from '../gallery/story'
import { Button } from '../primitives/Button'
import { Banner } from './Banner'

/** The width of the panel a banner spans in the app, so wrapping happens here as it does there. */
function Panel({ children }: { children: ReactNode }) {
  return <div className="w-full max-w-96">{children}</div>
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
    'Let op': () => (
      <Panel>
        <Banner tone="attention">Core start opnieuw</Banner>
      </Panel>
    ),
    'Let op, bezig': () => (
      <Panel>
        <Banner tone="attention" busy>
          Core start opnieuw
        </Banner>
      </Panel>
    ),
    'Let op, elders aangekondigd': () => (
      <Panel>
        <Banner tone="attention" announce={false}>
          Core start opnieuw
        </Banner>
      </Panel>
    ),
    Gevaar: () => (
      <Panel>
        <Banner tone="danger">Het commando is niet verstuurd</Banner>
      </Panel>
    ),
    'Gevaar met een actie': () => (
      <Panel>
        <Banner
          tone="danger"
          action={
            <Button size="sm" variant="secondary">
              Opnieuw proberen
            </Button>
          }
        >
          Het commando is niet verstuurd
        </Banner>
      </Panel>
    ),
    'Een lang bericht loopt door op een tweede regel': () => (
      <Panel>
        <Banner
          tone="danger"
          action={
            <Button size="sm" variant="secondary">
              Opnieuw proberen
            </Button>
          }
        >
          De run kon niet starten, omdat de provider binnen dertig seconden niet antwoordde
        </Banner>
      </Panel>
    ),
    // Last, so the states above keep their reference images. A sentence to read with a way out
    // beside it: the words in the text colour, only the icon in the tone.
    'Om te lezen, met een actie': () => (
      <Panel>
        <Banner
          tone="attention"
          prose
          action={
            <Button size="sm" variant="secondary">
              Project maken
            </Button>
          }
        >
          Deze map is nog geen project. Maak er een project van om de chats en runs te bewaren.
        </Banner>
      </Panel>
    ),
    'Om te lezen, gevaar': () => (
      <Panel>
        <Banner tone="danger" prose>
          De map kon niet worden geopend
        </Banner>
      </Panel>
    ),
  },
} satisfies Story
