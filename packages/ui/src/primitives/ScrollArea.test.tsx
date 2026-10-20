import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { ScrollArea } from './ScrollArea'

test('shows its content', () => {
  render(
    <ScrollArea>
      <p>Row content</p>
    </ScrollArea>,
  )
  expect(screen.getByText('Row content')).toBeInTheDocument()
})

test.each([
  ['without a label', <ScrollArea key="a">{<p>Row content</p>}</ScrollArea>],
  [
    'with a label',
    <ScrollArea key="b" label="Rows">
      {<p>Row content</p>}
    </ScrollArea>,
  ],
])('overrides the table wrapper of Radix (%s)', (_name, element) => {
  // Radix gives that wrapper `display: table` inline, which is shrink-to-fit: a truncating row
  // would widen it instead of truncating. happy-dom has no layout, so this only guards that the
  // override is not dropped from either branch of the className; that it actually works is
  // measured in Orbit's end-to-end gallery test, against a real column.
  const { container } = render(element)
  const viewport = container.querySelector('[data-radix-scroll-area-viewport]')
  expect(viewport?.className).toContain('[&>div]:block!')
  expect(viewport?.firstElementChild).toHaveStyle({ display: 'table' })
})

test('with a label the viewport is a named region that Tab can reach', () => {
  render(
    <ScrollArea label="Rows">
      <p>Row content</p>
    </ScrollArea>,
  )
  const region = screen.getByRole('region', { name: 'Rows' })
  expect(region).toHaveAttribute('data-radix-scroll-area-viewport')
  expect(region).toHaveAttribute('tabindex', '0')
})

test('an empty label counts as no label: no nameless tab stop', () => {
  const { container } = render(
    <ScrollArea label="  ">
      <p>Row content</p>
    </ScrollArea>,
  )
  expect(container.querySelector('[data-radix-scroll-area-viewport]')).not.toHaveAttribute(
    'tabindex',
  )
})

test('without a label the viewport is no tab stop and no region', () => {
  // A caller without a label says the content brings its own focusable elements; an extra,
  // nameless tab stop would only be noise (and axe's scrollable-region-focusable case).
  const { container } = render(
    <ScrollArea>
      <button type="button">Row content</button>
    </ScrollArea>,
  )
  const viewport = container.querySelector('[data-radix-scroll-area-viewport]')
  expect(viewport).not.toHaveAttribute('tabindex')
  expect(viewport).not.toHaveAttribute('role')
  expect(viewport).not.toHaveAttribute('aria-label')
  expect(screen.queryByRole('region')).not.toBeInTheDocument()
})
