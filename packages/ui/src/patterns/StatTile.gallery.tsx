import type { Story } from '../gallery/story'
import { ProgressMeter } from '../primitives/ProgressMeter'
import { TrendBadge } from '../primitives/TrendBadge'
import { StatTile } from './StatTile'

export default {
  group: 'patterns',
  title: 'StatTile',
  states: {
    'A row of tiles': () => (
      <div className="grid w-full max-w-[48rem] grid-cols-3 gap-3">
        <StatTile
          label="Actieve spaces"
          value="1.284"
          trend={<TrendBadge value="12%" direction="up" tone="good" description="12% gestegen" />}
          comparison="t.o.v. vorige week"
        />
        <StatTile
          label="Mislukte builds"
          value="23"
          trend={<TrendBadge value="8" direction="down" tone="good" description="8 minder" />}
          comparison="t.o.v. vorige week"
        />
        <StatTile
          label="Kosten deze maand"
          value="€ 1.940"
          trend={<TrendBadge value="€ 240" direction="up" tone="bad" description="€ 240 meer" />}
          comparison="t.o.v. oktober"
        />
      </div>
    ),
    'With a meter': () => (
      <div className="w-64">
        <StatTile label="Opslag" value="38 GB">
          <ProgressMeter
            label="Opslag"
            value={38}
            max={50}
            width="fill"
            valueText={(v, m) => `${v} van ${m} GB`}
          />
        </StatTile>
      </div>
    ),
  },
} satisfies Story
