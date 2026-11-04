---
"@fromorbit/ui": minor
---

One rhythm for every component, from the Laws of UX (`docs/family-style.md`, "Rhythm"). Pixel references of a host change; no name of a token, class or prop changes.

- **Tokens.** Radii 4/6/10 → 4/8/12px, nested (inner = outer less the inset). Control heights `xs/sm/md/lg` 20/24/28/32 → 24/28/32/40px: the default control is a 32px target. New: `--nt-space-item` (8px), `--nt-space-group` (24px), `--nt-space-section` (40px), `--nt-duration-fast` (120ms), `--nt-duration` (180ms), `--nt-ease`. Every transition reads `--nt-duration-fast`, the fade of a layer `--nt-duration`.
- **Lists and the sidebar.** `List` rows 32 → 36px and its groups 24px apart; `SearchList` and menu rows a 32px control in 13px; group labels (`SectionHeading`, `List`, `SearchList`) are 12px/500 muted in sentence case, no longer spaced capitals; counts in tabular figures. Arranged `Tabs` rows match the 36px `List` row. `DropdownMenu` `comfortable` rows 30 → 36px.
- **Fewer frames.** `SettingsGroup`, `SummaryBar`, `Banner`, `Tag` and the code blocks of `Prose` keep their tinted plane and drop the outer border; `PropertyList` separates its groups by space instead of a line; a markdown table keeps only its row lines. `Tag` `neutral` stands on `surface-hover`; `success` keeps its hairline and no plane (a tint would cost its deep green AA in light).
- **Dialogs.** `Dialog` and `ConfirmDialog` have a 20px inset and a 15px title; the foot of a `Dialog` has no rule.
- **Smaller things.** `Button` padding follows its height (10/12/16px); `EmptyState` takes the 15px title and more air; `StackedRow` titles 14 → 13px; the tab pills of a title-bar strip fit its 40px.
