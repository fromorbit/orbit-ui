---
"@fromorbit/ui": minor
---

`OtpInput`: a one-time code in separate boxes. One invisible `<input>` lies over the boxes, so pasting "123 456" fills them all, the browser offers a code from a message (`autocomplete="one-time-code"`), Backspace works and a screen reader meets one field; `onComplete` fires once when the last box fills. Digits or letters and digits (`cleanOtp`), `groupAfter` for a gap, and the props of `FormField`. Additive.
