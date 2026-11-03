---
"@fromorbit/ui": minor
---

`FormField` and `Form`, the form system. `FormField` puts the label above its control with a description or an error below it, and hands the control `id`, `aria-labelledby`, `aria-describedby`, `aria-invalid` and `aria-required` to spread (`{(field) => <Input label="…" {...field} />}`); the error replaces the description, carries a warning sign and is announced. `Form` switches the browser's own checks off and moves the focus to the first invalid field after a submit. `Input` gains `prefix` and `suffix` (text inside the frame, read as part of the description), and `Input`, `Textarea` and `Select` draw a danger border while `aria-invalid`; `Select` also takes `id`, `aria-invalid` and `aria-required`. Additive.
