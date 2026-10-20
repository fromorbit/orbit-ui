import type { Story } from '../gallery/story'
import { TooltipProvider } from '../overlays/Tooltip'
import { Icon } from '../primitives/Icon'
import { ProgressMeter } from '../primitives/ProgressMeter'
import { PropertyList } from './PropertyList'
import { StatusShape } from './StatusShape'

/** A plan under a spec: label in mono, title and its count, no bar; made-up names. */
function Plan({
  label,
  title,
  done,
  of,
}: {
  label: string
  title: string
  done: number
  of: number
}) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 font-mono text-[12px] text-muted">{label}</span>
      <span className="min-w-0 flex-1 truncate">{title}</span>
      <span className="shrink-0 font-mono text-[12px] text-muted tabular-nums">
        {done}/{of}
      </span>
    </span>
  )
}

/** The properties of SPEC-7, with made-up people and projects. */
function SpecProperties() {
  return (
    <TooltipProvider>
      <div className="w-80 bg-canvas p-3">
        <PropertyList
          label="Properties"
          groups={[
            [
              {
                label: 'Status',
                value: (
                  <span className="flex items-center gap-1.5">
                    <StatusShape kind="attention" />
                    In review
                  </span>
                ),
              },
              { label: 'Owner', value: 'Sanne Visser' },
              {
                label: 'Project',
                value: (
                  <span className="flex items-center gap-1.5">
                    <Icon name="folder" size="sm" tone="faint" />
                    webshop
                  </span>
                ),
              },
            ],
            [
              {
                label: 'Plans',
                value: (
                  <>
                    <Plan label="PLAN-10" title="Betaalstap" done={2} of={5} />
                    <Plan label="PLAN-11" title="Adres en verzending" done={0} of={3} />
                  </>
                ),
              },
              {
                label: 'Chats',
                value: (
                  <span className="flex items-center gap-1.5">
                    <StatusShape kind="running" label="Running" />
                    <span className="min-w-0 truncate">Betaalstap bouwen</span>
                  </span>
                ),
              },
            ],
            [
              { label: 'Check', value: 'Complete' },
              {
                label: 'Acceptance',
                value: (
                  <>
                    <span>9 of 12 criteria</span>
                    <span className="flex">
                      <ProgressMeter
                        valueText={(value, max) => `${value} van ${max}`}
                        value={9}
                        max={12}
                        label="Acceptance"
                        width="fill"
                        count={false}
                      />
                    </span>
                  </>
                ),
              },
            ],
          ]}
        />
      </div>
    </TooltipProvider>
  )
}

export default {
  group: 'patterns',
  title: 'PropertyList',
  states: {
    'The properties of a spec': () => <SpecProperties />,
    // Labels keep their column even when a value is long and wraps under itself.
    'A long value': () => (
      <div className="w-80 bg-canvas p-3">
        <PropertyList
          label="Properties"
          groups={[
            [
              { label: 'Owner', value: 'Someone with a name much longer than the column is wide' },
              { label: 'Project', value: 'boekhoud-api' },
            ],
          ]}
        />
      </div>
    ),
  },
} satisfies Story
