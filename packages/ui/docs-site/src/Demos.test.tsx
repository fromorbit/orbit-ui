import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { UiProvider } from '../../src'
import { stories } from '../../src/gallery'
import { DocsPage } from './DocsPage'
import { MISSING, MissingMarks, type MissingName } from './demo-kit/Missing'
import { DEMOS, inventoryOf, missingOverview, sourceOf } from './demo-kit/registry'

/** Puts `hash` in the address bar and tells the page, as a click on a link would. */
function goTo(hash: string): void {
  act(() => {
    history.replaceState(null, '', hash)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

/** The block of one demo on the page. */
function blockOf(slug: string): HTMLElement {
  const block = document.querySelector<HTMLElement>(`[data-demo-block="${slug}"]`)
  if (!block) throw new Error(`No block for ${slug}`)
  return block
}

const scrolled: string[] = []

beforeEach(() => {
  scrolled.length = 0
  // happy-dom has no layout; the page only needs to know which block it asked to scroll to.
  Element.prototype.scrollIntoView = vi.fn(function (this: Element) {
    scrolled.push(this.id)
  })
})

afterEach(() => {
  history.replaceState(null, '', '#')
  document.documentElement.removeAttribute('data-theme')
})

/** The screens the page promises, in the order of its bar. */
const SLUGS = [
  'review',
  'trail',
  'chat',
  'dashboard',
  'apps',
  'inloggen',
  'taken',
  'branches',
  'gebruik',
  'instellingen',
  'team',
]

describe('the demos tab', () => {
  test('shows every demo as a block, in the order of the bar, with the wishlist last', () => {
    goTo('#/demo')
    render(<DocsPage stories={stories} />)
    expect(DEMOS.map((demo) => demo.slug)).toEqual(SLUGS)
    const bar = screen.getByRole('navigation', { name: 'Naar een demo' })
    expect(
      within(bar)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual([...DEMOS.map((demo) => demo.title), 'Wensenlijst'])
    for (const demo of DEMOS) {
      expect(
        within(blockOf(demo.slug)).getByRole('heading', { level: 2, name: demo.title }),
      ).toBeInTheDocument()
    }
  })

  test('has one navigation: no list of components beside the demos', () => {
    goTo('#/demo')
    render(<DocsPage stories={stories} />)
    expect(screen.queryByRole('listbox', { name: 'Zoek een component' })).toBeNull()
    expect(screen.getAllByRole('navigation', { name: 'Naar een demo' })).toHaveLength(1)
  })

  test('switches from the components to the demos with the tabs', async () => {
    render(<DocsPage stories={stories} />)
    await userEvent.click(screen.getByRole('radio', { name: "Demo's" }))
    expect(location.hash).toBe('#/demo')
    expect(screen.getByRole('navigation', { name: 'Naar een demo' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: 'Componenten' }))
    expect(screen.getByRole('listbox', { name: 'Zoek een component' })).toBeInTheDocument()
  })

  test.each(SLUGS)('scrolls to the block #/demo/%s names', (slug) => {
    goTo(`#/demo/${slug}`)
    render(<DocsPage stories={stories} />)
    expect(scrolled).toContain(`demo-${slug}`)
    expect(blockOf(slug).querySelector('[data-demo]')?.getAttribute('data-demo')).toBe(slug)
  })

  test('returns to the block that was open after a visit to the components', async () => {
    goTo('#/demo/taken')
    render(<DocsPage stories={stories} />)
    await userEvent.click(screen.getByRole('radio', { name: 'Componenten' }))
    await userEvent.click(screen.getByRole('radio', { name: "Demo's" }))
    expect(location.hash).toBe('#/demo/taken')
  })

  test('keeps a story hash on the components tab', () => {
    goTo('#/primitives-button')
    render(<DocsPage stories={stories} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Button' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Componenten' })).toBeChecked()
  })

  test('shows what a demo uses and what it misses, from its source', () => {
    // The opname still draws its Scrubber as missing, so both lists are there.
    goTo('#/demo/trail')
    render(<DocsPage stories={stories} />)
    const block = blockOf('trail')
    const inventory = inventoryOf('trail')
    const used = within(block).getByRole('list', { name: 'Gebruikt' })
    const missing = within(block).getByRole('list', { name: 'Ontbreekt' })
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

  test('shows the source of a demo in its code view', async () => {
    goTo('#/demo/dashboard')
    render(<DocsPage stories={stories} />)
    const block = blockOf('dashboard')
    await userEvent.click(within(block).getByRole('radio', { name: 'Code' }))
    const code = within(block).getByRole('region', { name: /^Code van / })
    expect(code.textContent).toContain('export default')
    expect(sourceOf('dashboard')).toContain('export default')
  })

  test('narrows the frame of a demo to a phone', async () => {
    goTo('#/demo')
    render(<DocsPage stories={stories} />)
    const block = blockOf('dashboard')
    const frame = block.querySelector('[data-demo]')?.parentElement
    expect(frame?.className).toContain('w-full')
    await userEvent.click(within(block).getByRole('radio', { name: 'Mobiel' }))
    expect(frame?.className).toContain('w-[390px]')
  })

  test('switches the marks of what is missing off and on', async () => {
    goTo('#/demo')
    render(<DocsPage stories={stories} />)
    const marked = () => document.querySelectorAll('[data-missing][title]').length
    expect(marked()).toBeGreaterThan(0)
    await userEvent.click(screen.getByRole('switch', { name: 'Markeer ontbrekend' }))
    expect(marked()).toBe(0)
    // The placeholders stay, so the lists still match the screens.
    expect(document.querySelectorAll('[data-missing]').length).toBeGreaterThan(0)
  })
})

describe('every demo', () => {
  const cases = DEMOS.flatMap((demo) =>
    (demo.variants?.map((variant) => variant.value) ?? [undefined]).map(
      (variant) => [`${demo.slug}${variant ? ` (${variant})` : ''}`, demo, variant] as const,
    ),
  )

  test.each(cases)('%s renders what its source names', (_name, demo, variant) => {
    const { container } = render(
      <UiProvider locale="nl-NL">
        <MissingMarks value>
          {createElement(demo.Screen, variant === undefined ? {} : { variant })}
        </MissingMarks>
      </UiProvider>,
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
  })

  test.each(DEMOS.map((demo) => [demo.slug, demo] as const))(
    '%s says what it is',
    (_slug, demo) => {
      // A demo need not miss anything any more: once the library has every piece, it has none.
      expect(demo.description.length).toBeGreaterThan(20)
    },
  )
})

describe('the overview of what is missing', () => {
  test('names every Missing of every demo, with the demos it stands in', () => {
    goTo('#/demo/ontbrekend')
    render(<DocsPage stories={stories} />)
    expect(scrolled).toContain('demo-ontbrekend')
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
