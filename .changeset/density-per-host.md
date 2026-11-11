---
"@fromorbit/ui": minor
---

Density per host: a host picks how high the controls stand, the kit holds the numbers.

- **`data-density="compact"`** on an element (as a rule `<html>`) lowers every control a step for everything inside: `--nt-control-xs` 24 → 20px, `-sm` 28 → 24px, `-md` 32 → 28px, `-lg` 40 → 32px. For a tool used all day at close range, the desktop app. `data-density="regular"` brings the heights of 0.5.0 back inside a compact host. Without the attribute nothing changes: a host that sets nothing, such as the website, keeps the heights of 0.5.0.
- **Every control, row and head reads the token.** What stood on a Tailwind step that happened to match a control height now takes `--nt-control-*`, at the same size by default: `SectionHeading`, the group headings of `List` and `SearchList` (32px, `md`); `PageHeader`, `PanelTabHeader`, `ShelfGroup` and the trigger of `Accordion` (40px, `lg`); the head of `SettingsGroup` and the room for the close button of `Dialog` (28px, `sm`); `Collapsible` and `StepChips` (24px, `xs`); a dense `SettingRow` and a row of `PropertyList` (`md`); the days of `Calendar` (`md`). `Textarea` takes its padding from `--nt-control-md`, so one row stays level with an `Input` beside it in either density. A guard (`tests/control-heights.test.ts`) keeps literal control heights out of the components.
- A host never declares an `--nt-*` itself; it chooses a product (`data-product`) and a density (`data-density`). `docs/family-style.md` has a section "Density".
