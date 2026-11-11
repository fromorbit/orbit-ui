---
"@fromorbit/ui": patch
---

A floor of opacity for the translucent window, so its words stay legible (WCAG 1.4.3).

Under `data-translucent="true"`, `--nt-sidebar-background` was `transparent` and `--nt-panel-background` the canvas at 70%. Over a light material behind a dark window (or a dark one behind a light window), muted text in the sidebar fell to about 1.3:1. The sidebar now takes the frame and the panel the canvas at the lowest opacity at which `text`, `secondary` and `muted` hold 4.5:1 over the worst material, each layer counted alone: dark 90% (sidebar) and 93% (panel), light 96% and 92%. `--nt-app-background` stays the frame at 60%. `tokens.test.ts` holds the floor in both themes.
