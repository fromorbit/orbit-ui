import { useState } from 'react'
import type { Story } from '../gallery/story'
import { TooltipProvider } from '../overlays/Tooltip'
import { Button } from '../primitives/Button'
import { Switch } from '../primitives/Switch'
import { nl } from '../testing/labels'
import { SettingRow } from './SettingRow'
import { SettingsGroup } from './SettingsGroup'

function Row({ label, description }: { label: string; description?: string }) {
  const [on, setOn] = useState(false)
  return (
    <SettingRow labels={nl.settingRow} label={label} {...(description ? { description } : {})}>
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

export default {
  group: 'patterns',
  title: 'SettingsGroup',
  states: {
    'Heading and rows': () => (
      <TooltipProvider>
        <div className="w-full max-w-[560px]">
          <SettingsGroup title="Nieuwe gesprekken">
            <Row label="Netwerktoegang" description="De standaard voor een nieuw gesprek" />
            <Row label="Worktree per gesprek" />
          </SettingsGroup>
        </div>
      </TooltipProvider>
    ),
    'An action in the heading': () => (
      <TooltipProvider>
        <div className="w-full max-w-[560px]">
          <SettingsGroup
            title="Extensies"
            action={
              <Button size="sm" variant="secondary">
                Toevoegen…
              </Button>
            }
          >
            <Row label="Extensies" />
          </SettingsGroup>
        </div>
      </TooltipProvider>
    ),
    'Empty: only the heading and its action': () => (
      <div className="w-full max-w-[560px]">
        <SettingsGroup
          title="Extensies"
          action={
            <Button size="sm" variant="secondary">
              Toevoegen…
            </Button>
          }
        >
          {null}
        </SettingsGroup>
      </div>
    ),
    'Two groups, stacked': () => (
      <TooltipProvider>
        <div className="flex w-full max-w-[560px] flex-col gap-6">
          <SettingsGroup title="Nieuwe gesprekken">
            <Row label="Netwerktoegang" />
          </SettingsGroup>
          <SettingsGroup title="Git">
            <Row label="Worktree per gesprek" />
          </SettingsGroup>
        </div>
      </TooltipProvider>
    ),
  },
} satisfies Story
