import { type ReactNode, useState } from 'react'
import type { Story } from '../gallery/story'
import { TooltipProvider } from '../overlays/Tooltip'
import { SettingSwitchRow, type SettingSwitchRowProps } from './SettingSwitchRow'
import { SettingsGroup } from './SettingsGroup'

/** The group a row stands in on the screen, at the width of the settings column. */
function Group({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <div className="w-full max-w-[560px]">
        <SettingsGroup title="Reviews">{children}</SettingsGroup>
      </div>
    </TooltipProvider>
  )
}

/** A row that really switches. */
function Row({
  initial,
  ...props
}: Omit<SettingSwitchRowProps, 'checked' | 'onCheckedChange'> & { initial: boolean }) {
  const [on, setOn] = useState(initial)
  return <SettingSwitchRow {...props} checked={on} onCheckedChange={setOn} />
}

export default {
  group: 'patterns',
  title: 'SettingSwitchRow',
  states: {
    Aan: () => (
      <Group>
        <Row label="Concepten overslaan" initial />
      </Group>
    ),
    Uit: () => (
      <Group>
        <Row label="Concepten overslaan" initial={false} />
      </Group>
    ),
    'Met uitleg': () => (
      <Group>
        <Row
          label="Elke nieuwe pull request beoordelen"
          description="Lens begint als een pull request opent en na elke push"
          initial
        />
        <Row
          label="Wachten op de Trail-run voor goedkeuring"
          description="Lens keurt goed nadat de suites op de Halo-space zijn geslaagd. Een run die nog loopt, houdt de goedkeuring tegen."
          initial={false}
        />
      </Group>
    ),
    Repository: () => (
      <Group>
        <Row
          label="zilverberg/webwinkel"
          labelContent={<span className="font-mono">zilverberg/webwinkel</span>}
          meta="Assertief"
          initial
        />
        <Row
          label="zilverberg/kassa"
          labelContent={<span className="font-mono">zilverberg/kassa</span>}
          meta="Rustig"
          initial={false}
        />
      </Group>
    ),
    Gedimd: () => (
      <Group>
        <Row
          label="Een fix voorstellen bij een bevinding"
          description="De auteur commit het voorstel vanuit de pull request"
          dimmed="Koppel eerst een repository"
          initial={false}
        />
      </Group>
    ),
  },
} satisfies Story
