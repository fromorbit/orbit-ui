import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { SectionHeading } from './SectionHeading'

test('is a heading of 11px/500 in muted capitals with a little letter-spacing', () => {
  render(<SectionHeading>Wacht op jou</SectionHeading>)
  const heading = screen.getByRole('heading', { name: 'Wacht op jou', level: 3 })
  expect(heading.className.split(' ')).toEqual(
    expect.arrayContaining([
      'text-[11px]',
      'font-medium',
      'text-muted',
      'uppercase',
      'tracking-[0.04em]',
    ]),
  )
})

test('the text stays as written: the capitals are only the look', () => {
  render(<SectionHeading>In uitvoering</SectionHeading>)
  expect(screen.getByRole('heading').textContent).toBe('In uitvoering')
})

test('takes a level and an id, so a list can be named by it', () => {
  render(
    <SectionHeading level={2} id="open">
      Open
    </SectionHeading>,
  )
  expect(screen.getByRole('heading', { level: 2 })).toHaveAttribute('id', 'open')
})

test('a count stands beside it in mono, without the letter-spacing', () => {
  render(<SectionHeading count="2/5">Plannen en besluiten</SectionHeading>)
  const count = screen.getByText('2/5')
  expect(count.className).toContain('font-mono')
  expect(count.className).toContain('tracking-normal')
})

test('rule draws a decorative hairline to the end of the row', () => {
  render(<SectionHeading rule>Activiteit</SectionHeading>)
  const rule = screen.getByRole('heading').querySelector('[data-nt-heading-rule]')
  expect(rule).toHaveAttribute('aria-hidden', 'true')
  expect(rule?.className).toContain('bg-border')
})

test("level 'label' draws the same heading as a paragraph, for a widget that holds no heading", () => {
  render(
    <SectionHeading level="label" id="g1">
      Commando's
    </SectionHeading>,
  )
  expect(screen.queryByRole('heading')).toBeNull()
  const label = screen.getByText("Commando's").parentElement
  expect(label?.tagName).toBe('P')
  expect(label).toHaveAttribute('id', 'g1')
  expect(label?.className).toContain('uppercase')
})
