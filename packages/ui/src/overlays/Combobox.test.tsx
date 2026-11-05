import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { FormField } from '../primitives/FormField'
import { Combobox, filterComboboxOptions, MultiCombobox } from './Combobox'

const REGIONS = [
  { value: 'ams', label: 'Amsterdam', detail: 'eu-west', keywords: ['nederland'] },
  { value: 'fra', label: 'Frankfurt', detail: 'eu-central' },
  { value: 'zrh', label: 'Zürich', detail: 'eu-central' },
  { value: 'nyc', label: 'New York', detail: 'us-east', disabled: true },
  { value: 'sfo', label: 'San Francisco', detail: 'us-west' },
] as const

const LABELS = { search: 'Zoeken…', noResults: (q: string) => `Geen treffers voor ‘${q}’` }

type Region = (typeof REGIONS)[number]['value']

function Single({ onChange = vi.fn() }: { onChange?(value: Region): void }) {
  const [value, setValue] = useState<Region | null>(null)
  return (
    <Combobox<Region>
      label="Regio"
      placeholder="Kies een regio"
      labels={LABELS}
      options={REGIONS}
      value={value}
      onValueChange={(next) => {
        setValue(next)
        onChange(next)
      }}
    />
  )
}

describe('filterComboboxOptions', () => {
  test('matches every word, in label, detail or keywords, without case or accents', () => {
    expect(filterComboboxOptions(REGIONS, 'zurich').map((o) => o.value)).toEqual(['zrh'])
    expect(filterComboboxOptions(REGIONS, 'EU central').map((o) => o.value)).toEqual(['fra', 'zrh'])
    expect(filterComboboxOptions(REGIONS, 'nederland').map((o) => o.value)).toEqual(['ams'])
    expect(filterComboboxOptions(REGIONS, '  ')).toHaveLength(REGIONS.length)
  })
})

describe('Combobox', () => {
  test('the trigger says the placeholder and opens a list with the focus in the search', async () => {
    render(<Single />)
    const trigger = screen.getByRole('button', { name: /^Regio\b/ })
    // Named by its label and then what it shows, so the choice is heard (WCAG 2.5.3).
    expect(trigger.getAttribute('aria-labelledby')?.split(' ')).toHaveLength(2)
    expect(trigger).toHaveTextContent('Kies een regio')
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox')
    await userEvent.click(trigger)
    const search = screen.getByRole('combobox', { name: 'Zoeken…' })
    expect(search).toHaveFocus()
    expect(screen.getAllByRole('option')).toHaveLength(5)
  })

  test('typing narrows the list; Enter picks the first match and closes', async () => {
    const onChange = vi.fn()
    render(<Single onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /^Regio\b/ }))
    await userEvent.keyboard('fra{Enter}')
    expect(onChange).toHaveBeenCalledWith('fra')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    const trigger = screen.getByRole('button', { name: /^Regio\b/ })
    expect(trigger).toHaveTextContent('Frankfurt')
    expect(trigger).toHaveFocus()
  })

  test('the arrows move the active row past a disabled one, and wrap', async () => {
    render(<Single />)
    await userEvent.click(screen.getByRole('button', { name: /^Regio\b/ }))
    const search = screen.getByRole('combobox', { name: 'Zoeken…' })
    const active = () =>
      document.getElementById(search.getAttribute('aria-activedescendant') ?? '')?.textContent
    expect(active()).toContain('Amsterdam')
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')
    // New York is disabled: the third step lands on San Francisco.
    expect(active()).toContain('San Francisco')
    await userEvent.keyboard('{ArrowDown}')
    expect(active()).toContain('Amsterdam')
    await userEvent.keyboard('{ArrowUp}')
    expect(active()).toContain('San Francisco')
  })

  test('says so when nothing matches', async () => {
    render(<Single />)
    await userEvent.click(screen.getByRole('button', { name: /^Regio\b/ }))
    await userEvent.keyboard('tokio')
    expect(screen.getByText('Geen treffers voor ‘tokio’')).toBeInTheDocument()
    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })

  test('a click picks a row; a disabled row is not picked', async () => {
    const onChange = vi.fn()
    render(<Single onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /^Regio\b/ }))
    await userEvent.click(screen.getByRole('option', { name: /New York/ }))
    expect(onChange).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('option', { name: /Zürich/ }))
    expect(onChange).toHaveBeenCalledWith('zrh')
  })

  test('Escape closes and hands the focus back to the trigger', async () => {
    render(<Single />)
    await userEvent.click(screen.getByRole('button', { name: /^Regio\b/ }))
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Regio\b/ })).toHaveFocus()
  })

  test('the chosen option is selected when the list opens again', async () => {
    render(<Single />)
    await userEvent.click(screen.getByRole('button', { name: /^Regio\b/ }))
    await userEvent.click(screen.getByRole('option', { name: /Zürich/ }))
    await userEvent.click(screen.getByRole('button', { name: /^Regio\b/ }))
    expect(screen.getByRole('option', { name: /Zürich/ })).toHaveAttribute('aria-selected', 'true')
  })

  test('FormField names it and marks it invalid', () => {
    render(
      <FormField label="Datacenter" error="Kies een regio.">
        {(field) => (
          <Combobox
            label="x"
            placeholder="Kies"
            labels={LABELS}
            options={REGIONS}
            value={null}
            onValueChange={vi.fn()}
            {...field}
          />
        )}
      </FormField>,
    )
    const trigger = screen.getByRole('button', { name: /^Datacenter\b/ })
    expect(trigger).toHaveAttribute('aria-invalid', 'true')
    expect(trigger).toHaveAccessibleDescription('Kies een regio.')
    expect(trigger.className).toContain('border-danger')
  })
})

describe('MultiCombobox', () => {
  function Multi({ onChange = vi.fn() }: { onChange?(value: string[]): void }) {
    const [value, setValue] = useState<string[]>(['zrh'])
    return (
      <MultiCombobox
        label="Regio's"
        placeholder="Kies regio's"
        labels={LABELS}
        countLabel={(count) => `${count} gekozen`}
        options={REGIONS}
        value={value}
        onValueChange={(next) => {
          setValue(next)
          onChange(next)
        }}
      />
    )
  }

  test('a pick toggles and keeps the panel open; the value keeps the order of the options', async () => {
    const onChange = vi.fn()
    render(<Multi onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /^Regio's\b/ }))
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true')
    await userEvent.keyboard('ams{Enter}')
    expect(onChange).toHaveBeenLastCalledWith(['ams', 'zrh'])
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await userEvent.clear(screen.getByRole('combobox', { name: 'Zoeken…' }))
    await userEvent.click(screen.getByRole('option', { name: /Zürich/ }))
    expect(onChange).toHaveBeenLastCalledWith(['ams'])
  })

  test('the trigger lists the chosen labels, then a count', async () => {
    render(<Multi />)
    const trigger = screen.getByRole('button', { name: /^Regio's\b/ })
    expect(trigger).toHaveTextContent('Zürich')
    await userEvent.click(trigger)
    await userEvent.click(screen.getByRole('option', { name: /Amsterdam/ }))
    await userEvent.click(screen.getByRole('option', { name: /Frankfurt/ }))
    expect(screen.getByRole('button', { name: /^Regio's\b/ })).toHaveTextContent('3 gekozen')
  })
})
