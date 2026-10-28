# orbit-ui

The building blocks of the Orbit interface, as a Bun workspace with two packages: `@fromorbit/ui` (`packages/ui`: primitives, overlays, patterns and the design tokens `tokens.css` and `theme.css`) and `@fromorbit/doc-view` (`packages/doc-view`: the document view). Both are published on GitHub Packages.

## Commands

Bun is the package manager and script runner; the tests and the library itself run on Node (`.node-version`). At the root, every command runs over both packages (doc-view first); in a package folder, only over that package.

| Command | Proves |
|---|---|
| `bun run check` | typecheck, lint (including the boundaries) and every Vitest test (components in happy-dom), without building |
| `bun run build` | `dist/`: JavaScript with tsup (one module per source file, not minified), `.d.ts` with `tsc`, and `scripts/dts-extensions.mjs` adds `.js` to them; ui copies `tokens.css`, `theme.css` and `fonts.css`, doc-view copies `doc-view.css` |
| `bun run verify` | after `build`: every export has its file and loads in plain Node, through both `import` and `require` (`scripts/verify-dist.mjs`) |
| `bun run test:consumer` | after `build`: for ui, every export loads from `dist/` (`tests/exports.test.ts`), a `Button` from `dist/` renders with and without `UiProvider` (`tests/consumer.test.tsx`), and a consumer typechecks against the built `.d.ts` (`tests/consumer-types.test.ts`); for doc-view, the package is packed, installed into a fresh NodeNext project and typechecked (`consumer/consumer.test.ts`, needs network) |
| `bun run gallery:build` | the component site (`packages/ui/docs-site/`) builds into `docs-site/dist`; its test (list and hash) runs in `check`, `gallery:publish` only by hand |
| `bun run changeset` | announce a change (patch/minor/major) |
| `bun run release` | only on request: `build`, `verify`, `check`, `test:consumer` and `changeset publish` to GitHub Packages (token with `write:packages`) |

## The workspace

- `@fromorbit/ui` takes `@fromorbit/doc-view` as a peer; in the workspace it is a `workspace:*` devDependency, so the local doc-view. The `@fromorbit/source` condition in doc-view's `exports` points to its `src/`: ui's `tsconfig.json`, `vitest.config.ts` and `docs-site/vite.config.ts` set it, so `check` and the gallery need no build of doc-view. ui's `tsconfig.build.json` turns it off, so the ui build reads the built doc-view, and `bun run build` builds doc-view first.
- `bunfig.toml` at the root applies to both packages: an outside version must be seven days old; only our own packages are exempt (`packages/ui/tests/cooldown.test.ts`).
- `.npmrc` names only the `@fromorbit` registry and refers to `NODE_AUTH_TOKEN`; a token is never written to a file. Installing in the workspace does not need it; publishing does.

## Rules

- **No i18n.** No `i18next` or `react-i18next`, and no Dutch or English text in a component: every text arrives as a prop (`confirmLabel`, `copiedLabel`, `labels`). The consumer takes it from its own catalogue.
- **No `@nt/*`.** The packages know nothing of the app's protocol, bridge or shortcut catalogue. Types a component needs are its own structural copies (`packages/ui/src/types.ts`). doc-view imports none of our other packages (`packages/doc-view/test/boundaries.test.ts`). No `node:*` outside tests.
- **The app through `UiProvider`.** Shortcuts (`ShortcutPort`), platform, theme, `locale` and host (`HostPort`: the hosted layers of `HostedSurface`) come in through a single `UiProvider`; opening a file or link goes through `onOpen` on `FileLink` and `GitHubLink`. Without a provider everything works with a neutral default: no shortcut label, platform `mac`. The consumer fills `ShortcutIds` with declaration merging from the root module.
- **Three layers in ui.** `primitives/` → `overlays/` → `patterns/`: a layer imports only from itself or a layer below. `tests/boundaries.test.ts` and `biome.json` enforce the boundaries: layers only downward, no relative import outside `src/`, a package only if it is in `dependencies` or `peerDependencies`, `vitest`, Testing Library and `node:*` only in a test (`@testing-library/react` also in `src/testing/`), no `i18next` or `@nt/*`, and no import from `testing/` or `gallery/` outside a test, a story or those folders themselves.
- **Classes stay literal.** The consumer's Tailwind scans `dist/` with `@source`, so the build neither minifies nor bundles, and a class is never assembled from pieces.
- **Peers of ui.** React, `react-dom`, `radix-ui`, `lucide-react`, `@pierre/diffs`, `@pierre/trees`, `react-markdown`, `remark-gfm` and `@fromorbit/doc-view` are peer dependencies (the root export loads `Prose`, so doc-view is not optional); `@testing-library/react` (for `./testing`) is an optional peer; `class-variance-authority` is a regular dependency. Every peer is also in `devDependencies` and in `EXTERNAL` of `tsup.config.ts`; doc-view's own peers appear in ui only in `devDependencies`, for the tests.
- **`radix-ui` at `~1.6.7`.** Under 1.7.0 and 1.8.1, `Tabs.test.tsx` ("reports the tab that was chosen": the choice arrives twice) and `DropdownMenu.test.tsx` (the reason of a disabled row) fail. Widen the range only once both pass on the new version.
- **The `shiki` alias.** ui's `vitest.config.ts` points `shiki` to `src/patterns/shiki-bundle.ts` and inlines `@pierre/diffs`, so `PierreDiff` and `Prose` are tested against the bundle a consumer ships.
- **`testing/labels.ts` is a fixture.** The Dutch words of our own stories and tests. Public only as `galleryLabels` from `./gallery`, never from `./testing` or `.`: a consumer gives its components the words of its own catalogue.
- **The styling ships with it.** `tokens.css` provides the variables, `theme.css` everything else the components depend on, `fonts.css` the fonts (Outfit and DM Mono, from the package's own `@fontsource` dependencies, never from another origin; `src/fonts.test.ts`). `src/theme.test.ts` fails when a component carries an `nt-` class with no rule in `theme.css` or `tokens.css`, and when `theme.css` contains anything belonging to the app (`body`, window scrollbars, layout) or imports anything.
- **The family style.** The palette is the brand of the Orbit family: Midnight (dark) and Paper (light), a monochrome main button, violet links and focus. The fixed colours are `--nt-brand-*`, declared once on `:root` and never repeated in the light block. A product's colour is only its satellite (`--nt-satellite`, chosen with `data-product`), never a role; `tokens.test.ts` holds both, and every contrast requirement in both themes. See `docs/family-style.md`.
- **Guard tests in `packages/ui/tests/`** (helpers in `tests/guards/`): every component has a test and a gallery story beside it (`component-siblings`), every focus ring has an `outline-offset` (`focus-ring`), `text-faint` only in the tone of `Icon` (`faint-text`), no `<svg>` of our own outside the listed files (`own-svg`), no colour from the Tailwind palette (`palette-colours`), and no bare `<button>`/`<input>` in a story or in `testing/` (`bare-controls`).
- **doc-view's golden examples.** `packages/doc-view/fixtures/` ships with the package; `NT_GOLDEN_UPDATE=1 bun run test` in `packages/doc-view` rewrites them. Read the diff.
- **Every component exports its props type** and its `*Labels` type; ui's `src/index.ts` re-exports every module with `export *`, and `src/index.test.ts` names any module that is missing.
- **A new export** gets a line in `exports`, an entry in `ENTRIES` of `tsup.config.ts` and a place in the export test. Never change an existing subpath: consumers import it.
- **Stories are pixel references.** The visible text in `*.gallery.tsx` determines screenshots in consuming apps; change it only for a reason.
- **Language.** Code comments, test names and the repository documentation (the READMEs and this file) are in English, with JSDoc on every export (summary first, then the why). The exception is deliberate: the visible text of the gallery stories and of the component site (`docs-site`) stays Dutch, because the stories are Orbit's pixel references.
- **The repository is public.** No personal data, tokens, real machine paths, or names of clients or projects in code, stories, tests or fixtures: use made-up names and `/work/…` paths. No references to documents that do not live here.
- **Work goes through a branch and a pull request** to `main`, never with force; `git add` with explicit paths.

## Definition of done

`bun run check`, `bun run build` and `bun run test:consumer` are green, run in this session, and their output has been read.
