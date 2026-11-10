import { render, screen, within } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { SideNav, SideNavGroup, SideNavLink } from './SideNav'

/** The side panel of Lens: two places at the top and a group of repositories. */
function renderPanel(onNavigate?: (href: string) => void) {
  return render(
    <SideNav label="Lens" head={<span>Lens</span>}>
      <SideNavGroup>
        <SideNavLink label="Pull requests" href="#/prs" meta="12" current />
        <SideNavLink
          label="Wacht op jou"
          href="#/wacht"
          meta="3"
          {...(onNavigate ? { onNavigate } : {})}
        />
      </SideNavGroup>
      <SideNavGroup label="Repositories van Zilverberg">
        <SideNavLink label="webwinkel" href="#/webwinkel" meta="5" mono />
        <SideNavLink label="kassa-api" href="#/kassa-api" mono />
      </SideNavGroup>
    </SideNav>,
  )
}

describe('SideNav', () => {
  test('names the navigation of the panel by its app', () => {
    renderPanel()
    const nav = screen.getByRole('navigation', { name: 'Lens' })
    expect(within(nav).getAllByRole('link')).toHaveLength(4)
    // The head (the app's wordmark) stands above the rows, on a row of its own.
    expect(within(nav).getAllByText('Lens')).toHaveLength(1)
  })

  test('marks the open place with aria-current and the row-active plane, without a check', () => {
    renderPanel()
    const open = screen.getByRole('link', { name: /^Pull requests/ })
    expect(open).toHaveAttribute('aria-current', 'page')
    expect(open.className).toContain('bg-row-active')
    expect(open.className).toContain('text-fg')
    expect(open.className).toContain('font-medium')
    // The place is shown once: its fill and full-strength words, no check beside it.
    expect(open.querySelector('svg')).toBeNull()
    const rest = screen.getByRole('link', { name: /^Wacht op jou/ })
    expect(rest).not.toHaveAttribute('aria-current')
    expect(rest.className).toContain('text-secondary')
    expect(rest.className).not.toMatch(/(^|\s)bg-row-active\b/)
    // A row of 32px, 13px, the radius of a row.
    for (const row of [open, rest]) {
      expect(row.className).toContain('h-(--nt-control-md)')
      expect(row.className).toContain('text-[13px]')
      expect(row.className).toContain('rounded-md')
    }
  })

  test('shows a count or a short value as quiet meta at the end of the row', () => {
    renderPanel()
    const row = screen.getByRole('link', { name: /^Wacht op jou/ })
    const meta = within(row).getByText('3')
    expect(meta.className).toContain('ms-auto')
    expect(meta.className).toContain('text-[11px]')
    expect(meta.className).toContain('text-muted')
    expect(meta.className).toContain('font-mono')
    expect(row.lastElementChild).toBe(meta)
    // A repository reads in DM Mono, its meta the same.
    expect(screen.getByText('webwinkel').className).toContain('font-mono')
    // A row without meta draws no empty slot.
    expect(screen.getByRole('link', { name: 'kassa-api' }).children).toHaveLength(1)
  })

  test('heads a group with the SectionHeading of every list', () => {
    renderPanel()
    const group = screen.getByRole('list', { name: 'Repositories van Zilverberg' })
    const heading = screen.getByText('Repositories van Zilverberg').closest('p')
    expect(heading?.className).toContain('text-[12px]')
    expect(heading?.className).toContain('text-muted')
    expect(heading?.className).toContain('font-medium')
    expect(within(group).getAllByRole('link')).toHaveLength(2)
    // Groups stand 24px apart, the rows of one group 1px.
    const nav = screen.getByRole('navigation', { name: 'Lens' })
    expect(nav.querySelector('[data-nt-side-nav-groups]')?.className).toContain(
      'gap-(--nt-space-group)',
    )
    expect(group.className).toContain('gap-px')
  })

  test('hands a click to onNavigate, so the host can route without a reload', () => {
    const onNavigate = vi.fn()
    renderPanel(onNavigate)
    const row = screen.getByRole('link', { name: /^Wacht op jou/ })
    const click = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })
    row.dispatchEvent(click)
    expect(onNavigate).toHaveBeenCalledWith('#/wacht')
    expect(click.defaultPrevented).toBe(true)
    onNavigate.mockClear()
    const newTab = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      button: 0,
      ctrlKey: true,
    })
    row.dispatchEvent(newTab)
    expect(onNavigate).not.toHaveBeenCalled()
    expect(newTab.defaultPrevented).toBe(false)
  })
})
