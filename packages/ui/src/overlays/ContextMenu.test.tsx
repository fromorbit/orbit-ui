import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { Button } from '../primitives/Button'
import { ContextMenu } from './ContextMenu'
import { DropdownMenu, type DropdownMenuItem } from './DropdownMenu'

/** The acts on a file, once, as a caller gives them to both menus. */
function items(onSelect: (id: string) => void): DropdownMenuItem[] {
  return [
    { id: 'open', label: 'Openen', icon: 'square-arrow-out-up-right' },
    { id: 'rename', label: 'Hernoemen', icon: 'pencil', onSelect: () => onSelect('rename') },
    { id: 'archive', label: 'Archiveren', onSelect: () => onSelect('archive') },
    {
      id: 'delete',
      label: 'Verwijderen',
      tone: 'danger',
      separated: true,
      onSelect: () => onSelect('delete'),
    },
  ]
}

/** A file row a right click is meant for. */
function FileRow({
  onSelect = () => {},
  disabled = false,
}: {
  onSelect?: (id: string) => void
  disabled?: boolean
}) {
  return (
    <ContextMenu label="Acties voor offerte.pdf" items={items(onSelect)} disabled={disabled}>
      <div data-testid="row">offerte.pdf</div>
    </ContextMenu>
  )
}

test('a right click opens the menu, named by its label, with the rows in order', async () => {
  render(<FileRow />)
  fireEvent.contextMenu(screen.getByTestId('row'), { clientX: 40, clientY: 12 })
  const menu = await screen.findByRole('menu', { name: 'Acties voor offerte.pdf' })
  expect(
    within(menu)
      .getAllByRole('menuitem')
      .map((row) => row.textContent),
  ).toEqual(['Openen', 'Hernoemen', 'Archiveren', 'Verwijderen'])
  expect(within(menu).getByRole('separator')).toBeInTheDocument()
})

test('the region is marked open while its menu is up', async () => {
  render(<FileRow />)
  const row = screen.getByTestId('row')
  expect(row).toHaveAttribute('data-state', 'closed')
  fireEvent.contextMenu(row)
  await screen.findByRole('menu')
  expect(row).toHaveAttribute('data-state', 'open')
})

test('choosing a row reports it once and closes the menu', async () => {
  const onSelect = vi.fn()
  render(<FileRow onSelect={onSelect} />)
  fireEvent.contextMenu(screen.getByTestId('row'))
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Archiveren' }))
  expect(onSelect).toHaveBeenCalledTimes(1)
  expect(onSelect).toHaveBeenCalledWith('archive')
  await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
})

test('Escape closes it', async () => {
  render(<FileRow />)
  fireEvent.contextMenu(screen.getByTestId('row'))
  await screen.findByRole('menu')
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
})

test('disabled, it leaves the right click to the browser', () => {
  render(<FileRow disabled />)
  const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
  screen.getByTestId('row').dispatchEvent(event)
  expect(event.defaultPrevented).toBe(false)
  expect(screen.queryByRole('menu')).toBeNull()
})

test('a right click and the ⋯ of the same row draw the same rows from one array', async () => {
  const shared = items(() => {})
  render(
    <ContextMenu label="Rechtsklik" items={shared}>
      <div data-testid="row">
        offerte.pdf
        <DropdownMenu trigger={<Button>Meer</Button>} label="Meer" items={shared} />
      </div>
    </ContextMenu>,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Meer' }))
  const fromButton = within(await screen.findByRole('menu', { name: 'Meer' }))
    .getAllByRole('menuitem')
    .map((row) => [row.textContent, row.className, row.children.length])
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
  fireEvent.contextMenu(screen.getByTestId('row'))
  const fromClick = within(await screen.findByRole('menu', { name: 'Rechtsklik' }))
    .getAllByRole('menuitem')
    .map((row) => [row.textContent, row.className, row.children.length])
  expect(fromClick).toEqual(fromButton)
})

test('a row without an icon keeps the column of the icons, so every label starts on one line', async () => {
  render(<FileRow />)
  fireEvent.contextMenu(screen.getByTestId('row'))
  const archive = await screen.findByRole('menuitem', { name: 'Archiveren' })
  expect(archive.querySelector('[data-nt-menu-lead]')).not.toBeNull()
  const rename = screen.getByRole('menuitem', { name: 'Hernoemen' })
  expect(rename.querySelector('[data-nt-menu-lead]')).toBeNull()
})

test('choices, a head and a submenu work as in a DropdownMenu', async () => {
  const onSelect = vi.fn()
  render(
    <ContextMenu
      label="Tekening"
      header={{ title: 'plattegrond.png', detail: 'Tekeningen' }}
      items={[
        { id: 'grid', label: 'Raster tonen', checked: true, onSelect: () => onSelect('grid') },
        { id: 'metre', label: 'Meter', kind: 'radio', group: 'unit', checked: true },
        { id: 'cm', label: 'Centimeter', kind: 'radio', group: 'unit', checked: false },
        {
          id: 'move',
          label: 'Verplaatsen naar',
          kind: 'submenu',
          items: [{ id: 'archive', label: 'Archief', onSelect: () => onSelect('archive') }],
        },
      ]}
    >
      <div data-testid="canvas">tekening</div>
    </ContextMenu>,
  )
  fireEvent.contextMenu(screen.getByTestId('canvas'))
  const menu = await screen.findByRole('menu', { name: 'Tekening' })
  expect(
    within(menu).getByRole('group', { name: 'plattegrond.png Tekeningen' }),
  ).toBeInTheDocument()
  expect(screen.getByRole('menuitemcheckbox', { name: 'Raster tonen' })).toHaveAttribute(
    'aria-checked',
    'true',
  )
  expect(screen.getByRole('menuitemradio', { name: 'Centimeter' })).toHaveAttribute(
    'aria-checked',
    'false',
  )
  const move = screen.getByRole('menuitem', { name: 'Verplaatsen naar' })
  move.focus()
  await userEvent.keyboard('{ArrowRight}')
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Archief' }))
  expect(onSelect).toHaveBeenCalledWith('archive')
})
