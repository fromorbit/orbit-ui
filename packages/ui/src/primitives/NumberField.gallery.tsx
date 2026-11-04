import type { Story } from '../gallery/story'
import { NumberField } from './NumberField'

export default {
  group: 'primitives',
  title: 'NumberField',
  states: {
    Waarde: () => (
      <NumberField label="Concurrent runs" value={4} min={1} max={16} onCommit={() => {}} />
    ),
    Maten: () => (
      <div className="flex flex-wrap items-center gap-2">
        <NumberField
          label="Concurrent runs"
          value={4}
          min={1}
          max={16}
          size="sm"
          onCommit={() => {}}
        />
        <NumberField label="Concurrent runs" value={4} min={1} max={16} onCommit={() => {}} />
        <NumberField
          label="Concurrent runs"
          value={4}
          min={1}
          max={16}
          size="lg"
          onCommit={() => {}}
        />
      </div>
    ),
    'Met een eenheid': () => (
      <NumberField
        label="Approval timeout"
        value={15}
        min={1}
        max={120}
        unit="min"
        onCommit={() => {}}
      />
    ),
    Duizendtallen: () => (
      <NumberField
        label="Tokens per task"
        value={200000}
        min={1000}
        max={100000000}
        unit="tokens"
        onCommit={() => {}}
      />
    ),
    'Op de grens': () => (
      <NumberField label="Concurrent runs" value={16} min={1} max={16} onCommit={() => {}} />
    ),
    Uitgeschakeld: () => (
      <NumberField
        label="Concurrent runs"
        value={4}
        min={1}
        max={16}
        disabled
        onCommit={() => {}}
      />
    ),
  },
} satisfies Story
