---
"@fromorbit/ui": minor
---

`ChartFigure` and `ChartSvg`: a chart described as data (bar, line, area, pie or scatter), in the API and the look of the chart element of Orbit's desktop app, so the app can switch to the library. `ChartFigure` takes the block (`spec`: `type`, `x`, `y`, `data`, `title`, `source`), the host's `rows` for a block with a `source`, and its words as `labels` (`ChartFigureLabels`; Dutch in `@fromorbit/ui/testing`). `ChartSvg` takes the same `model`, `restLabel` and `onHover` as the desktop's drawing. The model and its axis come along from `chart-model`: `buildChartModel`, `chartPieSlices`, `CHART_SERIES_COLORS`, `CHART_MAX_SERIES`, `niceTicks`, `linearScale`, `formatTick`, with the types `ChartSpec`, `ChartRow`, `ChartModel`, `ChartModelSeries`, `ChartModelPoint`, `ChartSlice`, `ChartHover`. Own SVG, no library.

`Chart` takes the desktop's grid: dashed gridlines in `border-strong` above a solid baseline.
