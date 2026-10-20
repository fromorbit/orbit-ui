<img width="2400" height="600" alt="fromorbit-banner-donker-2400x600" src="https://github.com/user-attachments/assets/27ec445d-9198-40ba-921a-3826c02c0b8f" />

De bouwstenen van de interface van **Orbit**, als twee npm-pakketten:

| Pakket | Map | Wat het is |
|---|---|---|
| [`@fromorbit/ui`](packages/ui/README.md) | `packages/ui` | de componentenbibliotheek: primitives, overlays, patterns, de ontwerpwaarden (`tokens.css`) en het thema (`theme.css`) |
| [`@fromorbit/doc-view`](packages/doc-view/README.md) | `packages/doc-view` | de documentweergave: Markdown, zijn inhoudsopgave en de soort van een document |

`@fromorbit/ui` gebruikt `@fromorbit/doc-view` voor `Prose` en de Shiki-bundel (als peer dependency). Alle verhalen van de componenten staan online: <https://fromorbit.github.io/orbit-ui-docs/>.

Installeren als afnemer: zie de README van elk pakket. Beide staan op GitHub Packages (`https://npm.pkg.github.com`), dat ook voor een openbaar pakket een token met `read:packages` vraagt.

## Ontwikkelen

Vereisten: Node 24 en Bun (zie `.node-version` en `.bun-version`). De repo is een Bun-workspace; `@fromorbit/doc-view` komt in de workspace uit `packages/doc-view`, dus installeren vraagt geen token.

```sh
bun install
bun run check
```

| Commando (op de root) | Wat het doet |
|---|---|
| `bun run check` | typecheck, lint (incl. de grenzen) en alle Vitest-tests van beide pakketten, zonder te bouwen |
| `bun run build` | bouwt `dist/` van doc-view en daarna van ui (ESM plus `.d.ts`, één module per bronbestand, niet geminificeerd) |
| `bun run verify` | na `build`: elke export van beide pakketten heeft zijn bestand en laadt in kaal Node |
| `bun run test:consumer` | na `build`: doc-view ingepakt en geïnstalleerd in een vers NodeNext-project dat typecheckt (vraagt netwerk), en elke export van ui laadt, rendert en typecheckt vanuit `dist/` |
| `bun run gallery`, `gallery:build` | de componentenpagina (`packages/ui/docs-site`) lokaal met HMR, of als statische build naar `packages/ui/docs-site/dist` |
| `bun run gallery:publish` | bouwt de componentenpagina en zet hem op GitHub Pages (`fromorbit/orbit-ui-docs`); vraagt schrijfrechten op die repo |
| `bun run changeset` | een wijziging aankondigen (patch/minor/major) |
| `bun run version` | de versies ophogen uit de changesets en de changelogs schrijven |
| `bun run release` | bouwen, controleren, `check`, de afnemertests en `changeset publish` |

Elk pakket heeft dezelfde scripts in zijn eigen map (`bun run --cwd packages/ui check`, …).

De componentenpagina is een gewone afnemer: hij haalt de verhalen uit `src/gallery`, de componenten uit `src` en de styling uit `tokens.css` en `theme.css` (`packages/ui/tests/docs-site.test.ts` bewaakt dat). Hij zit niet in het npm-pakket.

## Uitgeven

1. Elke wijziging die een afnemer merkt, krijgt een changeset (`bun run changeset`).
2. `bun run version` hoogt de versies op en schrijft de `CHANGELOG.md` van elk pakket.
3. `bun run release` bouwt, controleert en publiceert naar GitHub Packages, met een token met `write:packages` in `NODE_AUTH_TOKEN`. `changeset publish` publiceert elk pakket waarvan de versie nog niet in het register staat; doc-view gaat vóór ui, want ui vraagt de nieuwe doc-view als peer.

## Opbouw

| Map | Rol |
|---|---|
| `packages/ui/` | `@fromorbit/ui`, met zijn tests, bewakingstests (`tests/`) en de componentenpagina (`docs-site/`) |
| `packages/doc-view/` | `@fromorbit/doc-view`, met zijn tests (`test/`), gouden voorbeelden (`fixtures/`) en de afnemertest (`consumer/`) |
| `scripts/` | wat beide builds delen: de `.d.ts` bijwerken voor NodeNext (`dts-extensions.mjs`) en de build controleren (`verify-dist.mjs`) |
| `.changeset/` | de aangekondigde wijzigingen |

## Werkwijze

Werk gaat via een eigen branch en een pull request naar `main`. De regels voor mensen en agents staan in [`AGENTS.md`](AGENTS.md).

Er is geen licentiebestand: alle rechten zijn voorbehouden.
