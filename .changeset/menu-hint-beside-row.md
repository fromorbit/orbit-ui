---
"@fromorbit/ui": patch
---

`Tooltip` takes a `side` (`top` by default) and wraps inside the room Radix measures on that side instead of running past the window's edge. A menu row's `hint` (`DropdownMenu`, `ContextMenu`) opens on the far side of the row, so the tooltip no longer covers the rows above and below it. The `ContextMenu` story raises the quiet text of a lit region to `secondary` while its menu is up, so it keeps 4.5:1 on the dark open tint (`muted` fell to 4.05:1).
