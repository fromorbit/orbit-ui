import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test, vi } from 'vitest'
import packageJson from '../../package.json'
import { stories, storyId } from '../../src/gallery'
import { DocsPage } from './DocsPage'
import { DEMOS } from './demo-kit/registry'
import { INSTALL, VERSION } from './Home'

/** Puts `hash` in the address bar and tells the page, as a click on a link would. */
function goTo(hash: string): void {
  act(() => {
    history.replaceState(null, '', hash)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

afterEach(() => {
  localStorage.clear()
  history.replaceState(null, '', '#')
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('data-product')
})

describe('the docs page', () => {
  test('draws the key of an Orbit command, not its id', () => {
    goTo('#/patterns-selectionbar')
    render(<DocsPage stories={stories} />)
    expect(screen.queryAllByText(/document\.comment/i)).toEqual([])
    expect(document.body.textContent).toContain('Shift Command M')
  })

  test('lists one item per story of the library', () => {
    goTo('#/primitives-button')
    render(<DocsPage stories={stories} />)
    const list = screen.getByRole('listbox', { name: 'Zoek een component' })
    const titles = within(list)
      .getAllByRole('option')
      .map((option) => option.textContent)
    expect(titles).toHaveLength(stories.length)
    expect(new Set(titles)).toEqual(new Set(stories.map((story) => story.title)))
  })

  test('shows the story the hash names', () => {
    goTo('#/primitives-button')
    render(<DocsPage stories={stories} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Button' })).toBeInTheDocument()
    expect(screen.getByText('Varianten')).toBeInTheDocument()
  })

  test('names the route in the title, so tabs and history tell the pages apart', () => {
    goTo('#/primitives-statusmark')
    render(<DocsPage stories={stories} />)
    expect(document.title).toBe('StatusMark · Bouwstenen · Orbit UI')
    goTo('#/demo/team')
    expect(document.title).toBe("Team en rechten · Demo's · Orbit UI")
    goTo('#/demo/ontbrekend')
    expect(document.title).toBe("Wensenlijst · Demo's · Orbit UI")
  })

  test('an open layer of a story does not hold the keyboard: it takes no focus on load', async () => {
    goTo('#/overlays-dialog')
    render(<DocsPage stories={stories} />)
    const dialog = await screen.findByRole('dialog', { name: 'Plan ter goedkeuring' })
    await act(() => new Promise((done) => requestAnimationFrame(() => done(undefined))))
    expect(dialog.contains(document.activeElement)).toBe(false)
  })

  test('closing a staged layer hands the focus to the button that opens it again', async () => {
    goTo('#/overlays-dialog')
    render(<DocsPage stories={stories} />)
    await screen.findByRole('dialog', { name: 'Plan ter goedkeuring' })
    await userEvent.click(screen.getByRole('button', { name: 'Blijf plannen' }))
    await userEvent.keyboard('{Escape}')
    const reopen = await screen.findByRole('button', { name: 'Plan bekijken' })
    await vi.waitFor(() => expect(reopen).toHaveFocus())
  })

  test('follows a change of the hash', () => {
    render(<DocsPage stories={stories} />)
    goTo('#/primitives-switch')
    expect(screen.getByRole('heading', { level: 1, name: 'Switch' })).toBeInTheDocument()
  })

  test('falls back to the first story for an unknown hash', () => {
    goTo('#/primitives-does-not-exist')
    render(<DocsPage stories={stories} />)
    const first = stories[0]
    expect(screen.getByRole('heading', { level: 1, name: first?.title ?? '' })).toBeInTheDocument()
  })

  test('writes the chosen story into the hash', async () => {
    goTo('#/primitives-button')
    render(<DocsPage stories={stories} />)
    await userEvent.click(screen.getByRole('option', { name: 'Switch' }))
    expect(location.hash).toBe(`#/${storyId({ group: 'primitives', title: 'Switch' })}`)
  })

  test('switches the document between dark and light', async () => {
    render(<DocsPage stories={stories} />)
    expect(document.documentElement.dataset.theme).toBe('dark')
    await userEvent.click(screen.getByRole('radio', { name: 'Licht' }))
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  test('keeps the chosen theme for the next visit', async () => {
    const { unmount } = render(<DocsPage stories={stories} />)
    await userEvent.click(screen.getByRole('radio', { name: 'Licht' }))
    unmount()
    document.documentElement.removeAttribute('data-theme')
    render(<DocsPage stories={stories} />)
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  test('names the groups of the catalogue in Dutch above a story', () => {
    goTo('#/primitives-button')
    render(<DocsPage stories={stories} />)
    expect(screen.getAllByText('Bouwstenen').length).toBeGreaterThan(0)
  })

  test('switches the satellite between the products of the family', async () => {
    render(<DocsPage stories={stories} />)
    expect(document.documentElement.dataset.product).toBe('orbit')
    await userEvent.click(screen.getByRole('radio', { name: 'Halo' }))
    expect(document.documentElement.dataset.product).toBe('halo')
  })

  test('folds the list behind a button of the header for a narrow screen', async () => {
    goTo('#/primitives-button')
    render(<DocsPage stories={stories} />)
    const button = screen.getByRole('button', { name: 'Componenten' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(screen.getByRole('option', { name: 'Switch' }))
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('the home page', () => {
  test.each(['', '#', '#/'])('opens at the root (%j), not on a component', (hash) => {
    goTo(hash)
    render(<DocsPage stories={stories} />)
    const home = screen.getByRole('main', { name: 'Start' })
    expect(within(home).getByRole('heading', { level: 1, name: 'Orbit UI' })).toBeInTheDocument()
    expect(screen.queryByRole('listbox', { name: 'Zoek een component' })).toBeNull()
    expect(screen.getByRole('radio', { name: 'Start' })).toBeChecked()
  })

  test('shows the version of the package and the install line', () => {
    render(<DocsPage stories={stories} />)
    expect(VERSION).toBe(packageJson.version)
    const home = screen.getByRole('main', { name: 'Start' })
    expect(home.textContent).toContain(VERSION)
    expect(within(home).getAllByText(INSTALL).length).toBeGreaterThan(0)
    expect(home.textContent).toContain('@fromorbit:registry=https://npm.pkg.github.com')
  })

  test('draws live components and demos, each linking to its page', () => {
    render(<DocsPage stories={stories} />)
    const mosaic = screen.getByRole('region', { name: 'Voorbeelden' })
    expect(within(mosaic).getByRole('radiogroup', { name: 'Periode' })).toBeInTheDocument()
    expect(within(mosaic).getByRole('link', { name: /StatTile/ })).toHaveAttribute(
      'href',
      `#/${storyId({ group: 'patterns', title: 'StatTile' })}`,
    )
    for (const slug of ['dashboard', 'inloggen', 'review']) {
      const demo = DEMOS.find((entry) => entry.slug === slug)
      expect(
        within(mosaic).getByRole('link', { name: new RegExp(demo?.title ?? slug) }),
      ).toHaveAttribute('href', `#/demo/${slug}`)
      expect(mosaic.querySelector(`[data-demo="${slug}"]`)?.closest('[inert]')).not.toBeNull()
    }
  })

  test('leads to the components and the demos with its two actions', async () => {
    render(<DocsPage stories={stories} />)
    await userEvent.click(screen.getByRole('button', { name: 'Componenten' }))
    expect(screen.getByRole('listbox', { name: 'Zoek een component' })).toBeInTheDocument()
    const first = stories[0]
    expect(first && location.hash).toBe(first && `#/${storyId(first)}`)
    goTo('#/')
    await userEvent.click(screen.getByRole('button', { name: "Demo's" }))
    expect(location.hash).toBe('#/demo')
  })

  test('returns home from the name of the site', async () => {
    goTo('#/primitives-button')
    render(<DocsPage stories={stories} />)
    expect(screen.getByRole('link', { name: 'Orbit UI, naar de start' })).toHaveAttribute(
      'href',
      '#/',
    )
    await userEvent.click(screen.getByRole('radio', { name: 'Start' }))
    expect(screen.getByRole('main', { name: 'Start' })).toBeInTheDocument()
  })
})
