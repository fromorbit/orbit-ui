import type { Story } from '../gallery/story'
import { FileLink } from './FileLink'

/**
 * A file link in running text: with a line, without one, and one long enough to break.
 */
export default {
  group: 'patterns',
  title: 'FileLink',
  states: {
    'In a sentence': () => (
      <p className="w-96 text-[13px]">
        Ik keek naar{' '}
        <FileLink
          label="Open src/winkelmand/totaal.ts, regel 42"
          text="src/winkelmand/totaal.ts:42"
          path="src/winkelmand/totaal.ts"
          line={42}
          onOpen={() => {}}
        />{' '}
        en naar{' '}
        <FileLink label="Open README.md" text="README.md" path="README.md" onOpen={() => {}} />.
      </p>
    ),
    'A long path that breaks': () => (
      <p className="w-64 text-[13px]">
        Zie{' '}
        <FileLink
          label="Open packages/webwinkel/src/features/winkelmand/berekening/totaal.test.ts"
          text="packages/webwinkel/src/features/winkelmand/berekening/totaal.test.ts"
          path="packages/webwinkel/src/features/winkelmand/berekening/totaal.test.ts"
          onOpen={() => {}}
        />{' '}
        voor de tests.
      </p>
    ),
  },
} satisfies Story
