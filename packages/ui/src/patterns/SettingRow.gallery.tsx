import { type ReactNode, useState } from 'react'
import type { Story } from '../gallery/story'
import { TooltipProvider } from '../overlays/Tooltip'
import { SegmentedControl } from '../primitives/SegmentedControl'
import { Switch } from '../primitives/Switch'
import { nl } from '../testing/labels'
import { SettingRow, type SettingRowProps } from './SettingRow'

/**
 * The card a row stands in on the screen, at the width of the settings column: the outlined
 * region of a `SettingsGroup`, a hairline without a fill.
 */
function Card({
  width = 'w-full max-w-[560px]',
  children,
}: {
  width?: string
  children: ReactNode
}) {
  return (
    <TooltipProvider>
      <div className={`${width} rounded-lg border border-border`}>{children}</div>
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
    Eenvoudig: () => (
      <Card>
        <SwitchRow />
      </Card>
    ),
    'Met een beschrijving': () => (
      <Card>
        <ChoiceRow description="De standaard voor een nieuw gesprek" />
      </Card>
    ),
    'Met een hint, zonder beschrijving': () => (
      <Card>
        <SwitchRow hint="Geldt voor elke host die een gesprek opent" />
      </Card>
    ),
    'Gewijzigd: herstellen aangeboden': () => (
      <Card>
        <ChoiceRow
          description="De standaard voor een nieuw gesprek"
          modified
          onReset={() => undefined}
          resetLabel="Terug naar standaard: Vragen"
        />
      </Card>
    ),
    'Project volgt de app': () => (
      <Card>
        <SwitchRow source="app" description="De standaard voor een nieuw gesprek" />
      </Card>
    ),
    'Project heeft een eigen waarde': () => (
      <Card>
        <SwitchRow
          source="project"
          description="De standaard voor een nieuw gesprek"
          modified
          onReset={() => undefined}
        />
      </Card>
    ),
    'App: een project wijkt af': () => (
      <Card>
        <SwitchRow
          differs="Anders in webwinkel"
          description="De standaard voor een nieuw gesprek"
        />
      </Card>
    ),
    'Tekens en tags': () => (
      <Card>
        <SwitchRow label="Doorschijnend venster" restart scopes={['project', 'chat']} />
      </Card>
    ),
    Gedimd: () => (
      <Card>
        <SwitchRow label="Model kiezen" dimmed="Stel eerst een API-sleutel in" />
      </Card>
    ),
    Fout: () => (
      <Card>
        <ChoiceRow
          description="De standaard voor een nieuw gesprek"
          error="De instelling is niet opgeslagen"
        />
      </Card>
    ),
    'Smal: de bediening gaat onder het label': () => (
      <Card width="w-full max-w-[400px]">
        <ChoiceRow
          description="De standaard voor een nieuw gesprek"
          modified
          onReset={() => undefined}
        />
      </Card>
    ),
    'Een groep rijen': () => (
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
