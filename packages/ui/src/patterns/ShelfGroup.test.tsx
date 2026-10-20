import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import { nl } from '../testing/labels'
import { List } from './List'
import { ShelfGroup } from './ShelfGroup'

/** A controlled shelf with two rows in it, as the foot of the chat list holds one. */
function Shelf({ initial = false, rule }: { initial?: boolean; rule?: boolean }) {
  const [open, setOpen] = useState(initial)
  return (
    <List label="Chats">
      <li>
        <button type="button" data-nt-list-row>
          Boven
        </button>
      </li>
      <ShelfGroup
        text={nl.shelf}
        title="Afgerond"
        count={143}
        open={open}
        onOpenChange={setOpen}
        {...(rule === undefined ? {} : { rule })}
      >
        <li>
          <button type="button" data-nt-list-row>
            Een
          </button>
        </li>
        <li>
          <button type="button" data-nt-list-row>
            Twee
          </button>
        </li>
      </ShelfGroup>
    </List>
  )
}

test('folded, it is one row "Afgerond 143" with aria-expanded false, and no rows under it', () => {
  render(<Shelf />)
  const toggle = screen.getByRole('button', { name: 'Afgerond 143' })
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByRole('button', { name: 'Een' })).toBeNull()
})

test('a click or Enter opens it and shows its rows', async () => {
  render(<Shelf />)
  const toggle = screen.getByRole('button', { name: 'Afgerond 143' })
  await userEvent.click(toggle)
  expect(toggle).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByRole('button', { name: 'Een' })).toBeInTheDocument()
  await userEvent.keyboard('{Enter}')
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
})

test('is a row of the list: the arrows walk onto it and into it', async () => {
  render(<Shelf initial />)
  await userEvent.click(screen.getByRole('button', { name: 'Boven' }))
  await userEvent.keyboard('{ArrowDown}')
  expect(screen.getByRole('button', { name: 'Afgerond 143' })).toHaveFocus()
  await userEvent.keyboard('{ArrowDown}')
  expect(screen.getByRole('button', { name: 'Een' })).toHaveFocus()
})

test('a 40px row of 12px muted words with a hairline above and the chevron on the right', () => {
  render(<Shelf />)
  const toggle = screen.getByRole('button', { name: 'Afgerond 143' })
  expect(toggle.className.split(' ')).toEqual(
    expect.arrayContaining(['h-10', 'border-t', 'border-border', 'text-[12px]', 'text-muted']),
  )
  const glyphs = toggle.querySelectorAll('svg')
  expect(glyphs).toHaveLength(1)
  expect(glyphs[0]?.getAttribute('class')).toContain('lucide-chevron-down')
  // The chevron is the last thing in the row.
  expect(toggle.lastElementChild?.contains(glyphs[0] ?? null)).toBe(true)
})

test('reports the wish to open to its owner, who decides', async () => {
  const onOpenChange = vi.fn()
  render(
    <List label="Chats">
      <ShelfGroup
        text={nl.shelf}
        title="Afgerond"
        count={3}
        open={false}
        onOpenChange={onOpenChange}
      >
        {null}
      </ShelfGroup>
    </List>,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Afgerond 3' }))
  expect(onOpenChange).toHaveBeenCalledWith(true)
})

test('bleed reaches past the gutter of a list that has one, and keeps its rows in it', () => {
  render(
    <List label="Chats">
      <ShelfGroup text={nl.shelf} title="Afgerond" count={1} open onOpenChange={vi.fn()} bleed>
        <li>
          <button type="button" data-nt-list-row>
            Een
          </button>
        </li>
      </ShelfGroup>
    </List>,
  )
  const shelf = screen.getByRole('button', { name: 'Afgerond 1' })
  // Its item steps 8px out on both sides, so the hairline reaches the rim of the column; the rows
  // it holds then need no gutter of their own beyond the one the list gives them.
  expect(shelf.closest('li')).toHaveClass('-mx-2')
  expect(screen.getByRole('button', { name: 'Een' }).closest('ul')).toHaveClass('px-2')
})

test('opening it scrolls its first row into view, and a shelf that starts open does not', async () => {
  const scrolled: Element[] = []
  const spy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(function (
    this: Element,
  ) {
    scrolled.push(this)
  })
  const { unmount } = render(<Shelf initial />)
  expect(scrolled).toEqual([])
  unmount()
  render(<Shelf />)
  await userEvent.click(screen.getByRole('button', { name: 'Afgerond 143' }))
  // The row at the foot of the column, where opening it showed nothing new.
  expect(scrolled).toEqual([screen.getByRole('button', { name: 'Een' }).closest('li')])
  spy.mockRestore()
})

test('draws a rule above the shelf unless told not to', () => {
  const { unmount } = render(<Shelf />)
  expect(screen.getByRole('button', { name: 'Afgerond 143' }).className).toMatch(/\bborder-t\b/)
  unmount()
  render(<Shelf rule={false} />)
  expect(screen.getByRole('button', { name: 'Afgerond 143' }).className).not.toMatch(/\bborder-t\b/)
})
