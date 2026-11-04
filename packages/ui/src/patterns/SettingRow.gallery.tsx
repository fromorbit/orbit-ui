import { type ReactNode, useState } from 'react'
import type { Story } from '../gallery/story'
import { TooltipProvider } from '../overlays/Tooltip'
import { SegmentedControl } from '../primitives/SegmentedControl'
import { Switch } from '../primitives/Switch'
import { nl } from '../testing/labels'
import { SettingRow, type SettingRowProps } from './SettingRow'

/** The card a row stands in on the screen, at the width of the settings column. */
function Card({ width = 'w-[560px]', children }: { width?: string; children: ReactNode }) {
  return (
    <TooltipProvider>
      <div className={`${width} rounded-lg bg-surface`}>{children}</div>
    </TooltipProvider>
  )
}

/** A row around a `Switch` that really switches. */
function SwitchRow(
  props: Omit<SettingRowProps, 'children' | 'label' | 'labels'> & { label?: string },
) {
  const [on, setOn] = useState(true)
  const label = props.label ?? 'Netwerktoegang'
  return (
    <SettingRow labels={nl.settingRow} {...props} label={label}>
      {({ labelId, describedById, disabled }) => (
        <Switch
          label={label}
          aria-labelledby={labelId}
          aria-describedby={describedById}
          checked={on}
          disabled={disabled}
          onCheckedChange={setOn}
        />
      )}
    </SettingRow>
  )
}

/** A row around a three-way choice, the widest control a row usually holds. */
function ChoiceRow(props: Omit<SettingRowProps, 'children' | 'label' | 'labels'>) {
  const [value, setValue] = useState('auto')
  return (
    <SettingRow labels={nl.settingRow} {...props} label="Toegang">
      {({ labelId, describedById, disabled }) => (
        <SegmentedControl
          label="Toegang"
          aria-labelledby={labelId}
          aria-describedby={describedById}
          value={value}
          disabled={disabled}
          options={[
            { value: 'ask', label: 'Vragen' },
            { value: 'auto', label: 'Automatisch' },
            { value: 'full', label: 'Volledig' },
          ]}
          onValueChange={setValue}
        />
      )}
    </SettingRow>
  )
}

export default {
  group: 'patterns',
  title: 'SettingRow',
  states: {
    Plain: () => (
      <Card>
        <SwitchRow />
      </Card>
    ),
    'With a description': () => (
      <Card>
        <ChoiceRow description="De standaard voor een nieuw gesprek" />
      </Card>
    ),
    'With a hint, no description': () => (
      <Card>
        <SwitchRow hint="Geldt voor elke host die een gesprek opent" />
      </Card>
    ),
    'Modified: reset offered': () => (
      <Card>
        <ChoiceRow
          description="De standaard voor een nieuw gesprek"
          modified
          onReset={() => undefined}
          resetLabel="Terug naar standaard: Vragen"
        />
      </Card>
    ),
    'Project follows app': () => (
      <Card>
        <SwitchRow source="app" description="De standaard voor een nieuw gesprek" />
      </Card>
    ),
    'Project has its own value': () => (
      <Card>
        <SwitchRow
          source="project"
          description="De standaard voor een nieuw gesprek"
          modified
          onReset={() => undefined}
        />
      </Card>
    ),
    'App: a project differs': () => (
      <Card>
        <SwitchRow
          differs="Anders in webwinkel"
          description="De standaard voor een nieuw gesprek"
        />
      </Card>
    ),
    'Signs and tags': () => (
      <Card>
        <SwitchRow label="Doorschijnend venster" restart scopes={['project', 'chat']} />
      </Card>
    ),
    Dimmed: () => (
      <Card>
        <SwitchRow label="Model kiezen" dimmed="Stel eerst een API-sleutel in" />
      </Card>
    ),
    Error: () => (
      <Card>
        <ChoiceRow
          description="De standaard voor een nieuw gesprek"
          error="De instelling is niet opgeslagen"
        />
      </Card>
    ),
    'Narrow: the control moves under the label': () => (
      <Card width="w-full max-w-[400px]">
        <ChoiceRow
          description="De standaard voor een nieuw gesprek"
          modified
          onReset={() => undefined}
        />
      </Card>
    ),
    'A group of rows': () => (
      <Card>
        <div className="divide-y divide-border">
          <ChoiceRow description="De standaard voor een nieuw gesprek" />
          <SwitchRow />
          <SwitchRow label="Worktree per gesprek" scopes={['project']} />
        </div>
      </Card>
    ),
  },
} satisfies Story
