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
        <div className="w-[560px]">
          <SettingsGroup title="New chats">
            <Row label="Network access" description="The default for a new chat" />
            <Row label="Worktree per chat" />
          </SettingsGroup>
        </div>
      </TooltipProvider>
    ),
    'An action in the heading': () => (
      <TooltipProvider>
        <div className="w-[560px]">
          <SettingsGroup
            title="Extensions"
            action={
              <Button size="sm" variant="secondary">
                Add…
              </Button>
            }
          >
            <Row label="Extensions" />
          </SettingsGroup>
        </div>
      </TooltipProvider>
    ),
    'Empty: only the heading and its action': () => (
      <div className="w-[560px]">
        <SettingsGroup
          title="Extensions"
          action={
            <Button size="sm" variant="secondary">
              Add…
            </Button>
          }
        >
          {null}
        </SettingsGroup>
      </div>
    ),
    'Two groups, stacked': () => (
      <TooltipProvider>
        <div className="flex w-[560px] flex-col gap-6">
          <SettingsGroup title="New chats">
            <Row label="Network access" />
          </SettingsGroup>
          <SettingsGroup title="Git">
            <Row label="Worktree per chat" />
          </SettingsGroup>
        </div>
      </TooltipProvider>
    ),
  },
} satisfies Story
