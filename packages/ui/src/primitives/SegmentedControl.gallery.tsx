import type { Story } from '../gallery/story'
import { Button } from './Button'
import { SegmentedControl } from './SegmentedControl'

export default {
  group: 'primitives',
  title: 'SegmentedControl',
  states: {
    'Twee opties': () => (
      <SegmentedControl
        label="Translucent window"
        value="auto"
        options={[
          { value: 'auto', label: 'Automatisch' },
          { value: 'off', label: 'Uit' },
        ]}
        onValueChange={() => {}}
      />
    ),
    'Drie opties': () => (
      <SegmentedControl
        label="Text size"
        value="medium"
        options={[
          { value: 'small', label: 'Klein' },
          { value: 'medium', label: 'Middel' },
          { value: 'large', label: 'Groot' },
        ]}
        onValueChange={() => {}}
      />
    ),
    'Vier opties': () => (
      <SegmentedControl
        label="Density"
        value="b"
        options={[
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
          { value: 'c', label: 'C' },
          { value: 'd', label: 'D' },
        ]}
        onValueChange={() => {}}
      />
    ),
    // A setting that another setting switches off is disabled rather than hidden, so the reader
    // sees what the choice would have been; the whole group dims, the checked segment included.
    Uitgeschakeld: () => (
      <SegmentedControl
        label="Text size"
        value="medium"
        disabled
        options={[
          { value: 'small', label: 'Klein' },
          { value: 'medium', label: 'Middel' },
          { value: 'large', label: 'Groot' },
        ]}
        onValueChange={() => {}}
      />
    ),
    Maten: () => (
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          label="Translucent window"
          size="sm"
          value="auto"
          options={[
            { value: 'auto', label: 'Automatisch' },
            { value: 'off', label: 'Uit' },
          ]}
          onValueChange={() => {}}
        />
        <SegmentedControl
          label="Translucent window"
          value="auto"
          options={[
            { value: 'auto', label: 'Automatisch' },
            { value: 'off', label: 'Uit' },
          ]}
          onValueChange={() => {}}
        />
        <SegmentedControl
          label="Translucent window"
          size="lg"
          value="auto"
          options={[
            { value: 'auto', label: 'Automatisch' },
            { value: 'off', label: 'Uit' },
          ]}
          onValueChange={() => {}}
        />
      </div>
    ),
    // Last, so it moves no reference above it: one option that cannot be chosen now, dimmed on its
    // own — the stand Lezen of a document over 2 MB.
    'Eén optie gedimd': () => (
      <SegmentedControl
        label="Mode"
        size="sm"
        value="code"
        options={[
          { value: 'read', label: 'Lezen', disabled: true },
          { value: 'code', label: 'Code' },
        ]}
        onValueChange={() => {}}
      />
    ),
    // The header of a file tab: `sm` is the frameless toolbar variant, 20px beside a 24px ghost
    // button. A wide toolbar keeps the words; under 480px the two groups of a markdown document
    // keep only their icons, the words stay the names.
    'In een werkbalk': () => (
      <div className="flex flex-col gap-3">
        {(['w-full max-w-[560px]', 'w-80'] as const).map((width) => (
          <div
            key={width}
            className={`@container/toolbar flex h-(--nt-control-lg) ${width} items-center gap-2 border-border border-b px-3 text-[12px]`}
          >
            <span className="min-w-0 flex-1 truncate">handbook.md</span>
            <SegmentedControl
              label="View"
              size="sm"
              collapse
              value="content"
              options={[
                { value: 'content', label: 'Bestand', icon: 'file' },
                { value: 'diff', label: 'Verschil', icon: 'file-diff' },
              ]}
              onValueChange={() => {}}
            />
            <SegmentedControl
              label="Mode"
              size="sm"
              collapse
              value="read"
              options={[
                { value: 'read', label: 'Lezen', icon: 'book-open' },
                { value: 'code', label: 'Code', icon: 'code' },
                { value: 'split', label: 'Naast elkaar', icon: 'columns' },
              ]}
              onValueChange={() => {}}
            />
            <Button size="sm" variant="ghost">
              Openen in editor
            </Button>
          </div>
        ))}
      </div>
    ),
  },
} satisfies Story
