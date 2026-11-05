---
"@fromorbit/ui": minor
---

`StatusMark` takes `size="sm"`: the shape at 8px with a softer glow in the same 14px slot, for the state that is the norm in its column (a paid invoice, a linked repository), so the one exception at the full size stands out. `SettingFoldRow` draws its status with that quiet mark (a circle for `success`, a diamond for `attention`, so it does not lean on colour) instead of a bare dot. `SettingRow` stretches its control to the row's width once it stands under the label (below 480px), so a full-width field there lines up with the rows around it. Additive.
