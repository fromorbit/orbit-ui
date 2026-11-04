# @fromorbit/ui

## 0.2.0

### Minor Changes

- 1c2adba: The style of the Orbit family is the default: Midnight in dark and Paper in light, planes and lines in Mist and Midnight, a monochrome main button (`--nt-accent` is Paper on Midnight and Midnight on Paper, `--nt-accent-fg` no longer white), links and the focus ring violet (`--nt-focus-ring` is its own colour, no longer an alias of the accent), the status colours of Orbit's site, and Outfit and DM Mono, shipped as the new entry point `./fonts.css` (new dependencies `@fontsource-variable/outfit` and `@fontsource/dm-mono`). Titles weigh 600 (`--nt-font-weight-heading`, Tailwind `font-heading`). The fixed colours of the family are `--nt-brand-*`; a product's colour is only its satellite, `--nt-satellite` (Tailwind `satellite`), Orbit orange by default and chosen with `data-product="orbit|halo|fold"`. The sidebar may carry `--nt-sidebar-gradient`. Breaking: every colour value changed in both themes, and a host that relied on white text on the accent, on Geist, or on the focus ring following `--nt-accent` must follow; see `docs/family-style.md`.

## 0.1.0

### Minor Changes

- 26f6553: First release: the interface building blocks of Orbit (primitives, overlays and patterns), the design tokens (`tokens.css`) and the theme (`theme.css`), the gallery stories (`./gallery`) and the test helpers (`./testing`). Needs `@fromorbit/doc-view` 0.1.8 or later as a peer.
