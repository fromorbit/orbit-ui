import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { nl } from '../testing/labels'
import { SummaryBar, SummaryRow } from './SummaryBar'

test('says how many files changed and by how many lines, counted through i18n', () => {
  render(<SummaryBar labels={nl.summary} files={4} added={128} removed={41} onOpen={() => {}} />)
  const bar = document.querySelector('[data-nt-summary-bar]')
  expect(bar?.textContent).toContain('4 bestanden gewijzigd')
  expect(bar?.textContent).toContain('+128')
  // A real minus sign, as a diff prints it, not a hyphen.
  expect(bar?.textContent).toContain('−41')
})

test('one file is singular', () => {
  render(<SummaryBar labels={nl.summary} files={1} added={3} removed={0} onOpen={() => {}} />)
  expect(document.querySelector('[data-nt-summary-bar]')?.textContent).toContain(
    '1 bestand gewijzigd',
  )
})

test('the diff colours are on the figures only', () => {
  render(<SummaryBar labels={nl.summary} files={4} added={128} removed={41} onOpen={() => {}} />)
  const bar = document.querySelector('[data-nt-summary-bar]') as HTMLElement
  const coloured = [...bar.querySelectorAll('[class*="text-success"], [class*="text-danger"]')]
  expect(coloured.map((element) => element.textContent)).toEqual(['+128', '−41'])
  expect(bar.className).not.toMatch(/success|danger/)
})

test('the figures are read as words, once', () => {
  render(<SummaryBar labels={nl.summary} files={4} added={128} removed={41} onOpen={() => {}} />)
  expect(screen.getByText('+128')).toHaveAttribute('aria-hidden', 'true')
  expect(screen.getByText('128 regels erbij, 41 eraf')).toHaveClass('sr-only')
})

test('Bekijk is no louder than the label: muted at rest', () => {
  render(<SummaryBar labels={nl.summary} files={4} added={128} removed={41} onOpen={() => {}} />)
  expect(screen.getByRole('button', { name: 'Bekijk' }).className.split(' ')).toContain(
    'text-muted',
  )
})

test('Bekijk is a named button that opens the changes', async () => {
  const onOpen = vi.fn()
  render(<SummaryBar labels={nl.summary} files={4} added={128} removed={41} onOpen={onOpen} />)
  await userEvent.click(screen.getByRole('button', { name: 'Bekijk' }))
  expect(onOpen).toHaveBeenCalledOnce()
})

// The card stands on the 4px grid at 32px, with the radius token.
test('a 30px row inside the 1px border makes the 32px bar, with the radius token', () => {
  render(<SummaryBar labels={nl.summary} files={4} added={128} removed={41} onOpen={() => {}} />)
  const bar = document.querySelector('[data-nt-summary-bar]') as HTMLElement
  expect(bar.className.split(' ')).toEqual(
    expect.arrayContaining(['border', 'border-border', 'rounded-md']),
  )
  expect(bar.querySelector('[data-nt-summary-row]')?.className.split(' ')).toContain('h-[30px]')
  expect(bar.querySelector('svg')?.getAttribute('class')).toContain('lucide-file-diff')
})

test('more rows stand under the files row in the same frame', () => {
  render(
    <SummaryBar labels={nl.summary} files={1} added={82} removed={0} onOpen={() => {}}>
      <SummaryRow
        icon={<span />}
        label="Artifacts · 1"
        action={<button type="button">Bekijk</button>}
      />
    </SummaryBar>,
  )
  const bar = document.querySelector('[data-nt-summary-bar]') as HTMLElement
  expect(bar.querySelectorAll('[data-nt-summary-row]')).toHaveLength(2)
  expect(bar.className.split(' ')).toContain('divide-y')
  expect(document.querySelectorAll('[data-nt-summary-bar]')).toHaveLength(1)
})
