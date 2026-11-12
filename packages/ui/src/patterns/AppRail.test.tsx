import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { DropdownMenu } from '../overlays/DropdownMenu'
import { Icon } from '../primitives/Icon'
import { uiWrapper } from '../testing/ui-wrapper'
import { AppRail, AppRailItem } from './AppRail'

/** The tokens, for the widths the rail reads from them. */
const tokensCss = readFileSync(join(import.meta.dirname, '..', 'tokens.css'), 'utf8')

/** A rail of three apps and a foot, with Lens open. */
function renderRail(props: { narrow?: boolean; onNavigate?: (href: string) => void } = {}) {
  return render(
    <AppRail
      label="Apps"
      {...(props.narrow ? { narrow: true } : {})}
      foot={
        <AppRailItem label="Instellingen" icon={<Icon name="settings" />} href="#/instellingen" />
      }
    >
      <AppRailItem label="Start" icon={<Icon name="house" />} href="#/start" />
      <AppRailItem
        label="Lens"
        icon={<Icon name="scan-search" />}
        href="#/lens"
        product="lens"
        current
        {...(props.onNavigate ? { onNavigate: props.onNavigate } : {})}
      />
      <AppRailItem label="Halo" icon={<Icon name="layers" />} href="#/halo" product="halo" />
    </AppRail>,
  )
}

describe('AppRail', () => {
  test('is a navigation landmark named by its label', () => {
    renderRail()
    const nav = screen.getByRole('navigation', { name: 'Apps' })
    expect(within(nav).getAllByRole('link')).toHaveLength(4)
  })

  test('marks the open app with aria-current on the neutral plane, its words at full strength', () => {
    renderRail()
    const lens = screen.getByRole('link', { name: 'Lens' })
    expect(lens).toHaveAttribute('aria-current', 'page')
    expect(lens.className).toContain('bg-row-active')
    expect(lens.className).toContain('text-fg')
    expect(lens.className).not.toMatch(/\bbg-(accent|satellite)\b/)
    // The others rest in muted, with no plane and no mark.
    const start = screen.getByRole('link', { name: 'Start' })
    expect(start).not.toHaveAttribute('aria-current')
    expect(start.className).toContain('text-muted')
    expect(start.className).not.toMatch(/(^|\s)bg-row-active\b/)
    // One hover role for the rail and the side panel: `surface-hover`.
    expect(start.className).toContain('hover:bg-surface-hover')
  })

  test.each([false, true])(
    'the open item has no dot, only its plane and aria-current (narrow: %s)',
    (narrow) => {
      const { container } = renderRail({ narrow })
      const lens = screen.getByRole('link', { name: 'Lens' })
      expect(lens).toHaveAttribute('aria-current', 'page')
      expect(lens.className).toContain('bg-row-active')
      // Nothing on the rail draws a product's colour: no satellite beside or inside an item.
      expect(container.querySelector('[data-nt-app-rail-satellite]')).toBeNull()
      expect(container.innerHTML).not.toMatch(/\b(bg|fill|text)-satellite\b/)
      // The deprecated `product` no longer reaches the DOM.
      expect(container.querySelector('[data-product]')).toBeNull()
      // The item holds only its control: no mark beside it.
      const item = lens.closest('li')
      expect([...(item?.children ?? [])]).toEqual([lens])
      expect(lens).toHaveAccessibleName('Lens')
    },
  )

  test('sets each label at 11px under a 20px icon', () => {
    renderRail()
    const lens = screen.getByRole('link', { name: 'Lens' })
    expect(lens.className).toContain('flex-col')
    expect(lens.className).toContain('text-[11px]')
    expect(lens.className).toContain('font-medium')
    const [glyph, word] = [...lens.children]
    expect(glyph).toHaveAttribute('aria-hidden', 'true')
    expect(glyph?.className).toContain('size-5')
    expect(glyph?.className).toContain('[&_svg]:size-5')
    expect(word).toHaveTextContent('Lens')
  })

  test('puts the items of the foot at the bottom of the rail', () => {
    renderRail()
    const nav = screen.getByRole('navigation', { name: 'Apps' })
    const lists = within(nav).getAllByRole('list')
    expect(lists).toHaveLength(2)
    expect(nav.className).toContain('flex-col')
    expect(nav.className).toContain('h-full')
    expect(lists[1]?.className).toContain('mt-auto')
    // In a short window the rail scrolls, so the foot stays within reach.
    expect(nav.className).toContain('overflow-y-auto')
    expect(within(lists[1] as HTMLElement).getByRole('link')).toHaveAccessibleName('Instellingen')
  })

  test('hands a click to onNavigate, so the host can route without a reload', () => {
    const onNavigate = vi.fn()
    renderRail({ onNavigate })
    const lens = screen.getByRole('link', { name: 'Lens' })
    expect(lens).toHaveAttribute('href', '#/lens')
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })
    lens.dispatchEvent(event)
    expect(onNavigate).toHaveBeenCalledWith('#/lens')
    expect(event.defaultPrevented).toBe(true)
    // A click that asks for a new tab or window stays the browser's.
    onNavigate.mockClear()
    const withMeta = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      button: 0,
      metaKey: true,
    })
    lens.dispatchEvent(withMeta)
    expect(onNavigate).not.toHaveBeenCalled()
    expect(withMeta.defaultPrevented).toBe(false)
  })

  test('keeps only the icons and names each item by its label on a narrow rail', () => {
    renderRail({ narrow: true })
    for (const name of ['Start', 'Lens', 'Halo', 'Instellingen']) {
      const link = screen.getByRole('link', { name })
      const word = screen.getByText(name)
      expect(word.className, name).toContain('sr-only')
      expect(link.contains(word), name).toBe(true)
    }
  })

  test('makes an item as wide as the rail less 12px, and never cuts its label off', () => {
    /** The declared value of a token of `tokens.css`, in px. */
    const token = (name: string): number => {
      const match = tokensCss.match(new RegExp(`${name}:\\s*(\\d+)px;`))
      expect(match, name).not.toBeNull()
      return Number(match?.[1])
    }
    /**
     * The width a `w-*` or `size-*` class names, in px: a step of 4px, or a token with its fallback,
     * which must be the token's own value so a host on an older `tokens.css` keeps the same rail.
     */
    const width = (className: string): number => {
      const match = className.match(
        /(?:^|\s)(?:w|size)-(?:\[var\((--nt-[a-z-]+),(\d+)px\)\]|(\d+))(?:\s|$)/,
      )
      expect(match, className).not.toBeNull()
      if (match?.[1] !== undefined) {
        expect(Number(match[2]), `the fallback of ${match[1]}`).toBe(token(match[1]))
        return token(match[1])
      }
      return Number(match?.[3]) * 4
    }
    for (const [narrow, rail] of [
      [false, 'w-[var(--nt-rail-width,72px)]'],
      [true, 'w-[var(--nt-rail-width-narrow,56px)]'],
    ] as const) {
      const { unmount } = renderRail({ narrow })
      const nav = screen.getByRole('navigation', { name: 'Apps' })
      expect(nav.className).toContain(rail)
      const item = screen.getByRole('link', { name: 'Instellingen' })
      expect(width(nav.className) - width(item.className), `narrow: ${narrow}`).toBe(12)
      const word = within(item).getByText('Instellingen')
      expect(word.className).not.toContain('truncate')
      expect(item.className).not.toContain('truncate')
      unmount()
    }
    renderRail()
    expect(screen.getByRole('link', { name: 'Lens' }).className).toContain('w-15')
  })

  test('opens a dialog as a button of the same shape when it has no href', async () => {
    const onSelect = vi.fn()
    render(
      <AppRail label="Apps">
        <AppRailItem
          label="Hulp"
          icon={<Icon name="circle-help" />}
          onSelect={onSelect}
          aria-haspopup="dialog"
        />
        <AppRailItem label="Lens" icon={<Icon name="scan-search" />} href="#/lens" />
      </AppRail>,
    )
    const help = screen.getByRole('button', { name: 'Hulp' })
    expect(help).toHaveAttribute('type', 'button')
    expect(help).toHaveAttribute('aria-haspopup', 'dialog')
    expect(help.className).toBe(screen.getByRole('link', { name: 'Lens' }).className)
    await userEvent.click(help)
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  test('announces the intent to open on hover and focus, so the host can prefetch', async () => {
    const onIntent = vi.fn()
    render(
      <AppRail label="Apps">
        <AppRailItem label="Halo" icon={<Icon name="layers" />} href="#/halo" onIntent={onIntent} />
      </AppRail>,
    )
    const halo = screen.getByRole('link', { name: 'Halo' })
    await userEvent.hover(halo)
    expect(onIntent).toHaveBeenLastCalledWith('#/halo')
    onIntent.mockClear()
    act(() => halo.focus())
    expect(onIntent).toHaveBeenCalledWith('#/halo')
  })

  test('shows the label in a tooltip on a narrow rail', async () => {
    renderRail({ narrow: true })
    const halo = screen.getByRole('link', { name: 'Halo' })
    await userEvent.tab()
    await userEvent.tab()
    await userEvent.tab()
    expect(halo).toHaveFocus()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Halo')
  })

  test('hands its ref and its props to the control, so it can be the trigger of a menu', async () => {
    const onShortcuts = vi.fn()
    render(
      <AppRail label="Apps">
        <DropdownMenu
          label="Hulp"
          side="top"
          trigger={<AppRailItem label="Hulp" icon={<Icon name="circle-help" />} />}
          items={[{ id: 'keys', label: 'Sneltoetsen', onSelect: onShortcuts }]}
        />
      </AppRail>,
    )
    const help = screen.getByRole('button', { name: 'Hulp' })
    // Radix wires the trigger itself: what it opens and whether it is open.
    expect(help).toHaveAttribute('aria-haspopup', 'menu')
    expect(help).toHaveAttribute('aria-expanded', 'false')
    // Still inside its list item, so the rail keeps one list of items.
    expect(help.closest('li')?.parentElement?.tagName).toBe('UL')
    await userEvent.click(help)
    expect(help).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Sneltoetsen' }))
    expect(onShortcuts).toHaveBeenCalledTimes(1)
  })

  test('takes a ref to its link or button', () => {
    const link = createRef<HTMLAnchorElement>()
    const button = createRef<HTMLButtonElement>()
    render(
      <AppRail label="Apps">
        <AppRailItem ref={link} label="Lens" icon={<Icon name="scan-search" />} href="#/lens" />
        <AppRailItem
          ref={button}
          label="Hulp"
          icon={<Icon name="circle-help" />}
          onSelect={() => {}}
        />
      </AppRail>,
    )
    expect(link.current).toBe(screen.getByRole('link', { name: 'Lens' }))
    expect(button.current).toBe(screen.getByRole('button', { name: 'Hulp' }))
  })

  test('says whether the menu it opens is open, as aria-expanded', () => {
    const { rerender } = render(
      <AppRail label="Apps">
        <AppRailItem
          label="Hulp"
          icon={<Icon name="circle-help" />}
          onSelect={() => {}}
          aria-haspopup="menu"
          aria-expanded={false}
        />
      </AppRail>,
    )
    expect(screen.getByRole('button', { name: 'Hulp' })).toHaveAttribute('aria-expanded', 'false')
    rerender(
      <AppRail label="Apps">
        <AppRailItem
          label="Hulp"
          icon={<Icon name="circle-help" />}
          onSelect={() => {}}
          aria-haspopup="menu"
          aria-expanded
        />
      </AppRail>,
    )
    expect(screen.getByRole('button', { name: 'Hulp' })).toHaveAttribute('aria-expanded', 'true')
  })

  test('runs the click handed to it before its own select or navigation', async () => {
    const order: string[] = []
    render(
      <AppRail label="Apps">
        <AppRailItem
          label="Hulp"
          icon={<Icon name="circle-help" />}
          onSelect={() => order.push('select')}
          onClick={() => order.push('click')}
        />
        <AppRailItem
          label="Lens"
          icon={<Icon name="scan-search" />}
          href="#/lens"
          onNavigate={() => order.push('navigate')}
          onClick={() => order.push('click')}
        />
      </AppRail>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Hulp' }))
    expect(order).toEqual(['click', 'select'])
    await userEvent.click(screen.getByRole('link', { name: 'Lens' }))
    expect(order).toEqual(['click', 'select', 'click', 'navigate'])
  })

  test('skips its own select or navigation when the click handed to it prevents it', async () => {
    const onSelect = vi.fn()
    const onNavigate = vi.fn()
    const onClick = vi.fn((event: { preventDefault(): void }) => event.preventDefault())
    render(
      <AppRail label="Apps">
        <AppRailItem
          label="Hulp"
          icon={<Icon name="circle-help" />}
          onSelect={onSelect}
          onClick={onClick}
        />
        <AppRailItem
          label="Lens"
          icon={<Icon name="scan-search" />}
          href="#/lens"
          onNavigate={onNavigate}
          onClick={onClick}
        />
      </AppRail>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Hulp' }))
    await userEvent.click(screen.getByRole('link', { name: 'Lens' }))
    expect(onClick).toHaveBeenCalledTimes(2)
    expect(onSelect).not.toHaveBeenCalled()
    expect(onNavigate).not.toHaveBeenCalled()
  })

  test('keeps the hover and focus handed to it beside its own intent', async () => {
    const onMouseEnter = vi.fn()
    const onFocus = vi.fn()
    const onIntent = vi.fn()
    render(
      <AppRail label="Apps">
        <AppRailItem
          label="Lens"
          icon={<Icon name="scan-search" />}
          href="#/lens"
          onIntent={onIntent}
          onMouseEnter={onMouseEnter}
          onFocus={onFocus}
        />
      </AppRail>,
    )
    const lens = screen.getByRole('link', { name: 'Lens' })
    await userEvent.hover(lens)
    act(() => lens.focus())
    expect(onMouseEnter).toHaveBeenCalledTimes(1)
    expect(onFocus).toHaveBeenCalledTimes(1)
    expect(onIntent).toHaveBeenCalledTimes(2)
  })

  test.each([false, true])(
    'hands the focus back to the trigger after Escape, closed and without a tooltip (narrow: %s)',
    async (narrow) => {
      render(
        <AppRail label="Apps" narrow={narrow}>
          <DropdownMenu
            label="Hulp"
            side="top"
            trigger={<AppRailItem label="Hulp" icon={<Icon name="circle-help" />} />}
            items={[{ id: 'keys', label: 'Sneltoetsen', onSelect: () => {} }]}
          />
        </AppRail>,
      )
      const help = screen.getByRole('button', { name: 'Hulp' })
      act(() => help.focus())
      await userEvent.keyboard('{Enter}')
      expect(await screen.findByRole('menu')).toBeInTheDocument()
      expect(help).toHaveAttribute('aria-expanded', 'true')
      await userEvent.keyboard('{Escape}')
      await waitFor(() => expect(help).toHaveFocus())
      expect(help).toHaveAttribute('aria-expanded', 'false')
      // The focus that comes back from the menu does not open the tooltip over where it was.
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(screen.queryByRole('tooltip')).toBeNull()
    },
  )

  test('shows its name and its key in a tooltip, and announces the key', async () => {
    render(
      <AppRail label="Apps">
        <AppRailItem
          label="Lens"
          icon={<Icon name="scan-search" />}
          href="#/lens"
          shortcut="demo.open"
        />
      </AppRail>,
      { wrapper: uiWrapper() },
    )
    const lens = screen.getByRole('link', { name: 'Lens' })
    expect(lens).toHaveAttribute('aria-keyshortcuts', 'Meta+O')
    act(() => lens.focus())
    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip).toHaveTextContent('Lens')
    expect(tooltip.querySelector('[data-nt-kbd]')).not.toBeNull()
    // The key is a description of the item, never part of its name.
    expect(lens).toHaveAccessibleName('Lens')
  })

  test('draws no tooltip on the wide rail when the key is unknown', async () => {
    render(
      <AppRail label="Apps">
        <AppRailItem
          label="Lens"
          icon={<Icon name="scan-search" />}
          href="#/lens"
          shortcut="demo.open"
        />
      </AppRail>,
    )
    const lens = screen.getByRole('link', { name: 'Lens' })
    act(() => lens.focus())
    // Without a provider the key is unknown, and the label already stands under the icon.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.queryByRole('tooltip')).toBeNull()
    expect(lens).not.toHaveAttribute('aria-describedby')
  })
})
