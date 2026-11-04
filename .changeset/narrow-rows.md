---
"@fromorbit/ui": patch
---

Narrow rows keep their words. `Banner` moves its action under the sentence, at the end, once the bar is too narrow for both, instead of squeezing the sentence to a word a line. `SettingRow`, stacked under 480px, gives its label column the row's width, so a long explanation is cut at the card's edge rather than running past it. `SettingFoldRow` puts its status under the label under 480px, as `SettingRow` does with its control, so the explanation is not cut to a word or two.
