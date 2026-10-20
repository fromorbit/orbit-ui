import type { ReactNode } from 'react'
import type { Story } from '../gallery/story'
import { PathLabel } from './PathLabel'

/**
 * A column as narrow as the detail slot of a picker row, so the head really has to give way.
 *
 * `min-w-0` on the box as well: without it a flex parent grows to the whole path and nothing ever
 * truncates — the mistake every caller of this component can make.
 *
 * `text-muted` on the box, not in the component: a path takes the colour of the row it stands in,
 * and the row it usually stands in is a quiet one. This is that row.
 */
function Column({ width, children }: { width: 'narrow' | 'wide'; children: ReactNode }) {
  return (
    <div
      className={
        width === 'narrow'
          ? 'flex min-w-0 rounded-md border border-border p-2 text-muted'
          : 'flex w-96 min-w-0 rounded-md border border-border p-2 text-muted'
      }
    >
      {children}
    </div>
  )
}

export default {
  group: 'patterns',
  title: 'PathLabel',
  states: {
    'A path that fits': () => (
      <Column width="wide">
        <PathLabel path="/work/nt-agent" />
      </Column>
    ),
    'A long path in a narrow column': () => (
      <div className="w-56">
        <Column width="narrow">
          <PathLabel path="/work/klanten/atlas/checkouts/nt-agent" />
        </Column>
      </div>
    ),
    // As an expression, not an attribute string: JSX does not read escape sequences, so a
    // `path="C:\\work"` attribute would carry two backslashes instead of one.
    'A Windows path': () => (
      <Column width="wide">
        <PathLabel path={'C:\\work\\klanten\\atlas\\checkouts\\nt-agent'} />
      </Column>
    ),
    'Just a name': () => (
      <Column width="wide">
        <PathLabel path="nt-agent" />
      </Column>
    ),
    // Last, so the states above keep their reference images: a file as the main text of a row in
    // the changes tab — the folder quiet, the name bright.
    'A file name that stands out': () => (
      <Column width="wide">
        <PathLabel path="src/components/lezer.ts" emphasis="name" />
      </Column>
    ),
    'A file that is gone': () => (
      <Column width="wide">
        <PathLabel path="docs/beeld.png" emphasis="gone" />
      </Column>
    ),
    // The head of a document: the folder loses its start, so the
    // folders nearest the name stay.
    'Cut from the start in the head of a document': () => (
      <div className="w-56">
        <Column width="narrow">
          <PathLabel
            path="docs/specs/afrekenen/winkelmand/retouren.md"
            emphasis="name"
            cut="start"
          />
        </Column>
      </div>
    ),
  },
} satisfies Story
