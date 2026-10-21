# @fromorbit/ui

The component library of Orbit: buttons, fields, dialogs, menus, lists and the design tokens. The library has no i18n: text comes in as props, and what the app provides (shortcuts, platform, theme, host) comes in through a single `UiProvider`.

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
"@nt/ui": "npm:@fromorbit/ui@^0.1.0"
```

```ts
import { Button } from '@nt/ui'
import '@nt/ui/tokens.css'
import '@nt/ui/theme.css'
```

**Tailwind and styling.** The components carry Tailwind classes (Tailwind 4). The consumer's Tailwind scans the built library with `@source`, which is why the build leaves every class literal. Two stylesheets, in this order, after Tailwind:

```css
@import 'tailwindcss';
@import '@nt/ui/tokens.css';
@import '@nt/ui/theme.css';
@source '../node_modules/@nt/ui/dist';
```

- `tokens.css`: the design tokens as variables (`--nt-accent`, …), per theme.
- `theme.css`: everything else the components need: the `@theme inline` block that maps the tokens to Tailwind names (`bg-accent`, `text-attention`, `rounded-md`, `shadow-menu`, …), the classes components carry (`no-drag`, `drag-region`, `nt-titlebar-strip`) and the animations (`nt-spin`, `nt-shape-spin`, `nt-shimmer`, `nt-fade-in`, `nt-wave`, their keyframes and the `prefers-reduced-motion` block). `theme.css` does not import Tailwind or `tokens.css` itself, so nothing loads twice.

The `@source` path is relative to the consumer's CSS file. Whatever concerns only an app (`body`, the window scrollbars, the layout) the consumer writes itself.

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
| `@fromorbit/ui/gallery` | `stories`, `collectStories`, `galleryLabels` and the `Story` type, for the consumer's gallery |
| `@fromorbit/ui/testing` | `renderWithUi` and the other helpers for a consumer's tests |

Peer dependencies: `react`, `react-dom`, `radix-ui` (`~1.6.7`: two tests fail under 1.7 and 1.8), `lucide-react`, `@pierre/diffs`, `@pierre/trees`, `react-markdown`, `remark-gfm` and `@fromorbit/doc-view` (for `Prose` and the Shiki bundle); optionally `@testing-library/react` (for `./testing`). `class-variance-authority` is a regular dependency.

## Layout

| Folder | Role |
|---|---|
| `src/primitives/` | the smallest building blocks: Avatar, BrandIcon, Button, Checkbox, ChoiceRow, CiteRow, Collapsible, Field, FileInput, Icon, IconButton, IconSegmentedControl, Input, Kbd, LevelBars, NumberField, OrbitWordmark, Pill, ProgressMeter, ProjectMark, RadioGroup, ResizeHandle, ScrollArea, SecretField, SectionHeading, SegmentedControl, Select, Separator, Skeleton, Spinner, StepChips, Switch, Tabs, Tag, Textarea, Thumbnail, Toggle; plus `shortcut` (the shortcut grammar) and `control-size` |
| `src/overlays/` | what floats above the page: ConfirmDialog, Dialog, DropdownMenu, Popover, Spotlight, Toast, Tooltip; plus `panel` and `portal`; imports only from `primitives/` |
| `src/patterns/` | composed building blocks: Banner, Chip, ChipListField, ChoiceCard, ChoiceCards, CopyButton, EditableTable, EmptyState, ErrorState, FileLink, GitHubLink, HostedSurface, List, MentionList, PageHeader, PanelTabHeader, PathField, PathLabel, PickerPill, PierreDiff (and PierreFile), PierreFileIcon, PierreTree, PropertyList, Prose, Rail, RelativeTime, RoomyListRow, SearchList, SelectionBar, SettingFoldRow, SettingRow, SettingsGroup, ShelfGroup, Shimmer, StackedRow, StatusLine, StatusShape, SummaryBar; imports from both layers below |
| `src/provider/` | `UiProvider` and its ports (`ShortcutPort`, `HostPort`, platform, theme) |
| `src/types.ts` | our own structural types for the data components draw |
| `src/gallery/`, `src/testing/` | the `./gallery` and `./testing` entries |
| `src/tokens.css` | the design tokens |
| `src/theme.css` | the Tailwind mapping, the global classes and the animations |
| `tests/` | the boundaries, the guard tests and the tests against the build (exports, a consumer that renders, a consumer's types) |
| `docs-site/` | the component site (Vite, React, Tailwind); it builds into `docs-site/dist` and is not part of the npm package |
| `scripts/` | publishing the component site |

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
