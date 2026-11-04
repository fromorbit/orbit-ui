---
"@fromorbit/ui": minor
---

`ContextMenu`, the menu a right click opens on a region (a row, a card, a file): a long press on a touch screen and the context-menu key open it too. It takes the item model of `DropdownMenu` (`DropdownMenuItem`, `DropdownMenuHeader`, `checks`, `density`, `height`) and draws its rows with the same code and in the same frame, so one array can feed both the `⋯` of a row and a right click on it. The region keeps its own looks and carries `data-state="open"` while its menu is up, so a host can keep it lit; `disabled` leaves the right click to the browser. Non-modal, like `DropdownMenu`.

`DropdownMenu`: a row without an icon, in a panel where another row has an icon, a glyph or a check at the start, keeps an empty slot of 14px, so every label of the panel starts on one line (the `Open` story: "Archiveren" now lines up with "Hernoemen"). A panel without any icon is unchanged.
