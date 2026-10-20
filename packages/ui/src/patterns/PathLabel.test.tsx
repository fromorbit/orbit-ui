import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { PathLabel } from './PathLabel'

/** Long enough that no column shows it whole; `/work/…`, never a home directory. */
const LONG = '/work/klanten/atlas/checkouts/nt-agent'

test('the path is one piece of text, however it is cut up for the eye', () => {
  // Splitting it into a head and a tail is a layout trick; what a screen reader and a copy action
  // see must still be the path itself, in order, with nothing added between the halves.
  const { container } = render(<PathLabel path={LONG} />)
  expect(container.textContent).toBe(LONG)
})

test('it splits at the last separator, so the last segment never shrinks', () => {
  render(<PathLabel path={LONG} />)
  // The head is the part CSS is allowed to eat; the tail keeps the separator so the two halves
  // read as one path even when the head is down to an ellipsis.
  expect(screen.getByText('/work/klanten/atlas/checkouts').className).toContain('truncate')
  const tail = screen.getByText('/nt-agent')
  expect(tail.className).toContain('shrink-0')
  expect(tail.className).not.toContain('truncate')
})

test('a Windows path splits on its own separator', () => {
  // As an expression, not an attribute string: JSX does not read escape sequences, so `path="a\\b"`
  // would hand the component two backslashes instead of the one a Windows path has.
  render(<PathLabel path={'C:\\work\\checkouts\\nt-agent'} />)
  expect(screen.getByText('C:\\work\\checkouts')).toBeInTheDocument()
  expect(screen.getByText('\\nt-agent')).toBeInTheDocument()
})

test('a bare name has no head to cut', () => {
  const { container } = render(<PathLabel path="nt-agent" />)
  expect(container.querySelector('[data-nt-path-head]')).toBeNull()
  expect(container.querySelector('[data-nt-path-tail]')).toHaveTextContent('nt-agent')
})

test('a path that is only a root keeps its slash in the tail', () => {
  const { container } = render(<PathLabel path="/work" />)
  expect(container.querySelector('[data-nt-path-head]')).toBeNull()
  expect(container.textContent).toBe('/work')
})

test('a trailing separator does not push the last segment into the head', () => {
  // The one thing this component protects is the last segment; a path ending in a separator would
  // otherwise cut after it and leave a bare "/" as the tail — the ellipsis would eat the name.
  const { container } = render(<PathLabel path="/work/klanten/nt-agent/" />)
  expect(screen.getByText('/work/klanten')).toBeInTheDocument()
  expect(screen.getByText('/nt-agent/')).toBeInTheDocument()
  expect(container.textContent).toBe('/work/klanten/nt-agent/')
})

test('a root with a trailing separator is still all tail', () => {
  const { container } = render(<PathLabel path="/work/" />)
  expect(container.querySelector('[data-nt-path-head]')).toBeNull()
  expect(container.textContent).toBe('/work/')
})

test('the whole path stands in the title, for the hover and for the tooltip later', () => {
  const { container } = render(<PathLabel path={LONG} />)
  expect(container.querySelector('[data-nt-path]')).toHaveAttribute('title', LONG)
})

test('a className or style from outside does not get in', () => {
  const { container } = render(
    // @ts-expect-error variation comes from props, never from a className handed in.
    <PathLabel path={LONG} className="bg-red-500" style={{ color: 'red' }} />,
  )
  const label = container.querySelector('[data-nt-path]')
  expect(label?.className).not.toContain('bg-red-500')
  expect(label?.getAttribute('style')).toBeNull()
})

test('a file name can stand out from its folder', () => {
  const { container } = render(<PathLabel path="src/components/lezer.ts" emphasis="name" />)

  expect(container.querySelector('[data-nt-path-head]')).toHaveClass('text-muted')
  expect(container.querySelector('[data-nt-path-tail]')).toHaveClass('text-fg')
})

test('a file that is gone is struck through and quiet', () => {
  const { container } = render(<PathLabel path="docs/beeld.png" emphasis="gone" />)

  expect(container.querySelector('[data-nt-path-tail]')).toHaveClass('line-through', 'text-muted')
})

test('without emphasis a path still takes the colour of its row', () => {
  const { container } = render(<PathLabel path="src/components/lezer.ts" />)

  expect(container.querySelector('[data-nt-path-head]')).not.toHaveClass('text-muted')
  expect(container.querySelector('[data-nt-path-tail]')).not.toHaveClass('text-fg')
})

test('cut from the start, the folder loses its beginning and the name stays whole', () => {
  // The head of a document: "…/checkouts/nt-agent" says more than
  // "/work/klanten/…/nt-agent" once the name is what the reader came for.
  const { container } = render(<PathLabel path={LONG} cut="start" />)
  const head = container.querySelector('[data-nt-path-head]') as HTMLElement
  // Right to left, so the ellipsis stands at the start; the text itself stays left to right, so
  // it still reads, copies and is spoken in its own order.
  expect(head.className).toContain('[direction:rtl]')
  expect(head.querySelector('bdi')?.getAttribute('dir')).toBe('ltr')
  expect(screen.getByText('/nt-agent').className).toContain('shrink-0')
  expect(container.textContent).toBe(LONG)
})
