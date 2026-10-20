import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Rail, RailInset } from './Rail'

test('the rule is drawn at the left, with the same air behind it either way', () => {
  const { container, rerender } = render(<Rail>steps</Rail>)
  const rail = () => container.querySelector('[data-nt-rail]')
  expect(rail()?.className).toContain('border-l')
  expect(rail()?.className).toContain('border-border')
  expect(rail()?.className).toContain('pl-3')

  rerender(<Rail line="hidden">events</Rail>)
  // Hidden is not absent: the block still stands in the same column as the ones around it, which
  // is the whole reason a technical event gets a rail at all.
  expect(rail()?.className).toContain('border-transparent')
  expect(rail()?.className).not.toContain('border-border')
  expect(rail()?.className).toContain('pl-3')
})

test('the shape is on the element that draws it, so it can be measured', () => {
  // A test that measures where the line stands must not have to guess which wrapper carries the
  // border; the e2e reads exactly this attribute.
  const { container } = render(<Rail>steps</Rail>)
  expect(container.querySelector('[data-nt-rail="visible"]')).toBeInTheDocument()
  expect(container.querySelector('[data-nt-rail="hidden"]')).toBeNull()
})

test('one column is the chevron slot, two are for a block that has no glyph either', () => {
  const { container, rerender } = render(<RailInset>een rij</RailInset>)
  const slots = () => container.querySelectorAll('span.size-\\(--nt-icon-sm\\)')
  expect(slots()).toHaveLength(1)

  rerender(<RailInset columns={2}>een denkstap</RailInset>)
  expect(slots()).toHaveLength(2)
  // Empty on purpose: it is a column, not a picture.
  for (const slot of slots()) expect(slot.textContent).toBe('')
})

test('the content keeps its own column and may shrink', () => {
  // Without `min-w-0` a long tool input widens the whole conversation instead of truncating.
  render(<RailInset>een rij</RailInset>)
  expect(screen.getByText('een rij').className).toContain('min-w-0')
})
