import type { Story } from '../gallery/story'
import { NumberField } from './NumberField'

export default {
  group: 'primitives',
  title: 'NumberField',
  states: {
    Value: () => (
      <NumberField label="Concurrent runs" value={4} min={1} max={16} onCommit={() => {}} />
    ),
    Sizes: () => (
      <div className="flex items-center gap-2">
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
    'With a unit': () => (
      <NumberField
        label="Approval timeout"
        value={15}
        min={1}
        max={120}
        unit="min"
        onCommit={() => {}}
      />
    ),
    'Thousands separators': () => (
      <NumberField
        label="Tokens per task"
        value={200000}
        min={1000}
        max={100000000}
        unit="tokens"
        onCommit={() => {}}
      />
    ),
    'At the limit': () => (
      <NumberField label="Concurrent runs" value={16} min={1} max={16} onCommit={() => {}} />
    ),
    Disabled: () => (
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
