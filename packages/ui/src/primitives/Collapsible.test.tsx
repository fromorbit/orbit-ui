import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import { Collapsible } from './Collapsible'

/** The controlled caller every state of this component needs: it owns `open`. */
function Example({ initial = false }: { initial?: boolean }) {
  const [open, setOpen] = useState(initial)
  return (
    <Collapsible summary="6 stappen" open={open} onOpenChange={setOpen}>
      <p>De zes regels</p>
    </Collapsible>
  )
}

test('the summary is a button that says whether it is open', () => {
  render(
    <Collapsible summary="6 stappen" open={false} onOpenChange={() => {}}>
      <p>De zes regels</p>
    </Collapsible>,
  )
  const summary = screen.getByRole('button', { name: '6 stappen' })
  expect(summary).toHaveAttribute('aria-expanded', 'false')
  // No `aria-controls` while it is closed: the content is out of the document, and a reference to
  // an id that does not exist is exactly what axe calls an invalid attribute value.
  expect(summary).not.toHaveAttribute('aria-controls')
})

test('closed, the content is not in the document', () => {
  render(
    <Collapsible summary="6 stappen" open={false} onOpenChange={() => {}}>
      <p>De zes regels</p>
    </Collapsible>,
  )
  // Not merely invisible: a hidden subtree inside a log would still be read out.
  expect(screen.queryByText('De zes regels')).not.toBeInTheDocument()
})

test('open, the content sits in the region the button points at', () => {
  render(
    <Collapsible summary="6 stappen" open onOpenChange={() => {}}>
      <p>De zes regels</p>
    </Collapsible>,
  )
  const summary = screen.getByRole('button', { name: '6 stappen' })
  expect(summary).toHaveAttribute('aria-expanded', 'true')
  const content = document.getElementById(summary.getAttribute('aria-controls') ?? '')
  expect(content).toHaveTextContent('De zes regels')
})

test('a click asks the caller to toggle; the component does not decide itself', async () => {
  const onOpenChange = vi.fn()
  render(
    <Collapsible summary="6 stappen" open={false} onOpenChange={onOpenChange}>
      <p>De zes regels</p>
    </Collapsible>,
  )
  await userEvent.click(screen.getByRole('button', { name: '6 stappen' }))
  expect(onOpenChange).toHaveBeenCalledWith(true)
  // Controlled: nothing opened by itself, because the caller has not said so yet.
  expect(screen.queryByText('De zes regels')).not.toBeInTheDocument()
})

test('Enter and space toggle the content, as with any button', async () => {
  render(<Example />)
  const summary = screen.getByRole('button', { name: '6 stappen' })
  summary.focus()
  await userEvent.keyboard('{Enter}')
  expect(screen.getByText('De zes regels')).toBeInTheDocument()
  await userEvent.keyboard(' ')
  expect(screen.queryByText('De zes regels')).not.toBeInTheDocument()
})

test('the chevron is decorative and turns with a transform only', () => {
  const { container } = render(<Example initial />)
  const slot = container.querySelector('[data-nt-collapsible-chevron]')
  expect(slot?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  expect(slot?.className).toContain('group-data-[state=open]:rotate-90')
  expect(slot?.className).toContain('transition-transform')
  expect(slot?.className).toContain('duration-100')
  // Reduced motion: the chevron simply stands in its other position, without travelling there.
  expect(slot?.className).toContain('motion-reduce:transition-none')
})

test('without a chevron the summary alone is the button, and still says whether it is open', async () => {
  // The quiet lines of the timeline: the whole line is the
  // button, so a chevron in front of it only repeated what a click already does.
  function Bare() {
    const [open, setOpen] = useState(false)
    return (
      <Collapsible summary="6 stappen" chevron={false} open={open} onOpenChange={setOpen}>
        <p>De zes regels</p>
      </Collapsible>
    )
  }
  const { container } = render(<Bare />)
  expect(container.querySelector('[data-nt-collapsible-chevron]')).toBeNull()
  const summary = screen.getByRole('button', { name: '6 stappen' })
  expect(summary).toHaveAttribute('aria-expanded', 'false')
  summary.focus()
  await userEvent.keyboard('{Enter}')
  expect(summary).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByText('De zes regels')).toBeInTheDocument()
  await userEvent.keyboard(' ')
  expect(screen.queryByText('De zes regels')).not.toBeInTheDocument()
})

test('the content appears with a fade, never by growing in height', () => {
  render(
    <Collapsible summary="6 stappen" open onOpenChange={() => {}}>
      <p>De zes regels</p>
    </Collapsible>,
  )
  const summary = screen.getByRole('button', { name: '6 stappen' })
  const content = document.getElementById(summary.getAttribute('aria-controls') ?? '')
  expect(content?.className).toContain('nt-fade-in')
})

test('the row is 24px high, carries no-drag and the focus ring of every control', () => {
  render(<Example />)
  const className = screen.getByRole('button', { name: '6 stappen' }).className
  expect(className).toContain('h-6')
  expect(className).toContain('w-full')
  expect(className).toContain('no-drag')
  expect(className).toContain('outline-focus')
  expect(className).toContain('focus-visible:outline-2')
  expect(className).toContain('hover:bg-surface-hover')
  expect(className).toContain('rounded-sm')
})

test('without a summary there is no button, and the content simply stands there', () => {
  // The shape a caller needs while the thing being summarised is still a single item: no trigger,
  // but the content in the very same slot of the tree, so it survives the summary arriving.
  render(
    <Collapsible summary={null} open={false} onOpenChange={() => {}}>
      <p>De enige regel</p>
    </Collapsible>,
  )
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  // `open` has nothing to act on then: content with no way to unfold it would be unreachable.
  expect(screen.getByText('De enige regel')).toBeInTheDocument()
})

test('a ref reaches the native button of the summary', () => {
  const ref = { current: null as HTMLButtonElement | null }
  render(
    <Collapsible ref={ref} summary="6 stappen" open={false} onOpenChange={() => {}}>
      <p>De zes regels</p>
    </Collapsible>,
  )
  expect(ref.current).toBe(screen.getByRole('button', { name: '6 stappen' }))
})

test('a given className does not reach the DOM', () => {
  render(
    // @ts-expect-error className is not allowed; every summary row looks the same
    <Collapsible summary="6 stappen" open={false} onOpenChange={() => {}} className="rogue">
      <p>De zes regels</p>
    </Collapsible>,
  )
  expect(document.querySelector('.rogue')).toBeNull()
})

test('the focus ring stays inside the row it marks', () => {
  render(
    <Collapsible summary="6 stappen" open={false} onOpenChange={() => {}}>
      <p>De zes regels</p>
    </Collapsible>,
  )
  const summary = screen.getByRole('button', { name: '6 stappen' })
  // The summary spans the whole column. A ring drawn outside it would stand 2px past both edges of
  // every block in the conversation; drawn inside, it follows the same corners as the hover fill.
  // Only a keyboard shows it (`focus-visible`), never a click: Playwright measures that in
  // Orbit's end-to-end tests, since happy-dom has no notion of the heuristic.
  expect(summary.className).toContain('focus-visible:-outline-offset-2')
  expect(summary.className.split(' ')).not.toContain('focus-visible:outline-offset-2')
  expect(summary.className.split(' ')).not.toContain('focus:outline-2')
  expect(summary.className).toContain('rounded-sm')
})

/** Ten steps, half of them open. */
const STEPS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

test('mounting reads no style or layout, open or closed', () => {
  // A conversation mounts one of these per block of tool calls and per folded turn, all in one
  // commit when a chat opens. Each read of computed style or geometry in between DOM writes forces
  // the browser to recalculate there and then: with Radix's content (its Presence and its height
  // measurement) that was two forced recalculations per row, the largest cost of opening a chat
  // after markdown itself.
  const styles = vi.spyOn(window, 'getComputedStyle')
  const rects = vi.spyOn(Element.prototype, 'getBoundingClientRect')
  render(
    <>
      {STEPS.map((index) => (
        <Collapsible
          key={`stap ${index}`}
          summary={`stap ${index}`}
          open={index % 2 === 0}
          onOpenChange={() => {}}
        >
          <p>regel {index}</p>
        </Collapsible>
      ))}
    </>,
  )
  // Counted before any query: finding a role reads computed style itself.
  const styleReads = styles.mock.calls.length
  const rectReads = rects.mock.calls.length
  styles.mockRestore()
  rects.mockRestore()
  expect(screen.getAllByRole('button')).toHaveLength(10)
  expect(styleReads).toBe(0)
  expect(rectReads).toBe(0)
})

test('content open from the start does not fade in; content opened later does', async () => {
  // As Radix did: what stands open when the conversation mounts is simply there, and only what the
  // reader unfolds fades in.
  render(<Example initial />)
  const summary = screen.getByRole('button', { name: '6 stappen' })
  const first = document.getElementById(summary.getAttribute('aria-controls') ?? '')
  expect(first?.style.animationName).toBe('none')
  await userEvent.click(summary)
  await userEvent.click(summary)
  const again = document.getElementById(summary.getAttribute('aria-controls') ?? '')
  expect(again?.className).toContain('nt-fade-in')
  expect(again?.style.animationName).toBe('')
})
