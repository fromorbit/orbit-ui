---
"@fromorbit/ui": patch
---

What the Orbit desktop app needs for its rail and top bar, so the app no longer builds it itself. Additive only: new props, new exports and new tokens, each opt-in; no prop, export, token or subpath is removed or renamed.

What a host checks:

- `AppRailItem` hands every prop it does not know to its link or button instead of dropping it. A host that passed a stray prop (`className`, `style` excepted, which stay dropped) now sees it on the element.
- A link of `AppRailItem` now always carries an `onClick`, `onMouseEnter` and `onFocus`, even without `onNavigate` or `onIntent`; what they do without those is nothing. A test that compares the attributes or props of the link one by one needs a new expectation.
- The width classes of the `nav` of `AppRail` changed (`w-[var(--nt-rail-width,72px)]` for `w-18`, `w-[var(--nt-rail-width-narrow,56px)]` for `w-14`), without a change in what is drawn; a test that looks for `w-18` or `w-14`, or compares the full class string, needs a new expectation.

What is new:

- `AppRailItem` takes a `ref` and every prop of its link or button, so it can be the `trigger` of a `DropdownMenu` or `Popover` (Radix `asChild`); on such a trigger `onSelect` may be left out. A button item takes `aria-expanded`. With `shortcut` it shows its label and key in a tooltip beside it and announces the key as `aria-keyshortcuts`, read through the `ShortcutPort` as `Button` does; on the wide rail only when the port knows the key. The host's `onClick` runs before the item's own `onSelect` or `onNavigate`, which a prevented click skips. As the trigger of a menu, the focus the menu hands back opens no tooltip; such a menu takes no `tooltip` of its own.
- `SearchFieldButton`: a button in the shape of a search field for the top bar: `--nt-control-sm` high, a hairline in `border` on `surface`, a glyph, the `placeholder` in muted 13px and the `shortcut` in one cap at the end.
- `TeamMark`: the 20px block of a team's first letter in `fg` on `bg-mark`, beside the 16px `ProjectMark`.
- Tokens of the shell: `--nt-rail-width`, `--nt-rail-width-narrow`, `--nt-top-bar-height` (48px), `--nt-shell-plane-inset-start` (74px), `--nt-shell-plane-inset-start-narrow` (58px) and `--nt-shell-plane-inset-top` (49px) for what a host lays over the floating plane, `--nt-top-bar-inset-start` (16px, 82px on macOS) and `--nt-top-bar-inset-end` (at least 12px, clear of the window controls on Windows).
- `--nt-side-panel-background`: the side panel as a background, opaque, and on a translucent window tinted at 92% in dark and 94% in light, the floor at which text, secondary and muted keep 4.5:1 over the worst material. `--nt-side-panel` and `bg-side-panel` stay opaque.
