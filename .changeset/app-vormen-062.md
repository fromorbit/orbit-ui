---
"@fromorbit/ui": patch
---

Opt-in forms the Orbit desktop app needs, and a 24px hit area back on two controls. Nothing changes for a caller that passes none of the new props.

- `Banner` takes `prose`: a sentence to read, in the text colour at 13px on the plane of a card with the tone's hairline; only the icon carries the tone, and the icon and the action stand beside the first line. One line still lands on `--nt-control-lg`.
- `EmptyState` takes `hero`: a 40px mark with a 24px icon, the title at 20px, the explanation at 13px, the parts 24px apart.
- `Input` takes the variant `tint`: a plane without a frame that lights under the pointer, with the focus ring alone.
- `Textarea` takes `grow`: the field also grows with lines that wrap (`field-sizing: content`), between `minRows` and `maxRows` times the 20px line.
- `Checkbox` and `Switch` reach a hit area of at least 24×24 again (WCAG 2.5.8) through an invisible `before`; what is drawn stays the same size.
- The read-only `PickerPill` pads 10px on either side, as a `Button` at size `sm` does, so its text no longer stands 2px off.
- New exports `controlPadX`, `controlPadEnd` and `controlPadXPx` (with the type `ControlPadSize`): the horizontal padding of a `Button` per size (`xs` 6px, `sm` 10px, `md` 12px, `lg` 16px) as a class, as the class for the end alone, and in pixels. `Button` and the read-only `PickerPill` read their padding from it, so a line that aligns with a button's text moves with it.
