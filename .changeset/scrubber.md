---
"@fromorbit/ui": minor
---

`Scrubber`: the timeline of a recording. A track with the played part (quiet, not the accent), a playhead to drag or move with the keys (Radix's slider: one tab stop, arrows, Page Up and Page Down, Home and End; a press anywhere seeks), a marker per event in the shape of its kind (`dot`, `bar`, `diamond`, `ring`) and red or amber with the soft glow of the status marks for what went wrong, round times underneath (`scrubberTicks`) and an optional legend with a count per kind. With a mouse, a small label over the track names the time under the pointer and the event of a marker within reach. The thumb is drawn at zero width, so the playhead, the played part and the markers stand at exactly their share of the width. `adjacentMarker` finds the previous or next marker of given kinds, for "Vorige fout" and "Volgende fout". Additive.

`Slider`: the thumb is a dot in the foreground colour with a rim of the card plane. It was the accent's foreground, which is Midnight in dark, so the thumb vanished into the track there.
