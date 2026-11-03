---
"@fromorbit/ui": minor
---

`StatusMark`, the status of something that runs as a small glossy sweet: a circle `running`, a triangle `fault`, a diamond `blocked`, a square `stopped`. A highlight over a body that darkens toward its edge, and a soft glow in its own colour; inside a button, link, tab or option it springs to 1.18 under the pointer, never with reduced motion. Drawn by `theme.css` (`nt-status-mark`) from new tokens in both themes, the names Halo uses for its own: `--nt-status-{run,fail,block,stop}` (the family's status colours; running is mint on Midnight) and their `-hi` highlights, `--nt-status-glow` (1 in dark, 0.45 in light) and `--nt-status-gloss` (1 and 0.5). Additive: no existing token or component changes; a host needs the new `tokens.css` and `theme.css` with the new `dist/`.
