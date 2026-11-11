import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { SectionHeading } from './SectionHeading'

test('is a quiet heading of 12px/500 in muted, in sentence case', () => {
  render(<SectionHeading>Wacht op jou</SectionHeading>)
  const heading = screen.getByRole('heading', { name: 'Wacht op jou', level: 3 })
  expect(heading.className.split(' ')).toEqual(
    expect.arrayContaining(['text-[12px]', 'font-medium', 'text-muted', 'h-(--nt-control-md)']),
  )
  expect(heading.className).not.toContain('uppercase')
})

test('the text stays as written', () => {
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

test('a count stands beside it in figures of one width, at rest weight', () => {
  render(<SectionHeading count="2/5">Plannen en besluiten</SectionHeading>)
  const count = screen.getByText('2/5')
  expect(count.className).toContain('tabular-nums')
  expect(count.className).toContain('font-normal')
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
  expect(label?.className).toContain('text-[12px]')
})
