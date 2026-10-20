# orbit-ui

De bouwstenen van de interface van Orbit, als Bun-workspace met twee pakketten: `@fromorbit/ui` (`packages/ui`: primitives, overlays, patterns en de ontwerpwaarden `tokens.css` en `theme.css`) en `@fromorbit/doc-view` (`packages/doc-view`: de documentweergave). Beide worden gepubliceerd op GitHub Packages.

## Commando's

Bun is package manager en script-runner; tests en de library zelf draaien op Node (`.node-version`). Op de root draait elk commando over beide pakketten (doc-view eerst); in een pakketmap alleen over dat pakket.

| Commando | Bewijst |
|---|---|
| `bun run check` | typecheck, lint (incl. de grenzen) en alle Vitest-tests (componenten in happy-dom), zonder te bouwen |
| `bun run build` | `dist/`: JavaScript met tsup (één module per bronbestand, niet geminificeerd), `.d.ts` met `tsc`, `scripts/dts-extensions.mjs` zet er `.js` in; ui kopieert `tokens.css` en `theme.css`, doc-view `doc-view.css` |
| `bun run verify` | na `build`: elke export heeft zijn bestand en laadt in kaal Node, via `import` en `require` (`scripts/verify-dist.mjs`) |
| `bun run test:consumer` | na `build`: voor ui laadt elke export uit `dist/` (`tests/exports.test.ts`), rendert een `Button` uit `dist/` met en zonder `UiProvider` (`tests/consumer.test.tsx`) en typecheckt een afnemer tegen de gebouwde `.d.ts` (`tests/consumer-types.test.ts`); voor doc-view wordt het pakket ingepakt, in een vers NodeNext-project geïnstalleerd en getypecheckt (`consumer/consumer.test.ts`, vraagt netwerk) |
| `bun run gallery:build` | de componentenpagina (`packages/ui/docs-site/`) bouwt naar `docs-site/dist`; zijn test (lijst en hash) draait in `check`, `gallery:publish` alleen met de hand |
| `bun run changeset` | een wijziging aankondigen (patch/minor/major) |
| `bun run release` | alleen op verzoek: `build`, `verify`, `check`, `test:consumer` en `changeset publish` naar GitHub Packages (token met `write:packages`) |

## De workspace

- `@fromorbit/ui` gebruikt `@fromorbit/doc-view` als peer; in de workspace is het een devDependency `workspace:*`, dus de lokale doc-view. De voorwaarde `@fromorbit/source` in de `exports` van doc-view wijst naar zijn `src/`: ui's `tsconfig.json`, `vitest.config.ts` en `docs-site/vite.config.ts` zetten hem, zodat `check` en de galerij geen build van doc-view nodig hebben. `tsconfig.build.json` van ui zet hem uit; de build van ui leest dus de gebouwde doc-view, en `bun run build` bouwt doc-view eerst.
- `bunfig.toml` op de root geldt voor beide pakketten: een versie van buiten moet zeven dagen oud zijn, alleen eigen pakketten zijn uitgezonderd (`packages/ui/tests/cooldown.test.ts`).
- `.npmrc` noemt alleen het register van `@fromorbit` en verwijst naar `NODE_AUTH_TOKEN`; er staat nooit een token in een bestand. Installeren in de workspace heeft hem niet nodig, publiceren wel.

## Regels die hier gelden

- **Geen i18n.** Geen `i18next` of `react-i18next`, en geen Nederlandse of Engelse tekst in een component: elke tekst komt als prop (`confirmLabel`, `copiedLabel`, `labels`). De afnemer haalt hem uit zijn eigen catalogus.
- **Geen `@nt/*`.** De pakketten kennen het protocol, de bridge en de sneltoetscatalogus van de app niet. Typen die een component nodig heeft, zijn eigen structurele kopieën (`packages/ui/src/types.ts`). doc-view importeert geen enkel ander eigen pakket (`packages/doc-view/test/boundaries.test.ts`). Geen `node:*` buiten tests.
- **De app via `UiProvider`.** Sneltoetsen (`ShortcutPort`), platform, thema, `locale` en host (`HostPort`: de gehoste lagen van `HostedSurface`) komen binnen via één `UiProvider`; een bestand of link openen gaat via `onOpen` van `FileLink` en `GitHubLink`. Zonder provider werkt alles met een neutrale standaard: geen sneltoetslabel, platform `mac`. `ShortcutIds` vult de afnemer met declaration merging vanuit de root-module.
- **Drie lagen in ui.** `primitives/` → `overlays/` → `patterns/`: een laag importeert alleen uit zichzelf of een laag eronder. `tests/boundaries.test.ts` en `biome.json` dwingen de grenzen af: lagen alleen omlaag, geen relatieve import buiten `src/`, een pakket alleen als het in `dependencies` of `peerDependencies` staat, `vitest`, Testing Library en `node:*` alleen in een test (`@testing-library/react` ook in `src/testing/`), geen `i18next` of `@nt/*`, en geen import uit `testing/` of `gallery/` buiten een test, een verhaal of die mappen zelf.
- **Klassen blijven letterlijk.** De Tailwind van de afnemer scant `dist/` met `@source`, dus de build minificeert en bundelt niet, en een klasse wordt nooit uit stukjes samengesteld.
- **Peers van ui.** React, `react-dom`, `radix-ui`, `lucide-react`, `@pierre/diffs`, `@pierre/trees`, `react-markdown`, `remark-gfm` en `@fromorbit/doc-view` zijn peer dependencies (de root-export laadt `Prose`, dus doc-view is niet optioneel); `@testing-library/react` (voor `./testing`) is een optionele peer; `class-variance-authority` is een gewone dependency. Elke peer staat ook in `devDependencies` en in `EXTERNAL` van `tsup.config.ts`; de peers van doc-view staan in ui alleen in `devDependencies`, voor de tests.
- **`radix-ui` op `~1.6.7`.** Onder 1.7.0 en 1.8.1 falen `Tabs.test.tsx` ("reports the tab that was chosen": de keuze komt twee keer binnen) en `DropdownMenu.test.tsx` (de reden van een uitgeschakelde rij). Verruim de range pas als die twee onder de nieuwe versie groen zijn.
- **De `shiki`-alias.** `vitest.config.ts` van ui laat `shiki` naar `src/patterns/shiki-bundle.ts` wijzen en inlinet `@pierre/diffs`; zo testen `PierreDiff` en `Prose` tegen de bundel die een afnemer uitlevert.
- **`testing/labels.ts` is een fixture.** De Nederlandse woorden van de eigen verhalen en tests. Publiek alleen als `galleryLabels` van `./gallery`, nooit vanuit `./testing` of `.`: een afnemer geeft zijn componenten de woorden van zijn eigen catalogus.
- **De styling gaat mee.** `tokens.css` levert de variabelen, `theme.css` de rest waarvan componenten afhangen. `src/theme.test.ts` faalt als een component een `nt-`-klasse draagt zonder regel in `theme.css` of `tokens.css`, en als `theme.css` iets van de app bevat (`body`, scrollbalken van het venster, indeling) of iets importeert.
- **Bewakingstests in `packages/ui/tests/`** (hulpjes in `tests/guards/`): elk component heeft een test en een galerijverhaal ernaast (`component-siblings`), elke focusring heeft een `outline-offset` (`focus-ring`), `text-faint` alleen in de toon van `Icon` (`faint-text`), geen eigen `<svg>` buiten de genoemde bestanden (`own-svg`), geen kleur uit het Tailwind-palet (`palette-colours`), en geen kale `<button>`/`<input>` in een verhaal of in `testing/` (`bare-controls`).
- **Gouden voorbeelden van doc-view.** `packages/doc-view/fixtures/` gaat mee in het pakket; `NT_GOLDEN_UPDATE=1 bun run test` in `packages/doc-view` schrijft ze opnieuw. Lees de diff.
- **Elke component exporteert zijn props-type** en zijn `*Labels`-type; `src/index.ts` van ui exporteert elk module met `export *`, `src/index.test.ts` noemt een module die ontbreekt.
- **Een nieuwe export** krijgt een regel in `exports`, een entry in `ENTRIES` van `tsup.config.ts` en een plek in de exporttest. Verander geen bestaand subpad: afnemers importeren het.
- **Verhalen zijn pixelreferenties.** De zichtbare tekst in `*.gallery.tsx` bepaalt schermafbeeldingen bij afnemers; verander hem alleen met een reden.
- **Commentaar en testnamen in het Engels**, met JSDoc op elke export (samenvatting, dan het waarom); documentatie in het Nederlands, de README van doc-view in het Engels.
- **De repo is openbaar.** Geen persoonsgegevens, tokens, echte machinepaden of namen van klanten of projecten in code, verhalen, tests of fixtures: verzonnen namen, `/work/…`-paden. Geen verwijzingen naar documenten die hier niet staan.
- **Werk gaat via een branch en een pull request** naar `main`, nooit met force; `git add` op expliciete paden.

## Definitie van klaar

`bun run check`, `bun run build` en `bun run test:consumer` zijn groen, in deze sessie gedraaid, en de uitvoer is gelezen.
