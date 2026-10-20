import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { MentionList, type MentionListItem, mentionOptionId } from './MentionList'

const ITEMS: MentionListItem[] = [
  { path: 'src/winkelmand/totaal.ts', kind: 'file', ranges: [[15, 18]] },
  { path: 'src/rapport/subtotaal.ts', kind: 'file', ranges: [[15, 18]] },
  { path: 'src/winkelmand', kind: 'dir' },
]

function renderList(overrides: Partial<Parameters<typeof MentionList>[0]> = {}) {
  const onPick = vi.fn()
  const onActiveChange = vi.fn()
  render(
    <MentionList
      id="mentions"
      label="Bestanden"
      items={ITEMS}
      activeIndex={0}
      onActiveChange={onActiveChange}
      onPick={onPick}
      emptyLabel="Geen bestanden"
      truncatedLabel="Niet alle bestanden van dit project staan in de lijst"
      countLabel="3 bestanden"
      anchor={null}
      {...overrides}
    />,
  )
  return { onPick, onActiveChange }
}

describe('MentionList', () => {
  test('the scrolling listbox is in the tab order, so the keyboard reaches its overflow', () => {
    // axe `scrollable-region-focusable`: with a classic scrollbar (Linux, Windows) eight rows
    // scroll, and a scrollable region nothing in it can focus must be focusable itself. The
    // composer's Tab picks a row, so in practice the focus stays in the field.
    renderList()
    expect(screen.getByRole('listbox', { name: 'Bestanden' })).toHaveAttribute('tabindex', '0')
  })

  test('the list is a listbox named files with one option per path', async () => {
    const { onPick } = renderList()
    const list = screen.getByRole('listbox', { name: 'Bestanden' })
    const options = within(list).getAllByRole('option')
    expect(options.map((option) => option.getAttribute('aria-label'))).toEqual([
      'src/winkelmand/totaal.ts',
      'src/rapport/subtotaal.ts',
      'src/winkelmand',
    ])
    expect(list.closest('[data-nt-layer]')).not.toBeNull()
    await userEvent.click(options[1] as HTMLElement)
    expect(onPick).toHaveBeenCalledWith(1)
  })

  test('the active option is marked for aria-activedescendant', () => {
    renderList({ activeIndex: 1 })
    const active = screen.getByRole('option', { name: 'src/rapport/subtotaal.ts' })
    expect(active).toHaveAttribute('id', mentionOptionId('mentions', 1))
    expect(active).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('option', { name: 'src/winkelmand/totaal.ts' })).toHaveAttribute(
      'aria-selected',
      'false',
    )
  })

  test('the ranges of core mark the letters that matched', () => {
    renderList()
    const first = screen.getByRole('option', { name: 'src/winkelmand/totaal.ts' })
    expect([...first.querySelectorAll('mark')].map((mark) => mark.textContent)).toEqual(['tot'])
  })

  test('a cut list says so under its rows', () => {
    renderList({ truncated: true })
    expect(
      screen.getByText('Niet alle bestanden van dit project staan in de lijst'),
    ).toBeInTheDocument()
  })

  test('an empty list says there are no files', () => {
    renderList({ items: [] })
    expect(screen.getByText('Geen bestanden')).toBeInTheDocument()
  })
})
