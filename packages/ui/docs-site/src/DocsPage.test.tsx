import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test } from 'vitest'
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
  history.replaceState(null, '', '#')
  document.documentElement.removeAttribute('data-theme')
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
    expect(screen.getByText('Variants')).toBeInTheDocument()
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
})
