---
"@fromorbit/ui": patch
---

What the Orbit desktop app needs for the chat row of its side panel and the project row of its start screen, so it builds neither itself. Additive only: new props, a new icon and a new data attribute, each opt-in; no prop, export, token or subpath is removed or renamed, and a row without the new props draws what it drew.

What a host checks:

- Every `ListRow` button carries `aria-pressed:bg-surface-hover aria-pressed:text-fg`. A row without `aria-pressed="true"` draws nothing new; a test that compares the full class string of a row needs a new expectation. A host that filled a pressed row with a rule of its own (`[data-nt-list-row][aria-pressed="true"]`) can drop it.
- `theme.css` lifts the muted meta of a pressed row of a list to secondary, as on a current row (`[data-nt-list-row][aria-pressed="true"] .text-muted`).
- A `ListRow` with a `marker` of the caller's own and a `subline` lays the mark in a column of its own (`data-nt-list-mark`) and the two lines beside it (`data-nt-list-lines`), so the second line starts under the title: beside a 16px `ProjectMark` it moves 2px to the right, where it belongs. The line loses its `ps-[22px]`. A row with the status shape keeps its DOM and its pixels.
- The box of `actions` of `ListRow` and `StackedRow` carries `data-nt-list-actions` (`StackedRow` keeps `data-nt-stacked-actions` beside it).

What is new:

- `ListRow` `size="comfortable"`: the title at 13px even with a `subline`, 10px of padding at the sides.
- `ListRow` `markerSide="end"`: the shape (or the caller's `marker`) at the end of the first line, in a 16px slot 10px from the edge, with 34px kept free; the second line starts under the title. With `actions`, the controls take the place of the shape on hover, on keyboard focus (`:focus-visible`) and while a menu of theirs is open, never on the focus a click leaves (A28), and the row keeps room for at most two controls of `--nt-control-sm` while they show, so they never lie over the title; a third would.
- `ListRow` `titleId`: the id on the title, for `aria-describedby` on a control beside the row.
- `ListRow` `titleWeight` (`medium` or `semibold`) and `monoTitle` (the title in DM Mono).
- `ListRow` `subline.mono`: the second line in DM Mono; a part in the sans is a `font-sans` span inside `content`.
- `ListRow` `shape.label`: the status word as the tooltip of the shape under the pointer. The shape stays decorative and the row's name keeps the status in its own place (title, status, meta, second line). With `markerSide="end"` and `actions` there is no tooltip, since the actions take the shape's place on hover.
- `StatusShape` `tooltip`: the word under the pointer while the shape stays decorative (`label` still names it and wins when both are given).
- `List` `roving`: one tab stop for the whole list (the row that last had the focus, else the current one, else the first; a newly current row takes it over); → into the controls beside a row, passing a disabled one, ← back, and the context-menu key or ⇧F10 opens a row's last control, its menu. A row that answers → itself (`preventDefault`) keeps it. Turned off again, every row and control gets its tab stop back.
- `List` `card`: the rows in an outlined region (hairline, 12px corners, no fill), a line between them, the rows square to its edge with their focus ring inside; the inset of the words is the row's own (10px `comfortable`, 8px regular). A pressed row (`aria-pressed`) marks the choice; a radio group may fit a single choice better later.
- The icon `list-filter`.
