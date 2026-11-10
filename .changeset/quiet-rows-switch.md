---
"@fromorbit/ui": minor
---

`Switch` takes the switch of the family: off is an outlined track in the edge of an empty box (`control-border`, 1.5px) with a muted thumb, on is the neutral `accent` fill with a thumb in `accent-fg`. The thumb is 11px in both states (was 14px with a hairline). The size of the track (32×18) and the behaviour are unchanged. A visible change for every host: check the screenshots of every screen with a switch; the gallery stories of `Switch` show the new look under the same names.

`SettingSwitchRow`: a setting that is on or off, in which the whole row is the switch's label. Title (`label`, or `labelContent` such as a repository in DM Mono) and an explanation that wraps (`description`) on the left, quiet `meta` and the `Switch` on the right; `dimmed` turns the switch off and says why. The measures of a `SettingRow`: 48px at the least, 64px with one line of explanation. Additive.

`SettingsGroup` draws its rows as an outlined region in both themes: a hairline in `border` round the rows and between them, 12px corners, and no fill or shadow (it was `bg-plane shadow-plane` since 0.4.0); it clips its rows to its corners. `PlanCard` with `plane="surface"` is now a tinted card beside outlined groups, no longer on the tint the groups shared. A host that relied on the white card of a group in light, or put a group on a plane of its own, should check that the hairline still parts it.
