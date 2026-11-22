---
"@fromorbit/ui": patch
---

Contrast on stacked planes (WCAG 2.2 AA). The base pairs held, but a lit row on a region, a card or the frame fell short, mostly in dark.

Token values:

- `--nt-text-muted` in dark is `#979ebd`, a step lighter than Slate with its hue, instead of `var(--nt-brand-slate)`: 6.5:1 on the canvas, and at least 4.5:1 on a region or a card under the pointer (5.0:1, 4.9:1), the chosen row on a card (4.8:1), a selected row (5.3:1) and the caret row (4.8:1), where Slate reached 4.1 to 4.5:1. `--nt-brand-slate` itself is unchanged.
- `--nt-text-faint` is `#7a81a0` in dark (was `#666d8b`) and `#6c7395` in light (was `#7d84a3`), so a faint icon keeps the 3:1 of a glyph on a chosen row and on the caret row (at least 3.2:1 on every lit row the tests name). It stays for icons only.
- The status colours hold 4.5:1 as words on the keyboard row of a list or a menu (`surface-active` over the canvas and over a card), each by the smallest step that keeps its hue, with its `-subtle` and `-border` tints following:
  - light `--nt-success` `#1f7a4a` → `#1c7044` (also 5.0:1 on the frame and 4.9:1 on its own banner, where it missed both);
  - light `--nt-danger` `#bf3030` → `#b92f2f` and `--nt-attention` `#965a00` → `#905600` (4.53:1 and 4.52:1 on the caret row, from 4.32:1 and 4.23:1; `--nt-comment-underline` follows attention);
  - dark `--nt-success` `#4cb782` → `#4db783` and `--nt-danger` `#ff7b7b` → `#ff7c7c` (4.504:1 and 4.509:1 on the keyboard row of a menu, from 4.496:1 and 4.479:1); `--nt-terminal-ansi-2` follows success.

Components:

- The keyboard row of a menu lifts its quiet words to `secondary`, since muted is 4.2:1 on it in dark: in `DropdownMenu` and `ContextMenu` the count, the key and a submenu's value (`group-focus-visible/item:`), in `MentionList` the detail of the active row.
- A lit row over the frame lifts its muted words, since muted falls to 4.4:1 there in light: the current `StackedRow` sets its first and third lines in `secondary`, a current or pressed `ListRow` its meta and second line, and the key of `SearchFieldButton` follows its words to `secondary` under the pointer.
- The active row of `SearchList` (and so of `MentionList`) carries a neutral stripe on its leading edge: 2px of `--nt-text-muted` (`before:bg-muted`), 4.1:1 and more against the active fill in both themes, never the accent or the focus colour. It is the non-text cue of the caret (WCAG 1.4.11), which no longer rests on its tint (1.4:1) and the step from muted to its words (2.6:1 in dark) alone. The keyboard row of a menu keeps its stripe in the focus colour.
- A current `ListRow` lifts its quiet words whether it is current through `current` or through an `aria-current="page"` passed with its other props.

The caret row's words (`--nt-text-strong`) stay white in dark, the extreme of the theme; with the lighter muted they stand 2.6:1 above it instead of 3.1:1. `tokens.test.ts` now computes these stacks in both themes.
