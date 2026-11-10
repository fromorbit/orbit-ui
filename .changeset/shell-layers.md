---
"@fromorbit/ui": minor
---

The shell of the family: three layers, the rail of the apps and the rows of the side panel.

- **The light frame is a step below Paper again** (`--nt-frame` `#ffffff` → `#e9e8e2`), so the frame, the side panel and the canvas lie in the same order in both themes. What floats on the canvas stays white: `plane`, `overlay-background`, `composer`, `bubble`, `diff-bg`. The translucent light window follows the frame (`rgb(233 232 226 / 0.6)`).
- **A new token `--nt-side-panel`** (Tailwind `bg-side-panel`), the middle layer: `#0f1630` in dark, `#efeee9` in light. Text, secondary, muted, the meta of a lit row, the accent as text, the focus ring, the edge of an empty box, the kinds of a document, every status mark and the status colours as words keep their contrast on it.
- **The satellites of Lens, Trail and Comet**: `--nt-brand-lens` (`#ffb224`), `--nt-brand-trail` (`#ff4d6d`) and `--nt-brand-comet` (`#4da3ff`), chosen with `data-product="lens"`, `"trail"` or `"comet"`. As every satellite, only a dot, never a role. The type `FamilyProduct` names the six products.
- **`AppRail` and `AppRailItem`**: the rail of the apps on the frame, 72px with items of 60px (56px narrow, items of 44px, icons only with the label in a tooltip), an icon of 20px over a label of 11px that is never cut off, the open app on the neutral `row-active` plane with its satellite as a 4px dot beside it. The rail scrolls in a short window. An item is a link (`href`, `onNavigate`) or, with `onSelect`, a button of the same shape that passes `aria-haspopup`.
- **`SideNav`, `SideNavGroup` and `SideNavLink`**: the places of one app in the side panel, rows of 32px under a `SectionHeading` and on its line, quiet meta in DM Mono. Rail and side panel share one hover (`surface-hover`) and take `onIntent(href)` on hover and focus, so a host can prefetch.
- `Icon` gains `house` and `circle-help`. The gallery's product switch has Lens, Trail and Comet.
- `docs/family-style.md`: a section "The shell", the hairlines of the floating plane, and the rule that a status on the frame is a glyph, never a word. The demos of the component site stand in the shell; their pixel references change.

**What a host checks in light:**

- [ ] Everything on `bg-frame` or `--nt-sidebar-background` turns `#e9e8e2`, darker than the canvas instead of white above it: the sidebar of the desktop app and Halo's sidebar first. Look at it beside the canvas.
- [ ] A status word on the frame becomes a glyph (`StatusMark`, or a dot beside a neutral word): on the light frame green reaches 4.3:1 as a word, muted 4.9:1 and the focus ring 5.1:1.
- [ ] A white column of the host's own on the frame, the hairline of `shadow-frame-edge` beside a sidebar, and the translucent window (`data-translucent`), against the deeper frame.
