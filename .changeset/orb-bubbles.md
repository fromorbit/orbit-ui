---
"@fromorbit/ui": minor
---

Orb in bubbles. `ChatMessage` takes `shape="bubble"`, a conversation as in a messaging app: your bubble on the right (corners 16/16/4/16), the other's on the left as a card with a hairline and a `mark` before it (16/16/16/4), at most 300px wide, with an optional `source` line above the bubble and its `actions` as chips under it. `TypingDots` is the "typt…" state: three dots that fade in turn and stand still under `prefers-reduced-motion`. New: `OrbMark`, a flat sphere in three sizes (16, 22 and 40px) with a deeper shade at the lower right and no gradient, decorative unless it is given a `label`; `UnreadBadge`, the count of unread messages; and `QuickActions` with `QuickAction`, the chips under a bubble. New tokens: `--nt-orb`, `--nt-orb-deep`, `--nt-unread` (Tailwind `orb`, `orb-deep`, `unread`) and `--nt-radius-bubble` (16px, `rounded-bubble`).
