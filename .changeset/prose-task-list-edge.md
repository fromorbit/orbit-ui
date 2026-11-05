---
"@fromorbit/ui": patch
---

`Prose` task lists: the words of a task item start right after its box, without the space GFM leaves there, so a wrapped second line lines up with the first under the hanging indent. A list made of tasks only drops the 16px marker indent, so its boxes stand on the left edge of the text and the label above them; a mixed list keeps its indent, so its boxes still line up with its bullets.
