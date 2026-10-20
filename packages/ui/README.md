# @fromorbit/ui

De componentenbibliotheek van Orbit: knoppen, velden, dialogen, menu's, lijsten en de ontwerpwaarden. De library kent geen i18n: teksten komen als props, en wat de app levert (sneltoetsen, platform, thema, host) komt via één `UiProvider`.

Alle verhalen staan online op <https://fromorbit.github.io/orbit-ui-docs/>.

## Installeren

Het pakket staat op GitHub Packages. Het npm-register van GitHub vraagt ook voor een openbaar pakket om een token: maak een personal access token (classic) met `read:packages`, zet hem in `NODE_AUTH_TOKEN`, en leg naast je `package.json` een `.npmrc`:

```
@fromorbit:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Installeer daarna de library met zijn peers:

```sh
npm install @fromorbit/ui @fromorbit/doc-view react react-dom radix-ui lucide-react \
  @pierre/diffs @pierre/trees react-markdown remark-gfm
```

`@fromorbit/doc-view` brengt zijn eigen peers mee (`shiki`, `@shikijs/langs`, `unified`, `remark-parse`, `remark-frontmatter`); een package manager die peers niet zelf installeert, heeft die ook nodig.

**De alias.** Wie de library onder een korte naam wil importeren, zet hem onder een alias; de voorbeelden hieronder gebruiken `@nt/ui`:

```json
"@nt/ui": "npm:@fromorbit/ui@^0.1.0"
```

```ts
import { Button } from '@nt/ui'
import '@nt/ui/tokens.css'
import '@nt/ui/theme.css'
```

**Tailwind en styling.** De componenten dragen Tailwind-klassen (Tailwind 4). De Tailwind van de afnemer scant de gebouwde library met `@source`; de build laat daarom elke klasse letterlijk staan. Twee stylesheets, in deze volgorde, na Tailwind:

```css
@import 'tailwindcss';
@import '@nt/ui/tokens.css';
@import '@nt/ui/theme.css';
@source '../node_modules/@nt/ui/dist';
```

- `tokens.css`: de ontwerpwaarden als variabelen (`--nt-accent`, …), per thema.
- `theme.css`: wat de componenten verder nodig hebben: het `@theme inline`-blok dat de tokens aan Tailwind-namen koppelt (`bg-accent`, `text-attention`, `rounded-md`, `shadow-menu`, …), de klassen die componenten dragen (`no-drag`, `drag-region`, `nt-titlebar-strip`) en de animaties (`nt-spin`, `nt-shape-spin`, `nt-shimmer`, `nt-fade-in`, `nt-wave`, hun keyframes en het `prefers-reduced-motion`-blok). `theme.css` importeert Tailwind en `tokens.css` niet zelf, zodat niets twee keer laadt.

Het pad van `@source` is relatief aan het CSS-bestand van de afnemer. Wat alleen een app aangaat (`body`, de scrollbalken van het venster, de indeling) schrijft de afnemer zelf.

**De app via `UiProvider`.** Sneltoetsen, platform, thema, taal voor getallen en de gehoste lagen komen via één provider; zonder provider werkt alles met een neutrale standaard (geen toetskapjes, platform `mac`):

```tsx
import { UiProvider } from '@nt/ui'

<UiProvider shortcuts={shortcutPort} platform="windows" locale="nl-NL" host={{ surfaces }}>
  <App />
</UiProvider>
```

Wie zijn sneltoets-id's wil laten aanvullen, vult `ShortcutIds` met declaration merging, onder de naam waaronder hij de library importeert:

```ts
declare module '@nt/ui' {
  interface ShortcutIds {
    'chat.send': true
  }
}
```

**Teksten als props.** De library bevat geen tekst. Een component met één tekst krijgt een prop (`confirmLabel`, `cancelLabel`), een component met meer een `labels`-object met een geëxporteerd type (`ProseLabels`, `SearchListLabels`, …); samengestelde teksten zijn functies (`noResults(query)`). De afnemer vult ze uit zijn eigen catalogus.

**Galerij en tests.** `@nt/ui/gallery` geeft `stories` (alle verhalen, gesorteerd), `collectStories` om er eigen verhalen bij te sorteren, en `galleryLabels`: de Nederlandse woorden die de verhalen gebruiken. `@nt/ui/testing` geeft `renderWithUi` (render binnen een `UiProvider`), `fakeShortcuts`, `uiWrapper`, `createFakeHost` en `HEADING_START_CASES` (de koppenposities die de test van `Prose` loopt, om gelijk te houden met de eigen kopie van een afnemer).

## Entry points

| Export | Inhoud |
|---|---|
| `@fromorbit/ui` | alle componenten en `UiProvider` |
| `@fromorbit/ui/tokens.css` | de ontwerpwaarden |
| `@fromorbit/ui/theme.css` | de Tailwind-namen van de tokens, de klassen en animaties van de componenten |
| `@fromorbit/ui/gallery` | `stories`, `collectStories`, `galleryLabels` en het type `Story`, voor de galerij van de afnemer |
| `@fromorbit/ui/testing` | `renderWithUi` en de andere hulpjes voor de tests van een afnemer |

Peer dependencies: `react`, `react-dom`, `radix-ui` (`~1.6.7`: onder 1.7 en 1.8 vallen twee tests om), `lucide-react`, `@pierre/diffs`, `@pierre/trees`, `react-markdown`, `remark-gfm` en `@fromorbit/doc-view` (voor `Prose` en de Shiki-bundel); optioneel `@testing-library/react` (voor `./testing`). `class-variance-authority` is een gewone dependency.

## Opbouw

| Map | Rol |
|---|---|
| `src/primitives/` | de kleinste bouwstenen: Avatar, BrandIcon, Button, Checkbox, ChoiceRow, CiteRow, Collapsible, Field, FileInput, Icon, IconButton, IconSegmentedControl, Input, Kbd, LevelBars, NumberField, OrbitWordmark, Pill, ProgressMeter, ProjectMark, RadioGroup, ResizeHandle, ScrollArea, SecretField, SectionHeading, SegmentedControl, Select, Separator, Skeleton, Spinner, StepChips, Switch, Tabs, Tag, Textarea, Thumbnail, Toggle; plus `shortcut` (de sneltoetsgrammatica) en `control-size` |
| `src/overlays/` | wat boven de pagina zweeft: ConfirmDialog, Dialog, DropdownMenu, Popover, Spotlight, Toast, Tooltip; plus `panel` en `portal`; importeert alleen uit `primitives/` |
| `src/patterns/` | samengestelde bouwstenen: Banner, Chip, ChipListField, ChoiceCard, ChoiceCards, CopyButton, EditableTable, EmptyState, ErrorState, FileLink, GitHubLink, HostedSurface, List, MentionList, PageHeader, PanelTabHeader, PathField, PathLabel, PickerPill, PierreDiff (en PierreFile), PierreFileIcon, PierreTree, PropertyList, Prose, Rail, RelativeTime, RoomyListRow, SearchList, SelectionBar, SettingFoldRow, SettingRow, SettingsGroup, ShelfGroup, Shimmer, StackedRow, StatusLine, StatusShape, SummaryBar; importeert uit beide lagen eronder |
| `src/provider/` | `UiProvider` en zijn poorten (`ShortcutPort`, `HostPort`, platform, thema) |
| `src/types.ts` | eigen, structurele typen van de gegevens die componenten tekenen |
| `src/gallery/`, `src/testing/` | de entry's `./gallery` en `./testing` |
| `src/tokens.css` | de ontwerpwaarden |
| `src/theme.css` | de Tailwind-koppeling, de globale klassen en de animaties |
| `tests/` | de grenzen, de bewakingstests en de tests tegen de build (exports, een afnemer die rendert, de typen van een afnemer) |
| `docs-site/` | de componentenpagina (Vite, React, Tailwind); de build gaat naar `docs-site/dist` en zit niet in het npm-pakket |
| `scripts/` | de componentenpagina publiceren |

## Changelog

Zie [CHANGELOG.md](CHANGELOG.md) zodra de eerste versie uit is.
