---
"@fromorbit/ui": minor
---

`DataTable` and `Pagination`. `DataTable` is a real `<table>` with sortable headers (a button in the `<th>`, `aria-sort`, stable sort in the locale's order with `sortRows`, or a sort held by the caller), a column of row boxes with a select-all box that shows mixed, amounts aligned to the end on tabular figures, placeholder rows and `aria-busy` while loading, an empty slot across every column, columns that step aside below a width of the table itself (`@container`), and a list of cards for a narrow table (`card`). `Pagination` is a named `nav` with the count, the pages around the current one (`pageItems`: never a gap of one page, seven places at most), `aria-current="page"`, and an optional page size. Additive.
