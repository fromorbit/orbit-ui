import type { Story } from '../gallery/story'
import { nl } from '../testing/labels'
import { PierreFileIcon } from './PierreFileIcon'
import { PierreTree } from './PierreTree'

const entries = [
  { path: 'lezer/src/greet.ts', status: 'modified' as const },
  { path: 'lezer/src/utils/format.ts', status: 'added' as const },
  { path: 'lezer/docs/notes.md', status: 'deleted' as const },
]

/** Forty invented paths across a handful of folders, for the tab Bestanden's collapsed tree. */
const workDirectory = [
  'README.md',
  'package.json',
  'src/app.ts',
  'src/index.ts',
  ...Array.from({ length: 12 }, (_, index) => `src/winkelmand/regel-${index}.ts`),
  ...Array.from({ length: 10 }, (_, index) => `src/klant/veld-${index}.ts`),
  ...Array.from({ length: 8 }, (_, index) => `src/betaling/stap-${index}.ts`),
  ...Array.from({ length: 6 }, (_, index) => `docs/hoofdstuk-${index}.md`),
  'docs/index.md',
].map((path) => ({ path }))

/**
 * The tree over the files of one chat: three folders, one status colour each.
 *
 * Relative paths, like the ones `FileChange.path` carries: `@pierre/trees` matches its `gitStatus`
 * against relative paths only, and a leading slash silently costs every row its colour. See
 * `PierreTree` itself, which says the same thing where it hands the status over.
 */
export default {
  group: 'patterns',
  title: 'PierreTree',
  states: {
    'Files across three folders': () => (
      <div className="w-72">
        <PierreTree entries={entries} onSelect={() => {}} label="Bestanden van deze chat" />
      </div>
    ),
    // The same icons outside the tree, the way a row of the changes tab shows them:
    // the glyph only, in the colour of the text beside it.
    'File icons beside their names': () => (
      <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[12px] text-muted">
        {['src/greet.ts', 'docs/notes.md', 'package.json', 'assets/logo.png', 'LICENSE'].map(
          (path) => (
            <li key={path} className="flex items-center gap-1.5">
              <PierreFileIcon path={path} />
              <span className="font-mono">{path}</span>
            </li>
          ),
        )}
      </ul>
    ),
    // The tab Bestanden's shape: filling a box of a known height, collapsed but for the top level.
    // Last on purpose (MOET N4 of the review): its 400px box shifts everything scrolled into view
    // after it by a fraction of a pixel (the gallery's own headings are 22.5px), which cost
    // `patterns-pierretree--file-icons-beside-their-names` its own reference image when this state
    // stood before it — a state earlier on the page never moves once captured, whatever is added
    // below it.
    werkmap: () => (
      <div className="h-[400px] w-72 border border-border">
        <PierreTree
          entries={workDirectory}
          onSelect={() => {}}
          label="Bestanden van deze chat"
          fill
          expansion="closed"
        />
      </div>
    ),
    // The tab Bestanden's own marks: a changed file (`M`), a
    // staged one (`A`), a new one (`U`), a folder above a changed path with a dot even though its
    // contents are not loaded, and what git ignores dimmed, a folder and a file.
    'status marks': () => (
      <div className="h-[220px] w-72 border border-border">
        <PierreTree
          entries={[
            { path: 'dist', kind: 'dir' },
            { path: 'src', kind: 'dir' },
            { path: 'src/app.ts' },
            { path: 'src/korting.ts' },
            { path: 'src/fout.log' },
            { path: 'README.md' },
            { path: 'winkelmand', kind: 'dir' },
          ]}
          onSelect={() => {}}
          label="Bestanden van deze chat"
          fill
          markLabels={nl.treeMarks}
          statuses={[
            { path: 'src/app.ts', mark: 'modified' },
            { path: 'src/korting.ts', mark: 'added' },
            { path: 'README.md', mark: 'new' },
            // Never loaded, so no entry names it directly: the dot on `winkelmand` alone shows it.
            { path: 'winkelmand/regels/nieuw.ts', mark: 'new' },
            { path: 'dist', mark: 'ignored', kind: 'dir' },
            { path: 'src/fout.log', mark: 'ignored' },
          ]}
        />
      </div>
    ),
  },
} satisfies Story
