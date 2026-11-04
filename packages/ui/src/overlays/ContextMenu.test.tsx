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

test('a radio row shows a dot, not the check of a switch, and a heading names its group', async () => {
  render(
    <ContextMenu
      label="Tekening"
      items={[
        { id: 'grid', label: 'Raster tonen', checked: true },
        { id: 'unit', label: 'Eenheid', kind: 'heading', separated: true },
        { id: 'metre', label: 'Meter', kind: 'radio', group: 'unit', checked: true },
        { id: 'cm', label: 'Centimeter', kind: 'radio', group: 'unit', checked: false },
      ]}
    >
      <div data-testid="canvas">tekening</div>
    </ContextMenu>,
  )
  fireEvent.contextMenu(screen.getByTestId('canvas'))
  const menu = await screen.findByRole('menu', { name: 'Tekening' })
  expect(within(menu).getByRole('group', { name: 'Eenheid' })).toBeInTheDocument()
  const metre = screen.getByRole('menuitemradio', { name: 'Meter' })
  expect(metre.querySelector('[data-nt-menu-check] [data-nt-menu-dot]')).not.toBeNull()
  const grid = screen.getByRole('menuitemcheckbox', { name: 'Raster tonen' })
  expect(grid.querySelector('[data-nt-menu-check] [data-nt-menu-dot]')).toBeNull()
  expect(grid.querySelector('[data-nt-menu-check] svg')).not.toBeNull()
})

test('the panel is capped in width, so a long label is cut off instead of leaving the window', async () => {
  render(<FileRow />)
  fireEvent.contextMenu(screen.getByTestId('row'))
  const menu = await screen.findByRole('menu')
  expect(menu.className).toContain('max-w-[min(20rem,calc(100vw-16px))]')
  const label = within(menu).getByText('Hernoemen')
  expect(label.className).toContain('min-w-0')
  expect(label.className).toContain('truncate')
})

test('under a head the danger icon keeps the tone of its row, and the rows lead in the head slot', async () => {
  render(
    <ContextMenu
      label="Acties voor Robin"
      header={{ title: 'Robin', glyph: <span data-testid="glyph" /> }}
      density="comfortable"
      items={[
        { id: 'profile', label: 'Profiel bekijken', icon: 'user' },
        { id: 'remove', label: 'Uit het team halen', icon: 'log-out', tone: 'danger' },
      ]}
    >
      <div data-testid="card">Robin</div>
    </ContextMenu>,
  )
  fireEvent.contextMenu(screen.getByTestId('card'))
  const remove = await screen.findByRole('menuitem', { name: 'Uit het team halen' })
  expect(remove.querySelector('[data-nt-menu-icon]')?.className).toContain('text-danger')
  const profile = screen.getByRole('menuitem', { name: 'Profiel bekijken' })
  expect(profile.querySelector('[data-nt-menu-icon]')?.className).toContain('text-muted')
  // The icon in the 30px slot of the head's glyph, so title and labels share one left edge.
  expect(profile.querySelector('[data-nt-menu-icon]')?.parentElement?.className).toContain('w-7.5')
  expect(screen.getByTestId('glyph').parentElement?.className).toContain('w-7.5')
})

test('every region of the story is reached with Tab, and offers its acts on a visible ⋯', async () => {
  const { default: story } = await import('./ContextMenu.gallery')
  for (const name of ['With choices', 'With a head'] as const) {
    const State = story.states[name]
    const { unmount } = render(<State />)
    const region = document.querySelector<HTMLElement>('[data-nt-story-region]')
    expect(region).not.toBeNull()
    await userEvent.tab()
    expect(region).toHaveFocus()
    expect(within(region as HTMLElement).getByRole('button', { name: 'Meer' })).toBeInTheDocument()
    unmount()
  }
})

/** A region that takes the focus, as a drawing or a card does, for the keyboard's way in. */
function FocusRegion({ onSelect = () => {} }: { onSelect?: (id: string) => void }) {
  return (
    <ContextMenu label="Acties voor offerte.pdf" items={items(onSelect)}>
      {/* biome-ignore lint/a11y/useSemanticElements: a file, not a set of form controls */}
      <div
        data-testid="region"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the focus target of the keys
        tabIndex={0}
        role="group"
        aria-label="offerte.pdf"
      >
        offerte.pdf
        <input aria-label="Notitie" />
      </div>
    </ContextMenu>
  )
}

test.each([
  ['Shift+F10', '{Shift>}{F10}{/Shift}'],
  ['the context-menu key', '{ContextMenu}'],
])('%s opens the menu on what holds the focus, on every platform', async (_, keys) => {
  render(<FocusRegion />)
  screen.getByTestId('region').focus()
  await userEvent.keyboard(keys)
  expect(await screen.findByRole('menu', { name: 'Acties voor offerte.pdf' })).toBeInTheDocument()
})

test('the keys are left to a field inside the region, for its own menu', async () => {
  render(<FocusRegion />)
  screen.getByRole('textbox', { name: 'Notitie' }).focus()
  await userEvent.keyboard('{Shift>}{F10}{/Shift}')
  expect(screen.queryByRole('menu')).toBeNull()
})

test('a scroll that moves the region closes the menu; one elsewhere leaves it open', async () => {
  render(
    <div data-testid="scroller">
      <FileRow />
      <div data-testid="elsewhere" />
    </div>,
  )
  fireEvent.contextMenu(screen.getByTestId('row'))
  await screen.findByRole('menu')
  fireEvent.scroll(screen.getByTestId('elsewhere'))
  expect(screen.getByRole('menu')).toBeInTheDocument()
  fireEvent.scroll(screen.getByTestId('scroller'))
  await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
})

test('the release of the press that opened it chooses nothing', async () => {
  const onSelect = vi.fn()
  render(<FileRow onSelect={onSelect} />)
  fireEvent.contextMenu(screen.getByTestId('row'), { clientX: 40, clientY: 12 })
  const row = await screen.findByRole('menuitem', { name: 'Archiveren' })
  fireEvent.pointerUp(row, { clientX: 41, clientY: 13, pointerType: 'mouse' })
  expect(onSelect).not.toHaveBeenCalled()
  expect(screen.getByRole('menu')).toBeInTheDocument()
})

test('the panel slides back inside the window on the side it opened to', async () => {
  render(<FileRow />)
  fireEvent.contextMenu(screen.getByTestId('row'))
  const menu = await screen.findByRole('menu')
  expect(menu.className).toContain('data-[side=right]:translate-x-[min(0px,')
  expect(menu.className).toContain('data-[side=left]:translate-x-[max(0px,')
})
