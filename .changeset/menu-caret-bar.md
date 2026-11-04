---
"@fromorbit/ui": patch
---

`DropdownMenu` and `ContextMenu`, through the rows they share: the row the keyboard walked to keeps its `surface-active` tint and adds a 2px bar of the focus colour on its leading edge, a cue of 3:1 and more in both themes (the tint alone was 1.2:1, under WCAG 1.4.11). The chevron of a submenu row is `muted` instead of `faint` (3:1 and more). A row with a `shortcut` carries `aria-keyshortcuts` from the `ShortcutPort`'s `aria`, so a screen reader hears the key while the row's name stays its label. The `ContextMenu` story names Control-click on macOS and Shift+F10 only on Windows and Linux, chooses its touch line by pointer only, lays its regions on white cards (`bg-plane shadow-plane`) with framed `⋯` buttons, and its keys follow the platform switch of the docs page.
