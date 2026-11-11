import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import { ProjectMark } from './ProjectMark'
import { TeamMark } from './TeamMark'

test('is a 20px block with the first letter of the team, in capitals, at full strength', () => {
  const { container } = render(<TeamMark name="studio noord" />)
  const mark = container.querySelector('[data-nt-team-mark]')
  expect(mark?.textContent).toBe('S')
  expect(mark?.className.split(' ')).toEqual(
    expect.arrayContaining([
      'size-5',
      'shrink-0',
      'rounded-sm',
      'bg-mark',
      'text-[11px]',
      'font-semibold',
      'text-fg',
    ]),
  )
})

test('is a step larger than ProjectMark and draws the same plane', () => {
  const team = render(<TeamMark name="webshop" />).container.querySelector('[data-nt-team-mark]')
  const project = render(<ProjectMark name="webshop" />).container.querySelector(
    '[data-nt-project-mark]',
  )
  expect(project?.className).toContain('size-4')
  expect(team?.className).toContain('size-5')
  expect(team?.textContent).toBe(project?.textContent)
  for (const shared of ['rounded-sm', 'bg-mark', 'font-semibold']) {
    expect(team?.className).toContain(shared)
  }
})

test('takes no colour of its own per team', () => {
  const one = render(<TeamMark name="Studio Noord" />).container.innerHTML
  const other = render(<TeamMark name="Sterrenwacht" />).container.innerHTML
  expect(one).toBe(other)
  expect(one).not.toMatch(/accent|satellite|avatar-|attention|danger|success/)
})

test('is decorative: the name stands beside it, never in it', () => {
  const { container } = render(<TeamMark name="Studio Noord" />)
  expect(container.querySelector('[data-nt-team-mark]')).toHaveAttribute('aria-hidden', 'true')
  expect(container.textContent).not.toContain('Studio Noord')
})

test('takes the first sign of a name that starts with an emoji or a space whole', () => {
  expect(render(<TeamMark name="  noord" />).container.textContent).toBe('N')
  expect(render(<TeamMark name="🚀raket" />).container.textContent).toBe('🚀')
  expect(render(<TeamMark name="" />).container.textContent).toBe('')
})
