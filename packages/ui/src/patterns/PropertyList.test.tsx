import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { ProgressMeter } from '../primitives/ProgressMeter'
import { PropertyList } from './PropertyList'

const groups = [
  [
    { label: 'Status', value: 'In review' },
    { label: 'Houder', value: 'Sanne Visser' },
    { label: 'Project', value: 'webshop' },
  ],
  [
    {
      label: 'Plannen',
      value: (
        <ProgressMeter
          valueText={(value, max) => `${value} van ${max}`}
          value={2}
          max={5}
          label="PLAN-10"
        />
      ),
    },
  ],
  [{ label: 'Controle', value: 'Compleet' }],
] as const

test('rows are label and value, as a description list', () => {
  render(<PropertyList label="Eigenschappen" groups={groups} />)
  const list = screen.getByRole('group', { name: 'Eigenschappen' })
  const terms = within(list).getAllByRole('term')
  const values = within(list).getAllByRole('definition')
  expect(terms.map((term) => term.textContent)).toEqual([
    'Status',
    'Houder',
    'Project',
    'Plannen',
    'Controle',
  ])
  expect(values[0]?.textContent).toBe('In review')
  expect(values[2]?.textContent).toBe('webshop')
})

test('the label is muted, the value in text; the label keeps one width', () => {
  render(<PropertyList label="Eigenschappen" groups={groups} />)
  const term = screen.getByText('Status')
  expect(term.className).toContain('text-muted')
  expect(term.className).toContain('w-24')
  expect(screen.getByText('Sanne Visser').className).toContain('text-fg')
})

test('a hairline separates the groups, and none stands above the first', () => {
  render(<PropertyList label="Eigenschappen" groups={groups} />)
  const sections = [...document.querySelectorAll('[data-nt-property-group]')]
  expect(sections).toHaveLength(3)
  for (const section of sections) {
    expect(section.className).toContain('border-t')
    expect(section.className).toContain('border-border')
    expect(section.className).toContain('first:border-t-0')
  }
})
