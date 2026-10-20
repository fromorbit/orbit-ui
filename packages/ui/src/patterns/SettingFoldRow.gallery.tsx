import { useState } from 'react'
import type { Story } from '../gallery/story'
import { TooltipProvider } from '../overlays/Tooltip'
import { Input } from '../primitives/Input'
import { NumberField } from '../primitives/NumberField'
import { nl } from '../testing/labels'
import { SettingFoldRow } from './SettingFoldRow'
import { SettingRow } from './SettingRow'
import { SettingsGroup } from './SettingsGroup'

function ProgramRow() {
  const [value, setValue] = useState('')
  return (
    <SettingRow labels={nl.settingRow} label="Program">
      {({ labelId, describedById }) => (
        <Input
          label="Program"
          aria-labelledby={labelId}
          aria-describedby={describedById}
          value={value}
          placeholder="lumen"
          maxLength={200}
          onChange={(event) => setValue(event.target.value)}
        />
      )}
    </SettingRow>
  )
}

/** The card of the agents as the settings screen draws it, with a number row under it to align. */
function Agents({ open }: { open: boolean }) {
  return (
    <TooltipProvider>
      <div className="flex w-[560px] flex-col gap-6">
        <SettingsGroup title="Agents">
          <SettingFoldRow
            label="Nova"
            description="4 models"
            status={{ tone: 'success', label: 'Ready' }}
          />
          <SettingFoldRow
            label="Lumen"
            description="2 models"
            status={{ tone: 'success', label: 'Ready' }}
            defaultOpen={open}
          >
            <ProgramRow />
          </SettingFoldRow>
          <SettingFoldRow
            label="Orbit"
            description="Signed out: run orbit login"
            status={{ tone: 'attention', label: 'Sign-in needed' }}
          />
          <SettingFoldRow
            label="Vega"
            description="vega is not on the PATH"
            status={{ tone: 'off', label: 'Not found' }}
          />
        </SettingsGroup>
        <SettingsGroup title="Queue">
          <SettingRow
            labels={nl.settingRow}
            label="Concurrent turns"
            description="What comes above waits in line"
          >
            {({ labelId, describedById }) => (
              <NumberField
                label="Concurrent turns"
                aria-labelledby={labelId}
                aria-describedby={describedById}
                value={4}
                min={1}
                max={16}
                onCommit={() => undefined}
              />
            )}
          </SettingRow>
          <SettingRow labels={nl.settingRow} label="Waiting time">
            {({ labelId, describedById }) => (
              <NumberField
                label="Waiting time"
                aria-labelledby={labelId}
                aria-describedby={describedById}
                value={5}
                min={1}
                max={120}
                unit="min"
                onCommit={() => undefined}
              />
            )}
          </SettingRow>
        </SettingsGroup>
      </div>
    </TooltipProvider>
  )
}

export default {
  group: 'patterns',
  title: 'SettingFoldRow',
  states: {
    'Agents, folded': () => <Agents open={false} />,
    'Agents, one open': () => <Agents open />,
  },
} satisfies Story
