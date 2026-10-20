import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import { List } from './List'
import { RoomyListRow } from './RoomyListRow'

describe('RoomyListRow', () => {
  test('reads as a row does, with its note last and heard once', () => {
    render(
      <List label="Subagents">
        <RoomyListRow
          title="Zoekt de korting"
          kind="done"
          status="Klaar"
          meta="1 actie"
          note="De korting staat in de winkelwagen."
        />
      </List>,
    )
    const row = screen.getByRole('button')
    expect(row).toHaveAccessibleName(
      'Zoekt de korting , Klaar, 1 actie , De korting staat in de winkelwagen.',
    )
    expect(screen.getByText('De korting staat in de winkelwagen.')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })

  test('lets its title wrap onto a second line instead of cutting it off at once', () => {
    render(
      <List label="Subagents">
        <RoomyListRow title="Een lange beschrijving" kind="running" status="Bezig" />
      </List>,
    )
    const title = screen.getByText('Een lange beschrijving')
    expect(title.className).toContain('line-clamp-2')
    expect(title.className).not.toContain('truncate')
  })

  test('has room around it, a rounded hover and the focus ring of the app', () => {
    render(
      <List label="Subagents">
        <RoomyListRow title="Zoekt de korting" kind="done" status="Klaar" />
      </List>,
    )
    const row = screen.getByRole('button')
    expect(row.className).toContain('py-2.5')
    expect(row.className).toContain('rounded-md')
    expect(row.className).toContain('focus-visible:outline-2')
  })

  test('without a note it is one line and nothing stray is heard', () => {
    render(
      <List label="Subagents">
        <RoomyListRow title="Zoekt de korting" kind="done" status="Klaar" meta="1 actie" />
      </List>,
    )
    expect(screen.getByRole('button')).toHaveAccessibleName('Zoekt de korting , Klaar, 1 actie')
  })

  test('the arrows walk it with the other rows of the list', async () => {
    render(
      <List label="Subagents">
        <RoomyListRow title="Een" kind="done" status="Klaar" />
        <RoomyListRow title="Twee" kind="running" status="Bezig" />
      </List>,
    )
    screen.getByRole('button', { name: /Een/ }).focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('button', { name: /Twee/ })).toHaveFocus()
  })

  test('its actions stand beside the row, not inside it, and the arrows skip them', async () => {
    render(
      <List label="Subagents">
        <RoomyListRow
          title="Een"
          kind="done"
          status="Klaar"
          actions={<button type="button">Acties voor Een</button>}
          below={<p>Veld onder Een</p>}
        />
        <RoomyListRow title="Twee" kind="running" status="Bezig" />
      </List>,
    )
    const row = screen.getByRole('button', { name: /^Een/ })
    const actions = screen.getByRole('button', { name: 'Acties voor Een' })
    // Never a button in a button: the actions are a sibling of the row, in the same list item.
    expect(row.contains(actions)).toBe(false)
    expect(row.closest('li')).toBe(actions.closest('li'))
    expect(screen.getByText('Veld onder Een').closest('li')).toBe(row.closest('li'))
    row.focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('button', { name: /^Twee/ })).toHaveFocus()
  })
})
