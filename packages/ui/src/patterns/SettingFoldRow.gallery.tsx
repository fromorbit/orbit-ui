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
    <SettingRow labels={nl.settingRow} label="Programma">
      {({ labelId, describedById }) => (
        <Input
          label="Programma"
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
      <div className="flex w-full max-w-[560px] flex-col gap-6">
        <SettingsGroup title="Agents">
          <SettingFoldRow
            label="Nova"
            description="4 modellen"
            status={{ tone: 'success', label: 'Klaar' }}
          />
          <SettingFoldRow
            label="Lumen"
            description="2 modellen"
            status={{ tone: 'success', label: 'Klaar' }}
            defaultOpen={open}
          >
            <ProgramRow />
          </SettingFoldRow>
          <SettingFoldRow
            label="Orbit"
            description="Afgemeld: voer orbit login uit"
            status={{ tone: 'attention', label: 'Aanmelden nodig' }}
          />
          <SettingFoldRow
            label="Vega"
            description="vega staat niet in het PATH"
            status={{ tone: 'off', label: 'Niet gevonden' }}
          />
        </SettingsGroup>
        <SettingsGroup title="Wachtrij">
          <SettingRow
            labels={nl.settingRow}
            label="Beurten tegelijk"
            description="Wat erboven komt, wacht op zijn beurt"
          >
            {({ labelId, describedById }) => (
              <NumberField
                label="Beurten tegelijk"
                aria-labelledby={labelId}
                aria-describedby={describedById}
                value={4}
                min={1}
                max={16}
                onCommit={() => undefined}
              />
            )}
          </SettingRow>
          <SettingRow labels={nl.settingRow} label="Wachttijd">
            {({ labelId, describedById }) => (
              <NumberField
                label="Wachttijd"
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
    'Agents, ingeklapt': () => <Agents open={false} />,
    'Agents, één open': () => <Agents open />,
    // As wide as a phone: the status goes under the name, the chevron stays at the end.
    'Smal, als op een telefoon': () => (
      <TooltipProvider>
        <div className="w-full max-w-[358px]">
          <SettingsGroup title="Koppeling">
            <SettingFoldRow label="Omgeving" description="Wat Review op deze machine nodig heeft">
              <ProgramRow />
            </SettingFoldRow>
            <SettingFoldRow
              label="Vega"
              description="vega staat niet in het PATH"
              status={{ tone: 'off', label: 'Niet gevonden' }}
            >
              <ProgramRow />
            </SettingFoldRow>
          </SettingsGroup>
        </div>
      </TooltipProvider>
    ),
  },
} satisfies Story
