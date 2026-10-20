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
        I looked at{' '}
        <FileLink
          label="Open src/winkelmand/totaal.ts, regel 42"
          text="src/winkelmand/totaal.ts:42"
          path="src/winkelmand/totaal.ts"
          line={42}
          onOpen={() => {}}
        />{' '}
        and at{' '}
        <FileLink label="Open README.md" text="README.md" path="README.md" onOpen={() => {}} />.
      </p>
    ),
    'A long path that breaks': () => (
      <p className="w-64 text-[13px]">
        See{' '}
        <FileLink
          label="Open packages/webwinkel/src/features/winkelmand/berekening/totaal.test.ts"
          text="packages/webwinkel/src/features/winkelmand/berekening/totaal.test.ts"
          path="packages/webwinkel/src/features/winkelmand/berekening/totaal.test.ts"
          onOpen={() => {}}
        />{' '}
        for the tests.
      </p>
    ),
  },
} satisfies Story
