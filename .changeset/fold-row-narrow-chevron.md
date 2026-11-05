---
"@fromorbit/ui": patch
---

`SettingFoldRow` under 480px: the chevron stays at the end of the first line, centred on the label, and only the status word goes to a line of its own under it. Before, the label took the whole first line and the chevron wrapped with the status to the start of the second, where it no longer read as the row's way open. No prop changes.
