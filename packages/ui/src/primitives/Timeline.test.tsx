import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Icon } from './Icon'
import { Timeline, TimelineItem } from './Timeline'

test('an ordered list named by its label, one item per event, in order', () => {
  render(
    <Timeline label="Activiteit">
      <TimelineItem marker={<Icon name="plus" size="sm" />} time="3 d">
        Noor maakte de spec
      </TimelineItem>
      <TimelineItem marker={<Icon name="check" size="sm" />} time="2 u">
        Sem keurde hem goed
      </TimelineItem>
    </Timeline>,
  )
  const list = screen.getByRole('list', { name: 'Activiteit' })
  expect(list.tagName).toBe('OL')
  const items = within(list).getAllByRole('listitem')
  expect(items.map((item) => item.textContent)).toEqual([
    'Noor maakte de spec3 d',
    'Sem keurde hem goed2 u',
  ])
})

test('the marker is decorative', () => {
  const { container } = render(
    <Timeline label="Activiteit">
      <TimelineItem marker={<Icon name="plus" size="sm" />}>Gemaakt</TimelineItem>
    </Timeline>,
  )
  expect(container.querySelector('li > span')).toHaveAttribute('aria-hidden', 'true')
})
