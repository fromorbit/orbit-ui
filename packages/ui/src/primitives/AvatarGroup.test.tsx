import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { AvatarGroup } from './AvatarGroup'

const TEAM = [
  'Noor de Vries',
  'Sem Jansen',
  'Lotte Bakker',
  'Daan Visser',
  'Eva Smit',
  'Finn de Boer',
]

test('one image named by its label; the faces and the count are hidden', () => {
  render(<AvatarGroup names={TEAM} label="6 leden" />)
  const group = screen.getByRole('img', { name: '6 leden' })
  expect(group.querySelectorAll('[data-nt-avatar]')).toHaveLength(4)
  expect(group).toHaveTextContent('+2')
})

test('max sets how many faces stand before the count; no count when all fit', () => {
  const { rerender } = render(<AvatarGroup names={TEAM} label="team" max={2} />)
  expect(screen.getByRole('img')).toHaveTextContent('+4')
  rerender(<AvatarGroup names={TEAM.slice(0, 3)} label="team" />)
  expect(screen.getByRole('img').textContent).not.toContain('+')
})

test('the ring takes the plane it stands on', () => {
  render(<AvatarGroup names={TEAM} label="team" on="overlay" />)
  expect(screen.getByRole('img').firstElementChild?.className).toContain('ring-overlay')
})
