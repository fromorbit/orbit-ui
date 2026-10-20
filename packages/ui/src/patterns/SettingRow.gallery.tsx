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
      <div className={`${width} rounded-lg border border-border bg-surface`}>{children}</div>
    </TooltipProvider>
  )
}

/** A row around a `Switch` that really switches. */
function SwitchRow(
  props: Omit<SettingRowProps, 'children' | 'label' | 'labels'> & { label?: string },
) {
  const [on, setOn] = useState(true)
  const label = props.label ?? 'Network access'
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
    <SettingRow labels={nl.settingRow} {...props} label="Access level">
      {({ labelId, describedById, disabled }) => (
        <SegmentedControl
          label="Access level"
          aria-labelledby={labelId}
          aria-describedby={describedById}
          value={value}
          disabled={disabled}
          options={[
            { value: 'ask', label: 'Ask' },
            { value: 'auto', label: 'Automatic' },
            { value: 'full', label: 'Full access' },
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
        <ChoiceRow description="The default for a new chat" />
      </Card>
    ),
    'With a hint, no description': () => (
      <Card>
        <SwitchRow hint="Applies to every host a chat opens" />
      </Card>
    ),
    'Modified: reset offered': () => (
      <Card>
        <ChoiceRow
          description="The default for a new chat"
          modified
          onReset={() => undefined}
          resetLabel="Back to default: Ask"
        />
      </Card>
    ),
    'Project follows app': () => (
      <Card>
        <SwitchRow source="app" description="The default for a new chat" />
      </Card>
    ),
    'Project has its own value': () => (
      <Card>
        <SwitchRow
          source="project"
          description="The default for a new chat"
          modified
          onReset={() => undefined}
        />
      </Card>
    ),
    'App: a project differs': () => (
      <Card>
        <SwitchRow differs="Different in webwinkel" description="The default for a new chat" />
      </Card>
    ),
    'Signs and tags': () => (
      <Card>
        <SwitchRow label="Translucent window" restart scopes={['project', 'chat']} />
      </Card>
    ),
    Dimmed: () => (
      <Card>
        <SwitchRow label="Choose model" dimmed="Set an API key first" />
      </Card>
    ),
    Error: () => (
      <Card>
        <ChoiceRow description="The default for a new chat" error="Could not save the setting" />
      </Card>
    ),
    'Narrow: the control moves under the label': () => (
      <Card width="w-[400px]">
        <ChoiceRow description="The default for a new chat" modified onReset={() => undefined} />
      </Card>
    ),
    'A group of rows': () => (
      <Card>
        <div className="divide-y divide-border">
          <ChoiceRow description="The default for a new chat" />
          <SwitchRow />
          <SwitchRow label="Worktree per chat" scopes={['project']} />
        </div>
      </Card>
    ),
  },
} satisfies Story
