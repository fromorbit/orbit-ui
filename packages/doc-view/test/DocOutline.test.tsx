import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { DocOutline, type DocOutlineProps } from '../src/index'

const ENTRIES = [
  { depth: 1, text: 'Handleiding', anchor: 'handleiding' },
  { depth: 2, text: 'Installatie', anchor: 'installatie' },
  { depth: 3, text: 'Met npm', anchor: 'met-npm' },
] as const

const LABELS = { label: 'Inhoudsopgave', toggle: 'Inhoudsopgave tonen' }

function renderOutline(props: Partial<DocOutlineProps> = {}) {
  const onJump = vi.fn()
  render(
    <DocOutline
      entries={ENTRIES}
      active={null}
      onJump={onJump}
      folded={false}
      labels={LABELS}
      {...props}
    />,
  )
  return onJump
}

describe('DocOutline', () => {
  test('lists the headings with their level, the current one marked', () => {
    renderOutline({ active: 'installatie' })
    const nav = screen.getByRole('navigation', { name: 'Inhoudsopgave' })
    const links = within(nav).getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual(['Handleiding', 'Installatie', 'Met npm'])
    expect(links.map((link) => link.getAttribute('data-depth'))).toEqual(['1', '2', '3'])
    expect(links.map((link) => link.parentElement?.className)).toEqual([
      'nt-doc-outline-depth-1',
      'nt-doc-outline-depth-2',
      'nt-doc-outline-depth-3',
    ])
    expect(within(nav).getByRole('link', { name: 'Installatie' })).toHaveAttribute(
      'aria-current',
      'location',
    )
  })

  test('a click hands the anchor over and never navigates', async () => {
    const onJump = renderOutline()
    const link = screen.getByRole('link', { name: 'Met npm' })
    expect(link).toHaveAttribute('href', '#met-npm')
    await userEvent.click(link)
    expect(onJump).toHaveBeenCalledWith('met-npm')
    expect(window.location.hash).toBe('')
  })

  test('folds to a plain toggle without a button of the caller', async () => {
    const onJump = renderOutline({ folded: true })
    expect(screen.queryByRole('link', { name: 'Handleiding' })).toBeNull()
    const toggle = screen.getByRole('button', { name: 'Inhoudsopgave tonen' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const nav = screen.getByRole('navigation', { name: 'Inhoudsopgave' })
    expect(toggle).toHaveAttribute('aria-controls', nav.id)
    await userEvent.click(screen.getByRole('link', { name: 'Installatie' }))
    expect(onJump).toHaveBeenCalledWith('installatie')
    expect(screen.queryByRole('link', { name: 'Installatie' })).toBeNull()
  })

  test('draws the toggle with the button of the caller', async () => {
    renderOutline({
      folded: true,
      renderToggle: ({ label, expanded, onToggle }) => (
        <button type="button" aria-pressed={expanded} onClick={onToggle}>
          {`eigen ${label}`}
        </button>
      ),
    })
    const toggle = screen.getByRole('button', { name: 'eigen Inhoudsopgave tonen' })
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('link', { name: 'Handleiding' })).toBeVisible()
  })

  test('draws nothing for a document without headings', () => {
    const { container } = render(
      <DocOutline entries={[]} active={null} onJump={() => {}} folded={false} labels={LABELS} />,
    )
    expect(container.textContent).toBe('')
  })
})
