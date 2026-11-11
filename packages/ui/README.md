# @fromorbit/ui

The component library of Orbit: buttons, fields, dialogs, menus, lists and the design tokens, in the style of the Orbit family (Midnight and Paper, Outfit and DM Mono; see [`docs/family-style.md`](../../docs/family-style.md)). The library has no i18n: text comes in as props, and what the app provides (shortcuts, platform, theme, host) comes in through a single `UiProvider`.

Every story is online at <https://fromorbit.github.io/orbit-ui-docs/>.

## Install

The package is published on GitHub Packages. GitHub's npm registry asks for a token even for a public package: create a personal access token (classic) with `read:packages`, put it in `NODE_AUTH_TOKEN`, and add an `.npmrc` beside your `package.json`:

```
@fromorbit:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Then install the library with its peers:

```sh
npm install @fromorbit/ui @fromorbit/doc-view react react-dom radix-ui lucide-react \
  @pierre/diffs @pierre/trees react-markdown remark-gfm
```

`@fromorbit/doc-view` brings peers of its own (`shiki`, `@shikijs/langs`, `unified`, `remark-parse`, `remark-frontmatter`); a package manager that does not install peers automatically needs those as well.

**The alias.** To import the library under a short name, install it under an alias; the examples below use `@nt/ui`:

```json
"@nt/ui": "npm:@fromorbit/ui@^0.2.0"
```

```ts
import { Button } from '@nt/ui'
import '@nt/ui/fonts.css'
import '@nt/ui/tokens.css'
import '@nt/ui/theme.css'
```

**Tailwind and styling.** The components carry Tailwind classes (Tailwind 4). The consumer's Tailwind scans the built library with `@source`, which is why the build leaves every class literal. The fonts, then Tailwind, then two stylesheets, in this order:

```css
@import '@nt/ui/fonts.css';
@import 'tailwindcss';
@import '@nt/ui/tokens.css';
@import '@nt/ui/theme.css';
@source '../node_modules/@nt/ui/dist';
```

- `fonts.css`: Outfit and DM Mono, from the package's own dependencies (`@fontsource-variable/outfit`, `@fontsource/dm-mono`), so the font files go into the consumer's bundle and nothing is fetched from another origin. Optional for a consumer that loads the same faces itself.
- `tokens.css`: the design tokens as variables (`--nt-accent`, …), per theme: dark on `:root`, light where an element carries `data-theme="light"`. The fixed colours of the family are `--nt-brand-*`. In light the regions are white on a page of Paper: a region of its own takes `bg-plane shadow-plane` (a tint without an edge in dark; a `ChoiceCard` is one too), a sidebar's inner edge `shadow-frame-edge` (nothing in dark). The shell has three layers in both themes: the frame (`bg-frame`: the window, the app rail and the top bar), the side panel (`bg-side-panel`) and the canvas (`bg-canvas`), deepest first; see `docs/family-style.md`. The one chosen card among cards of one kind (the current `PlanCard`) takes `from-lift to-lift shadow-lift` and `text-lift-quiet` for its quiet words: a tint in dark, the same white as its neighbours with a firmer hairline in light, never a grey fill.
- `theme.css`: everything else the components need: the `@theme inline` block that maps the tokens to Tailwind names (`bg-accent`, `text-attention`, `rounded-md`, `shadow-menu`, …), the classes components carry (`no-drag`, `drag-region`, `nt-titlebar-strip`, the status mark `nt-status-mark`) and the animations (`nt-spin`, `nt-shape-spin`, `nt-shimmer`, `nt-fade-in`, `nt-wave`, their keyframes and the `prefers-reduced-motion` block). `theme.css` does not import Tailwind or `tokens.css` itself, so nothing loads twice.

The `@source` path is relative to the consumer's CSS file. Whatever concerns only an app (`body`, the window scrollbars, the layout) the consumer writes itself.

**The product.** A product's own colour is only its satellite (`--nt-satellite`, Tailwind `satellite`): Orbit orange by default, Halo mint with `data-product="halo"` on `<html>`, Fold lavender with `data-product="fold"`. It is never a role: the main button is monochrome, links and the focus ring are violet, whatever the product.

**The density.** `data-density="compact"` on `<html>` lowers every control a step (`--nt-control-*`: 20, 24, 28 and 32px instead of 24, 28, 32 and 40px) for a tool used all day, the desktop app; without it, as on the website, the heights stay regular. A host chooses a density, never its own `--nt-*`. See `docs/family-style.md`.

**The app through `UiProvider`.** Shortcuts, platform, theme, the locale for numbers and the hosted layers come in through a single provider; without it everything works with a neutral default (no key caps, platform `mac`):

```tsx
import { UiProvider } from '@nt/ui'

<UiProvider shortcuts={shortcutPort} platform="windows" locale="nl-NL" host={{ surfaces }}>
  <App />
</UiProvider>
```

To get completion for your shortcut ids, fill `ShortcutIds` with declaration merging, under the name you import the library by:

```ts
declare module '@nt/ui' {
  interface ShortcutIds {
    'chat.send': true
  }
}
```

**Text as props.** The library contains no text. A component with one text takes a prop (`confirmLabel`, `cancelLabel`), a component with more takes a `labels` object with an exported type (`ProseLabels`, `SearchListLabels`, …); composed texts are functions (`noResults(query)`). The consumer fills them from its own catalogue.

**Gallery and tests.** `@nt/ui/gallery` provides `stories` (every story, sorted), `collectStories` to sort your own stories in with them, and `galleryLabels`: the Dutch words the stories use. `@nt/ui/testing` provides `renderWithUi` (render inside a `UiProvider`), `fakeShortcuts`, `uiWrapper`, `createFakeHost` and `HEADING_START_CASES` (the heading positions the `Prose` test walks, to keep a consumer's own copy in step).

## Entry points

| Export | Contents |
|---|---|
| `@fromorbit/ui` | every component and `UiProvider` |
| `@fromorbit/ui/tokens.css` | the design tokens |
| `@fromorbit/ui/theme.css` | the Tailwind names of the tokens, and the classes and animations of the components |
| `@fromorbit/ui/fonts.css` | Outfit and DM Mono, self-hosted through the package's dependencies |
| `@fromorbit/ui/gallery` | `stories`, `collectStories`, `galleryLabels` and the `Story` type, for the consumer's gallery |
| `@fromorbit/ui/testing` | `renderWithUi` and the other helpers for a consumer's tests |

Peer dependencies: `react`, `react-dom`, `radix-ui` (`~1.6.7`: two tests fail under 1.7 and 1.8), `lucide-react`, `@pierre/diffs`, `@pierre/trees`, `react-markdown`, `remark-gfm` and `@fromorbit/doc-view` (for `Prose` and the Shiki bundle); optionally `@testing-library/react` (for `./testing`). `class-variance-authority`, `@fontsource-variable/outfit` and `@fontsource/dm-mono` are regular dependencies.

## Layout

| Folder | Role |
|---|---|
| `src/primitives/` | the smallest building blocks: Accordion, Avatar, AvatarGroup, BrandIcon, Button, Calendar, Checkbox, CheckboxField, CheckboxGroup, ChoiceRow, CiteRow, Collapsible, Field, FileInput, Form, FormField, Icon, IconButton, IconSegmentedControl, Input, Kbd, LevelBars, NumberField, OrbitWordmark, OtpInput, Pill, ProgressBar, ProgressMeter, ProjectMark, RadioGroup, ResizeHandle, ScrollArea, SecretField, SectionHeading, SegmentedControl, Select, Separator, ShareBar, Skeleton, Slider, Spinner, StatusMark, StepChips, Switch, Tabs, Tag, Textarea, Thumbnail, Timeline, Toggle, TrendBadge; plus `shortcut` (the shortcut grammar) and `control-size` |
| `src/overlays/` | what floats above the page: Combobox (and MultiCombobox), ConfirmDialog, ContextMenu, DatePicker, Dialog, DropdownMenu, Popover, Sheet, Spotlight, Toast, Tooltip; plus `panel`, `portal` and `menu-rows` (the rows both menus share: the keyboard caret is a tint and a 2px bar of the focus colour, a row's key reaches a screen reader as `aria-keyshortcuts` from the `ShortcutPort`, a row's hint opens in a `Tooltip` beside the row, not over its neighbours); imports only from `primitives/` |
| `src/patterns/` | composed building blocks: AppRail (and AppRailItem), Banner, Chart (and Sparkline), ChartFigure (and ChartSvg, with the model in `chart-model`), ChatMessage (and ChatLog), Chip, ChipListField, ChoiceCard, ChoiceCards, Composer, CopyButton, DataTable, CreditCardField (and CreditCardVisual, with the rules in `credit-card`), EditableTable, EmptyState, ErrorState, FileDrop, FileLink, FindingCard, GitHubLink, HostedSurface, List, MentionList, PageHeader, Pagination, PanelTabHeader, PathField, PathLabel, PickerPill, PierreDiff (and PierreFile), PierreFileIcon, PierreTree, PlanCard (and PlanCards), PropertyList, Prose, Rail, RelativeTime, RoomyListRow, Scrubber (and ScrubberMark), SearchList, SelectionBar, SettingFoldRow, SettingRow, SettingsGroup, SeverityBar, ShelfGroup, Shimmer, SideNav (and SideNavGroup, SideNavLink), StackedRow, StatTile, StatusLine, StatusShape, SummaryBar; imports from both layers below |
| `src/provider/` | `UiProvider` and its ports (`ShortcutPort`, `HostPort`, platform, theme) |
| `src/types.ts` | our own structural types for the data components draw |
| `src/gallery/`, `src/testing/` | the `./gallery` and `./testing` entries |
| `src/tokens.css` | the design tokens |
| `src/theme.css` | the Tailwind mapping, the global classes and the animations |
| `src/fonts.css` | the fonts of the family |
| `tests/` | the boundaries, the guard tests and the tests against the build (exports, a consumer that renders, a consumer's types) |
| `docs-site/` | the component site (Vite, React, Tailwind); it builds into `docs-site/dist` and is not part of the npm package |
| `scripts/` | publishing the component site |

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
