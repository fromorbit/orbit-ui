import { useState } from 'react'
import type { Story } from '../gallery/story'
import { Button } from '../primitives/Button'
import { IconButton } from '../primitives/IconButton'
import { nl } from '../testing/labels'
import { Chip } from './Chip'
import { Composer, type ComposerProps } from './Composer'
import { PickerPill } from './PickerPill'
import { PierreFileIcon } from './PierreFileIcon'
import type { SearchListItem } from './SearchList'
import { StackedRowBranch } from './StackedRow'

const MODELS: SearchListItem[] = [
  { id: 'opus', label: 'Opus 5.5', detail: 'Grondig, voor lastig werk' },
  { id: 'sonnet', label: 'Sonnet 5', detail: 'Snel en precies' },
  { id: 'haiku', label: 'Haiku 5', detail: 'Kort en goedkoop' },
]

/** What the agent may do in this chat: the whole name in the list, a short word in the pill. */
const ACCESS: (SearchListItem & { short: string })[] = [
  { id: 'read', label: 'Alleen lezen', short: 'Lezen', detail: 'Leest bestanden, verandert niets' },
  {
    id: 'edit',
    label: 'Mag bewerken',
    short: 'Bewerken',
    detail: 'Bewerkt bestanden, vraagt voor commando’s',
  },
  {
    id: 'full',
    label: 'Volledige toegang',
    short: 'Alles',
    detail: 'Bewerkt en voert commando’s uit',
  },
]

/**
 * The tools of Orbit's composer: the round "+", the model and the access level, three quiet
 * controls of one height. The access level keeps a short word at every width: a bare shield would
 * not say whether the agent may only read or may change files.
 */
function Tools() {
  const [model, setModel] = useState('opus')
  const [access, setAccess] = useState('edit')
  return (
    <>
      <IconButton icon="plus" shape="round" size="sm" label="Bijlage toevoegen" />
      <PickerPill
        listLabels={nl.list}
        label="Model"
        icon="sparkles"
        value={MODELS.find((item) => item.id === model)?.label ?? ''}
        items={MODELS}
        selectedId={model}
        onSelect={setModel}
        searchable={false}
      />
      <PickerPill
        listLabels={nl.list}
        label="Toegang"
        icon="shield"
        value={ACCESS.find((item) => item.id === access)?.short ?? ''}
        items={ACCESS}
        selectedId={access}
        onSelect={setAccess}
        searchable={false}
      />
    </>
  )
}

/** A composer with its own draft, in the width of a conversation's column. */
function Live({
  initial = '',
  ...props
}: { initial?: string } & Omit<ComposerProps, 'labels' | 'value' | 'onValueChange' | 'onSend'>) {
  const [value, setValue] = useState(initial)
  return (
    <div className="w-full max-w-[720px]">
      <Composer
        labels={nl.composer}
        placeholder="Vraag iets of geef een opdracht…"
        value={value}
        onValueChange={setValue}
        onSend={() => setValue('')}
        tools={<Tools />}
        {...props}
      />
    </div>
  )
}

export default {
  group: 'patterns',
  title: 'Composer',
  states: {
    'Leeg: de verstuurknop rust': () => <Live />,
    'Met tekst: één nadruk, de verstuurknop': () => (
      <Live initial="Zet het lage tarief van 9% er ook in, met een test." />
    ),
    'Een nieuw gesprek: drie regels en waar het landt': () => (
      <Live
        minRows={3}
        footer={
          <>
            Start op een nieuwe branch:
            <StackedRowBranch name="nt/btw-tarieven" worktree />
          </>
        }
      />
    ),
    'Met bijlagen': () => (
      <Live
        initial="Waarom wijken deze twee af?"
        attachments={
          <>
            <Chip
              size="sm"
              truncate="middle"
              icon={<PierreFileIcon path="factuur-2026-0412.pdf" />}
              label="factuur-2026-0412.pdf"
              remove={{ label: 'Haal factuur-2026-0412.pdf weg', onRemove: () => {} }}
            />
            <Chip
              size="sm"
              truncate="middle"
              icon={<PierreFileIcon path="export-boekhouding.csv" />}
              label="export-boekhouding.csv"
              remove={{ label: 'Haal export-boekhouding.csv weg', onRemove: () => {} }}
            />
          </>
        }
      />
    ),
    'Bezig: Stoppen in plaats van versturen': () => (
      <Live running onStop={() => {}} initial="En daarna de facturen van" />
    ),
    'Uit, met de reden': () => (
      <Live
        disabledReason="Kies eerst een project om in te werken."
        disabledAction={
          <Button variant="primary" size="sm">
            Kies project
          </Button>
        }
      />
    ),
  },
} satisfies Story
