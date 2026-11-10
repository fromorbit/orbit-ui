---
"@fromorbit/ui": minor
---

The shell of the family: three layers, the rail of the apps and the rows of the side panel.

- **The light frame is a step below Paper again** (`--nt-frame` `#ffffff` → `#e9e8e2`), so the frame, the side panel and the canvas lie in the same order in both themes. What floats on the canvas stays white: `plane`, `overlay-background`, `composer`, `bubble`, `diff-bg`. The translucent light window follows the frame (`rgb(233 232 226 / 0.6)`). A host checks two things in light: a white column of its own on the frame (a sidebar that took the white frame of 0.4.0) now stands out against a deeper frame, and the hairline beside a sidebar (`shadow-frame-edge`) is still the edge between frame and canvas.
- **A new token `--nt-side-panel`** (Tailwind `bg-side-panel`), the middle layer: `#0f1630` in dark, `#efeee9` in light. Text, secondary, muted, the accent as text, the focus ring, the edge of an empty box and every status mark keep their contrast on it.
- **The satellites of Lens, Trail and Comet**: `--nt-brand-lens` (`#ffb224`), `--nt-brand-trail` (`#ff4d6d`) and `--nt-brand-comet` (`#4da3ff`), chosen with `data-product="lens"`, `"trail"` or `"comet"`. As every satellite, only a dot, never a role.
- **`AppRail` and `AppRailItem`**: the rail of the apps on the frame, 68px (56px narrow, icons only), an icon of 20px over a label of 11px, the open app on the neutral `row-active` plane with its satellite as a 4px dot beside it.
- **`SideNav`, `SideNavGroup` and `SideNavLink`**: the places of one app in the side panel, rows of 32px under a `SectionHeading`, quiet meta in DM Mono. Both hand a plain click to `onNavigate`, so a host routes without a reload.
- `Icon` gains `house` and `circle-help`.
- `docs/family-style.md`: a section "The shell", the hairlines of the floating plane, and the rule that a status on the frame is a glyph, never a word (green as a word reaches only 4.3:1 on the light frame). The demos of the component site stand in the shell; their pixel references change.
