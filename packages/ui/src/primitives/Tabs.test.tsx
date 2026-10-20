import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, test } from 'vitest'
import { Tabs } from './Tabs'

const tabs = [
  { id: 'a', label: 'Uiterlijk', content: <p>Inhoud A</p> },
  { id: 'b', label: 'Agents', content: <p>Inhoud B</p> },
  { id: 'c', label: 'Providers', content: <p>Inhoud C</p> },
]

test('starts at the first tab, or at defaultTab when one is given', () => {
  render(<Tabs label="Onderdelen" tabs={tabs} />)
  expect(screen.getByRole('tab', { name: 'Uiterlijk' })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByText('Inhoud A')).toBeInTheDocument()
})

test('reports the tab that was chosen', async () => {
  const chosen: string[] = []
  render(<Tabs label="Onderdelen" tabs={tabs} onTabChange={(id) => chosen.push(id)} />)
  await userEvent.click(screen.getByRole('tab', { name: 'Agents' }))
  expect(chosen).toEqual(['b'])
})

test('defaultTab picks another tab to start with', () => {
  render(<Tabs label="Onderdelen" tabs={tabs} defaultTab="b" />)
  expect(screen.getByRole('tab', { name: 'Agents' })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByText('Inhoud B')).toBeInTheDocument()
})

test('walks with the arrow keys and activates the focused tab', async () => {
  render(<Tabs label="Onderdelen" tabs={tabs} />)
  screen.getByRole('tab', { name: 'Uiterlijk' }).focus()
  await userEvent.keyboard('{ArrowDown}')
  expect(screen.getByRole('tab', { name: 'Agents' })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByText('Inhoud B')).toBeInTheDocument()
})

test('a pill draws a glyph in place of a named icon, and its hint as a title', () => {
  render(
    <Tabs
      label="Paneel"
      orientation="horizontal"
      variant="pill"
      tabs={[
        {
          id: 'f',
          label: 'totaal.ts',
          icon: 'file',
          glyph: <svg data-testid="type-icon" />,
          hint: 'src/winkelmand/totaal.ts',
          content: <p>Inhoud</p>,
        },
      ]}
    />,
  )
  const pill = screen.getByRole('tab', { name: 'totaal.ts' })
  expect(pill.querySelector('[data-testid="type-icon"]')).not.toBeNull()
  expect(pill.querySelectorAll('svg')).toHaveLength(1)
  expect(pill).toHaveAttribute('title', 'src/winkelmand/totaal.ts')
})

test('the tablist carries the label as its accessible name', () => {
  render(<Tabs label="Onderdelen" tabs={tabs} />)
  expect(screen.getByRole('tablist', { name: 'Onderdelen' })).toBeInTheDocument()
})

test('a tab uses the size token instead of a loose height class', () => {
  render(<Tabs label="Onderdelen" tabs={tabs} />)
  const className = screen.getByRole('tab', { name: 'Uiterlijk' }).className
  expect(className).toContain('h-(--nt-control-md)')
  expect(className).not.toContain('h-[30px]')
})

test('tabs without an orientation stay vertical', () => {
  render(<Tabs label="Onderdelen" tabs={tabs} />)
  expect(screen.getByRole('tablist', { name: 'Onderdelen' })).toHaveAttribute(
    'aria-orientation',
    'vertical',
  )
})

test('horizontal tabs put their list above the panel', () => {
  render(<Tabs label="Onderdelen" tabs={tabs} orientation="horizontal" />)
  const list = screen.getByRole('tablist', { name: 'Onderdelen' })
  expect(list).toHaveAttribute('aria-orientation', 'horizontal')
  const panel = screen.getByText('Inhoud A').closest('[role="tabpanel"]')
  expect(panel).not.toBeNull()
  // The list precedes the panel in the DOM, so it lays out above it in the block flow.
  expect(list.compareDocumentPosition(panel as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  )
})

test('horizontal tabs wrap only when the caller opts in', () => {
  const { rerender } = render(<Tabs label="Onderdelen" tabs={tabs} orientation="horizontal" />)
  const tablist = screen.getByRole('tablist', { name: 'Onderdelen' })
  expect(tablist.className).not.toContain('flex-wrap')
  expect(screen.getByRole('tab', { name: 'Uiterlijk' }).className).not.toContain('shrink-0')

  rerender(<Tabs label="Onderdelen" tabs={tabs} orientation="horizontal" horizontalWrap />)
  expect(screen.getByRole('tablist', { name: 'Onderdelen' }).className).toContain('flex-wrap')
  expect(screen.getByRole('tab', { name: 'Uiterlijk' }).className).toContain('shrink-0')
})

test('the arrow keys walk a horizontal list left and right', async () => {
  render(<Tabs label="Onderdelen" tabs={tabs} orientation="horizontal" />)
  screen.getByRole('tab', { name: 'Uiterlijk' }).focus()
  await userEvent.keyboard('{ArrowRight}')
  expect(screen.getByRole('tab', { name: 'Agents' })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByText('Inhoud B')).toBeInTheDocument()
})

const pillTabs = [
  { id: 'a', label: 'Uiterlijk', icon: 'check' as const, content: <p>Inhoud A</p> },
  { id: 'b', label: 'Agents', icon: 'search' as const, content: <p>Inhoud B</p> },
]

test('a pill tab carries its icon beside its label', () => {
  render(<Tabs label="Onderdelen" tabs={pillTabs} orientation="horizontal" variant="pill" />)
  const tab = screen.getByRole('tab', { name: 'Uiterlijk' })
  expect(tab.querySelector('svg')).toBeInTheDocument()
})

test('the active pill is marked by its fill, not by colour alone', () => {
  render(<Tabs label="Onderdelen" tabs={pillTabs} orientation="horizontal" variant="pill" />)
  const active = screen.getByRole('tab', { name: 'Uiterlijk' })
  const inactive = screen.getByRole('tab', { name: 'Agents' })
  // Colour on its own would fail a reader who cannot tell the two text colours apart,
  // so a fill class conditioned on `data-state=active` must be there beside the text colour.
  expect(active).toHaveAttribute('data-state', 'active')
  expect(inactive).toHaveAttribute('data-state', 'inactive')
  expect(active.className).toContain('data-[state=active]:bg-surface-hover')
})

test('the slot beside the list is not part of the tablist', () => {
  render(
    <Tabs
      label="Onderdelen"
      tabs={pillTabs}
      orientation="horizontal"
      variant="pill"
      after={<button type="button">Meer</button>}
    />,
  )
  const tablist = screen.getByRole('tablist', { name: 'Onderdelen' })
  const slot = screen.getByRole('button', { name: 'Meer' })
  expect(tablist).not.toContainElement(slot)
})

test('arrow keys walk the tabs and stop at the slot', async () => {
  render(
    <Tabs
      label="Onderdelen"
      tabs={pillTabs}
      orientation="horizontal"
      variant="pill"
      after={<button type="button">Meer</button>}
    />,
  )
  screen.getByRole('tab', { name: 'Uiterlijk' }).focus()
  await userEvent.keyboard('{ArrowRight}')
  expect(screen.getByRole('tab', { name: 'Agents' })).toHaveFocus()
  await userEvent.keyboard('{ArrowRight}')
  // Two tabs only: the arrow wraps back to the first rather than reaching into the slot, since the
  // slot sits outside Radix's own tablist and never becomes part of its roving tabindex.
  expect(screen.getByRole('tab', { name: 'Uiterlijk' })).toHaveFocus()
})

test('a pill tab adds no room above its content', () => {
  render(
    <Tabs
      label="Onderdelen"
      orientation="horizontal"
      variant="pill"
      tabs={[{ id: 'a', label: 'Wijzigingen', content: <p>Lijst</p> }]}
    />,
  )
  const panel = screen.getByText('Lijst').closest('[role="tabpanel"]') as HTMLElement
  // The strip already keeps 6px under its pills; the content starts right there, with the panel's
  // 12px at the sides and 16px below.
  expect(panel.className.split(' ')).toEqual(expect.arrayContaining(['px-3', 'pt-0', 'pb-4']))
  expect(panel.className).not.toContain('pt-2')
})

test('a flush tab fills its panel without padding or a scroll of its own', () => {
  render(
    <Tabs
      label="Onderdelen"
      orientation="horizontal"
      variant="pill"
      tabs={[{ id: 'a', label: 'Browser', content: <p>Pagina</p>, flush: true }]}
    />,
  )
  const panel = screen.getByText('Pagina').closest('[role="tabpanel"]') as HTMLElement
  expect(panel.className).toContain('flex-col')
  expect(panel.className).not.toContain('px-3')
  expect(panel.className).not.toContain('overflow-y-auto')
})

test('a line tab strip is unchanged', () => {
  // The settings screen (vertical) and today's right panel (horizontal, line) must keep looking
  // exactly as they did before this task, so neither of their reference images shifts.
  render(<Tabs label="Onderdelen" tabs={tabs} orientation="horizontal" />)
  const tab = screen.getByRole('tab', { name: 'Uiterlijk' })
  expect(tab.className).toContain('border-b-2')
  expect(tab.className).not.toContain('rounded-md')
  const list = screen.getByRole('tablist', { name: 'Onderdelen' })
  expect(list.className).toContain('border-b')
})

test.each([
  ['vertical line', { orientation: 'vertical' as const }],
  ['horizontal line', { orientation: 'horizontal' as const }],
  ['horizontal pill', { orientation: 'horizontal' as const, variant: 'pill' as const }],
])('the %s panel is no tab stop and draws no ring of its own', (_name, props) => {
  render(<Tabs label="Onderdelen" tabs={tabs} {...props} />)
  const panel = screen.getByRole('tabpanel')
  // A click on empty space left the focus here, and the next key drew
  // a ring around the whole panel. Every control inside has its own tab stop and ring.
  expect(panel).toHaveAttribute('tabindex', '-1')
  expect(panel.className).not.toContain('focus-visible:outline-2')
  expect(panel.className.split(' ')).toContain('outline-none')
})

describe('a vertical list with a field above it, counts and dimmed tabs', () => {
  // The settings screen while it searches: the search field on top of the list,
  // the number of hits behind each category, and a category without hits dimmed.
  test('draws `before` above the list, in the same column, outside the tablist', () => {
    render(<Tabs label="Onderdelen" tabs={tabs} before={<input aria-label="Zoek" />} />)
    const field = screen.getByRole('textbox', { name: 'Zoek' })
    const list = screen.getByRole('tablist')
    expect(list.contains(field)).toBe(false)
    // One column: the field and the list share it, the field first.
    const column = list.parentElement
    expect(column?.contains(field)).toBe(true)
    expect(column?.firstElementChild?.contains(field)).toBe(true)
    expect(column?.contains(screen.getByRole('tabpanel'))).toBe(false)
    // A real column, not `display: contents`, which would lay the field beside the list.
    expect(column).toHaveClass('flex-col')
  })

  test('a count stands behind the label and joins its name', () => {
    const [first, second] = tabs
    if (!first || !second) throw new Error('fixture')
    render(<Tabs label="Onderdelen" tabs={[{ ...first, count: 2 }, second]} />)
    expect(screen.getByRole('tab', { name: 'Uiterlijk, 2' })).toHaveTextContent('Uiterlijk2')
    expect(screen.getByRole('tab', { name: 'Agents' })).toBeInTheDocument()
  })

  test('a dimmed tab cannot be chosen', async () => {
    const [first, second] = tabs
    if (!first || !second) throw new Error('fixture')
    const chosen: string[] = []
    render(
      <Tabs
        label="Onderdelen"
        tabs={[first, { ...second, dimmed: true }]}
        onTabChange={(id) => chosen.push(id)}
      />,
    )
    const dimmed = screen.getByRole('tab', { name: 'Agents' })
    expect(dimmed).toBeDisabled()
    await userEvent.click(dimmed)
    expect(chosen).toEqual([])
  })
})

describe('a pill that can close and count', () => {
  const pills = (closable = true) => [
    { id: 'changes', label: 'Wijzigingen', icon: 'file-diff' as const, content: <p>W</p> },
    {
      id: 'tab-1',
      label: 'Winkel',
      icon: 'globe' as const,
      closable,
      closeLabel: 'Sluit Winkel',
      content: <p>Winkel</p>,
    },
  ]

  function Harness({ onClose }: { onClose?(id: string): void }) {
    const [list, setList] = useState(pills())
    return (
      <Tabs
        label="Paneel"
        orientation="horizontal"
        variant="pill"
        value="tab-1"
        tabs={list}
        onClose={(id) => {
          onClose?.(id)
          setList((current) => current.filter((tab) => tab.id !== id))
        }}
      />
    )
  }

  test('a closable pill keeps its icon and shows its cross at the right', () => {
    render(<Harness />)
    const tab = screen.getByRole('tab', { name: 'Winkel' })
    const icon = tab.querySelector('svg')
    expect(icon).toBeInTheDocument()
    // The icon stays put: unlike the earlier form, closing no longer hides it.
    expect(icon?.parentElement?.className).not.toContain('invisible')
    const close = screen.getByLabelText('Sluit Winkel')
    expect(close.className).toContain('right-')
    expect(close.className).not.toContain('left-')
  })

  test('the cross shows on the active pill at rest and on others on hover', () => {
    render(<Harness />)
    const activeClose = screen.getByLabelText('Sluit Winkel')
    // "Winkel" is the active pill (`value="tab-1"`): its cross needs no hover to be seen.
    expect(activeClose.className).toContain('peer-data-[state=active]:opacity-100')
    // Every cross still answers hover and focus, for the pills that are not active.
    expect(activeClose.className).toContain('group-hover:opacity-100')
    expect(activeClose.className).toContain('group-focus-within:opacity-100')
  })

  test('the close button has its own name', async () => {
    const closed: string[] = []
    render(<Harness onClose={(id) => closed.push(id)} />)
    await userEvent.click(screen.getByLabelText('Sluit Winkel'))
    expect(closed).toEqual(['tab-1'])
  })

  test('a middle click closes a closable pill', () => {
    const closed: string[] = []
    render(<Harness onClose={(id) => closed.push(id)} />)
    fireEvent(
      screen.getByRole('tab', { name: 'Winkel' }),
      new MouseEvent('auxclick', { bubbles: true, button: 1 }),
    )
    expect(closed).toEqual(['tab-1'])
  })

  test('Delete closes a focused closable pill', async () => {
    const closed: string[] = []
    render(<Harness onClose={(id) => closed.push(id)} />)
    screen.getByRole('tab', { name: 'Winkel' }).focus()
    await userEvent.keyboard('{Delete}')
    expect(closed).toEqual(['tab-1'])
  })

  test('a pill that is not closable has no close button and ignores Delete', async () => {
    const closed: string[] = []
    render(
      <Tabs
        label="Paneel"
        orientation="horizontal"
        variant="pill"
        tabs={pills(false)}
        onClose={(id) => closed.push(id)}
      />,
    )
    expect(screen.queryByLabelText('Sluit Winkel')).toBeNull()
    screen.getByRole('tab', { name: 'Wijzigingen' }).focus()
    await userEvent.keyboard('{Delete}')
    expect(closed).toEqual([])
  })

  test('without tabs the strip stays and what the caller gave for that stands under it', () => {
    render(
      <Tabs
        label="Paneel"
        orientation="horizontal"
        variant="pill"
        tabs={[]}
        after={<button type="button">Open een tab</button>}
        empty={<p>Kies een tab</p>}
      />,
    )
    expect(screen.getByRole('tablist', { name: 'Paneel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open een tab' })).toBeInTheDocument()
    expect(screen.getByText('Kies een tab')).toBeInTheDocument()
  })

  test('with tabs the empty content is not drawn', () => {
    render(
      <Tabs
        label="Paneel"
        orientation="horizontal"
        variant="pill"
        tabs={pills(false)}
        empty={<p>Kies een tab</p>}
      />,
    )
    expect(screen.queryByText('Kies een tab')).toBeNull()
  })

  test('a count stands after the title', () => {
    render(
      <Tabs
        label="Paneel"
        orientation="horizontal"
        variant="pill"
        tabs={[{ id: 'changes', label: 'Wijzigingen', count: 3, content: <p>W</p> }]}
      />,
    )
    expect(screen.getByRole('tab')).toHaveTextContent('Wijzigingen3')
    // A pause between the word and the figure in the name, so it is not read as one word.
    expect(screen.getByRole('tab')).toHaveAccessibleName('Wijzigingen, 3')
  })

  test('a long title is cut and keeps all of it in its name', () => {
    const long = 'Een heel lange titel van een pagina die nooit op een pil past'
    render(
      <Tabs
        label="Paneel"
        orientation="horizontal"
        variant="pill"
        tabs={[{ id: 'tab-1', label: long, content: <p>X</p> }]}
      />,
    )
    const title = screen.getByText(long)
    expect(title.className).toContain('truncate')
    expect(title.className).toContain('max-w-36')
    expect(screen.getByRole('tab', { name: long })).toBeInTheDocument()
  })

  test('after closing, the focus goes to the pill that is shown', async () => {
    render(<Harness />)
    screen.getByRole('tab', { name: 'Winkel' }).focus()
    await userEvent.keyboard('{Delete}')
    expect(screen.getByRole('tab', { name: 'Wijzigingen' })).toHaveFocus()
  })
})

describe('a strip at title bar height', () => {
  const six = Array.from({ length: 6 }, (_, index) => ({
    id: `page-${index}`,
    label: `Een pagina met een lange titel ${index}`,
    icon: 'globe' as const,
    closable: true,
    closeLabel: `Sluit pagina ${index}`,
    content: <p>Pagina {index}</p>,
  }))

  /** The row around the list and the slot: what stands at the top of the panel. */
  const strip = () => screen.getByRole('tablist').parentElement as HTMLElement

  test('a pill of a titlebar strip is 72 to 144px, and the list scrolls rather than squeeze it', () => {
    render(
      <Tabs
        label="Paneel"
        orientation="horizontal"
        variant="pill"
        strip="titlebar"
        onClose={() => {}}
        tabs={six}
      />,
    )
    // Never narrower than 72px, never wider than 144px.
    for (const tab of screen.getAllByRole('tab')) {
      expect(tab).toHaveClass('min-w-18', 'max-w-36')
    }
    expect(screen.getByRole('tablist')).toHaveClass('overflow-x-auto')
  })

  test('a file name is cut in the middle, so its end and extension stay', () => {
    render(
      <Tabs
        label="Paneel"
        orientation="horizontal"
        variant="pill"
        strip="titlebar"
        tabs={[
          {
            id: 'f',
            label: 'bestellingen-overzicht-per-maand.test.tsx',
            middle: true,
            content: <p>Bestand</p>,
          },
        ]}
      />,
    )
    const tab = screen.getByRole('tab', { name: 'bestellingen-overzicht-per-maand.test.tsx' })
    // The head gives way with an ellipsis; the tail never shrinks.
    const [head, tail] = Array.from(tab.querySelectorAll('[aria-hidden="true"] > span'))
    expect(head).toHaveClass('truncate')
    expect(tail).toHaveClass('shrink-0')
    expect(tail?.textContent).toBe('maand.test.tsx')
    expect(`${head?.textContent}${tail?.textContent}`).toBe(
      'bestellingen-overzicht-per-maand.test.tsx',
    )
  })

  test('a titlebar strip is a drag region with undraggable pills', () => {
    render(
      <Tabs
        label="Paneel"
        orientation="horizontal"
        variant="pill"
        strip="titlebar"
        onClose={() => {}}
        tabs={six.slice(0, 2)}
        after={<button type="button">Open een tab</button>}
      />,
    )
    expect(strip()).toHaveClass('drag-region', 'nt-titlebar-strip', 'h-(--nt-titlebar-height)')
    for (const tab of screen.getAllByRole('tab')) expect(tab).toHaveClass('no-drag')
    // The slot and every cross opt out as well: a click on them may not grab the window.
    const slot = screen.getByRole('button', { name: 'Open een tab' }).parentElement
    expect(slot).toHaveClass('no-drag')
    for (const cross of strip().querySelectorAll('button[aria-hidden="true"]')) {
      expect(cross).toHaveClass('no-drag')
    }
  })

  test('the before slot starts the strip, ahead of the tab list', () => {
    render(
      <Tabs
        label="Paneel"
        orientation="horizontal"
        variant="pill"
        strip="titlebar"
        onClose={() => {}}
        tabs={six.slice(0, 1)}
        after={<button type="button">Open een tab</button>}
        before={<button type="button">Paneel</button>}
      />,
    )
    const slot = screen.getByRole('button', { name: 'Paneel' }).parentElement as HTMLElement
    expect(slot).toHaveClass('no-drag')
    // The first element of the strip, before the tab list and the add-tab slot.
    expect(strip().firstElementChild).toBe(slot)
    const buttons = Array.from(strip().querySelectorAll('button'))
    expect(buttons.indexOf(screen.getByRole('button', { name: 'Paneel' }))).toBe(0)
  })

  test('the end slot closes the strip, after the add-tab slot and pushed to the far edge', () => {
    render(
      <Tabs
        label="Paneel"
        orientation="horizontal"
        variant="pill"
        strip="titlebar"
        onClose={() => {}}
        tabs={six.slice(0, 1)}
        after={<button type="button">Open een tab</button>}
        end={<button type="button">Volledig scherm</button>}
      />,
    )
    const slot = screen.getByRole('button', { name: 'Volledig scherm' })
      .parentElement as HTMLElement
    expect(slot).toHaveClass('no-drag', 'ml-auto')
    expect(strip().lastElementChild).toBe(slot)
  })

  test('a titlebar strip marks itself when it holds the traffic lights', () => {
    const { rerender } = render(
      <Tabs
        label="Paneel"
        orientation="horizontal"
        variant="pill"
        strip="titlebar"
        reserveTrafficLights
        tabs={six.slice(0, 1)}
      />,
    )
    expect(strip()).toHaveAttribute('data-nt-reserve-traffic-lights', 'true')
    rerender(
      <Tabs
        label="Paneel"
        orientation="horizontal"
        variant="pill"
        strip="titlebar"
        tabs={six.slice(0, 1)}
      />,
    )
    expect(strip()).not.toHaveAttribute('data-nt-reserve-traffic-lights')
  })

  test('a plain strip is no drag region', () => {
    render(<Tabs label="Paneel" orientation="horizontal" variant="pill" tabs={six.slice(0, 1)} />)
    expect(strip()).not.toHaveClass('drag-region')
    expect(strip()).not.toHaveAttribute('data-nt-reserve-window-controls')
  })

  test('a titlebar strip marks itself when it holds the window controls', () => {
    const { rerender } = render(
      <Tabs
        label="Paneel"
        orientation="horizontal"
        variant="pill"
        strip="titlebar"
        reserveWindowControls
        tabs={six.slice(0, 1)}
      />,
    )
    expect(strip()).toHaveAttribute('data-nt-reserve-window-controls', 'true')
    rerender(
      <Tabs
        label="Paneel"
        orientation="horizontal"
        variant="pill"
        strip="titlebar"
        tabs={six.slice(0, 1)}
      />,
    )
    expect(strip()).not.toHaveAttribute('data-nt-reserve-window-controls')
  })

  test('six pills shrink to 72px and then scroll, rather than run under the reserved room', () => {
    render(
      <Tabs
        label="Paneel"
        orientation="horizontal"
        variant="pill"
        strip="titlebar"
        reserveWindowControls
        onClose={() => {}}
        tabs={six}
      />,
    )
    // happy-dom has no layout: what is checked is the arrangement that makes the pills give way.
    // The list may shrink (`min-w-0`) and scrolls what does not fit; a pill gives way down to 72px
    // and no further, a closable one with the box around it.
    const list = screen.getByRole('tablist')
    expect(strip()).toHaveClass('min-w-0')
    expect(list).toHaveClass('min-w-0', 'overflow-x-auto')
    expect(list).not.toHaveClass('shrink-0')
    for (const tab of screen.getAllByRole('tab')) {
      expect(tab).toHaveClass('min-w-18')
      expect(tab.parentElement).toHaveClass('min-w-18')
    }
  })
})

describe('a narrow pill strip', () => {
  const five = ['Wijzigingen', 'Browser', 'Subagents', 'Terminal', 'Bestanden'].map((label) => ({
    id: label,
    label,
    icon: 'file' as const,
    content: <p>{label}</p>,
  }))

  test('folds the label of every inactive pill by a container rule, never the active one', () => {
    // Five pills fold under 576px of strip: 96px a pill
    // and 96px for what stands beside them. The rule is CSS; the browser test measures it.
    render(
      <Tabs label="Paneel" orientation="horizontal" variant="pill" strip="titlebar" tabs={five} />,
    )
    const label = (name: string) =>
      screen.getByRole('tab', { name }).querySelector('[data-nt-tab-label]')
    expect(label('Wijzigingen')).not.toHaveClass('@max-[576px]/tabs:sr-only')
    for (const name of ['Browser', 'Subagents', 'Terminal', 'Bestanden']) {
      expect(label(name)).toHaveClass('@max-[576px]/tabs:sr-only')
      // The label stays the name of the tab, folded or not.
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    }
    expect(screen.getByRole('tab', { name: 'Browser' })).toHaveClass('@max-[576px]/tabs:min-w-0')
  })

  test('lays the icon of a pill in the tooltip the caller hands in', () => {
    render(
      <Tabs
        label="Paneel"
        orientation="horizontal"
        variant="pill"
        tabs={five.slice(0, 2)}
        tip={(label, trigger) => (
          <span data-tip={label} className="contents">
            {trigger}
          </span>
        )}
      />,
    )
    const browser = screen.getByRole('tab', { name: 'Browser' })
    expect(browser.querySelector('[data-tip="Browser"] svg')).not.toBeNull()
    // The trigger itself is not wrapped: its `data-state` stays the tab's own.
    expect(browser).toHaveAttribute('data-state', 'inactive')
  })
})

describe('a titlebar strip that overflows', () => {
  /** Gives the list the sizes of a strip whose pills run past it, scrolled to `left`. */
  function overflow(list: HTMLElement, left: number): void {
    Object.defineProperty(list, 'scrollWidth', { configurable: true, value: 400 })
    Object.defineProperty(list, 'clientWidth', { configurable: true, value: 200 })
    list.scrollLeft = left
    fireEvent.scroll(list)
  }

  test('fades the edge that hides a pill, and only that edge', () => {
    render(
      <Tabs label="Paneel" orientation="horizontal" variant="pill" strip="titlebar" tabs={tabs} />,
    )
    const list = screen.getByRole('tablist')
    overflow(list, 0)
    expect(list).toHaveAttribute('data-nt-fade-end', 'true')
    expect(list).not.toHaveAttribute('data-nt-fade-start')
    expect(list.style.maskImage).toContain('linear-gradient')
    overflow(list, 200)
    expect(list).toHaveAttribute('data-nt-fade-start', 'true')
    expect(list).not.toHaveAttribute('data-nt-fade-end')
  })

  test('draws no fade while everything fits', () => {
    render(
      <Tabs label="Paneel" orientation="horizontal" variant="pill" strip="titlebar" tabs={tabs} />,
    )
    const list = screen.getByRole('tablist')
    expect(list).not.toHaveAttribute('data-nt-fade-start')
    expect(list).not.toHaveAttribute('data-nt-fade-end')
    expect(list.style.maskImage).toBe('')
  })
})
