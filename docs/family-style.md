# The family style (0.2.0)

From 0.2.0 the default look of `@fromorbit/ui` is the brand of the Orbit family (brand assets v1.0), the look Halo laid over the kit by hand and Orbit's site wears on its public pages. A host gets it by loading the three stylesheets; no override of its own is needed.

Photographs before and after, light and dark, are in [`screenshots/2026-10-28-family-style/`](screenshots/2026-10-28-family-style/): `before-*` is 0.1.0, `after-*` is 0.2.0 with the product Orbit, `after-halo-*` the same with `data-product="halo"`.

## What the default is now

| Part | Dark (`:root`) | Light (`[data-theme="light"]`) |
|---|---|---|
| Canvas | Midnight `#111936` | Paper `#F5F4F0` |
| Frame (window, app rail, top bar) | a step deeper, `#0C1229` | a step deeper than Paper, `#E9E8E2` |
| Side panel (the navigation of one app) | between frame and canvas, `#0F1630` | between frame and canvas, `#EFEEE9` |
| Card, menu, composer, plane | a step lighter, `#19223F` | white |
| Planes and lines | Mist at low strength | Midnight at low strength |
| Text / muted | Paper 15.7:1 / Slate 5.6:1 | Midnight 15.7:1 / deep Slate `#5A6185` 5.5:1 |
| Main button (`accent`) | Paper with Midnight words | Midnight with Paper words |
| Links, selected word (`accent-text`), focus ring | violet lifted to `#A3AAF5` (7.9:1) | violet `#5140F2` (5.7:1) |
| Status | the site's: green `#4CB782`, ochre `#E5A445`, red `#FF7B7B` | green `#1F7A4A`, ochre `#965A00`, red `#BF3030` |
| Sidebar of a host that keeps one | `--nt-sidebar-gradient`: a whisper of the Midnight gradient (not in the shell) | flat |

Type: Outfit (variable) for the interface, titles at 600 (`--nt-font-weight-heading`, Tailwind `font-heading`: `PageHeader`, `Dialog`, `ConfirmDialog`, `EmptyState`); DM Mono (400, 500) for code, paths and keys, never with a synthetic bold. Both ship with the package as `@fromorbit/ui/fonts.css`, which imports `@fontsource-variable/outfit` and `@fontsource/dm-mono` (OFL, regular dependencies of the package), so the font files travel in the host's bundle and nothing is fetched from another origin.

The fixed colours of the family are tokens of their own, the same in both themes: `--nt-brand-midnight`, `-midnight-top`, `-midnight-bottom`, `--nt-brand-gradient`, `-paper`, `-mist`, `-slate`, `-slate-deep`, `-violet`, and per product `--nt-brand-orbit` (orange), `--nt-brand-halo` (mint), `--nt-brand-fold` (lavender), `--nt-brand-lens` (gold `#FFB224`), `--nt-brand-trail` (the red of a recording, `#FF4D6D`) and `--nt-brand-comet` (sky blue, `#4DA3FF`).

`tokens.test.ts` computes every contrast requirement from the file, in both themes: text and muted at least 4.5:1 on the canvas, the frame, the side panel and a card, the status colours as words on the canvas and a card; secondary at least 7:1; the focus ring and a status glyph at least 3:1; `faint` stays for icons only (`tests/faint-text.test.ts`). The reduced-motion block of `theme.css` is unchanged and still covers every animation.

## The product's accent: the satellite

A product's own colour is never a role of the interface (never a word, a line, a plane or a button). It is the satellite: the dot in its symbol and wordmark, and at most a small dot that says "where you are now", always beside another sign (mint on Paper is 1.7:1).

- `--nt-satellite` holds it; Tailwind names it `satellite` (`bg-satellite`, `fill-satellite`).
- Without anything it is Orbit orange. `data-product="halo"` on an element (as a rule `<html>`) makes it mint for everything inside, `data-product="fold"` lavender, `"lens"` gold, `"trail"` red, `"comet"` sky blue, `data-product="orbit"` orange again. A satellite is never a role, a word or a plane: gold, red and blue are as much a dot as mint is.
- The product rules stand after the light block and the light block never repeats the satellite, so a `data-theme` further in cannot take it back.
- A host can also set `--nt-satellite` itself.

The gallery has a switch for it (Orbit, Halo, Fold, Lens, Trail, Comet): the dot beside "UI" in its head is the satellite.

## Density: chosen by the host

The kit has one set of control heights, a row height, and two densities. The host chooses one with `data-density` on an element (as a rule `<html>`), the way it chooses its product with `data-product`; everything inside follows.

| Token | Regular (no attribute, or `data-density="regular"`) | Compact (`data-density="compact"`) |
|---|---|---|
| `--nt-control-xs` | 24px | 20px |
| `--nt-control-sm` | 28px | 24px |
| `--nt-control-md` | 32px | 28px |
| `--nt-control-lg` | 40px | 32px |
| `--nt-row` | 36px | 32px |

- **On `<html>`, not on a container.** Menus, dialogs, popovers and toasts render through a portal into `body`, outside any container of the page. A `data-density` on a container shrinks the controls inside it, but the menu that opens from one of them stands at the regular height. Set it on `<html>`; use a container only for a part that never opens a layer.
- **Who uses what.** Orbit's desktop app is compact: a tool used all day at close range, in the manner of Linear or Codex. Orbit's website and the other pages of the family keep the regular heights and set nothing. `regular` exists for a part of a compact host that must stand at the regular size (a page of the website shown inside the app).
- **What follows.** Every control, row and head of the kit takes its height from `--nt-control-*` or `--nt-row`:
  - controls: `Button`, `IconButton`, `Input`, `Select`, `Chip`, `PickerPill`, `StepChips`, `Collapsible`, the days of `Calendar`, and a one-row `Textarea`, which stays level with an `Input` beside it;
  - rows on a control height: a row of a menu, of `SideNav`, of `SearchList`, of `SummaryBar`, a compact or dense row of `List`, a dense `SettingRow`, a row of `PropertyList`;
  - rows on `--nt-row` (36px, 32px compact): a row of `List`, a row of a `comfortable` menu and a tab of arranged `Tabs`;
  - heads and strips: `SectionHeading`, the group headings of `List`, `SearchList` and `MentionList`, the head of `SettingsGroup`, `PageHeader`, `PanelTabHeader`, `ShelfGroup`, the trigger of `Accordion`, and `Banner` (its minimum).

  `tests/control-heights.test.ts` fails when a component writes one of these heights as a Tailwind step (`h-8`, `h-9`) instead of the token.
- **What stays.** Glyphs and marks keep their size in either density: an icon, an avatar, a `Switch` (32×18) and a `Checkbox` (16px), the marks of a timeline. The `Switch` and the `Checkbox` reach a hit area of at least 24×24 (WCAG 2.5.8) through an invisible `before` around what is drawn, so the area holds in either density too. So do the rows of a settings card (`SettingRow`, `SettingSwitchRow`, the row of a `Field`: 48px with a description under the title), a row of `List` with a second line (48px), the rows of a table in a document (`Prose`), the items of `AppRail` (the shell chooses its own narrow rail), the title bar (`--nt-titlebar-height`, 40px) and the foot of the sidebar (`--nt-sidebar-foot-height`, 44px): none of them is a control height. A row of a menu keeps 44px under a coarse pointer.
- **A host never declares an `--nt-*` itself.** It chooses a theme (`data-theme`), a product (`data-product`) and a density (`data-density`); the numbers live in the kit, so the app and the site cannot drift apart. A density the kit lacks goes to the kit first.
- The density rules stand after the light block, which repeats no height, so a `data-theme` further in cannot take a density back (`tokens.test.ts`).

## The shell: three layers

The window of an app of the family has three layers, deepest first, the same order in both themes (`tokens.test.ts`):

1. **The frame** (`--nt-frame`, `bg-frame`): the window itself, the app rail (`AppRail`, `--nt-rail-width`) on the left and the top bar of 48px (`--nt-top-bar-height`) above. No line runs between the rail and the top bar; they are one surface.
2. **The side panel** (`--nt-side-panel`, `bg-side-panel`): the navigation of the open app (`SideNav`).
3. **The canvas** (`--nt-canvas`, `bg-canvas`): the content.

The side panel and the content float together as one plane on the frame: a 12px corner at the top start, a hairline in `border-strong` along the top and the start edge, and a hairline in `border` between the side panel and the content. The plane starts 1px of frame and its hairline after the rail and under the top bar's hairline; what a host lays over it (a toast, a layer of the side panel) reads `--nt-shell-plane-inset-start` (74px) and `--nt-shell-plane-inset-top` (49px) instead of adding them up. Both follow the rail of 72px; beside the narrow rail the plane starts 16px sooner. Each step between three layers is half as large as the one step between two (1.03:1 to 1.06:1), too small to be an edge on its own; that is why the floating plane has lines where two planes side by side have none.

- **`AppRail`**: 72px wide; each item 60px wide (6px of inset on either side) and at least 52px high, radius 8px, an icon of 20px over its label in 11px/500, never cut off ("Instellingen" is 55.6px in Outfit, more in a fallback font). At rest muted, under the pointer `surface-hover`, open on `row-active` in `fg` with `aria-current="page"`. Beside the open item stands its satellite, a dot of 4px (`data-product` on the item), never the plane or the words. The narrow rail of 56px (items of 44px) keeps only the icons, each named by its label and showing it in a tooltip; the host chooses it, the rail does not narrow itself. The rail scrolls in a short window, so its foot stays within reach. An item is a link (`href`, with `onNavigate` for a host that routes itself) or, with `onSelect`, a button of the same shape (help that opens a dialog). Its `ref` and every other prop reach that link or button, so an item without `onSelect` can be the `trigger` of a `DropdownMenu` (help as a menu): Radix then sets `aria-haspopup` and `aria-expanded` itself; a host that drives a menu or dialog of its own passes `aria-expanded`. With `shortcut` an item names its key in a tooltip beside it (the label and a `Kbd`, read through the `ShortcutPort` as `Button` does) and announces it as `aria-keyshortcuts`; on the wide rail that tooltip stands only when the port knows the key. The widths are tokens, `--nt-rail-width` (72px) and `--nt-rail-width-narrow` (56px), which the rail reads itself. Every icon and word is a prop: the kit draws no symbol of an app.
- **`SideNav`**: a head on a row of 32px, groups 24px apart (`--nt-space-group`) under the `SectionHeading` of every list (12px/500 muted), rows of 32px (`--nt-control-md`) and 13px, radius 8px, 1px apart. Its words stand 8px in (`px-2`), on the line of the group heading. At rest `secondary`, under the pointer `surface-hover`, open on `row-active` in `fg` at 500, no check beside it. A count or short value at the end in 11px DM Mono, muted, secondary on the open row.
- **One hover for the shell**: `surface-hover` on the rail and in the side panel alike. Both take `onIntent(href)` on hover and focus, so a host can prefetch what an item leads to.
- **The top bar** is the host's (it carries the window), built from parts of the kit. Its content starts at `--nt-top-bar-inset-start` (16px, 82px on macOS, after the traffic lights, in every state of the sidebar) and ends at `--nt-top-bar-inset-end` (at least 12px, and on Windows clear of the window controls). In the middle `SearchFieldButton`: a button in the shape of a search field ("Zoek of spring naar…" and ⌘K), on `--nt-control-sm`, a hairline in `border` on `surface`, the words muted, the key in one cap at the end; a button and not a field, since it opens the palette and takes no text. At the end the team as a quiet button with `TeamMark`, the 20px block of its first letter in `fg` on `bg-mark` (`ProjectMark` a step larger and at full strength), then the account.

**A status on the frame is a glyph, never a word.** The status colours as words are tested on the canvas, the side panel and a card; on the light frame the green of a word reaches only 4.3:1. On the rail or the top bar a state is a `StatusMark` or a dot beside a word in `fg`, `secondary` or `muted`. **The side panel is a ground for a status word**: green reaches 4.6:1 on it in light, ochre 4.8:1 and red 4.9:1 (`tokens.test.ts`), so a row of `SideNav` may say "Mislukt" in red.

The canvas keeps everything that floats on it white in light: a card, a menu, the composer, a plane of its own (`--nt-plane`). The frame of 0.4.0 was white too; from the shell it is a step below Paper again, so the three layers do not turn round. A host that kept its own white column on the frame (a sidebar of its own), or that relied on the hairline beside it (`shadow-frame-edge`, still the edge in light), checks it against the deeper frame.

`--nt-frame-edge` has no variant for the side panel, on purpose: it stays the hairline in light, the edge of a host's own column on the frame (the sidebar of the desktop app), which still meets the canvas there without a plane between them; the shell itself draws its lines from `border-strong` and `border`.

On a translucent window (`data-translucent="true"`) the side panel takes a tint of its own, as the canvas beside it does: a host that paints it with `--nt-side-panel-background` instead of `bg-side-panel` lets the material through the whole floating plane rather than through the content alone. The floor follows the rule of the sidebar and the panel: the lowest strength at which `text`, `secondary` and `muted` keep 4.5:1 over the worst material, the side panel counted alone (92% in dark, muted 4.6:1; 94% in light, muted 4.56:1; `tokens.test.ts`). `--nt-side-panel` and `bg-side-panel` stay opaque, so nothing changes for a host that does not opt in. A status word on the tinted side panel holds AA only over a material lighter than black: in light at 94% over black, green reaches 4.0:1. On a translucent window a state in the side panel is better a glyph beside a word in `fg`.

## Status marks (the minor after 0.2.0)

What runs on its own (a service, an app, a space) shows its state with `StatusMark`: a circle `running`, a triangle `fault`, a diamond `blocked`, a square `stopped`, each a flat fill in its status colour with a soft glow of that colour around it. The shape is the information; the glow only makes it pleasant. A chat keeps `StatusShape`, whose seven states and quiet outlines belong to a column read all day.

| Part | Dark | Light |
|---|---|---|
| Running (`--nt-status-run`) | mint `#2FD3A6`, a dot like the satellite | the status green `--nt-success` |
| Fault (`--nt-status-fail`) | `--nt-danger` | `--nt-danger` |
| Blocked (`--nt-status-block`) | `--nt-attention` | `--nt-attention` |
| Stopped (`--nt-status-stop`) | muted (Slate) | deep Slate |
| Glow (`--nt-status-glow`) | 1 | 0.22 |

The glow is `0 0 6px 1px` of the colour at 55% (times the strength); the triangle, a softer one with rounded corners whose ink is as high as the circle's, takes it as a `drop-shadow` of 4px at 60% on the outer element, because its `clip-path` cuts a `box-shadow` off. The names are the ones Halo gives its own marks (V-691 in `halo-v2`), with the kit's `nt-` before them. A host may set the glow on an element to calm the marks inside it. Every colour reaches 3:1 on the canvas, the frame, the side panel and a card, as a status glyph must (`tokens.test.ts`). The marks stand still under the pointer.

## Rhythm (the minor after the status marks)

The same handful of distances, sizes and emphases in every component, so a screen built from them reads as one thing. Each rule comes from one of the [Laws of UX](https://lawsofux.com); the tokens hold the numbers (`tokens.css`, tested in `tokens.test.ts`). A new component takes these tokens and classes rather than numbers of its own.

| Rule | In the kit | Law |
|---|---|---|
| **Spacing: one 4px scale, three distances that mean something.** Items of a group 8px apart (`--nt-space-item`), groups 24px (`--nt-space-group`), sections 40px (`--nt-space-section`). The space between groups is at least three times the space inside one. | `List` groups `mt-6`, `SearchList` groups `mt-3`, `PropertyList` groups `pt-4` | Proximity, Chunking |
| **A group of rows is an outlined region: a hairline and no fill, in both themes. A card that stands as an object of its own keeps its plane.** `SettingsGroup` draws its rows in a hairline of `border` with 12px corners (`rounded-lg`), a line between the rows and no tint or shadow; never a box inside a box. A card that is a thing in itself (`PlanCard`, `FindingCard`, `StatTile`, `SummaryBar`, a code block) keeps its plane: a tint in dark, white with a hairline edge (`shadow-plane`) in light, never a grey tinted panel. A divider only runs between rows that the eye follows across (settings rows, table rows). No line runs between two planes that lie side by side (a frame and a canvas next to each other): their brightness is the edge. The floating plane of the shell is the exception, because each of its steps is half as large: a hairline in `border-strong` above it and at its start, one in `border` between the side panel and the content, none between the rail and the top bar (see "The shell"). In light the regions on the canvas are white (a card, a code block, a dialog) on a page of Paper, a touch off-white, and the small difference, a hairline or the soft shadow of `shadow-plane`, parts them; never a grey-filled panel. | `SettingsGroup`, `SummaryBar`, `Banner`, `Tag`, code blocks, the foot of `Dialog` | Common Region, Uniform Connectedness, Prägnanz |
| **Type: five sizes, three weights.** 11px (meta, a timestamp, a count), 12px (secondary text, labels of groups, descriptions), 13px (the body of the interface: rows, menus, fields), 15px (the title of a dialog, a card or an empty state), 20px (the title of a page, and of the `hero` form of `EmptyState`, the first impression of a screen). 400 for text, 500 for a label or a chosen row, 600 (`font-heading`) for titles. Group labels are sentence case, never spaced capitals. The initials of a mark (`Avatar`, `ProjectMark`, `TeamMark`) are a glyph, not a step of the scale. **One allowed exception:** the figure of a dashboard tile (`StatTile`) is 26px (600, tabular, a 32px line), so the number a tile exists for is the first thing read, above the page title; no other text takes 26px. | `SectionHeading`, `Dialog`, `EmptyState`, `PageHeader` | Similarity, Aesthetic–Usability |
| **Radius: one family, nested.** 4px (`sm`: a tag, a key, a mark), 8px (`md`: a control, a row), 12px (`lg`: a card, a menu, a dialog). Inner radius = outer radius − the inset between them: a 12px menu with a 4px inset holds 8px rows. `rounded-full` only for what is round by meaning. | `--nt-radius-*`, every component | Prägnanz |
| **Density: controls on four heights.** 24px (`xs`, a quiet footer button), 28px (`sm`, a dense toolbar), 32px (`md`, the default control and the row of a menu or picker), 40px (`lg`, a prominent action, a banner, the strip of a page or panel head). The title bar has its own height (`--nt-titlebar-height`) and keeps it in every density. A compact host lowers each control a step (see "Density: chosen by the host"). A row of a navigation list is 36px (`--nt-row`, 32px compact); a row of the side panel of the shell (`SideNav`) is 32px, the default control. A pointer target is at least 28px, 32px by default. Padding grows with the height (10/12/16px). | `--nt-control-*`, `Button`, `List`, `SearchList`, `DropdownMenu` | Fitts |
| **Every action is a framed button.** An action in a row, a card's head or a banner is a real button with a visible frame (`secondary`, 28 or 32px high), its edge on the content column; or the whole row is the link. No text-only or ghost action that floats; `ghost` stays for icon buttons and toggles in a toolbar. | `Button` `secondary`, `SummaryBar`, `Panel` actions in the demos | Jakob, Signifiers (Affordance) |
| **Emphasis: one per view.** One filled main button per view; the place you are is shown once (the row's fill and full-strength text, no check beside it); a count, a time or a path is muted; the accent violet is for links and focus only. Status speaks through its shape and colour, not through a frame. The one framed status is a `Banner` in its `prose` form, a sentence to read: the words in the text colour on the plane of a card (white in light), so the tone moves to the icon and the hairline. | `SearchList` (`checkSlot={false}` in navigation), `Tag`, `Banner` | Von Restorff, Serial Position |
| **Fewer choices in sight.** Actions of a row appear on hover or focus; long groups fold; settings come in named groups of a handful of rows. | `List` groups, `RoomyListRow`, `SettingRow`, `SettingsGroup` | Hick, Miller, Tesler |
| **A setting that is on or off is one row, and the row is its label.** The title (13px/400) and its explanation (12px `muted`, wrapping, never cut) on the left, quiet meta and the switch on the right, centred at every width; a click anywhere in the row switches, and the switch is the one tab stop. The switch is 32×18: off an outline in the edge of an empty box (`control-border`) with a muted thumb, on the neutral `accent` with a thumb in `accent-fg`; never violet, never a product's colour. | `SettingSwitchRow`, `Switch` | Fitts, Common Region |
| **Familiar shapes.** A field is a framed plane (only a column of fields in a table drops the frame, `Input` `tint`, and keeps the plane and the focus ring), a button looks pressable, a menu opens at its trigger, the sidebar is a column of places with the current one filled. | `Input`, `Select`, `Button`, `DropdownMenu` | Jakob |
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
- The translucent window: the window takes the Midnight or Paper frame at 60%; the sidebar and the panel keep a floor of opacity (dark 90% and 93%, light 96% and 92%), and the side panel of the shell through `--nt-side-panel-background` (dark 92%, light 94%), so their words hold 4.5:1 over any material. Check it over the macOS material and on Windows.
- What the app paints outside the tokens (the terminal reads the ANSI tokens, Mermaid and Shiki read the page's tokens) follows; anything with a colour of its own (an icon, a canvas) does not.
- Orbit's site copies the app's `tokens.css` (`nt:sync`) for its workspace pages; once the app takes this package, the workspace of the site turns to the brand too, and the site's brand layer becomes largely redundant. The site decides that in a decision of its own.
- Step 2 can drift: the app's copies of the components have moved on since the package was cut. Compare each module before replacing it.
