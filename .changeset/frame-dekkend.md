---
"@fromorbit/ui": patch
---

The frame of a translucent window (`--nt-app-background` under `data-translucent="true"`) takes the tint of Midnight or Paper at 85% instead of 60%, in both themes. The rail and the top bar around the floating plane now follow the family's tint with only a hint of the window material; at 60% the grey of the macOS material came through and the frame no longer matched the deep blue of the plane. Nothing else changes: the sidebar, the panel and the side panel keep their floors (90–96%), and no token, export or subpath is added, removed or renamed. A host that compares this colour in a test or a screenshot needs a new reference.
