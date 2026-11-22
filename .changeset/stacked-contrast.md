---
"@fromorbit/ui": patch
---

Contrast on stacked planes (WCAG 2.2 AA). The base pairs held, but a lit row on a region or a card fell short, mostly in dark. Three values change:

- `--nt-text-muted` in dark is `#979ebd`, a step lighter than Slate with its hue, instead of `var(--nt-brand-slate)`: 6.5:1 on the canvas, and at least 4.5:1 on a region or a card under the pointer (5.0:1, 4.9:1), the chosen row on a card (4.8:1), a selected row (5.3:1) and the caret row (4.8:1), where Slate reached 4.1 to 4.5:1. `--nt-brand-slate` itself is unchanged.
- `--nt-success` in light is `#1c7044` (was `#1f7a4a`), with `--nt-success-subtle` as its tint: 5.5:1 on Paper, 5.0:1 on the frame, 4.6:1 on the caret row and 4.9:1 on its own banner, where the old green missed all three.
- `--nt-text-faint` is `#7a81a0` in dark (was `#666d8b`) and `#6c7395` in light (was `#7d84a3`), so a faint icon keeps the 3:1 of a glyph on a chosen row and on the caret row (at least 3.2:1 on every lit row the tests name). It stays for icons only.

The caret row's words (`--nt-text-strong`) stay white in dark, the extreme of the theme; with the lighter muted they stand 2.6:1 above it instead of 3.1:1. `tokens.test.ts` now computes these stacks in both themes, the status colours as words on the frame, and the success banner.
