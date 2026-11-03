import { useState } from 'react'
import type { Story } from '../gallery/story'
import { IconButton } from '../primitives/IconButton'
import { Pill } from '../primitives/Pill'
import { nl } from '../testing/labels'
import { Chip } from './Chip'
import { Composer, type ComposerProps } from './Composer'
import { PickerPill } from './PickerPill'
import type { SearchListItem } from './SearchList'
import { StackedRowBranch } from './StackedRow'

const MODELS: SearchListItem[] = [
  { id: 'opus', label: 'Opus 5.5', detail: 'Grondig, voor lastig werk' },
  { id: 'sonnet', label: 'Sonnet 5', detail: 'Snel en precies' },
  { id: 'haiku', label: 'Haiku 5', detail: 'Kort en goedkoop' },
]

/** The tools of Orbit's composer: the round "+", the model and the access level. */
function Tools() {
  const [model, setModel] = useState('opus')
  return (
    <>
      <IconButton icon="plus" shape="round" outlined size="sm" label="Bijlage" />
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
      <Pill icon="shield">Bewerkingen</Pill>
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
    'Empty: the send button rests': () => <Live />,
    'With text: one emphasis, the send button': () => (
      <Live initial="Zet het lage tarief van 9% er ook in, met een test." />
    ),
    'A new chat: three rows and where it lands': () => (
      <Live minRows={3} footer={<StackedRowBranch name="nt/btw-tarieven" worktree />} />
    ),
    'With attachments': () => (
      <Live
        initial="Waarom wijken deze twee af?"
        attachments={
          <>
            <Chip
              label="factuur-2026-0412.pdf"
              remove={{ label: 'Haal factuur-2026-0412.pdf weg', onRemove: () => {} }}
            />
            <Chip
              label="export-boekhouding.csv"
              remove={{ label: 'Haal export-boekhouding.csv weg', onRemove: () => {} }}
            />
          </>
        }
      />
    ),
    'Running: Stop in place of send': () => (
      <Live running onStop={() => {}} initial="En daarna de facturen van" />
    ),
    'Off, with the reason': () => <Live disabledReason="Kies eerst een project om in te werken." />,
  },
} satisfies Story
