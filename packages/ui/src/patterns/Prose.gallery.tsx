import type { Story } from '../gallery/story'
import { nl } from '../testing/labels'
import { FileLink } from './FileLink'
import { Prose, type ProseDocument, type ProseReferences } from './Prose'

/**
 * One column width, narrow enough that the table really is wider than its column.
 *
 * Every element lives in a single answer rather than one state each: a story is captured as one
 * screenshot, and a stack of separately captioned states would run past the bottom of the stage.
 */
function Column({ markdown }: { markdown: string }) {
  return (
    <div className="w-full max-w-96">
      <Prose labels={nl.prose} markdown={markdown} />
    </div>
  )
}

/** The half-open fence is last, so it swallows nothing that comes after it. */
const answer = [
  '## Wat ik heb veranderd',
  '',
  'Tekst met **vet**, *cursief* en `code in de regel`.',
  '',
  'Eén nieuwe regel blijft een regelafbreking:',
  'dit is de tweede regel.',
  '',
  '- Een opsomming',
  '- Nog een opsomming',
  '  - Een opsomming daaronder',
  '',
  '1. Eerste stap',
  '2. Tweede stap',
  '',
  '- [x] Taak die klaar is',
  '- [ ] Taak die nog openstaat',
  '',
  '> Een citaat uit iets wat hij las.',
  '',
  '---',
  '',
  '### Een kop een niveau lager',
  '',
  '```ts',
  'const result = await orchestrator.run({ workspace, provider, prompt, retries: 3 })',
  '```',
  '',
  '| Pakket | Rol | Hangt af van | Getest met |',
  '| --- | --- | --- | --- |',
  '| protocol | draadcontract | niets | vitest |',
  '',
  'Zie [de ontwerpnotities](https://example.com/notes) of https://example.com/raw.',
  '',
  '![Een schema van de runlus](https://example.com/loop.png)',
  '',
  '```ts',
  'const half = "still streaming',
].join('\n')

/**
 * The guarantee of `Prose`: raw HTML in an answer is text, never an element.
 *
 * On a reference image rather than in a test alone, because this is the one property of the
 * component that a reader has to be able to check at a glance — an answer that quotes a script tag
 * has to show the tag.
 */
const raw = [
  'Een agent die HTML citeert:',
  '',
  'Hij schreef <script>alert(1)</script> en <img src="x" onerror="boom"> hierboven.',
  '',
  '<b>Vet?</b> Nee: tekst, met aan elke kant van de b een punthaak.',
].join('\n')

/** The files the story knows; in the app the chat's own list decides. */
const KNOWN = ['notities.md', 'src/app.ts', 'src/winkelmand/totaal.ts']

/** A stand-in for the chat's finder: whole code or a word that is a known path, with a line. */
const references: ProseReferences<{ start: number; end: number; path: string; line?: number }> = {
  find(text, where) {
    const found = []
    for (const word of text.matchAll(where === 'code' ? /^.*$/g : /\S+/g)) {
      const [raw = ''] = /^[^:,.]+(?:\.[a-z]+)?(?::\d+)?/.exec(word[0]) ?? []
      const [path = '', line] = raw.split(':')
      if (!KNOWN.includes(path)) continue
      const start = word.index ?? 0
      found.push({ start, end: start + raw.length, path, ...(line ? { line: Number(line) } : {}) })
    }
    return found
  },
  render: (match, text) => (
    <FileLink
      label={
        match.line === undefined ? `Open ${match.path}` : `Open ${match.path}, regel ${match.line}`
      }
      text={text}
      path={match.path}
      {...(match.line === undefined ? {} : { line: match.line })}
      onOpen={() => {}}
    />
  ),
}

const paths = [
  'Ik maakte `notities.md` en las `src/winkelmand/totaal.ts:3`.',
  '',
  'De naam van de winkel staat in src/app.ts, en `dist/bundel.js` is gebouwd.',
  '',
  '```ts',
  "import { naam } from './src/app.ts'",
  '```',
].join('\n')

/** A made-up document, as the reading mode shows one. */
const handbook = [
  '---',
  'title: Handbook',
  '---',
  '',
  '# Handbook',
  '',
  'How the made-up shop works. Read [the installation](installation.md) first, or jump to',
  '[usage](#usage). A `javascript:` link stays [text](javascript:void(0)).',
  '',
  '![The shop in one picture](diagram.png)',
  '',
  '## Usage',
  '',
  '```ts',
  'export const total = (prices: number[]) => prices.reduce((a, b) => a + b, 0)',
  '```',
].join('\n')

/** A 24 × 12 PNG in the accent colour, standing in for what `documents.image` answers. */
const DIAGRAM =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAMCAIAAAD3UuoiAAAAF0lEQVR4nGOwOfKMKohh1KBRg0YNwocA72Yi3zV3xT8AAAAASUVORK5CYII='

const documentOptions: ProseDocument = {
  onLink: () => {},
  linkable: (href) => !href.startsWith('javascript:'),
  image: async () => DIAGRAM,
  headings: [
    { from: 25, anchor: 'handbook' },
    { from: 238, anchor: 'usage' },
  ],
  highlight: true,
  frontmatter: 'folded',
}

export default {
  group: 'patterns',
  title: 'Prose',
  states: {
    'An answer with every element': () => <Column markdown={answer} />,
    'Raw HTML stays text': () => <Column markdown={raw} />,
    // Last, so it moves no reference above it: paths the agent named become links.
    'Paths as file links': () => (
      <div className="w-full max-w-96">
        <Prose labels={nl.prose} markdown={paths} references={references} />
      </div>
    ),
    // After the others, so it moves none of their references: the reading mode.
    'A document': () => (
      <div className="w-full max-w-96">
        <Prose labels={nl.prose} markdown={handbook} document={documentOptions} />
      </div>
    ),
  },
} satisfies Story
