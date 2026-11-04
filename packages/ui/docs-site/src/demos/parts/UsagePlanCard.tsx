import type { ReactNode } from 'react'
import { Button, Icon, Tag } from '../../../../src'
import { Missing } from '../../demo-kit/Missing'

/** The plan of the workspace, drawn as the missing `PlanCard`. */
export function UsagePlanCard(): ReactNode {
  return (
    <Missing name="PlanCard" className="h-full">
      <div className="flex h-full flex-col gap-4 rounded-lg bg-overlay p-4">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[13px] text-fg">Team</span>
          <Tag tone="success">Huidig plan</Tag>
        </div>
        <p className="m-0 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
          <span className="whitespace-nowrap font-heading text-[20px] text-fg leading-none tabular-nums">
            € 24
          </span>
          <span className="text-[12px] text-muted">per lid per maand, excl. btw</span>
        </p>
        <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[13px] text-secondary">
          {[
            'Onbeperkt gesprekken en specs',
            '250 agent-uren per maand',
            'Orbit Review op 10 repositories',
            '50 GB opslag voor opnames',
          ].map((line) => (
            <li key={line} className="flex items-center gap-2">
              <Icon name="check" size="sm" />
              {line}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-[12px] text-muted">6 leden · € 174,24 per maand</span>
          <Button variant="secondary" size="sm">
            Wijzigen
          </Button>
        </div>
      </div>
    </Missing>
  )
}
