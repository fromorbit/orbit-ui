import { render, screen, within } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { Icon } from '../primitives/Icon'
import { AppRail, AppRailItem } from './AppRail'

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

  test('marks the open app with aria-current and its satellite beside the neutral plane', () => {
    const { container } = renderRail()
    const lens = screen.getByRole('link', { name: 'Lens' })
    expect(lens).toHaveAttribute('aria-current', 'page')
    expect(lens.className).toContain('bg-row-active')
    expect(lens.className).toContain('text-fg')
    expect(lens.className).not.toMatch(/\bbg-(accent|satellite)\b/)
    // The satellite is the product's own: the item carries `data-product`, the dot reads it.
    const item = lens.closest('li')
    expect(item).toHaveAttribute('data-product', 'lens')
    const dots = container.querySelectorAll('[data-nt-app-rail-satellite]')
    expect(dots).toHaveLength(1)
    expect(item?.contains(dots[0] ?? null)).toBe(true)
    expect(lens.contains(dots[0] ?? null)).toBe(false)
    expect(dots[0]?.className).toContain('bg-satellite')
    // The others rest in muted, with no plane and no mark.
    const start = screen.getByRole('link', { name: 'Start' })
    expect(start).not.toHaveAttribute('aria-current')
    expect(start.className).toContain('text-muted')
    expect(start.className).not.toMatch(/(^|\s)bg-row-active\b/)
  })

  test('keeps the satellite out of the accessible name', () => {
    const { container } = renderRail()
    expect(container.querySelector('[data-nt-app-rail-satellite]')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    expect(screen.getByRole('link', { name: 'Lens' })).toHaveAccessibleName('Lens')
  })

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
    const nav = screen.getByRole('navigation', { name: 'Apps' })
    expect(nav.className).toContain('w-14')
    for (const name of ['Start', 'Lens', 'Halo', 'Instellingen']) {
      const link = screen.getByRole('link', { name })
      const word = screen.getByText(name)
      expect(word.className, name).toContain('sr-only')
      expect(link.contains(word), name).toBe(true)
    }
  })
})
