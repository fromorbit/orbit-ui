---
"@fromorbit/ui": patch
---

What the Orbit desktop app needs for the groups of its side panel (Runs, Integraties and Afgerond under the chats), so it overrides nothing of `ListGroup` itself. Additive only: new props on `ListGroup`, each opt-in, and one new data attribute (`data-nt-list-group-chevron`), while the heading of a group with `rowMark` also carries the existing `data-nt-list-row`; no prop, export, token or subpath is removed or renamed, and a group without the new props draws what it drew.

What a host checks:

- A `roving` `List` walks with → into a box of actions (`data-nt-list-actions`) only when that box is a direct child of the row's own `<li>`, as `ListRow` and `StackedRow` render it. Before, it took the first such box anywhere in the `<li>`, so → on the button of an open `ShelfGroup` walked into the controls of its first row. A host that renders a row of its own with the box deeper in the `<li>` moves it up to be the `<li>`'s child.
- The class string of the count of `ListGroup` lost a trailing space; a test that compares it in full needs a new expectation. Nothing is drawn differently.

What is new:

- `ListGroup` `variant="disclosure"`: the chevron before the word, always in sight and turned to the word while folded (`data-nt-list-group-chevron`); the count at the end of the heading in DM Mono 11px, a figure or the caller's words ("1 bezig, 1 vraagt iets"); the hover of the shell (`surface-hover`). One form for every group that folds in a side panel's column, Afgerond at its foot too: opened by the reader, it brings its first row into view, as `ShelfGroup` does. `variant="label"` is the default and the form of before.
- `ListGroup` `inset`: the heading starts 12px in instead of 8px, so in a column with an 8px gutter its first glyph stands 20px from the edge: the chevron of a `disclosure` heading on the line of a `SectionHeading` set 4px in and of the chats, its word at 38px. The rows of `ListRow` stand at 16px (regular) or 18px (`comfortable`); the design puts everything at 18px, a next step. The app can drop its `[&_[data-nt-list-group-heading]]:ps-3`.
- `ListGroup` `spacing="column"`: 14px between the groups and 1px between the rows instead of 24px (`mt-6`) and 4px (`gap-1`). The app can drop the `[&>ul>li]:mt-0 [&>ul>li+li]:pt-3` it sets on its groups; the step from Recent to the first group stays the app's (`SIDE_GROUP_STEP`) until `SectionHeading` has one.
- `ListGroup` `rowMark`: the heading's button carries `data-nt-list-row`, so in a `List` the arrows, Home and End walk onto it and on from it, a folded group stays one step in the column, and in a `roving` list it is no tab stop of its own.
- `ListGroup` `level` (`2` or `3`, default `2`): the heading as an `h3`, the level of a `SectionHeading` in a column.
