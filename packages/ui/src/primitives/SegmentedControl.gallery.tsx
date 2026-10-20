import type { Story } from '../gallery/story'
import { Button } from './Button'
import { SegmentedControl } from './SegmentedControl'

export default {
  group: 'primitives',
  title: 'SegmentedControl',
  states: {
    'Two options': () => (
      <SegmentedControl
        label="Translucent window"
        value="auto"
        options={[
          { value: 'auto', label: 'Automatic' },
          { value: 'off', label: 'Off' },
        ]}
        onValueChange={() => {}}
      />
    ),
    'Three options': () => (
      <SegmentedControl
        label="Text size"
        value="medium"
        options={[
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' },
        ]}
        onValueChange={() => {}}
      />
    ),
    'Four options': () => (
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
    Disabled: () => (
      <SegmentedControl
        label="Text size"
        value="medium"
        disabled
        options={[
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' },
        ]}
        onValueChange={() => {}}
      />
    ),
    Sizes: () => (
      <div className="flex items-center gap-2">
        <SegmentedControl
          label="Translucent window"
          size="sm"
          value="auto"
          options={[
            { value: 'auto', label: 'Automatic' },
            { value: 'off', label: 'Off' },
          ]}
          onValueChange={() => {}}
        />
        <SegmentedControl
          label="Translucent window"
          value="auto"
          options={[
            { value: 'auto', label: 'Automatic' },
            { value: 'off', label: 'Off' },
          ]}
          onValueChange={() => {}}
        />
        <SegmentedControl
          label="Translucent window"
          size="lg"
          value="auto"
          options={[
            { value: 'auto', label: 'Automatic' },
            { value: 'off', label: 'Off' },
          ]}
          onValueChange={() => {}}
        />
      </div>
    ),
    // Last, so it moves no reference above it: one option that cannot be chosen now, dimmed on its
    // own — the stand Lezen of a document over 2 MB.
    'One option dimmed': () => (
      <SegmentedControl
        label="Mode"
        size="sm"
        value="code"
        options={[
          { value: 'read', label: 'Read', disabled: true },
          { value: 'code', label: 'Code' },
        ]}
        onValueChange={() => {}}
      />
    ),
    // The header of a file tab: `sm` is the frameless toolbar variant, 20px beside a 24px ghost
    // button. A wide toolbar keeps the words; under 480px the two groups of a markdown document
    // keep only their icons, the words stay the names.
    'In a toolbar': () => (
      <div className="flex flex-col gap-3">
        {(['w-[560px]', 'w-80'] as const).map((width) => (
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
                { value: 'content', label: 'File', icon: 'file' },
                { value: 'diff', label: 'Diff', icon: 'file-diff' },
              ]}
              onValueChange={() => {}}
            />
            <SegmentedControl
              label="Mode"
              size="sm"
              collapse
              value="read"
              options={[
                { value: 'read', label: 'Read', icon: 'book-open' },
                { value: 'code', label: 'Code', icon: 'code' },
                { value: 'split', label: 'Split', icon: 'columns' },
              ]}
              onValueChange={() => {}}
            />
            <Button size="sm" variant="ghost">
              Open in editor
            </Button>
          </div>
        ))}
      </div>
    ),
  },
} satisfies Story
