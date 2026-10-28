<img width="2400" height="600" alt="Orbit" src="https://github.com/user-attachments/assets/27ec445d-9198-40ba-921a-3826c02c0b8f" />

The building blocks of the **Orbit** interface, as two npm packages:

| Package | Folder | What it is |
|---|---|---|
| [`@fromorbit/ui`](packages/ui/README.md) | `packages/ui` | the component library: primitives, overlays, patterns, the design tokens (`tokens.css`), the theme (`theme.css`) and the fonts (`fonts.css`), in the style of the Orbit family ([`docs/family-style.md`](docs/family-style.md)) |
| [`@fromorbit/doc-view`](packages/doc-view/README.md) | `packages/doc-view` | the document view: Markdown, its outline and the kind of a document |

`@fromorbit/ui` uses `@fromorbit/doc-view` for `Prose` and the Shiki bundle (as a peer dependency). Every component story is online: <https://fromorbit.github.io/orbit-ui-docs/>.

To install either package in your own project, see its README. Both are published on GitHub Packages (`https://npm.pkg.github.com`), which asks for a token with `read:packages` even for a public package.

## Development

Requirements: Node 24 and Bun (see `.node-version` and `.bun-version`). The repository is a Bun workspace; inside it, `@fromorbit/doc-view` resolves to `packages/doc-view`, so installing needs no token.

```sh
bun install
bun run check
```

| Command (at the root) | What it does |
|---|---|
| `bun run check` | typecheck, lint (including the boundaries) and every Vitest test of both packages, without building |
| `bun run build` | builds `dist/` for doc-view, then for ui (ESM plus `.d.ts`, one module per source file, not minified) |
| `bun run verify` | after `build`: every export of both packages has its file and loads in plain Node |
| `bun run test:consumer` | after `build`: doc-view is packed and installed into a fresh NodeNext project that typechecks (needs network), and every export of ui loads, renders and typechecks from `dist/` |
| `bun run gallery`, `gallery:build` | the component site (`packages/ui/docs-site`) locally with HMR, or as a static build into `packages/ui/docs-site/dist` |
| `bun run gallery:publish` | builds the component site and deploys it to GitHub Pages (`fromorbit/orbit-ui-docs`); needs write access to that repository |
| `bun run changeset` | announce a change (patch/minor/major) |
| `bun run version` | bump the versions from the changesets and write the changelogs |
| `bun run release` | build, verify, `check`, the consumer tests and `changeset publish` |

Each package has the same scripts in its own folder (`bun run --cwd packages/ui check`, …).

The component site is an ordinary consumer: it takes the stories from `src/gallery`, the components from `src` and the styling from `tokens.css` and `theme.css` (`packages/ui/tests/docs-site.test.ts` guards this). It is not part of the npm package.

## Releasing

1. Every change a consumer will notice gets a changeset (`bun run changeset`).
2. `bun run version` bumps the versions and writes each package's `CHANGELOG.md`.
3. `bun run release` builds, checks and publishes to GitHub Packages, with a token that has `write:packages` in `NODE_AUTH_TOKEN`. `changeset publish` publishes every package whose version is not yet in the registry; doc-view goes before ui, because ui asks for the new doc-view as a peer.

## Layout

| Folder | Role |
|---|---|
| `packages/ui/` | `@fromorbit/ui`, with its tests, guard tests (`tests/`) and the component site (`docs-site/`) |
| `packages/doc-view/` | `@fromorbit/doc-view`, with its tests (`test/`), golden examples (`fixtures/`) and the consumer test (`consumer/`) |
| `docs/` | the family style, how Halo and the Orbit app move over to it, and its photographs |
| `scripts/` | what both builds share: rewriting the `.d.ts` for NodeNext (`dts-extensions.mjs`) and checking the build (`verify-dist.mjs`) |
| `.changeset/` | the announced changes |

## Contributing

Work goes through a branch of its own and a pull request to `main`. The rules for people and agents are in [`AGENTS.md`](AGENTS.md).

There is no license file: all rights reserved.
