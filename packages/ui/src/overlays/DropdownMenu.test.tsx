import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import { Button } from '../primitives/Button'
import { IconButton } from '../primitives/IconButton'
import { uiWrapper } from '../testing/ui-wrapper'
import { DropdownMenu, type DropdownMenuItem } from './DropdownMenu'
import { PortalContainerProvider } from './portal'
import { TooltipProvider } from './Tooltip'

/** The shape every caller has: a trigger and a handful of row actions. */
function items(onSelect: (id: string) => void): DropdownMenuItem[] {
  return [
    { id: 'rename', label: 'Hernoemen', onSelect: () => onSelect('rename') },
    { id: 'archive', label: 'Archiveren', onSelect: () => onSelect('archive') },
    { id: 'delete', label: 'Verwijderen', tone: 'danger', onSelect: () => onSelect('delete') },
  ]
}

/** Opens the menu the way a reader does and hands back the trigger and the panel. */
async function open(onSelect: (id: string) => void = () => {}): Promise<{
  trigger: HTMLElement
  panel: HTMLElement
}> {
  render(<DropdownMenu trigger={<Button>Meer</Button>} label="Rijacties" items={items(onSelect)} />)
  const trigger = screen.getByRole('button', { name: 'Meer' })
  await userEvent.click(trigger)
  const panel = await screen.findByRole('menu', { name: 'Rijacties' })
  return { trigger, panel }
}

test('opens on a click and puts the focus in the menu', async () => {
  // Radix's MenuContentImpl parks focus on the panel itself when it mounts, not on the first item:
  // the first item only gets it via ArrowDown, Home or typing. See DropdownMenu.tsx for the reason
  // this wrapper never overrides that with its own `onOpenAutoFocus`.
  const { panel } = await open()
  await waitFor(() => expect(document.activeElement).toBe(panel))
})

test('an open menu hides nothing else from a screen reader', async () => {
  // A row menu is not a modal, and `Popover` beside it is not one either: Radix' own default for
  // `DropdownMenu` is, and it marks everything outside the panel `aria-hidden` while leaving it in
  // the tab order. Axe reads that as `focusable-disabled` (WCAG 4.1.2) — it caught the gallery
  // story of this layer, where the rest of the page is a handful of other triggers.
  render(
    <>
      <Button>Naast het menu</Button>
      <DropdownMenu trigger={<Button>Meer</Button>} label="Rijacties" items={items(() => {})} />
    </>,
  )
  const beside = screen.getByRole('button', { name: 'Naast het menu' })
  await userEvent.click(screen.getByRole('button', { name: 'Meer' }))
  await screen.findByRole('menu', { name: 'Rijacties' })
  expect(beside.closest('[aria-hidden="true"]')).toBeNull()
  expect(beside).not.toHaveAttribute('aria-hidden')
})

test('ArrowDown moves to the first item', async () => {
  await open()
  await userEvent.keyboard('{ArrowDown}')
  await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Hernoemen' })).toHaveFocus())
})

test('Escape closes it and hands the focus back to the trigger', async () => {
  const { trigger } = await open()
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  expect(trigger).toHaveFocus()
})

test('choosing an item reports it once and closes the menu', async () => {
  const onSelect = vi.fn()
  await open(onSelect)
  await userEvent.click(screen.getByRole('menuitem', { name: 'Archiveren' }))
  expect(onSelect).toHaveBeenCalledExactlyOnceWith('archive')
  await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
})

test('choosing a plain row hands the focus back to the trigger', async () => {
  const { trigger } = await open()
  await userEvent.click(screen.getByRole('menuitem', { name: 'Archiveren' }))
  await waitFor(() => expect(trigger).toHaveFocus())
})

/** Lets every timer that is due run: Radix hands the focus back one task after the menu closed. */
function nextTasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 20))
}

test('the hand-back never takes the focus from what holds it by then', async () => {
  // The panel's `+` → Browser: the new tab's address takes the focus once core has answered. When
  // that lands before Radix's deferred hand-back to the trigger (a task after the close), the
  // hand-back used to win and pull the focus off the address.
  render(
    <>
      <input aria-label="Adres" />
      <DropdownMenu
        trigger={<Button>Meer</Button>}
        label="Rijacties"
        items={[
          {
            id: 'browser',
            label: 'Browser',
            // After the menu is gone but ahead of the hand-back: a timer set before its own.
            onSelect: () => {
              setTimeout(() => screen.getByRole('textbox', { name: 'Adres' }).focus(), 0)
            },
          },
        ]}
      />
    </>,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Meer' }))
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Browser' }))
  await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  await nextTasks()
  expect(screen.getByRole('textbox', { name: 'Adres' })).toHaveFocus()
})

test('a late hand-back leaves the menu opened again in the meantime open', async () => {
  // Delayed long enough under load, the hand-back of one close fired after the reader had opened
  // the menu again: focusing the trigger is a focus outside that menu, so it closed at once.
  render(
    <DropdownMenu
      trigger={<Button>Meer</Button>}
      label="Rijacties"
      items={[
        {
          id: 'again',
          label: 'Nog eens',
          // Reopens the menu after the close but ahead of the hand-back, as the press would.
          onSelect: () => {
            setTimeout(() => fireEvent.pointerDown(screen.getByRole('button', { name: 'Meer' })), 0)
          },
        },
      ]}
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Meer' }))
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Nog eens' }))
  await nextTasks()
  expect(screen.getByRole('menu', { name: 'Rijacties' })).toBeInTheDocument()
})

test('a late hand-back after a radio row leaves the menu opened again open', async () => {
  // The project switcher: a radio row renames the trigger, and the reader opens the menu again
  // right away to choose the next project (top-bar e2e, "the switcher filters the sidebar").
  function Switcher() {
    const [chosen, setChosen] = useState('alle')
    return (
      <DropdownMenu
        trigger={<Button>{chosen === 'alle' ? 'Alle projecten' : chosen}</Button>}
        label="Kies een project"
        items={['alle', 'ander-project'].map((id) => ({
          id,
          label: id === 'alle' ? 'Alle projecten' : id,
          kind: 'radio' as const,
          group: 'project',
          checked: id === chosen,
          onSelect: () => {
            setChosen(id)
            // Reopens after the close but ahead of the hand-back, as the next press would.
            setTimeout(() => fireEvent.pointerDown(screen.getByRole('button')), 0)
          },
        }))}
      />
    )
  }
  render(<Switcher />)
  await userEvent.click(screen.getByRole('button', { name: 'Alle projecten' }))
  await userEvent.click(await screen.findByRole('menuitemradio', { name: 'ander-project' }))
  await nextTasks()
  expect(screen.getByRole('button', { name: 'ander-project' })).toBeInTheDocument()
  expect(screen.getByRole('menu', { name: 'Kies een project' })).toBeInTheDocument()
})

test('after a close by a click on another control, Escape still hands the focus back', async () => {
  // The first close leaves the focus on the control clicked; the next close, with the focus gone
  // down with the menu, is an ordinary one again.
  render(
    <>
      <button type="button">Elders</button>
      <DropdownMenu trigger={<Button>Meer</Button>} label="Rijacties" items={items(() => {})} />
    </>,
  )
  const trigger = screen.getByRole('button', { name: 'Meer' })
  const elsewhere = screen.getByRole('button', { name: 'Elders' })
  await userEvent.click(trigger)
  await screen.findByRole('menu', { name: 'Rijacties' })
  await userEvent.click(elsewhere)
  await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  await nextTasks()
  expect(elsewhere).toHaveFocus()

  await userEvent.click(trigger)
  await screen.findByRole('menu', { name: 'Rijacties' })
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  await waitFor(() => expect(trigger).toHaveFocus())
})

test('a disabled item cannot be chosen', async () => {
  const onSelect = vi.fn()
  render(
    <DropdownMenu
      trigger={<Button>Meer</Button>}
      label="Rijacties"
      items={[
        { id: 'rename', label: 'Hernoemen', disabled: true, onSelect: () => onSelect('rename') },
      ]}
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Meer' }))
  const item = await screen.findByRole('menuitem', { name: 'Hernoemen' })
  expect(item).toHaveAttribute('aria-disabled', 'true')
  await userEvent.click(item)
  expect(onSelect).not.toHaveBeenCalled()
})

test('a disabled row with a reason stays in the walk, keeps its reason, and still refuses the choice', async () => {
  // The guarded form (review, 3e ronde): Radix's own `disabled` (the test above) would remove a
  // row from the roving-focus walk entirely, which is exactly wrong for a row whose reason is
  // meant to be read on the way through it. This one is real `disabled` *and* a `hint` together —
  // the combination that asks for the guard in `DropdownMenu.tsx`'s `Row`, proven here directly
  // rather than only through a caller like `BrowserMenu` that happens to refuse the action itself.
  const onSelect = vi.fn()
  render(
    <TooltipProvider>
      <DropdownMenu
        trigger={<Button>Meer</Button>}
        label="Rijacties"
        items={[
          { id: 'rename', label: 'Hernoemen', onSelect: () => onSelect('rename') },
          {
            id: 'archive',
            label: 'Archiveren',
            disabled: true,
            hint: 'Hoogstens vijf keer per dag',
            onSelect: () => onSelect('archive'),
          },
        ]}
      />
    </TooltipProvider>,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Meer' }))
  const menu = await screen.findByRole('menu', { name: 'Rijacties' })
  const row = screen.getByRole('menuitem', { name: 'Archiveren' })
  // A real walk from the panel, not a bare `.focus()` in the test: two presses past the panel
  // itself (Radix parks the focus there on open, see "opens on a click…" above), one per row.
  await userEvent.keyboard('{ArrowDown}')
  await userEvent.keyboard('{ArrowDown}')
  expect(row).toHaveFocus()
  expect(row).toHaveAttribute('aria-disabled', 'true')
  expect(row).toHaveAccessibleDescription('Hoogstens vijf keer per dag')
  await userEvent.keyboard('{Enter}')
  expect(onSelect).not.toHaveBeenCalled()
  // Radix closes the menu on every choice unless the row's own `onSelect` says otherwise — exactly
  // what a row that never really chose anything should say.
  expect(menu).toBeVisible()
})

test('a row may show the key that opens it', async () => {
  render(
    <DropdownMenu
      trigger={<Button>Meer</Button>}
      label="Rijacties"
      items={[{ id: 'rename', label: 'Hernoemen', shortcut: 'R', onSelect: () => {} }]}
    />,
    { wrapper: uiWrapper() },
  )
  await userEvent.click(screen.getByRole('button', { name: 'Meer' }))
  const row = await screen.findByRole('menuitem', { name: 'Hernoemen' })
  expect(row.querySelector('kbd')).toHaveTextContent('R')
})

test('a shortcut is drawn key by key: icons for the modifiers, the letter as text', async () => {
  render(
    <DropdownMenu
      trigger={<Button>Meer</Button>}
      label="Rijacties"
      items={[{ id: 'hard', label: 'Hard herladen', shortcut: '⇧⌘R', onSelect: () => {} }]}
    />,
    { wrapper: uiWrapper({ platform: 'mac' }) },
  )
  await userEvent.click(screen.getByRole('button', { name: 'Meer' }))
  const row = await screen.findByRole('menuitem', { name: 'Hard herladen' })
  const keys = [...row.querySelectorAll('kbd')]
  expect(keys).toHaveLength(3)
  expect(keys.filter((key) => key.querySelector('svg') !== null)).toHaveLength(2)
  expect(keys[2]).toHaveTextContent('R')
  expect(keys[2]?.querySelector('svg')).toBeNull()
})

test('a row shows the keys of its shortcut id', async () => {
  render(
    <DropdownMenu
      trigger={<Button>Meer</Button>}
      label="Rijacties"
      items={[{ id: 'hard', label: 'Hard herladen', shortcut: 'demo.reload', onSelect: () => {} }]}
    />,
    { wrapper: uiWrapper({ platform: 'linux' }) },
  )
  await userEvent.click(screen.getByRole('button', { name: 'Meer' }))
  const row = await screen.findByRole('menuitem', { name: 'Hard herladen' })
  // Off macOS: Ctrl and Shift, then the letter.
  const keys = [...row.querySelectorAll('kbd')]
  expect(keys.map((key) => key.textContent)).toEqual(['Ctrl', '', 'R'])
})

test('a row without a key looks exactly as before', async () => {
  await open()
  const row = await screen.findByRole('menuitem', { name: 'Hernoemen' })
  expect(row.querySelector('kbd')).toBeNull()
})

test('a disabled row still shows its key', async () => {
  render(
    <DropdownMenu
      trigger={<Button>Meer</Button>}
      label="Rijacties"
      items={[
        { id: 'rename', label: 'Hernoemen', shortcut: 'R', disabled: true, onSelect: () => {} },
      ]}
    />,
    { wrapper: uiWrapper() },
  )
  await userEvent.click(screen.getByRole('button', { name: 'Meer' }))
  const row = await screen.findByRole('menuitem', { name: 'Hernoemen' })
  expect(row).toHaveAttribute('aria-disabled', 'true')
  expect(row.querySelector('kbd')).toHaveTextContent('R')
})

test('the panel lands in the portal container, never in the body', async () => {
  const host = document.createElement('div')
  document.body.append(host)
  try {
    render(
      <PortalContainerProvider container={host}>
        <DropdownMenu trigger={<Button>Meer</Button>} label="Rijacties" items={items(() => {})} />
      </PortalContainerProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Meer' }))
    const panel = await screen.findByRole('menu', { name: 'Rijacties' })
    expect(host.contains(panel)).toBe(true)
  } finally {
    host.remove()
  }
})

/** A menu with a radio group of two, a checkbox and a hinted row, as the browser tab has one. */
function ChoiceMenu({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <TooltipProvider>
      <DropdownMenu
        trigger={<Button>Meer</Button>}
        label="Profiel"
        items={[
          { id: 'reload', label: 'Herlaad', onSelect: () => onSelect('reload') },
          {
            id: 'clean',
            label: 'Schoon',
            kind: 'radio',
            group: 'profile',
            checked: true,
            separated: true,
            hint: 'Wisselen kost de geschiedenis',
            onSelect: () => onSelect('clean'),
          },
          {
            id: 'project',
            label: 'Project',
            kind: 'radio',
            group: 'profile',
            checked: false,
            onSelect: () => onSelect('project'),
          },
          {
            id: 'default',
            label: 'Standaard',
            kind: 'checkbox',
            checked: true,
            onSelect: () => onSelect('default'),
          },
        ]}
      />
    </TooltipProvider>
  )
}

test('a radio row and a checkbox row say whether they are on', async () => {
  render(<ChoiceMenu onSelect={() => {}} />)
  await userEvent.click(screen.getByRole('button', { name: 'Meer' }))
  await screen.findByRole('menu', { name: 'Profiel' })
  expect(screen.getByRole('menuitemradio', { name: 'Schoon' })).toHaveAttribute(
    'aria-checked',
    'true',
  )
  expect(screen.getByRole('menuitemradio', { name: 'Project' })).toHaveAttribute(
    'aria-checked',
    'false',
  )
  expect(screen.getByRole('menuitemcheckbox', { name: 'Standaard' })).toHaveAttribute(
    'aria-checked',
    'true',
  )
  expect(screen.getByRole('separator')).toBeInTheDocument()
})

test('choosing a radio row reports it like any other row', async () => {
  const onSelect = vi.fn()
  render(<ChoiceMenu onSelect={onSelect} />)
  await userEvent.click(screen.getByRole('button', { name: 'Meer' }))
  await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Project' }))
  expect(onSelect).toHaveBeenCalledWith('project')
})

test('a hint describes its row in a tooltip, not in the menu', async () => {
  render(<ChoiceMenu onSelect={() => {}} />)
  await userEvent.click(screen.getByRole('button', { name: 'Meer' }))
  const row = await screen.findByRole('menuitemradio', { name: 'Schoon' })
  expect(screen.queryByText('Wisselen kost de geschiedenis')).toBeNull()
  row.focus()
  await waitFor(() => expect(row).toHaveAccessibleDescription('Wisselen kost de geschiedenis'))
})

test('a row with `checked` is a checkbox item that says whether it is on', async () => {
  const onSelect = vi.fn()
  render(
    <DropdownMenu
      trigger={<Button>Weergave</Button>}
      label="Weergave"
      items={[
        { id: 'wrap', label: 'Regels afbreken', checked: true, onSelect: () => onSelect('wrap') },
        { id: 'space', label: 'Witruimte negeren', checked: false, onSelect: () => {} },
      ]}
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Weergave' }))
  const wrap = await screen.findByRole('menuitemcheckbox', { name: 'Regels afbreken' })
  expect(wrap).toHaveAttribute('aria-checked', 'true')
  expect(screen.getByRole('menuitemcheckbox', { name: 'Witruimte negeren' })).toHaveAttribute(
    'aria-checked',
    'false',
  )
  // Only the row that is on shows the check mark; the other keeps its room for one.
  expect(wrap.querySelector('[data-nt-menu-check] svg')).not.toBeNull()
  expect(
    screen
      .getByRole('menuitemcheckbox', { name: 'Witruimte negeren' })
      .querySelector('[data-nt-menu-check] svg'),
  ).toBeNull()

  await userEvent.click(wrap)
  expect(onSelect).toHaveBeenCalledOnce()
  expect(onSelect).toHaveBeenCalledWith('wrap')
})

test('a row without `checked` stays a plain menu item', async () => {
  await open()
  expect(screen.queryByRole('menuitemcheckbox')).not.toBeInTheDocument()
  expect(screen.getAllByRole('menuitem')).toHaveLength(3)
})

test('a row may carry a count after its label, read in its name', async () => {
  render(
    <DropdownMenu
      trigger={<Button>Bereik</Button>}
      label="Bereik"
      items={[
        {
          id: 'open',
          label: 'Open',
          kind: 'radio',
          group: 'scope',
          checked: true,
          count: 24,
          shortcut: '⌥⌘1',
          onSelect: () => {},
        },
        {
          id: 'all',
          label: 'Alles',
          kind: 'radio',
          group: 'scope',
          checked: false,
          count: 0,
          onSelect: () => {},
        },
      ]}
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Bereik' }))
  const open = await screen.findByRole('menuitemradio', { name: 'Open, 24' })
  expect(open.querySelector('[data-nt-menu-count]')).toHaveTextContent('24')
  // A count of nothing is still a count.
  expect(screen.getByRole('menuitemradio', { name: 'Alles, 0' })).toBeInTheDocument()
})

test('tooltip names an icon trigger on focus, and the trigger still opens the menu', async () => {
  // Kritiek 10: the `⋯` of a row says nothing on its own.
  render(
    <DropdownMenu
      label="Tabacties"
      tooltip="Meer"
      trigger={<IconButton icon="more-horizontal" label="Meer" />}
      items={[{ id: 'reload', label: 'Opnieuw laden', onSelect: () => {} }]}
    />,
  )
  const trigger = screen.getByRole('button', { name: 'Meer' })
  trigger.focus()
  expect(await screen.findByRole('tooltip')).toHaveTextContent('Meer')
  await userEvent.click(trigger)
  expect(await screen.findByRole('menuitem', { name: 'Opnieuw laden' })).toBeInTheDocument()
})

/** A menu of choices with a heading, submenus and checks on the right: the model menu's shape. */
function NestedMenu({
  onSelect,
  open,
  onOpenChange,
}: {
  onSelect: (id: string) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <DropdownMenu
      trigger={<Button>Model</Button>}
      label="Model"
      checks="end"
      height="available"
      {...(open === undefined ? {} : { open })}
      {...(onOpenChange ? { onOpenChange } : {})}
      items={[
        { id: 'head', label: 'Relay', kind: 'heading', glyph: <span data-testid="mark" /> },
        {
          id: 'a',
          label: 'Alfa',
          kind: 'radio',
          group: 'model',
          checked: true,
          onSelect: () => onSelect('a'),
        },
        {
          id: 'b',
          label: 'Bravo',
          kind: 'radio',
          group: 'model',
          checked: false,
          onSelect: () => onSelect('b'),
        },
        {
          id: 'more',
          label: 'Meer modellen',
          kind: 'submenu',
          items: [
            {
              id: 'c',
              label: 'Charlie',
              kind: 'radio',
              group: 'more',
              checked: false,
              onSelect: () => onSelect('c'),
            },
          ],
        },
        {
          id: 'agent',
          label: 'Agent',
          kind: 'submenu',
          value: 'Relay',
          valueGlyph: <span data-testid="value-mark" />,
          separated: true,
          items: [
            {
              id: 'relay',
              label: 'Relay',
              kind: 'radio',
              group: 'agent',
              checked: true,
              glyph: <span data-testid="agent-mark" />,
              onSelect: () => onSelect('relay'),
            },
          ],
        },
      ]}
    />
  )
}

test('a heading is shown but is no stop of the walk', async () => {
  render(<NestedMenu onSelect={() => {}} />)
  await userEvent.click(screen.getByRole('button', { name: 'Model' }))
  const menu = await screen.findByRole('menu', { name: 'Model' })
  const heading = menu.querySelector('[data-nt-menu-heading]')
  expect(heading).toHaveTextContent('Relay')
  expect(heading?.querySelector('[data-testid="mark"]')).not.toBeNull()
  await userEvent.keyboard('{ArrowDown}')
  expect(document.activeElement).toBe(screen.getByRole('menuitemradio', { name: 'Alfa' }))
})

test('with checks at the end the check of a choice follows its label', async () => {
  render(<NestedMenu onSelect={() => {}} />)
  await userEvent.click(screen.getByRole('button', { name: 'Model' }))
  const row = await screen.findByRole('menuitemradio', { name: 'Alfa' })
  const check = row.querySelector('[data-nt-menu-check]')
  expect(check?.querySelector('svg')).not.toBeNull()
  expect(row.lastElementChild?.contains(check ?? null)).toBe(true)
})

test('a submenu row names its value and opens its rows with ArrowRight', async () => {
  render(<NestedMenu onSelect={() => {}} />)
  await userEvent.click(screen.getByRole('button', { name: 'Model' }))
  const agent = await screen.findByRole('menuitem', { name: 'Agent: Relay' })
  expect(agent).toHaveAttribute('aria-haspopup', 'menu')
  const value = agent.querySelector('[data-nt-menu-value]')
  expect(value).toHaveTextContent('Relay')
  // The mark of the value leads it, inside the quiet part on the right.
  const mark = value?.querySelector('[data-testid="value-mark"]')
  expect(mark).not.toBeNull()
  expect(value?.firstElementChild).toBe(mark)
  agent.focus()
  await userEvent.keyboard('{ArrowRight}')
  const sub = await screen.findByRole('menu', { name: 'Agent' })
  const relay = within(sub).getByRole('menuitemradio', { name: 'Relay' })
  expect(relay).toHaveAttribute('aria-checked', 'true')
  expect(relay.querySelector('[data-testid="agent-mark"]')).not.toBeNull()
})

test('choosing a row of a submenu reports it and closes the whole menu', async () => {
  const onSelect = vi.fn()
  render(<NestedMenu onSelect={onSelect} />)
  await userEvent.click(screen.getByRole('button', { name: 'Model' }))
  const more = await screen.findByRole('menuitem', { name: 'Meer modellen' })
  more.focus()
  await userEvent.keyboard('{ArrowRight}')
  await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Charlie' }))
  expect(onSelect).toHaveBeenCalledWith('c')
  await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
})

test('open and onOpenChange drive the menu from outside', async () => {
  const onOpenChange = vi.fn()
  function Driven() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Van buiten</Button>
        <NestedMenu
          onSelect={() => {}}
          open={open}
          onOpenChange={(next) => {
            onOpenChange(next)
            setOpen(next)
          }}
        />
      </>
    )
  }
  render(<Driven />)
  expect(screen.queryByRole('menu')).toBeNull()
  await userEvent.click(screen.getByRole('button', { name: 'Van buiten' }))
  expect(await screen.findByRole('menu', { name: 'Model' })).toBeInTheDocument()
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
  expect(onOpenChange).toHaveBeenCalledWith(false)
})

test('opens from outside when a caller drives it, and reports its closing', async () => {
  // The snooze menu of the inbox opens on H, a key of the page rather than of its trigger.
  function Driven() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Van buiten</Button>
        <DropdownMenu
          trigger={<Button>Meer</Button>}
          label="Rijacties"
          items={items(() => {})}
          open={open}
          onOpenChange={setOpen}
        />
      </>
    )
  }
  render(<Driven />)
  expect(screen.queryByRole('menu')).toBeNull()
  await userEvent.click(screen.getByRole('button', { name: 'Van buiten' }))
  await screen.findByRole('menu', { name: 'Rijacties' })
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
})

test('a shortcut stands in one cap at the end of its row', async () => {
  render(
    <DropdownMenu
      trigger={<Button>Meer</Button>}
      label="Account"
      items={[
        {
          id: 'settings',
          label: 'Instellingen',
          shortcut: 'demo.settings',
          onSelect: () => {},
        },
      ]}
    />,
    { wrapper: uiWrapper({ platform: 'mac' }) },
  )
  await userEvent.click(screen.getByRole('button', { name: 'Meer' }))
  const row = await screen.findByRole('menuitem', { name: 'Instellingen' })
  const caps = row.querySelectorAll('[data-nt-kbd]')
  expect(caps).toHaveLength(1)
  expect(caps[0]?.className).toContain('border-border-strong')
  expect(caps[0]?.className).toContain('rounded-sm')
  // Both keys inside that one cap, none with a border of its own.
  const keys = [...row.querySelectorAll('kbd')]
  expect(keys).toHaveLength(2)
  expect(keys[1]).toHaveTextContent(',')
  for (const key of keys) expect(key.className).not.toContain('border')
})

test('a head names the rows under it, without being a row of its own', async () => {
  render(
    <DropdownMenu
      trigger={<Button>Account</Button>}
      label="Account: Robin de Vries"
      header={{
        title: 'Robin de Vries',
        detail: 'Studio Noord',
        glyph: <span data-testid="glyph" />,
      }}
      items={items(() => {})}
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Account' }))
  const menu = await screen.findByRole('menu')
  const group = within(menu).getByRole('group')
  expect(group).toHaveAccessibleName('Robin de Vries Studio Noord')
  expect(within(group).getAllByRole('menuitem')).toHaveLength(3)
  const head = menu.querySelector('[data-nt-menu-head]')
  expect(head).toHaveAttribute('aria-hidden', 'true')
  expect(head?.querySelector('[data-testid="glyph"]')).not.toBeNull()
  expect(head?.querySelector('[tabindex]')).toBeNull()
  // A line under the head, and room for a name beside its glyph.
  expect(head?.nextElementSibling).toHaveAttribute('role', 'separator')
  expect(menu.className).toContain('min-w-58')
  // The walk starts at the first row, not at the head.
  await userEvent.keyboard('{ArrowDown}')
  expect(within(menu).getByRole('menuitem', { name: 'Hernoemen' })).toHaveFocus()
})

test('a head without a detail is one line, named by its title alone', async () => {
  render(
    <DropdownMenu
      trigger={<Button>Account</Button>}
      label="Account: Niet aangemeld"
      header={{ title: 'Niet aangemeld' }}
      items={items(() => {})}
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Account' }))
  const menu = await screen.findByRole('menu')
  expect(within(menu).getByRole('group')).toHaveAccessibleName('Niet aangemeld')
  expect(menu.querySelector('[data-nt-menu-head]')?.textContent).toBe('Niet aangemeld')
})

test('comfortable rows are 30px with their icon in muted, quiet rows dimmed', async () => {
  render(
    <DropdownMenu
      trigger={<Button>Account</Button>}
      label="Account"
      density="comfortable"
      items={[
        { id: 'account', label: 'Profiel', icon: 'user', onSelect: () => {} },
        { id: 'out', label: 'Afmelden', icon: 'log-out', tone: 'quiet', onSelect: () => {} },
      ]}
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Account' }))
  const row = await screen.findByRole('menuitem', { name: 'Profiel' })
  expect(row.className).toContain('h-[30px]')
  expect(row.querySelector('[data-nt-menu-icon]')?.className).toContain('text-muted')
  const quiet = screen.getByRole('menuitem', { name: 'Afmelden' })
  expect(quiet.className).toContain('text-secondary')
  expect(quiet.className).not.toContain('text-fg')
})

test('a menu without a head or density keeps its rows and frame', async () => {
  await open()
  const row = await screen.findByRole('menuitem', { name: 'Hernoemen' })
  expect(row.className).toContain('h-(--nt-control-md)')
  expect(screen.queryByRole('group')).toBeNull()
  expect(screen.getByRole('menu').className).toContain('min-w-40')
})
