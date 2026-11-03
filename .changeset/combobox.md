---
"@fromorbit/ui": minor
---

`Combobox` and `MultiCombobox`: a choice out of a long list, found by typing. A button trigger like `Select`'s (it takes the props of `FormField` and `Field`, and `block` for a form column) opens a panel with a search field on top (the ARIA combobox, with `aria-activedescendant`) and a listbox below; the search ignores case and accents and matches every word in the label, `detail` or `keywords` (`filterComboboxOptions`). The multiple one toggles rows, keeps the panel open and lists the chosen labels or a count. New `COMBOBOX_PANEL` in the overlay frames. Additive.
