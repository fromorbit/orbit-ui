import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useState } from 'react'
import { expect, test, vi } from 'vitest'
import { nl } from '../testing/labels'
import { List, ListGroup, ListRow } from './List'
import { RelativeTime } from './RelativeTime'

/**
 * A list whose rows sit in two named groups, each with its own `<ul>` inside a `<section>`.
 *
 * The shape the sidebar uses: one `List` around everything, so the arrows run through all rows,
 * with the groups as list items in between. `role="group"`, because a named `<section>` would be a
 * landmark and a project in a sidebar is not one.
 */
function GroupedList() {
  return (
    <List label="Chats">
      <li>
        {/* biome-ignore lint/a11y/useSemanticElements: a fieldset is for forms; this is a named group in a list, and a named section would be a landmark. */}
        <section role="group" aria-label="nt-agent">
          <ul>
            <ListRow title="Eerste chat" />
            <ListRow title="Tweede chat" />
          </ul>
        </section>
      </li>
      <li>
        {/* biome-ignore lint/a11y/useSemanticElements: a fieldset is for forms; this is a named group in a list, and a named section would be a landmark. */}
        <section role="group" aria-label="webshop">
          <ul>
            <ListRow title="Derde chat" />
            <ListRow title="Vierde chat" />
          </ul>
        </section>
      </li>
    </List>
  )
}

function rowsByTitle(...titles: string[]): HTMLElement[] {
  return titles.map((title) => screen.getByRole('button', { name: new RegExp(title) }))
}

test('a group of rows is a group, not a landmark', () => {
  // A named `<section>` is a `region`: a landmark, which lands in the landmark menu of a screen
  // reader beside the navigation and the main panel. A project in a sidebar is not that; it is a
  // named group of rows, so it says so.
  render(<GroupedList />)
  expect(screen.getByRole('group', { name: 'nt-agent' })).toBeInTheDocument()
  expect(screen.getByRole('group', { name: 'webshop' })).toBeInTheDocument()
  expect(screen.queryByRole('region')).toBeNull()
})

test('the list carries its name', () => {
  render(
    <List label="Chats">
      <ListRow title="Eerste chat" />
    </List>,
  )
  expect(screen.getByRole('list', { name: 'Chats' })).toBeInTheDocument()
})

test('a row is a button in a list item', () => {
  render(
    <List label="Chats">
      <ListRow title="Eerste chat" />
    </List>,
  )
  const row = screen.getByRole('button', { name: 'Eerste chat' })
  expect(row.closest('li')).toBeInTheDocument()
  expect(screen.getAllByRole('listitem')).toHaveLength(1)
})

test('the name of a row is title, status between commas and meta', () => {
  render(
    <List label="Chats">
      <ListRow title="Eerste chat" kind="running" status="Bezig" meta="5 min" />
    </List>,
  )
  // The same shape the sidebar has always read: the status is a clause of its own, so it never
  // runs into the title or the time beside it.
  expect(screen.getByRole('button', { name: 'Eerste chat , Bezig, 5 min' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Eerste chat.*Bezig.*5 min/ })).toBeInTheDocument()
})

test('a meta made of elements counts in the name just the same', () => {
  // `meta` is usually not a string but a component: the name must read the same either way, since
  // that is what a screen reader hears in the sidebar.
  const now = Date.UTC(2026, 8, 19, 12, 0, 0)
  render(
    <List label="Chats">
      <ListRow
        title="Eerste chat"
        kind="running"
        status="Bezig"
        meta={<RelativeTime labels={nl.time} at={now - 5 * 60_000} now={now} />}
      />
    </List>,
  )
  expect(screen.getByRole('button', { name: 'Eerste chat , Bezig, 5 min' })).toBeInTheDocument()
})

test('without a status there is no stray punctuation in the name', () => {
  render(
    <List label="Chats">
      <ListRow title="Eerste chat" meta="5 min" />
    </List>,
  )
  expect(screen.getByRole('button', { name: 'Eerste chat 5 min' })).toBeInTheDocument()
})

test('without meta the status is shown as meta, but it is announced once', () => {
  render(
    <List label="Chats">
      <ListRow title="Eerste chat" kind="attention" status="Wacht op goedkeuring" />
    </List>,
  )
  const row = screen.getByRole('button', { name: /Eerste chat.*Wacht op goedkeuring/ })
  // Announced once: the copy that is in the name is the invisible one, so the visible status in
  // the meta column is hidden from assistive technology.
  const visible = row.querySelector('span[aria-hidden="true"]:not([data-nt-status-shape])')
  expect(visible).toHaveTextContent('Wacht op goedkeuring')
  expect(visible?.parentElement?.className).toContain('text-[11px]')
})

test('the kind draws the icon; the icon itself says nothing', () => {
  const { container } = render(
    <List label="Chats">
      <ListRow title="Eerste chat" kind="failed" status="Mislukt" />
    </List>,
  )
  const icon = container.querySelector('[data-nt-status-shape]')
  expect(icon).toHaveAttribute('data-kind', 'failed')
  expect(icon).toHaveAttribute('aria-hidden', 'true')
})

test('without a kind the place of the icon remains', () => {
  const { container } = render(
    <List label="Chats">
      <ListRow title="Eerste chat" />
    </List>,
  )
  expect(container.querySelector('[data-nt-status-shape]')).toHaveAttribute('data-kind', 'none')
})

test('a kind without a word does not exist: the types do not allow it', () => {
  render(
    <List label="Chats">
      {/* @ts-expect-error a kind without a status word would carry the status by shape alone. */}
      <ListRow title="Eerste chat" kind="running" />
    </List>,
  )
  expect(screen.getByRole('button', { name: /Eerste chat/ })).toBeInTheDocument()
})

test('the current row is the current page, the rest is not', () => {
  render(
    <List label="Chats">
      <ListRow title="Eerste chat" current />
      <ListRow title="Tweede chat" />
    </List>,
  )
  expect(screen.getByRole('button', { name: 'Eerste chat' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  expect(screen.getByRole('button', { name: 'Tweede chat' })).not.toHaveAttribute('aria-current')
})

test('a row is 32px high, from the size token', () => {
  render(
    <List label="Chats">
      <ListRow title="Eerste chat" />
    </List>,
  )
  expect(screen.getByRole('button', { name: 'Eerste chat' }).className).toContain(
    'h-(--nt-control-lg)',
  )
})

test('a long title is truncated instead of widening the row', () => {
  render(
    <List label="Chats">
      <ListRow title="Een titel die veel te lang is voor deze kolom" />
    </List>,
  )
  expect(screen.getByText('Een titel die veel te lang is voor deze kolom').className).toContain(
    'truncate',
  )
})

test('clicking calls the caller', async () => {
  const onClick = vi.fn()
  render(
    <List label="Chats">
      <ListRow title="Eerste chat" onClick={onClick} />
    </List>,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Eerste chat' }))
  expect(onClick).toHaveBeenCalledOnce()
})

test('the ref points at the button itself', () => {
  const ref = createRef<HTMLButtonElement>()
  render(
    <List label="Chats">
      <ListRow title="Eerste chat" ref={ref} />
    </List>,
  )
  expect(ref.current).toBe(screen.getByRole('button', { name: 'Eerste chat' }))
})

test('a className or style from outside does not get in', () => {
  render(
    <List label="Chats">
      {/* @ts-expect-error variation comes from props, never from a className handed in. */}
      <ListRow title="Eerste chat" className="bg-red-500" style={{ color: 'red' }} />
    </List>,
  )
  const row = screen.getByRole('button', { name: 'Eerste chat' })
  expect(row.className).not.toContain('bg-red-500')
  expect(row.getAttribute('style')).toBeNull()
})

test('arrow keys move the focus, across groups too, without wrapping', async () => {
  render(<GroupedList />)
  const [first, second, third, fourth] = rowsByTitle(
    'Eerste chat',
    'Tweede chat',
    'Derde chat',
    'Vierde chat',
  )
  first?.focus()
  await userEvent.keyboard('{ArrowDown}')
  expect(second).toHaveFocus()
  // The step that matters: the last row of the first group leads into the second group.
  await userEvent.keyboard('{ArrowDown}')
  expect(third).toHaveFocus()
  await userEvent.keyboard('{ArrowUp}')
  expect(second).toHaveFocus()
  await userEvent.keyboard('{ArrowUp}')
  expect(first).toHaveFocus()
  await userEvent.keyboard('{ArrowUp}')
  expect(first).toHaveFocus()
  await userEvent.keyboard('{End}')
  expect(fourth).toHaveFocus()
  await userEvent.keyboard('{ArrowDown}')
  expect(fourth).toHaveFocus()
  await userEvent.keyboard('{Home}')
  expect(first).toHaveFocus()
})

test('another key leaves the focus alone', async () => {
  render(<GroupedList />)
  const [first] = rowsByTitle('Eerste chat')
  first?.focus()
  await userEvent.keyboard('{ArrowRight}')
  expect(first).toHaveFocus()
})

test('a row with an action keeps its own button', () => {
  render(
    <List label="Chats">
      <ListRow title="Eerste chat" actions={<button type="button">Meer</button>} />
    </List>,
  )
  // A button in a button does not exist, so the action sits beside the row's own button — both
  // inside the one list item.
  const row = screen.getByRole('button', { name: 'Eerste chat' })
  const action = screen.getByRole('button', { name: 'Meer' })
  expect(row).not.toContainElement(action)
  expect(row.closest('li')).toContainElement(action)
})

test('the action is reachable with the keyboard', async () => {
  render(
    <List label="Chats">
      <ListRow title="Eerste chat" actions={<button type="button">Meer</button>} />
    </List>,
  )
  // Always in the DOM, never only-on-hover: someone tabbing through the list must reach it without
  // first pointing at the row.
  const action = screen.getByRole('button', { name: 'Meer' })
  action.focus()
  expect(action).toHaveFocus()
})

test('a row without actions renders exactly what it did', () => {
  const { container } = render(
    <List label="Chats">
      <ListRow title="Eerste chat" />
    </List>,
  )
  // The migration onto `actions` must not change a screen that never passes it.
  expect(container.querySelectorAll('button')).toHaveLength(1)
})

test('a row with actions keeps its detail at the right edge', () => {
  // No reserved `pr-8` any more: the button keeps its ordinary padding, and the meta sits flush
  // with the row like it does without actions, ready to swap with the menu on hover.
  render(
    <List label="Chats">
      <ListRow title="Eerste chat" meta="5 min" actions={<button type="button">Meer</button>} />
    </List>,
  )
  const row = screen.getByRole('button', { name: /Eerste chat/ })
  expect(row.className).not.toContain('pr-8')
  expect(row.className).toContain('px-2')
})

test('the detail steps aside for the actions on hover', () => {
  render(
    <List label="Chats">
      <ListRow title="Eerste chat" meta="5 min" actions={<button type="button">Meer</button>} />
    </List>,
  )
  const detail = screen.getByText('5 min')
  // The same group classes the menu appears with, reversed: visible in rest, gone on hover or
  // focus-within, so the two trade the same spot rather than both reserving it.
  expect(detail.className).toContain('group-hover/row:opacity-0')
  expect(detail.className).toContain('group-focus-within/row:opacity-0')
})

test('the detail stays in the accessible name while it is hidden', () => {
  render(
    <List label="Chats">
      <ListRow title="Eerste chat" meta="5 min" actions={<button type="button">Meer</button>} />
    </List>,
  )
  // Hidden with opacity, not removed or aria-hidden: a screen reader must still read it.
  expect(screen.getByRole('button', { name: 'Eerste chat 5 min' })).toBeInTheDocument()
})

test('a row without actions is unchanged', () => {
  render(
    <List label="Chats">
      <ListRow title="Eerste chat" meta="5 min" />
    </List>,
  )
  // Without actions there is nothing to step aside for, so the detail carries none of those classes.
  const detail = screen.getByText('5 min')
  expect(detail.className).not.toContain('group-hover/row:opacity-0')
  expect(detail.className).not.toContain('group-focus-within/row:opacity-0')
})

test('without focus in the list the arrow keys do nothing', async () => {
  render(
    <>
      <GroupedList />
      <button type="button">Buiten de lijst</button>
    </>,
  )
  const outside = screen.getByRole('button', { name: 'Buiten de lijst' })
  outside.focus()
  await userEvent.keyboard('{ArrowDown}')
  expect(outside).toHaveFocus()
})

test('a row draws the status shape, with or without asking for it', () => {
  const { container, rerender } = render(
    <List label="Chats">
      <ListRow title="Eerste chat" kind="done" status="Klaar" />
    </List>,
  )
  // Done is the hexagon everywhere, not the old muted check.
  expect(container.querySelector('[data-nt-status-shape]')).toHaveAttribute('data-shape', 'hexagon')
  rerender(
    <List label="Chats">
      <ListRow title="Eerste chat" kind="running" status="Bezig" marker="shape" />
    </List>,
  )
  expect(container.querySelector('[data-nt-status-shape]')).toHaveAttribute('data-kind', 'running')
  // The word stays in the name whichever mark is drawn.
  expect(screen.getByRole('button', { name: /^Eerste chat ?, Bezig/ })).toBeInTheDocument()
})

test('a second line stands under the title, hidden from the ear, its words in the name', () => {
  render(
    <List label="Chats">
      <ListRow
        title="Eerste chat"
        kind="running"
        status="Bezig"
        marker="shape"
        meta="5 min"
        subline={{ content: <span>nt/eerste-chat</span>, label: 'nt/eerste-chat' }}
      />
    </List>,
  )
  const row = screen.getByRole('button', { name: /Eerste chat/ })
  expect(row).toHaveAccessibleName(/^Eerste chat ?, Bezig, ?5 min ?, nt\/eerste-chat$/)
  const line = row.querySelector('[data-nt-list-subline]')
  expect(line).toHaveAttribute('aria-hidden', 'true')
  expect(line).toHaveTextContent('nt/eerste-chat')
  // 48px tall, the title in 12px; the second line in the sans at 11px with even figures, muted,
  // indented to where the title starts (14px mark + 8px gap). Mono made it read as big as the
  // title.
  expect(row.className).toContain('h-12')
  expect(row.querySelector('[data-nt-list-title]')?.className).toContain('text-[12px]')
  expect(line?.className).not.toContain('font-mono')
  expect(line?.className).toContain('tabular-nums')
  expect(line?.className).toContain('text-[11px]')
  expect(line?.className).toContain('text-muted')
  expect(line?.className).toContain('ps-[22px]')
})

test('a row without a second line keeps its single 32px line', () => {
  render(
    <List label="Chats">
      <ListRow title="Eerste chat" kind="running" status="Bezig" marker="shape" />
    </List>,
  )
  const row = screen.getByRole('button', { name: /Eerste chat/ })
  expect(row.querySelector('[data-nt-list-subline]')).toBeNull()
  expect(row.className).toContain('h-(--nt-control-lg)')
})

test('a strong row draws its title in the foreground colour, a default one muted', () => {
  const { rerender } = render(
    <List label="Chats">
      <ListRow title="Eerste chat" />
    </List>,
  )
  expect(screen.getByRole('button').className).toContain('text-muted')
  rerender(
    <List label="Chats">
      <ListRow title="Eerste chat" emphasis="strong" />
    </List>,
  )
  expect(screen.getByRole('button').className).toContain('text-fg')
  expect(screen.getByRole('button').className).not.toContain('text-muted')
})

test('secondary keeps titles quiet at rest, a step above muted (K2)', () => {
  render(
    <List label="Specs">
      <ListRow title="Afrekenen v2" emphasis="secondary" />
    </List>,
  )
  const row = screen.getByRole('button')
  expect(row).toHaveClass('text-secondary')
  expect(row.className).not.toContain('text-muted')
  // Hover and the current row still lift it to the foreground.
  expect(row.className).toContain('hover:text-fg')
  expect(row.className).toContain('aria-[current=page]:text-fg')
})

function FoldableGroup({ initiallyOpen = true }: { initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen)
  return (
    <List label="Chats">
      <ListGroup
        heading="webshop"
        count={2}
        label="webshop, 2 chats"
        open={open}
        onOpenChange={setOpen}
      >
        <ListRow title="Eerste chat" />
        <ListRow title="Tweede chat" />
      </ListGroup>
      <ListGroup heading="nt-agent" count={1} label="nt-agent, 1 chat" open onOpenChange={() => {}}>
        <ListRow title="Derde chat" />
      </ListGroup>
    </List>
  )
}

test('a list group is named by its heading alone, and its button by the whole phrase', () => {
  render(<FoldableGroup />)
  expect(screen.getByRole('group', { name: 'webshop' })).toBeInTheDocument()
  const toggle = screen.getByRole('button', { name: 'webshop, 2 chats' })
  expect(toggle).toHaveAttribute('aria-expanded', 'true')
  // The count stands beside the heading for the eye; the heading level keeps the projects in the
  // heading list of a screen reader.
  expect(toggle.closest('h2')).toHaveTextContent('webshop2')
})

test('a folded group renders no rows, so the arrows skip straight to the next group', async () => {
  render(<FoldableGroup />)
  await userEvent.click(screen.getByRole('button', { name: 'webshop, 2 chats' }))
  expect(screen.getByRole('button', { name: 'webshop, 2 chats' })).toHaveAttribute(
    'aria-expanded',
    'false',
  )
  expect(screen.queryByRole('button', { name: /Eerste chat/ })).toBeNull()
  expect(screen.getByRole('button', { name: /Derde chat/ })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'webshop, 2 chats' }))
  expect(screen.getByRole('button', { name: /Eerste chat/ })).toBeInTheDocument()
})

test('the heading of a group is a small label in capitals, 11px and muted', () => {
  render(<FoldableGroup />)
  const toggle = screen.getByRole('button', { name: 'webshop, 2 chats' })
  expect(toggle.className).toContain('text-[11px]')
  expect(toggle.className).toContain('uppercase')
  expect(toggle.className).toContain('text-muted')
})

test('the rows of a group stand 4px apart', () => {
  render(<FoldableGroup />)
  const rows = screen.getByRole('group', { name: 'webshop' }).querySelector('ul')
  expect(rows?.className).toContain('gap-1')
})

test('a fold chevron stands beside the row, not inside its button, and the arrows skip it', async () => {
  const onToggle = vi.fn()
  render(
    <List label="Chats">
      <ListRow title="Ouder" fold={{ open: false, label: 'Subagents van Ouder', onToggle }} />
      <ListRow title="Tweede" />
    </List>,
  )
  const row = screen.getByRole('button', { name: 'Ouder' })
  const chevron = screen.getByRole('button', { name: 'Subagents van Ouder' })
  expect(chevron).toHaveAttribute('aria-expanded', 'false')
  expect(row.contains(chevron)).toBe(false)
  expect(row.closest('li')?.contains(chevron)).toBe(true)
  await userEvent.click(chevron)
  expect(onToggle).toHaveBeenCalledOnce()
  row.focus()
  await userEvent.keyboard('{ArrowDown}')
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Tweede' }))
})

test('a glyph of its own takes the place of the status icon', () => {
  const { container } = render(
    <List label="Documenten">
      <ListRow
        title="Afrekenen"
        marker={<svg data-own-glyph aria-hidden="true" />}
        status="Spec, Concept"
      />
    </List>,
  )
  expect(container.querySelector('[data-own-glyph]')).not.toBeNull()
  expect(container.querySelector('[data-nt-status-shape]')).toBeNull()
  expect(screen.getByRole('button')).toHaveAccessibleName(/^Afrekenen\s*, Spec, Concept,$/)
})

test('a glyph of its own needs the status in words: the types do not allow it without', () => {
  render(
    <List label="Documenten">
      {/* @ts-expect-error a glyph without a word would carry the status by shape alone. */}
      <ListRow title="Afrekenen" marker={<svg aria-hidden="true" />} />
    </List>,
  )
  expect(screen.getByRole('button', { name: /Afrekenen/ })).toBeInTheDocument()
})

test('a struck row draws its title struck through', () => {
  const { container } = render(
    <List label="Documenten">
      <ListRow title="Retouren" struck />
    </List>,
  )
  expect(container.querySelector('[data-nt-list-title]')).toHaveClass('line-through')
})

test('a row that fills only when current has no fill under the pointer', () => {
  render(
    <List label="Documenten">
      <ListRow title="Eerste" fill="current" />
      <ListRow title="Tweede" />
    </List>,
  )
  const [quiet, plain] = screen.getAllByRole('button')
  expect(quiet?.className).not.toContain('hover:bg-surface')
  expect(quiet?.className).toContain('aria-[current=page]:bg-surface-hover')
  expect(plain?.className).toContain('hover:bg-surface')
})

test('a hint shows the whole title under the pointer', () => {
  render(
    <List label="Documenten">
      <ListRow title="Plan" hint="Afrekenen v2" />
    </List>,
  )
  expect(screen.getByRole('button')).toHaveAttribute('title', 'Afrekenen v2')
})

test('a compact row is 24px high with the text of a secondary line', () => {
  render(
    <List label="Stappen">
      <ListRow title="De mand" status="Klaar" meta={false} compact />
    </List>,
  )
  const row = screen.getByRole('button', { name: /De mand/ })
  expect(row.className).toContain('h-(--nt-control-sm)')
  expect(row.className).toContain('text-[12px]')
  expect(row.className).not.toContain('h-(--nt-control-lg)')
})

test('a list can take its name from a visible heading', () => {
  render(
    <>
      <h2 id="busy">Bezig</h2>
      <List labelledBy="busy">
        <ListRow title="Afrekenen v2" status="Spec, In review" />
      </List>
    </>,
  )
  const list = screen.getByRole('list', { name: 'Bezig' })
  expect(list).toHaveAttribute('aria-labelledby', 'busy')
  expect(list).not.toHaveAttribute('aria-label')
})

test('a dense row is 28px high with the text of the base', () => {
  render(
    <List label="Documenten">
      <ListRow title="Afrekenen v2" status="Spec, Concept" dense />
    </List>,
  )
  const row = screen.getByRole('button', { name: /Afrekenen v2/ })
  expect(row.className).toContain('h-(--nt-control-md)')
  expect(row.className).toContain('text-[13px]')
  expect(row.className).not.toContain('h-(--nt-control-lg)')
})

test('meta={false} shows no detail, while the status stays in the name', () => {
  render(
    <List label="Stappen">
      <ListRow title="De mand" status="Klaar" meta={false} compact />
    </List>,
  )
  expect(screen.getByRole('button', { name: 'De mand , Klaar,' })).toBeInTheDocument()
  expect(screen.queryByText('Klaar', { selector: '[aria-hidden="true"]' })).toBeNull()
})

test('a detail for the pointer shows on hover and focus, in place of the meta', () => {
  render(
    <List label="Documenten">
      <ListRow title="Afrekenen" meta="3/5" hoverMeta="PLAN-9" />
    </List>,
  )
  const meta = screen.getByText('3/5')
  const label = screen.getByText('PLAN-9')
  expect(meta.className).toContain('group-hover/row:opacity-0')
  expect(meta.className).toContain('group-focus-within/row:opacity-0')
  expect(label.className).toContain('opacity-0')
  expect(label.className).toContain('group-hover/row:opacity-100')
  expect(label.className).toContain('group-focus-within/row:opacity-100')
  // Both in the name, meta first, so a name still ends in the label.
  expect(screen.getByRole('button', { name: 'Afrekenen 3/5 PLAN-9' })).toBeInTheDocument()
})

test('a detail for the pointer alone leaves the spot empty at rest', () => {
  render(
    <List label="Documenten">
      <ListRow title="Voorraad" hoverMeta="SPEC-4" />
    </List>,
  )
  expect(screen.getByText('SPEC-4').className).toContain('opacity-0')
  expect(screen.getByRole('button', { name: 'Voorraad SPEC-4' })).toBeInTheDocument()
})

test('a quiet group shows its count only under the pointer, with the focus, or folded', () => {
  const { rerender } = render(
    <List label="Chats">
      <ListGroup
        heading="nt-agent"
        count={4}
        label="nt-agent, 4 chats"
        quiet
        open
        onOpenChange={() => {}}
      >
        <ListRow title="Eerste chat" />
      </ListGroup>
    </List>,
  )
  const button = screen.getByRole('button', { name: 'nt-agent, 4 chats' })
  // In the regular weight rather than medium, so the heading sits a step behind the rows.
  expect(button.className).toContain('font-normal')
  const count = button.querySelector('[data-nt-list-group-count]')
  expect(count?.className).toContain('opacity-0')
  expect(count?.className).toContain('group-hover/heading:opacity-100')
  rerender(
    <List label="Chats">
      <ListGroup
        heading="nt-agent"
        count={4}
        label="nt-agent, 4 chats"
        quiet
        open={false}
        onOpenChange={() => {}}
      >
        <ListRow title="Eerste chat" />
      </ListGroup>
    </List>,
  )
  expect(button.querySelector('[data-nt-list-group-count]')?.className).not.toContain('opacity-0')
})

test('a group may carry an icon before its heading', () => {
  render(
    <List label="Chats">
      <ListGroup
        heading="Gearchiveerd"
        count={2}
        label="Gearchiveerd, 2 chats"
        icon="archive"
        open={false}
        onOpenChange={() => {}}
      >
        <ListRow title="Oude chat" />
      </ListGroup>
    </List>,
  )
  const button = screen.getByRole('button', { name: 'Gearchiveerd, 2 chats' })
  expect(button.querySelector('[data-nt-list-group-icon] svg')).not.toBeNull()
})

test('a pointer on the row that has the focus lets go of it first, so a click leaves no ring', () => {
  // The keyboard (or ⌘J) focused it; a click on the same row would otherwise keep the ring of
  // keyboard focus on a row chosen with the mouse.
  const onPointerDown = vi.fn()
  render(
    <List label="Wacht op jou">
      <ListRow title="Eerste" onPointerDown={onPointerDown} />
      <ListRow title="Tweede" />
    </List>,
  )
  const first = screen.getByRole('button', { name: 'Eerste' })
  first.focus()
  expect(first).toHaveFocus()
  first.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
  expect(first).not.toHaveFocus()
  // The caller's own handler still hears it.
  expect(onPointerDown).toHaveBeenCalledOnce()
  // A row without the focus is left alone.
  const second = screen.getByRole('button', { name: 'Tweede' })
  second.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
  expect(document.activeElement).not.toBe(second)
})
