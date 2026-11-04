import type { Story } from '../gallery/story'
import { RelativeTime, type RelativeTimeLabels } from './RelativeTime'

/** The short units of the app, in Dutch as the gallery runs. */
const LABELS: RelativeTimeLabels = {
  now: 'nu',
  minutes: (count) => `${count} min`,
  hours: (count) => `${count} u`,
  days: (count) => `${count} d`,
  weeks: (count) => `${count} wk`,
}

/** A fixed moment, not the clock: a screenshot reference must read the same tomorrow. */
const now = Date.UTC(2026, 8, 19, 12, 0, 0)
const minute = 60_000
const hour = 60 * minute
const day = 24 * hour

const ages: [string, number][] = [
  ['Seconden', 30_000],
  ['Minuten', 5 * minute],
  ['Uren', 2 * hour],
  ['Dagen', 3 * day],
  ['Weken', 30 * day],
]

export default {
  group: 'patterns',
  title: 'RelativeTime',
  states: {
    'Hoe lang geleden': () => (
      <div className="flex flex-col gap-1 text-[11px] text-muted">
        {ages.map(([label, ago]) => (
          <div key={label} className="flex gap-3">
            <span className="w-16 text-fg">{label}</span>
            <RelativeTime at={now - ago} now={now} labels={LABELS} />
          </div>
        ))}
      </div>
    ),
  },
} satisfies Story
