---
'@fromorbit/ui': patch
---

`AppRail`: the open item no longer has the 4px satellite beside it. It is shown by its neutral plane (`row-active`), its words at full strength and `aria-current="page"` alone. `AppRailItem`'s `product` prop does nothing any more and is deprecated; the item no longer sets `data-product`.
