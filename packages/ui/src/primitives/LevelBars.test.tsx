import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import { LevelBars } from './LevelBars'

const on = (container: HTMLElement) =>
  [...container.querySelectorAll('[data-nt-level-bar]')].map(
    (bar) => bar.getAttribute('data-on') === 'true',
  )

test('fills as many bars as the level, of a scale of three or four', () => {
  const { container, rerender } = render(<LevelBars level={1} of={3} />)
  expect(on(container)).toEqual([true, false, false])
  rerender(<LevelBars level={3} of={4} />)
  expect(on(container)).toEqual([true, true, true, false])
})

test('is hidden from assistive technology: the word beside it says the level', () => {
  const { container } = render(<LevelBars level={2} of={3} />)
  expect(container.querySelector('[data-nt-level-bars]')).toHaveAttribute('aria-hidden', 'true')
})

test('a scale longer than four draws four bars', () => {
  const { container } = render(<LevelBars level={2} of={6} />)
  expect(on(container)).toHaveLength(4)
})
