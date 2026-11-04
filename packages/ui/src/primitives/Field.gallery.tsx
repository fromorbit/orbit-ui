import type { Story } from '../gallery/story'
import { Field } from './Field'
import { NumberField } from './NumberField'
import { SegmentedControl } from './SegmentedControl'
import { Switch } from './Switch'

export default {
  group: 'primitives',
  title: 'Field',
  states: {
    'Alleen een label': () => (
      <Field label="Netwerktoegang">
        {({ labelId, describedById }) => (
          <Switch
            label="Netwerktoegang"
            aria-labelledby={labelId}
            aria-describedby={describedById}
            checked
            onCheckedChange={() => {}}
          />
        )}
      </Field>
    ),
    'Met beschrijving': () => (
      <Field label="Runs tegelijk" description="Hoeveel beurten tegelijk mogen lopen.">
        {({ labelId, describedById }) => (
          <NumberField
            label="Runs tegelijk"
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
    'Met een SegmentedControl': () => (
      <Field label="Dichtheid" description="Hoeveel lucht een rij in een lijst krijgt.">
        {({ labelId, describedById }) => (
          <SegmentedControl
            label="Dichtheid"
            aria-labelledby={labelId}
            aria-describedby={describedById}
            value="compact"
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'comfortable', label: 'Ruim' },
            ]}
            onValueChange={() => {}}
          />
        )}
      </Field>
    ),
    // The bare button, without the Tooltip a caller wraps it in (`primitives/` may not import
    // `overlays/`): see `features/settings/SettingRow.gallery.tsx` for the wrapped, hoverable one.
    'Met een hint, zonder omlijsting': () => (
      <Field label="Geschiedenis" hint="Per projectprofiel">
        {({ labelId, describedById }) => (
          <NumberField
            label="Geschiedenis"
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
    'Met een fout': () => (
      <Field
        label="Wachttijd voor akkoord"
        description="Hoe lang een akkoord mag wachten voordat het verloopt."
        error="Niet opgeslagen."
      >
        {({ labelId, describedById }) => (
          <NumberField
            label="Wachttijd voor akkoord"
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
