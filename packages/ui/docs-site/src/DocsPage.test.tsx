import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { stories, storyId } from '../../src/gallery'
import { DocsPage } from './DocsPage'

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
    render(<DocsPage stories={stories} />)
    const button = screen.getByRole('button', { name: 'Componenten' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(screen.getByRole('option', { name: 'Switch' }))
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })
})
