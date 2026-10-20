import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import { afterEach, describe, expect, test } from 'vitest'
import { UiProvider } from '../../src'
import { stories } from '../../src/gallery'
import { DocsPage } from './DocsPage'
import { MISSING, type MissingName } from './demo-kit/Missing'
import { DEMOS, inventoryOf, missingOverview } from './demo-kit/registry'

/** Puts `hash` in the address bar and tells the page, as a click on a link would. */
function goTo(hash: string): void {
  act(() => {
    history.replaceState(null, '', hash)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

afterEach(() => {
  history.replaceState(null, '', '#')
  document.documentElement.removeAttribute('data-theme')
})

/** The eight screens the page promises, in the order of its list. */
const TITLES = [
  'Dashboard',
  'CMS-overzicht',
  'Betalingen',
  'AI-chat',
  'Instellingen',
  'Team en rechten',
  'Taken',
  'Inloggen en onboarding',
]

describe('the demos tab', () => {
  test('lists all eight demos and the overview of what is missing', () => {
    goTo('#/demo/dashboard')
    render(<DocsPage stories={stories} />)
    const list = screen.getByRole('listbox', { name: "Demo's" })
    const titles = within(list)
      .getAllByRole('option')
      .map((option) => option.textContent)
    expect(titles).toEqual([...TITLES, 'Overzicht ontbrekend'])
  })

  test('switches from the components to the demos with the tabs', async () => {
    render(<DocsPage stories={stories} />)
    await userEvent.click(screen.getByRole('radio', { name: "Demo's" }))
    expect(location.hash).toBe('#/demo/dashboard')
    expect(screen.getByRole('listbox', { name: "Demo's" })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: 'Componenten' }))
    expect(screen.getByRole('listbox', { name: 'Zoek een component' })).toBeInTheDocument()
  })

  test.each(DEMOS.map((demo) => [demo.slug, demo.title] as const))(
    'opens the demo #/demo/%s names',
    (slug, title) => {
      goTo(`#/demo/${slug}`)
      render(<DocsPage stories={stories} />)
      const stage = screen.getByRole('main', { name: title })
      expect(stage.querySelector('[data-demo]')?.getAttribute('data-demo')).toBe(slug)
    },
  )

  test('writes the chosen demo into the hash', async () => {
    goTo('#/demo/dashboard')
    render(<DocsPage stories={stories} />)
    const list = screen.getByRole('listbox', { name: "Demo's" })
    await userEvent.click(within(list).getByRole('option', { name: 'Taken' }))
    expect(location.hash).toBe('#/demo/taken')
  })

  test('keeps a story hash on the components tab', () => {
    goTo('#/primitives-button')
    render(<DocsPage stories={stories} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Button' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Componenten' })).toBeChecked()
  })

  test('shows what a demo uses and what it misses, from its source', () => {
    goTo('#/demo/betalingen')
    render(<DocsPage stories={stories} />)
    const inventory = inventoryOf('betalingen')
    const used = screen.getByRole('list', { name: 'Gebruikt' })
    const missing = screen.getByRole('list', { name: 'Ontbreekt' })
    expect(
      within(used)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(inventory.used)
    expect(
      within(missing)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(inventory.missing)
  })
})

describe('every demo', () => {
  test.each(DEMOS.map((demo) => [demo.slug, demo] as const))('%s renders', (_slug, demo) => {
    const { container } = render(
      <UiProvider locale="nl-NL">{createElement(demo.Screen)}</UiProvider>,
    )
    const shown = new Set(
      [...container.querySelectorAll('[data-missing]')].map((node) =>
        node.getAttribute('data-missing'),
      ),
    )
    const inventory = inventoryOf(demo.slug)
    // What renders is what the source names: the list is read from the file, not kept by hand.
    expect(inventory.used.length).toBeGreaterThan(3)
    for (const name of shown) expect(inventory.missing).toContain(name)
    expect(inventory.missing.length).toBeGreaterThan(0)
  })
})

describe('the overview of what is missing', () => {
  test('names every Missing of every demo, with the demos it stands in', () => {
    goTo('#/demo/ontbrekend')
    render(<DocsPage stories={stories} />)
    const overview = screen.getByRole('list', { name: 'Ontbrekende componenten' })
    const everyName = new Set(DEMOS.flatMap((demo) => inventoryOf(demo.slug).missing))
    for (const name of everyName) {
      const row = within(overview).getByRole('listitem', { name })
      const demos = DEMOS.filter((demo) => inventoryOf(demo.slug).missing.includes(name))
      for (const demo of demos) {
        expect(within(row).getByRole('link', { name: demo.title })).toBeInTheDocument()
      }
    }
    expect(within(overview).getAllByRole('listitem')).toHaveLength(everyName.size)
  })

  test('keeps no entry in the catalogue that no demo uses', () => {
    const used = new Set(missingOverview().map((entry) => entry.name))
    expect(Object.keys(MISSING).filter((name) => !used.has(name as MissingName))).toEqual([])
  })
})
