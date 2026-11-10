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

## Status marks (the minor after 0.2.0)

What runs on its own (a service, an app, a space) shows its state with `StatusMark`: a circle `running`, a triangle `fault`, a diamond `blocked`, a square `stopped`, each a flat fill in its status colour with a soft glow of that colour around it. The shape is the information; the glow only makes it pleasant. A chat keeps `StatusShape`, whose seven states and quiet outlines belong to a column read all day.

| Part | Dark | Light |
|---|---|---|
| Running (`--nt-status-run`) | mint `#2FD3A6`, a dot like the satellite | the status green `--nt-success` |
| Fault (`--nt-status-fail`) | `--nt-danger` | `--nt-danger` |
| Blocked (`--nt-status-block`) | `--nt-attention` | `--nt-attention` |
| Stopped (`--nt-status-stop`) | muted (Slate) | deep Slate |
| Glow (`--nt-status-glow`) | 1 | 0.22 |

The glow is `0 0 6px 1px` of the colour at 55% (times the strength); the triangle, a softer one with rounded corners whose ink is as high as the circle's, takes it as a `drop-shadow` of 4px at 60% on the outer element, because its `clip-path` cuts a `box-shadow` off. The names are the ones Halo gives its own marks (V-691 in `halo-v2`), with the kit's `nt-` before them. A host may set the glow on an element to calm the marks inside it. Every colour reaches 3:1 on the canvas, the frame and a card, as a status glyph must (`tokens.test.ts`). The marks stand still under the pointer.

## Rhythm (the minor after the status marks)

The same handful of distances, sizes and emphases in every component, so a screen built from them reads as one thing. Each rule comes from one of the [Laws of UX](https://lawsofux.com); the tokens hold the numbers (`tokens.css`, tested in `tokens.test.ts`). A new component takes these tokens and classes rather than numbers of its own.

| Rule | In the kit | Law |
|---|---|---|
| **Spacing: one 4px scale, three distances that mean something.** Items of a group 8px apart (`--nt-space-item`), groups 24px (`--nt-space-group`), sections 40px (`--nt-space-section`). The space between groups is at least three times the space inside one. | `List` groups `mt-6`, `SearchList` groups `mt-3`, `PropertyList` groups `pt-4` | Proximity, Chunking |
| **A group of rows is an outlined region: a hairline and no fill, in both themes. A card that stands as an object of its own keeps its plane.** `SettingsGroup` draws its rows in a hairline of `border` with 12px corners (`rounded-lg`), a line between the rows and no tint or shadow; never a box inside a box. A card that is a thing in itself (`PlanCard`, `FindingCard`, `StatTile`, `SummaryBar`, a code block) keeps its plane: a tint in dark, white with a hairline edge (`shadow-plane`) in light, never a grey tinted panel. A divider only runs between rows that the eye follows across (settings rows, table rows). In dark the plane is a tint and no line runs between the frame and the canvas: their brightness is the edge. In light the regions are white (the sidebar, a card, a group, a code block, a dialog) on a page of Paper, a touch off-white, and the small difference, a hairline (`shadow-frame-edge` beside a sidebar) or the soft shadow of `shadow-plane` parts them; never a grey-filled panel. | `SettingsGroup`, `SummaryBar`, `Banner`, `Tag`, code blocks, the foot of `Dialog` | Common Region, Uniform Connectedness, Prägnanz |
| **Type: five sizes, three weights.** 11px (meta, a timestamp, a count), 12px (secondary text, labels of groups, descriptions), 13px (the body of the interface: rows, menus, fields), 15px (the title of a dialog, a card or an empty state), 20px (the title of a page). 400 for text, 500 for a label or a chosen row, 600 (`font-heading`) for titles. Group labels are sentence case, never spaced capitals. The initials of a mark (`Avatar`, `ProjectMark`) are a glyph, not a step of the scale. **One allowed exception:** the figure of a dashboard tile (`StatTile`) is 26px (600, tabular, a 32px line), so the number a tile exists for is the first thing read, above the page title; no other text takes 26px. | `SectionHeading`, `Dialog`, `EmptyState`, `PageHeader` | Similarity, Aesthetic–Usability |
| **Radius: one family, nested.** 4px (`sm`: a tag, a key, a mark), 8px (`md`: a control, a row), 12px (`lg`: a card, a menu, a dialog). Inner radius = outer radius − the inset between them: a 12px menu with a 4px inset holds 8px rows. `rounded-full` only for what is round by meaning. | `--nt-radius-*`, every component | Prägnanz |
| **Density: controls on four heights.** 24px (`xs`, a quiet footer button), 28px (`sm`, a dense toolbar), 32px (`md`, the default control and the row of a menu or picker), 40px (`lg`, a prominent action, a banner, the title bar). A row of a navigation list is 36px. A pointer target is at least 28px, 32px by default. Padding grows with the height (10/12/16px). | `--nt-control-*`, `Button`, `List`, `SearchList`, `DropdownMenu` | Fitts |
| **Every action is a framed button.** An action in a row, a card's head or a banner is a real button with a visible frame (`secondary`, 28 or 32px high), its edge on the content column; or the whole row is the link. No text-only or ghost action that floats; `ghost` stays for icon buttons and toggles in a toolbar. | `Button` `secondary`, `SummaryBar`, `Panel` actions in the demos | Jakob, Signifiers (Affordance) |
| **Emphasis: one per view.** One filled main button per view; the place you are is shown once (the row's fill and full-strength text, no check beside it); a count, a time or a path is muted; the accent violet is for links and focus only. Status speaks through its shape and colour, not through a frame. | `SearchList` (`checkSlot={false}` in navigation), `Tag`, `Banner` | Von Restorff, Serial Position |
| **Fewer choices in sight.** Actions of a row appear on hover or focus; long groups fold; settings come in named groups of a handful of rows. | `List` groups, `RoomyListRow`, `SettingRow`, `SettingsGroup` | Hick, Miller, Tesler |
| **A setting that is on or off is one row, and the row is its label.** The title (13px/400) and its explanation (12px `muted`, wrapping, never cut) on the left, quiet meta and the switch on the right, centred at every width; a click anywhere in the row switches, and the switch is the one tab stop. The switch is 32×18: off an outline in the edge of an empty box (`control-border`) with a muted thumb, on the neutral `accent` with a thumb in `accent-fg`; never violet, never a product's colour. | `SettingSwitchRow`, `Switch` | Fitts, Common Region |
| **Familiar shapes.** A field is a framed plane, a button looks pressable, a menu opens at its trigger, the sidebar is a column of places with the current one filled. | `Input`, `Select`, `Button`, `DropdownMenu` | Jakob |
| **Motion: at once, and calm.** Hover and press answer in 120ms (`--nt-duration-fast`), a layer fades in 180ms (`--nt-duration`) on one curve (`--nt-ease`); nothing moves its own height; `prefers-reduced-motion` turns every animation off. | every `transition`, `.nt-fade-in` | Doherty threshold |
| **Progress that shows, and a good end.** What runs shows its state (`StatusMark`, `StepChips`, `ProgressMeter`); an empty or finished state is a calm title, a sentence and one action. | `EmptyState`, `StepChips` | Goal-Gradient, Zeigarnik, Peak–End |

`packages/ui/tests/rhythm.test.ts` holds four of these rules for every component, story and demo of the gallery (`docs-site/` too): text only in the five sizes (the initials of a mark and the 26px figure of `StatTile` excepted), corners only in the three radii (no `rounded-2xl` or `3xl`), no duration that is not a token, and no spaced capitals. A text that takes no size of its own inherits the browser's 16px, off the scale: a label in a row, a box's option or a dialog's body names its 13px itself. `packages/ui/docs-site/src/TypeSize.test.tsx` holds that one: it draws every state of every story and every demo and walks up from each text to the size it inherits, so a `Field` label or a `RadioGroup` option without its own 13px fails the check. The demos keep to the scale as well: a hero or a marketing headline is a 20px page title, not a size of its own.

Contrast stays as before: every pair in `tokens.test.ts` still reaches AA, and the tints that replaced borders were chosen so that the words on them do too. Three pairs were added: the edge of an empty box (`--nt-control-border`, 3:1 against every plane, WCAG 1.4.11), the words on a success tag (`--nt-success-subtle`, a tint like attention's and danger's, so every tone of `Tag` is a plane without a frame), and the meta of a lit row: muted Slate stays 3:1 under the caret row's words, so on `bg-row-active` or a current row (`aria-current`) the meta steps up to secondary (`theme.css`). Code takes its colours from the `--nt-code-token-*` tokens in `PierreDiff` and `PierreFile` too, a step darker in light so they keep AA on the tint of a changed line.

The gallery speaks Dutch throughout: the captions of the states, the sample data, and the groups (Bouwstenen, Lagen, Patronen). One word per thing across stories and demos: *gesprek* (not chat), *samenvoegen* (not overnemen), the roles Eigenaar, Beheerder, Lid and Gast, and one relative time ("5 min", "2 u", "3 d", "4 wk").

## Breaking changes of 0.2.0

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
