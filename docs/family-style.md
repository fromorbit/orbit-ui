# The family style (0.2.0)

From 0.2.0 the default look of `@fromorbit/ui` is the brand of the Orbit family (brand assets v1.0), the look Halo laid over the kit by hand and Orbit's site wears on its public pages. A host gets it by loading the three stylesheets; no override of its own is needed.

Photographs before and after, light and dark, are in [`screenshots/2026-10-28-family-style/`](screenshots/2026-10-28-family-style/): `before-*` is 0.1.0, `after-*` is 0.2.0 with the product Orbit, `after-halo-*` the same with `data-product="halo"`.

## What the default is now

| Part | Dark (`:root`) | Light (`[data-theme="light"]`) |
|---|---|---|
| Canvas | Midnight `#111936` | Paper `#F5F4F0` |
| Frame (sidebar, window) | a step deeper, `#0C1229` | a step darker, `#EFEEE9` |
| Card, menu, composer | a step lighter, `#19223F` | white |
| Planes and lines | Mist at low strength | Midnight at low strength |
| Text / muted | Paper 15.7:1 / Slate 5.6:1 | Midnight 15.7:1 / deep Slate `#5A6185` 5.5:1 |
| Main button (`accent`) | Paper with Midnight words | Midnight with Paper words |
| Links, selected word (`accent-text`), focus ring | violet lifted to `#A3AAF5` (7.9:1) | violet `#5140F2` (5.7:1) |
| Status | the site's: green `#4CB782`, ochre `#E5A445`, red `#FF7B7B` | green `#1F7A4A`, ochre `#965A00`, red `#BF3030` |
| Sidebar | `--nt-sidebar-gradient`: a whisper of the Midnight gradient | flat |

Type: Outfit (variable) for the interface, titles at 600 (`--nt-font-weight-heading`, Tailwind `font-heading`: `PageHeader`, `Dialog`, `ConfirmDialog`, `EmptyState`); DM Mono (400, 500) for code, paths and keys, never with a synthetic bold. Both ship with the package as `@fromorbit/ui/fonts.css`, which imports `@fontsource-variable/outfit` and `@fontsource/dm-mono` (OFL, regular dependencies of the package), so the font files travel in the host's bundle and nothing is fetched from another origin.

The fixed colours of the family are tokens of their own, the same in both themes: `--nt-brand-midnight`, `-midnight-top`, `-midnight-bottom`, `--nt-brand-gradient`, `-paper`, `-mist`, `-slate`, `-slate-deep`, `-violet`, and per product `--nt-brand-orbit` (orange), `--nt-brand-halo` (mint), `--nt-brand-fold` (lavender).

`tokens.test.ts` computes every contrast requirement from the file, in both themes: text, muted and the status colours at least 4.5:1 on the canvas, the frame and a card; secondary at least 7:1; the focus ring and a status glyph at least 3:1; `faint` stays for icons only (`tests/faint-text.test.ts`). The reduced-motion block of `theme.css` is unchanged and still covers every animation.

## The product's accent: the satellite

A product's own colour is never a role of the interface (never a word, a line, a plane or a button). It is the satellite: the dot in its symbol and wordmark, and at most a small dot that says "where you are now", always beside another sign (mint on Paper is 1.7:1).

- `--nt-satellite` holds it; Tailwind names it `satellite` (`bg-satellite`, `fill-satellite`).
- Without anything it is Orbit orange. `data-product="halo"` on an element (as a rule `<html>`) makes it mint for everything inside, `data-product="fold"` lavender, `data-product="orbit"` orange again.
- The product rules stand after the light block and the light block never repeats the satellite, so a `data-theme` further in cannot take it back.
- A host can also set `--nt-satellite` itself.

The gallery has a switch for it (Orbit, Halo, Fold): the dot beside "UI" in its head is the satellite.

## Breaking changes

- **Every colour value changed**, in both themes. The names (`--nt-*` and the Tailwind names of `theme.css`) are the same; pixel references of a host (screenshots, end-to-end colour checks) change.
- **The accent is monochrome.** `--nt-accent` is Paper in dark and Midnight in light; `--nt-accent-fg` is no longer `#ffffff` but Midnight in dark and Paper in light. Whatever a host puts on `bg-accent` with its own white text, or reads as "the blue", must take `text-accent-fg` or `accent-text`.
- **The focus ring is its own colour.** `--nt-focus-ring` no longer reads `var(--nt-accent)`; a host that recoloured the ring through `--nt-accent` sets `--nt-focus-ring` instead.
- **Fonts.** `--nt-font-sans` and `--nt-font-mono` name Outfit and DM Mono, no longer Geist. A host loads `@fromorbit/ui/fonts.css` (or the same faces itself); without either, the system font shows.
- **Titles weigh 600** through `font-heading`. A host that builds against the new `dist/` needs the new `theme.css`, which maps `--font-weight-heading`.
- **Two new dependencies**, `@fontsource-variable/outfit` and `@fontsource/dm-mono` (5.3.0), installed with the package.
- **The light block no longer repeats `--nt-brand-orbit`**: the fixed colours and the satellite are declared once.

## Halo: what can go

Halo (`fromorbit/halo-v2`) laid the family style over 0.1.0 itself. After it moves its `vendor/` tarball to 0.2.0:

1. `packages/ui/src/theme/brand.css`: both blocks of `--nt-*` roles (`:root` and `[data-theme='light']`) go; they are the kit's defaults now. What stays is Halo's own: the wordmark (`--halo-wordmark`, `.wordmark`, `.auth .wordmark`).
2. In the same file: `--halo-side-plane` goes; `.sidebar` takes `background: var(--nt-sidebar-gradient), var(--sunk)`. The `font-synthesis-weight` rule goes (it is in `fonts.css`).
3. `packages/ui/src/app.css`: the three `@fontsource` imports become one `@import '@fromorbit/ui/fonts.css';`, and `packages/ui/package.json` drops `@fontsource-variable/outfit` and `@fontsource/dm-mono` (they come with the kit).
4. `<html>` in `packages/ui/index.html` gets `data-product="halo"`; the mint dot of the current space in `styles.css` takes `var(--nt-satellite)` instead of `var(--halo-mint)`.
5. `packages/ui/src/theme/tokens.css`: `--halo-midnight`, `-paper`, `-mist`, `-slate`, `-slate-deep`, `-violet`, `-mint` can read the kit's `--nt-brand-*` (or go where nothing outside `light.css` and `dark.css` names them). `light.css` and `dark.css` stay as long as the desktop setup page reads them alone.
6. `theme/orbit.css` stays: it maps Halo's own tokens onto the kit's roles. `--danger-fg` stays Halo's (the kit has no solid red button).

Differences to check in Halo's photographs: `secondary` and `faint` are now opaque colours (Halo had Mist and Slate at partial strength, the same on the canvas); `faint` in light is darker (`#7D84A3`, 3.3:1, where Halo's was 2.5:1). The proxy's pages (`proxy-builtin/src/page-theme.ts`) copy the kit's palette and a test holds them to the kit's `tokens.css`: that test fails on the new tarball until the copy follows, which brings those pages into the brand as well.

## The Orbit app: how it moves over

The app (`fromorbit/Orbit`, `apps/desktop`) has its own copy of what became this package: `src/renderer/src/styles/tokens.css` (the same roles, a few tokens fewer), the `@theme inline` block at the top of `styles/index.css` (the same as `theme.css`), Geist from `main.tsx`, and the components under `src/renderer/src/shared/ui/`. It already sets `data-theme` on `<html>` from the preload. The move is two steps, each its own PR:

**Step 1, the style (small).**

1. Add `@fromorbit/ui` under the alias the README describes (`"@nt/ui": "npm:@fromorbit/ui@^0.2.0"`).
2. `styles/index.css`: replace `@import "./tokens.css"` and the `@theme inline` block with `@import "@nt/ui/fonts.css"`, `@import "@nt/ui/tokens.css"`, `@import "@nt/ui/theme.css"` and an `@source` on the package's `dist`. What only the app owns (body, window scrollbars, layout, the rich editor) stays in `index.css`.
3. `main.tsx`: drop the two Geist imports; `package.json`: drop `@fontsource-variable/geist` and `-geist-mono`.
4. Delete `styles/tokens.css`; move what its `tokens.test.ts` checks that the package does not (app-only tokens, if any remain) into a test of the app, and drop the rest, which the package now tests.
5. Optionally `data-product="orbit"` on `<html>` (the default already is Orbit).

**Step 2, the components (larger, separate).** Replace imports from `shared/ui/{primitives,overlays,patterns}` with `@nt/ui`, module by module, and delete the copies. The app's `ShortcutPort`, platform, theme and host go in through one `UiProvider`; the words through the `labels` props from the app's own catalogue.

**What changes for the app.** Everything that is `bg-accent` (the send button, a checked box, an on switch, the merged state of a pull request) turns from steel blue to Paper in dark and Midnight in light; selected words and links turn violet; the focus ring turns violet; the sidebar may take `--nt-sidebar-gradient`; the type turns Outfit and DM Mono; titles weigh 600.

**Risks.**

- The end-to-end tests that compare colours or take screenshots change all at once; take new references in the same PR and check them in both themes.
- Code of the app that assumed white on the accent (a `text-white` on `bg-accent`, an icon in `#fff`) now stands on Paper; search for it before the switch.
- The translucent window: the tint is now the Midnight or Paper frame at 60% and 70%; check it over the macOS material and on Windows.
- What the app paints outside the tokens (the terminal reads the ANSI tokens, Mermaid and Shiki read the page's tokens) follows; anything with a colour of its own (an icon, a canvas) does not.
- Orbit's site copies the app's `tokens.css` (`nt:sync`) for its workspace pages; once the app takes this package, the workspace of the site turns to the brand too, and the site's brand layer becomes largely redundant. The site decides that in a decision of its own.
- Step 2 can drift: the app's copies of the components have moved on since the package was cut. Compare each module before replacing it.
