---
"@fromorbit/ui": minor
---

`FindingCard` and `SeverityBar`, the findings of a review. `FindingCard` is one finding as an `<article>` named by its title, on the card plane (`bg-overlay`, 12px, no frame): the sign of its weight in a column of its own beside the title, the weight's word and the place (a page or a file, in mono) in a 12px line under it, what was seen in 13px `secondary`, an optional row of `actions`, and `media` (a screenshot) at the right while the card is wide enough and under the words when it is not (a container query on the card). `headingLevel` sets the level of the title. `SeverityBar` counts findings per weight as a `ShareBar` heavy to light with the same signs and colours (`SEVERITY_SIGN`), leaves a weight of zero out, and is one calm line with a check (`labels.none`) when there is nothing. New `FindingSeverity`, `FINDING_SEVERITIES` and `SeverityBarLabels`. Additive.
