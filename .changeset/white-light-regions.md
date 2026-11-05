---
"@fromorbit/ui": minor
---

Light mode: white regions on a page of Paper. The sidebar and the frame (`--nt-frame`), a settings group, a code block, a summary, your own chat bubble and the code area of a diff are white, on a canvas of Paper, a touch off-white; a hairline or a soft shadow parts them, never a grey fill. Dark mode is unchanged, pixel for pixel.

- **New tokens.** `--nt-plane` (the plane of a region of its own: the 4% tint of `surface` in dark, white in light; Tailwind `bg-plane`), `--nt-shadow-plane` (its edge: nothing in dark, a hairline and a soft shadow in light; `shadow-plane`), `--nt-frame-edge` (the edge between a frame column and the canvas: transparent in dark, the hairline of `border` in light; `shadow-frame-edge` draws it as an inset shadow, so it takes no room).
- **Light values.** `--nt-frame` `#efeee9` → `#ffffff`, `--nt-bubble` → `#ffffff`, `--nt-diff-bg` `#efeee9` → `#ffffff`, the translucent window's frame white at 60%.
- **Components.** `SettingsGroup`, `SummaryBar`, the code blocks of `Prose`, `PlanCard` on `plane="surface"` and the bubble of `ChatMessage` take `bg-plane shadow-plane`. A host draws its sidebar's inner edge with `shadow-frame-edge`.
