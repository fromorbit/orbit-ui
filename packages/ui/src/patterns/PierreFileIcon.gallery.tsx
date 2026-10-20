import type { Story } from '../gallery/story'
import { PierreFileIcon } from './PierreFileIcon'

/**
 * The icon of one file outside the tree, as rows of the changes tab, attachments and links draw it.
 *
 * Its own story since the icon left `PierreTree.tsx`, so a row outside the tree no longer loads the
 * tree library;
 * the tree's story keeps the same icons beside its own rows.
 */
export default {
  group: 'patterns',
  title: 'PierreFileIcon',
  states: {
    // A language with a builtin icon, one of ours, a build file and a type without an icon.
    'Known and unknown types': () => (
      <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[12px] text-muted">
        {['src/winkel.ts', 'src/Winkel.java', 'build.gradle', 'notities.onbekend'].map((path) => (
          <li key={path} className="flex items-center gap-1.5">
            <PierreFileIcon path={path} />
            <span className="font-mono">{path}</span>
          </li>
        ))}
      </ul>
    ),
  },
} satisfies Story
