---
"@fromorbit/ui": minor
---

`Calendar` and `DatePicker`, without a date library. `Calendar` is a month of day buttons with the keys of the ARIA date picker (arrows, Page Up/Down with Shift for a year, Home/End), one tab stop, month and weekday names from `Intl` in the provider's locale, `min`, `max` and `isDisabled` (such days stay reachable but cannot be chosen), and today marked. Days are `YYYY-MM-DD` (`IsoDate`), so no zone ever shifts a day; `addDays`, `addMonths`, `monthGrid`, `isIsoDate` and `todayIso` are exported. `DatePicker` opens it under a trigger that shows the day in the locale and takes the props of `FormField`. `Icon` gains `calendar` and `upload`. Additive.
