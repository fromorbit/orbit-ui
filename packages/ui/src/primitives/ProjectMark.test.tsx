import { render } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { ProjectMark } from './ProjectMark'

test('is a 14px block with the first letter of the project, in capitals', () => {
  const { container } = render(<ProjectMark name="webshop" />)
  const mark = container.querySelector('[data-nt-project-mark]')
  expect(mark?.textContent).toBe('W')
  expect(mark?.className.split(' ')).toEqual(
    expect.arrayContaining([
      'size-3.5',
      'rounded-sm',
      'bg-mark',
      'text-[9px]',
      'font-semibold',
      'text-secondary',
    ]),
  )
})

test('is muted and colourless: no accent, no colour of its own per project', () => {
  const one = render(<ProjectMark name="webshop" />).container.innerHTML
  const other = render(<ProjectMark name="wiki" />).container.innerHTML
  // Two projects with the same letter draw exactly the same block.
  expect(one).toBe(other)
  expect(one).not.toMatch(/accent|attention|danger|success|kind-/)
})

test('is decorative: the name stands after it, never in it', () => {
  const { container } = render(<ProjectMark name="webshop" />)
  expect(container.querySelector('[data-nt-project-mark]')).toHaveAttribute('aria-hidden', 'true')
  expect(container.textContent).not.toContain('webshop')
})

test('takes the first letter of a name that starts with an emoji or a space whole', () => {
  expect(render(<ProjectMark name="  docs-site" />).container.textContent).toBe('D')
  expect(render(<ProjectMark name="🚀raket" />).container.textContent).toBe('🚀')
  expect(render(<ProjectMark name="" />).container.textContent).toBe('')
})

test('makes no segmenter per mark: a list of marks shares one', () => {
  // Every row of a stored list draws a mark; a segmenter per mark was a measurable part of the
  // app's start-up time.
  const made = vi.spyOn(Intl, 'Segmenter')
  try {
    render(
      <div>
        {Array.from({ length: 20 }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: a fixed list in a test.
          <ProjectMark key={index} name={`project-${index}`} />
        ))}
      </div>,
    )
    expect(made.mock.calls.length).toBeLessThanOrEqual(1)
  } finally {
    made.mockRestore()
  }
})
