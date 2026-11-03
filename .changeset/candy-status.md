---
"@fromorbit/ui": minor
---

`StatusMark`, the status of something that runs as a small mark with a soft glow: a circle `running`, a triangle `fault` (softer, with rounded corners), a diamond `blocked`, a square `stopped`. A flat fill in its status colour with a glow of that colour around it; the triangle's glow is a `drop-shadow`, because its `clip-path` cuts a `box-shadow` off. Drawn by `theme.css` (`nt-status-mark`) from new tokens in both themes, the names Halo uses for its own: `--nt-status-{run,fail,block,stop}` (the family's status colours; running is mint on Midnight) and `--nt-status-glow` (1 in dark, 0.22 in light). Additive: no existing token or component changes; a host needs the new `tokens.css` and `theme.css` with the new `dist/`.
