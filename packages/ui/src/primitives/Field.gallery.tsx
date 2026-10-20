import type { Story } from '../gallery/story'
import { Field } from './Field'
import { NumberField } from './NumberField'
import { SegmentedControl } from './SegmentedControl'
import { Switch } from './Switch'

export default {
  group: 'primitives',
  title: 'Field',
  states: {
    'Label only': () => (
      <Field label="Network access">
        {({ labelId, describedById }) => (
          <Switch
            label="Network access"
            aria-labelledby={labelId}
            aria-describedby={describedById}
            checked
            onCheckedChange={() => {}}
          />
        )}
      </Field>
    ),
    'With description': () => (
      <Field label="Concurrent runs" description="How many turns may run at the same time.">
        {({ labelId, describedById }) => (
          <NumberField
            label="Concurrent runs"
            aria-labelledby={labelId}
            aria-describedby={describedById}
            value={4}
            min={1}
            max={16}
            onCommit={() => {}}
          />
        )}
      </Field>
    ),
    'With a SegmentedControl': () => (
      <Field label="Density" description="How much air a list row gets.">
        {({ labelId, describedById }) => (
          <SegmentedControl
            label="Density"
            aria-labelledby={labelId}
            aria-describedby={describedById}
            value="compact"
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'comfortable', label: 'Comfortable' },
            ]}
            onValueChange={() => {}}
          />
        )}
      </Field>
    ),
    // The bare button, without the Tooltip a caller wraps it in (`primitives/` may not import
    // `overlays/`): see `features/settings/SettingRow.gallery.tsx` for the wrapped, hoverable one.
    'With a hint, unwrapped': () => (
      <Field label="History" hint="Per project profile">
        {({ labelId, describedById }) => (
          <NumberField
            label="History"
            aria-labelledby={labelId}
            aria-describedby={describedById}
            value={500}
            min={50}
            max={5000}
            onCommit={() => {}}
          />
        )}
      </Field>
    ),
    'With error': () => (
      <Field
        label="Approval timeout"
        description="How long an approval may wait before it times out."
        error="Could not be saved."
      >
        {({ labelId, describedById }) => (
          <NumberField
            label="Approval timeout"
            aria-labelledby={labelId}
            aria-describedby={describedById}
            value={15}
            min={1}
            max={120}
            unit="min"
            onCommit={() => {}}
          />
        )}
      </Field>
    ),
  },
} satisfies Story
