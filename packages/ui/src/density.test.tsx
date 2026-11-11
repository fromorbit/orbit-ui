import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import { DropdownMenu } from './overlays/DropdownMenu'
import { List, ListRow } from './patterns/List'
import { Button } from './primitives/Button'
import { Tabs } from './primitives/Tabs'

/**
 * The rows that stand a step above a control (36px regular, 32px compact) take `--nt-row`, so they
 * follow the density a host picks (`data-density`, `tokens.css`) rather than staying 36px.
 */
test('a row of a list, a menu and arranged tabs follows the density', async () => {
  render(
    <>
      <List label="Chats">
        <ListRow title="Eerste chat" />
      </List>
      <Tabs
        label="Onderdelen"
        tabs={[{ id: 'a', label: 'Uiterlijk', content: <p>Inhoud A</p> }]}
        arrange={({ list, panels }) => (
          <>
            {list}
            {panels}
          </>
        )}
      />
      <DropdownMenu
        trigger={<Button>Account</Button>}
        label="Account"
        density="comfortable"
        items={[{ id: 'account', label: 'Profiel', onSelect: () => {} }]}
      />
    </>,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Account' }))
  const rows = [
    screen.getByRole('button', { name: 'Eerste chat' }),
    screen.getByRole('tab', { name: 'Uiterlijk' }),
    await screen.findByRole('menuitem', { name: 'Profiel' }),
  ]
  for (const row of rows) {
    const classes = row.className.split(' ')
    expect(classes).toContain('h-(--nt-row)')
    expect(classes).not.toContain('h-9')
  }
})
