# @fromorbit/doc-view

The document view of Orbit: `DocProse` draws Markdown, `DocOutline` its headings, `DocKindIcon` the kind and status of a document.

React components that stand on their own. Every visible text comes in as a prop (`labels`), and links and images are the caller's to decide through callbacks, so the package knows nothing of files, browsers or a server. Only a relative path or an `http:`, `https:` or `mailto:` address ever becomes a link, whatever the caller allows.

## Install

The package is published on GitHub Packages. GitHub's npm registry asks for a token even for a public package: create a personal access token (classic) with `read:packages`, put it in `NODE_AUTH_TOKEN`, and add an `.npmrc` beside your `package.json`:

```
@fromorbit:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Then install it, under its own name or under a short alias:

```sh
npm install @fromorbit/doc-view
```

```json
"@nt/doc-view": "npm:@fromorbit/doc-view@^0.1.8"
```

The examples below use the alias `@nt/doc-view`; with the plain name, import from `@fromorbit/doc-view`.

Peer dependencies: `react`, `react-markdown`, `remark-gfm`, `remark-frontmatter`, `remark-parse`, `unified`, `shiki`, `@shikijs/langs`, `lucide-react`.

## Usage

```tsx
import { DocOutline, DocProse, outlineOf } from '@nt/doc-view'
import '@nt/doc-view/doc-view.css'

export function Document({ markdown }: { markdown: string }) {
  const headings = outlineOf(markdown)
  return (
    <>
      <DocOutline
        entries={headings}
        active={null}
        onJump={(anchor) => document.getElementById(anchor)?.scrollIntoView()}
        folded={false}
        labels={{ label: 'Contents', toggle: 'Show contents' }}
      />
      <DocProse
        markdown={markdown}
        labels={{
          codeBlock: 'Code block',
          table: 'Table',
          frontmatter: 'Frontmatter',
          footnotes: 'Footnotes',
          taskDone: 'Done',
          taskOpen: 'Not done',
        }}
        linkable={(href) => href.startsWith('https:')}
        onLink={(href) => window.open(href)}
        headings={headings}
        highlight
        frontmatter="folded"
        alerts
      />
    </>
  )
}
```

Other options of `DocProse`: `image` (a loader returning a data URL or `null`), `renderCodeBlock` (draw a fenced block of your own, such as a diagram), `renderCopy` (the copy button of a code block), `foldTechnical` (a section Contract folded under `labels.technical`, for a reader who does not read code) and `focus` (ranges of the source to light, for a review of the document). `DocKindIcon` takes `kind`, `category` and an optional `plain`.

## Entry points

| Entry point | Contents |
|---|---|
| `@fromorbit/doc-view` | `DocProse`, `DocOutline`, `DocKindIcon`, `outlineOf` (GitHub-style anchors), `highlightCode`, `bundledLanguageOf`, `ALERT_KINDS`, and their prop and label types |
| `@fromorbit/doc-view/shiki-bundle` | the 25 lazily loaded Shiki grammars (`bundledLanguages`, `createHighlighter`, `codeToHtml`, ...), built only on `shiki/core`; a host can alias `shiki` to it, as `@fromorbit/ui` does for its diff view |
| `@fromorbit/doc-view/doc-view.css` | the typography of the three components; it names only its own `nt-doc*` classes and reads the host's `--nt-*` design tokens (`--nt-text`, `--nt-border`, `--nt-accent`, `--nt-font-mono`, ...), which the host must define, for example with `@fromorbit/ui/tokens.css` |

`fixtures/` ships with the package as plain files: golden examples, each a `<name>.md` with the `<name>.html` that `DocProse` renders and a `<name>.json` with the `outlineOf` result and the Shiki tokens of its code blocks, plus `labels.json`. The recipe is written at the top of `test/golden.test.tsx`; `NT_GOLDEN_UPDATE=1 bun run test` in this folder rewrites them.

## Testing

There are no fakes or contract suites. A consumer that carries its own copy of the source checks it against `fixtures/` with the same recipe, so a change in a dependency shows as a red test on both sides.

## Development

This package lives in the `orbit-ui` workspace; see the README at the root for the commands. In this folder, `bun run check` runs typecheck, lint and tests, `bun run build` writes `dist/`, and `bun run test:consumer` packs the build and type-checks it from a fresh NodeNext project.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
