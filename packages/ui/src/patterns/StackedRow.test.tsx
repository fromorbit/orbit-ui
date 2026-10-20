import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { List } from './List'
import { StackedRow, StackedRowBranch } from './StackedRow'

/** A row as the chat list draws one; the rest of a test changes one thing. */
function row(overrides: Partial<Parameters<typeof StackedRow>[0]> = {}) {
  return (
    <StackedRow
      label="Zoekfilter herbouwen, webshop, bezig, nt/zoekfilter-server, 2m"
      meta="webshop"
      trailingMeta="2m"
      title="Zoekfilter herbouwen"
      detail="nt/zoekfilter-server"
      {...overrides}
    />
  )
}

test('is a list row of three lines: 16, 20 and 16px, 72px in all', () => {
  render(<List label="Chats">{row()}</List>)
  const button = screen.getByRole('button')
  expect(button).toHaveAttribute('data-nt-list-row')
  expect(button.className.split(' ')).toEqual(
    expect.arrayContaining(['h-18', 'px-3', 'py-2.5', 'rounded-[8px]']),
  )
  const lines = [...button.querySelectorAll('[data-nt-stacked-line]')]
  expect(lines.map((line) => line.getAttribute('data-nt-stacked-line'))).toEqual([
    'meta',
    'title',
    'detail',
  ])
  expect(lines[0]?.className).toContain('h-4')
  expect(lines[0]?.className).toContain('text-[11px]')
  expect(lines[1]?.className).toContain('h-5')
  expect(lines[1]?.className).toContain('text-[14px]')
  expect(lines[1]?.className).toContain('font-medium')
  expect(lines[2]?.className).toContain('h-4')
  expect(lines[2]?.className).toContain('text-[11px]')
})

test('the accessible name comes from the caller, not from the three lines', () => {
  render(<List label="Chats">{row()}</List>)
  expect(
    screen.getByRole('button', {
      name: 'Zoekfilter herbouwen, webshop, bezig, nt/zoekfilter-server, 2m',
    }),
  ).toBeInTheDocument()
})

test('every slot lands on its line and side', () => {
  render(
    <List label="Chats">
      {row({
        meta: 'webshop',
        trailingMeta: '2m',
        detail: 'nt/zoekfilter-server',
        trailingDetail: '#482',
      })}
    </List>,
  )
  const button = screen.getByRole('button')
  const [meta, title, detail] = button.querySelectorAll('[data-nt-stacked-line]')
  expect(meta?.querySelector('[data-nt-stacked-start]')?.textContent).toBe('webshop')
  expect(meta?.querySelector('[data-nt-stacked-end]')?.textContent).toBe('2m')
  expect(title?.textContent).toBe('Zoekfilter herbouwen')
  expect(detail?.querySelector('[data-nt-stacked-start]')?.textContent).toBe('nt/zoekfilter-server')
  expect(detail?.querySelector('[data-nt-stacked-end]')?.textContent).toBe('#482')
})

test('current is the soft card and aria-current="page"', () => {
  render(<List label="Chats">{row({ current: true })}</List>)
  const button = screen.getByRole('button')
  expect(button).toHaveAttribute('aria-current', 'page')
  expect(button.className).toContain('bg-row-active')
  expect(button.className).not.toContain('border')
  expect(button.closest('li')).toHaveAttribute('data-current')
})

test('at rest there is no fill, only the hover of a row', () => {
  render(<List label="Chats">{row()}</List>)
  const button = screen.getByRole('button')
  expect(button).not.toHaveAttribute('aria-current')
  expect(button.className).toContain('hover:bg-row-hover')
  expect(button.className).not.toContain('bg-row-active')
})

test('seen dims the title to text-secondary at 400; unseen and current keep it in text at 500', () => {
  const { rerender } = render(<List label="Chats">{row({ seen: true })}</List>)
  const title = () => screen.getByRole('button').querySelector('[data-nt-stacked-line="title"]')
  expect(title()?.className).toContain('text-secondary')
  expect(title()?.className).toContain('font-normal')
  rerender(<List label="Chats">{row({ seen: false })}</List>)
  expect(title()?.className).toContain('text-fg')
  expect(title()?.className).toContain('font-medium')
  rerender(<List label="Chats">{row({ seen: true, current: true })}</List>)
  expect(title()?.className).toContain('text-fg')
  expect(title()?.className).toContain('font-medium')
})

test('no hairlines stand between items: space and the soft card carry the separation', () => {
  render(
    <List label="Chats">
      {row({ title: 'Een' })}
      {row({ title: 'Twee', current: true })}
      {row({ title: 'Drie' })}
    </List>,
  )
  const items = [...document.querySelectorAll('li')]
  for (const item of items) expect(item.className).not.toContain('before:')
  expect(items[1]).toHaveAttribute('data-current')
  expect(items[0]).not.toHaveAttribute('data-current')
})

test('without a detail the item has two lines: 16 and 20px, 56px in all', () => {
  render(<List label="Chats">{row({ detail: undefined })}</List>)
  const button = screen.getByRole('button')
  expect(button.className.split(' ')).toContain('h-14')
  expect(button.className.split(' ')).not.toContain('h-18')
  const lines = [...button.querySelectorAll('[data-nt-stacked-line]')]
  expect(lines.map((line) => line.getAttribute('data-nt-stacked-line'))).toEqual(['meta', 'title'])
})

test('a trailing detail alone still makes the third line', () => {
  render(<List label="Chats">{row({ detail: undefined, trailingDetail: '+3 −1' })}</List>)
  const detail = screen.getByRole('button').querySelector('[data-nt-stacked-line="detail"]')
  expect(detail?.querySelector('[data-nt-stacked-end]')?.textContent).toBe('+3 −1')
})

test('pinned draws the pin before the time, decorative', () => {
  render(<List label="Chats">{row({ pinned: true, trailingMeta: '1u' })}</List>)
  const end = screen.getByRole('button').querySelector('[data-nt-stacked-end]')
  const pin = end?.querySelector('svg')
  expect(pin?.getAttribute('class')).toContain('lucide-pin')
  expect(pin?.getAttribute('class')).toContain('text-faint')
  expect(pin?.getAttribute('class')).toContain('size-(--nt-icon-xs)')
  expect(end?.textContent).toBe('1u')
})

test('the arrows of the list walk the rows', async () => {
  render(
    <List label="Chats">
      {row({ title: 'Een', label: 'Een' })}
      {row({ title: 'Twee', label: 'Twee' })}
    </List>,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Een' }))
  await userEvent.keyboard('{ArrowDown}')
  expect(screen.getByRole('button', { name: 'Twee' })).toHaveFocus()
})

test('a click reaches the caller', async () => {
  const onClick = vi.fn()
  render(<List label="Chats">{row({ onClick })}</List>)
  await userEvent.click(screen.getByRole('button'))
  expect(onClick).toHaveBeenCalledOnce()
})

test('the branch of a worktree carries folder-git-2; main carries no icon', () => {
  const { container, rerender } = render(<StackedRowBranch name="nt/zoekfilter-server" worktree />)
  const icon = container.querySelector('svg')
  expect(icon?.getAttribute('class')).toContain('lucide-folder-git-2')
  expect(icon?.getAttribute('class')).toContain('text-faint')
  expect(icon?.getAttribute('class')).toContain('size-(--nt-icon-xs)')
  expect(container.textContent).toBe('nt/zoekfilter-server')
  rerender(<StackedRowBranch name="main" />)
  expect(container.querySelector('svg')).toBeNull()
  expect(container.textContent).toBe('main')
})

test('actions stand beside the button, where the time stands, and trade places with it', () => {
  render(
    <List label="Chats">
      {row({
        actions: (
          <button type="button" aria-label="Meer">
            …
          </button>
        ),
      })}
    </List>,
  )
  const button = screen.getByRole('button', { name: /^Zoekfilter herbouwen/ })
  const more = screen.getByRole('button', { name: 'Meer' })
  // Never inside the row's own button: a button inside a button does not exist.
  expect(button).not.toContainElement(more)
  expect(button.closest('li')).toContainElement(more)
  // Always in the DOM, so the keyboard reaches it; shown on hover or keyboard focus, while the time
  // yields. Not on a focus a click left behind: a chosen row keeps its time, or its "#1" (A28).
  const holder = more.closest('[data-nt-stacked-actions]')
  expect(holder?.className).toContain('group-hover/stacked:opacity-100')
  expect(holder?.className).toContain('group-has-[:focus-visible]/stacked:opacity-100')
  expect(holder?.className).not.toContain('group-focus-within/stacked')
  const end = button.querySelector('[data-nt-stacked-line="meta"] [data-nt-stacked-end]')
  expect(end?.className).toContain('group-hover/stacked:opacity-0')
  expect(end?.className).toContain('group-has-[:focus-visible]/stacked:opacity-0')
  // The arrows of the list pass it by: it is no row of its own.
  expect(more).not.toHaveAttribute('data-nt-list-row')
})
