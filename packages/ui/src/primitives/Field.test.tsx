import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { expect, test, vi } from 'vitest'
import { Field } from './Field'
import { NumberField } from './NumberField'
import { SegmentedControl } from './SegmentedControl'
import { Select } from './Select'
import { Switch } from './Switch'

/**
 * A stand-in for the real `Tooltip` a caller in the app wraps the hint button in
 * (`features/settings/SettingRow.tsx`, tested there against the real `Tooltip`): `primitives/`
 * may not import `overlays/`, so this proves only that `Field` hands the button to `wrapHint` and
 * puts the result where the info button belongs — not Radix's own tooltip behaviour.
 */
function fakeTooltip(button: ReactElement, label: string): ReactElement {
  return (
    <span>
      {button}
      <span role="tooltip">{label}</span>
    </span>
  )
}

test('draws labelContent in place of the label text, and the name stays the label', () => {
  // The search of the settings marks what it hit in the label.
  render(
    <Field
      label="Netwerktoegang"
      labelContent={
        <>
          <mark>Netwerk</mark>toegang
        </>
      }
    >
      {({ labelId }) => (
        <Switch label="decoy" aria-labelledby={labelId} checked={false} onCheckedChange={vi.fn()} />
      )}
    </Field>,
  )
  expect(screen.getByRole('switch', { name: 'Netwerktoegang' })).toBeInTheDocument()
  expect(screen.getByText('Netwerk').tagName).toBe('MARK')
})

test('the label is visible and becomes the accessible name of the control through aria-labelledby', () => {
  render(
    <Field label="Netwerktoegang">
      {({ labelId, describedById }) => (
        <Switch
          label="decoy"
          aria-labelledby={labelId}
          aria-describedby={describedById}
          checked={false}
          onCheckedChange={vi.fn()}
        />
      )}
    </Field>,
  )
  expect(screen.getByText('Netwerktoegang')).toBeInTheDocument()
  // The primitive's own `label` prop ("decoy") loses: Field's visible label wins per the ARIA
  // accessible-name computation, so the switch is only findable by the visible text.
  expect(screen.getByRole('switch', { name: 'Netwerktoegang' })).toBeInTheDocument()
  expect(screen.queryByRole('switch', { name: 'decoy' })).not.toBeInTheDocument()
})

test('the explanation hangs on the control through aria-describedby', () => {
  render(
    <Field label="Gelijktijdige beurten" description="Hoeveel beurten tegelijk mogen lopen.">
      {({ labelId, describedById }) => (
        <NumberField
          label="decoy"
          aria-labelledby={labelId}
          aria-describedby={describedById}
          value={4}
          min={1}
          max={16}
          onCommit={vi.fn()}
        />
      )}
    </Field>,
  )
  const control = screen.getByRole('spinbutton', { name: 'Gelijktijdige beurten' })
  expect(control).toHaveAccessibleDescription('Hoeveel beurten tegelijk mogen lopen.')
})

test('a failure replaces the explanation, with role="alert", and stays the description of the control', () => {
  render(
    <Field
      label="Wachttijd op goedkeuring"
      description="Uitleg die verdwijnt."
      error="Kon niet opslaan."
    >
      {({ labelId, describedById }) => (
        <NumberField
          label="decoy"
          aria-labelledby={labelId}
          aria-describedby={describedById}
          value={5}
          min={0}
          max={60}
          onCommit={vi.fn()}
        />
      )}
    </Field>,
  )
  expect(screen.queryByText('Uitleg die verdwijnt.')).not.toBeInTheDocument()
  const alert = screen.getByRole('alert')
  expect(alert).toHaveTextContent('Kon niet opslaan.')
  const control = screen.getByRole('spinbutton', { name: 'Wachttijd op goedkeuring' })
  expect(control).toHaveAccessibleDescription('Kon niet opslaan.')
})

test('without an explanation or a failure the control gets no aria-describedby', () => {
  render(
    <Field label="Netwerktoegang">
      {({ labelId, describedById }) => (
        <Switch
          label="decoy"
          aria-labelledby={labelId}
          aria-describedby={describedById}
          checked={false}
          onCheckedChange={vi.fn()}
        />
      )}
    </Field>,
  )
  expect(screen.getByRole('switch')).not.toHaveAttribute('aria-describedby')
})

test('an empty or whitespace explanation counts as absent: no paragraph, no aria-describedby', () => {
  // An empty string is text the caller does not have yet; rendering it anyway would wire an empty
  // paragraph as the control's description.
  const seen: (string | undefined)[] = []
  const { container } = render(
    <Field label="Netwerktoegang" description="   " error="">
      {({ labelId, describedById }) => {
        seen.push(describedById)
        return (
          <Switch
            label="decoy"
            aria-labelledby={labelId}
            aria-describedby={describedById}
            checked={false}
            onCheckedChange={vi.fn()}
          />
        )
      }}
    </Field>,
  )
  expect(seen.every((id) => id === undefined)).toBe(true)
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  // Only the label's own paragraph is left.
  expect(container.querySelectorAll('p')).toHaveLength(1)
  expect(screen.getByRole('switch')).not.toHaveAttribute('aria-describedby')
})

test('a SegmentedControl in a Field is named after the visible label', () => {
  render(
    <Field label="Dichtheid" description="Hoeveel lucht een rij krijgt.">
      {({ labelId, describedById }) => (
        <SegmentedControl
          label="decoy"
          aria-labelledby={labelId}
          aria-describedby={describedById}
          value="compact"
          options={[
            { value: 'compact', label: 'Compact' },
            { value: 'ruim', label: 'Ruim' },
          ]}
          onValueChange={vi.fn()}
        />
      )}
    </Field>,
  )
  const group = screen.getByRole('radiogroup', { name: 'Dichtheid' })
  expect(group).toHaveAccessibleDescription('Hoeveel lucht een rij krijgt.')
  expect(screen.queryByRole('radiogroup', { name: 'decoy' })).not.toBeInTheDocument()
})

test('a Select in a Field is named after the visible label', () => {
  render(
    <Field label="Project" description="Waar de agent zijn werk doet.">
      {({ labelId, describedById }) => (
        <Select
          label="decoy"
          aria-labelledby={labelId}
          aria-describedby={describedById}
          value="a"
          options={[
            { value: 'a', label: 'Project A' },
            { value: 'b', label: 'Project B' },
          ]}
          onValueChange={vi.fn()}
        />
      )}
    </Field>,
  )
  const trigger = screen.getByRole('combobox', { name: 'Project' })
  expect(trigger).toHaveAccessibleDescription('Waar de agent zijn werk doet.')
  expect(screen.queryByRole('combobox', { name: 'decoy' })).not.toBeInTheDocument()
})

test('shows a hint as a tooltip on a focusable info button', async () => {
  render(
    <Field label="Geschiedenis" hint="Per projectprofiel" wrapHint={fakeTooltip}>
      {({ labelId, describedById }) => (
        <NumberField
          label="decoy"
          aria-labelledby={labelId}
          aria-describedby={describedById}
          value={500}
          min={50}
          max={5000}
          onCommit={vi.fn()}
        />
      )}
    </Field>,
  )
  const info = screen.getByRole('button', { name: 'Per projectprofiel' })
  expect(info.tagName).toBe('BUTTON')
  expect(await screen.findByRole('tooltip')).toHaveTextContent('Per projectprofiel')
})

test('describes the control with its hint', () => {
  render(
    <Field label="Geschiedenis" hint="Per projectprofiel">
      {({ labelId, describedById }) => (
        <NumberField
          label="decoy"
          aria-labelledby={labelId}
          aria-describedby={describedById}
          value={500}
          min={50}
          max={5000}
          onCommit={vi.fn()}
        />
      )}
    </Field>,
  )
  const control = screen.getByRole('spinbutton', { name: 'Geschiedenis' })
  expect(control).toHaveAccessibleDescription('Per projectprofiel')
})

test('a Field with only a description behaves exactly as before: no info button', () => {
  render(
    <Field label="Gelijktijdige beurten" description="Hoeveel beurten tegelijk mogen lopen.">
      {({ labelId, describedById }) => (
        <NumberField
          label="decoy"
          aria-labelledby={labelId}
          aria-describedby={describedById}
          value={4}
          min={1}
          max={16}
          onCommit={vi.fn()}
        />
      )}
    </Field>,
  )
  expect(screen.queryAllByRole('button')).toHaveLength(0)
})
