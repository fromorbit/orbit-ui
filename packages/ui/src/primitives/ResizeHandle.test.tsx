import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { ResizeHandle, widthAfterDrag } from './ResizeHandle'

test('the arrow keys change the width by one step', async () => {
  const onValueChange = vi.fn()
  render(
    <ResizeHandle
      label="Paneelbreedte"
      value={360}
      min={320}
      max={640}
      onValueChange={onValueChange}
    />,
  )
  const handle = screen.getByRole('separator', { name: 'Paneelbreedte' })
  handle.focus()
  await userEvent.keyboard('{ArrowRight}')
  expect(onValueChange).toHaveBeenLastCalledWith(376)
  await userEvent.keyboard('{ArrowLeft}')
  expect(onValueChange).toHaveBeenLastCalledWith(344)
})

test('Home and End go to the bounds', async () => {
  const onValueChange = vi.fn()
  render(
    <ResizeHandle
      label="Paneelbreedte"
      value={360}
      min={320}
      max={640}
      onValueChange={onValueChange}
    />,
  )
  screen.getByRole('separator', { name: 'Paneelbreedte' }).focus()
  await userEvent.keyboard('{Home}')
  expect(onValueChange).toHaveBeenLastCalledWith(320)
  await userEvent.keyboard('{End}')
  expect(onValueChange).toHaveBeenLastCalledWith(640)
})

test('the value never leaves its bounds', async () => {
  const onValueChange = vi.fn()
  render(
    <ResizeHandle
      label="Paneelbreedte"
      value={330}
      min={320}
      max={640}
      step={16}
      onValueChange={onValueChange}
    />,
  )
  screen.getByRole('separator', { name: 'Paneelbreedte' }).focus()
  await userEvent.keyboard('{ArrowLeft}')
  expect(onValueChange).toHaveBeenLastCalledWith(320)
})

test('it says what it resizes and how wide that is', () => {
  render(
    <ResizeHandle
      label="Paneelbreedte"
      value={360}
      min={320}
      max={640}
      controls="right-panel"
      onValueChange={() => {}}
    />,
  )
  const handle = screen.getByRole('separator', { name: 'Paneelbreedte' })
  expect(handle).toHaveAttribute('aria-valuenow', '360')
  expect(handle).toHaveAttribute('aria-valuemin', '320')
  expect(handle).toHaveAttribute('aria-valuemax', '640')
  expect(handle).toHaveAttribute('aria-controls', 'right-panel')
})

test('a drag says when it starts and when it ends', () => {
  const onValueChange = vi.fn()
  const onDragChange = vi.fn()
  render(
    <ResizeHandle
      label="Paneelbreedte"
      value={360}
      min={320}
      max={640}
      onValueChange={onValueChange}
      onDragChange={onDragChange}
    />,
  )
  const handle = screen.getByRole('separator', { name: 'Paneelbreedte' })
  fireEvent.pointerDown(handle, { pointerId: 1, clientX: 100 })
  expect(onDragChange).toHaveBeenLastCalledWith(true)
  fireEvent.pointerMove(handle, { pointerId: 1, clientX: 140 })
  expect(onValueChange).toHaveBeenLastCalledWith(400)
  fireEvent.pointerUp(handle, { pointerId: 1, clientX: 140 })
  expect(onDragChange).toHaveBeenLastCalledWith(false)
})

test('a drag also reports where the pointer is, past the bounds too', () => {
  const onValueChange = vi.fn()
  const onDragMove = vi.fn()
  render(
    <ResizeHandle
      label="Paneelbreedte"
      value={360}
      min={320}
      max={640}
      onValueChange={onValueChange}
      onDragMove={onDragMove}
    />,
  )
  const handle = screen.getByRole('separator', { name: 'Paneelbreedte' })
  fireEvent.pointerDown(handle, { pointerId: 1, clientX: 100 })
  fireEvent.pointerMove(handle, { pointerId: 1, clientX: 20 })
  // The value stops at the bound; the pointer does not.
  expect(onValueChange).toHaveBeenLastCalledWith(320)
  expect(onDragMove).toHaveBeenLastCalledWith(280)
  fireEvent.pointerMove(handle, { pointerId: 1, clientX: 500 })
  expect(onValueChange).toHaveBeenLastCalledWith(640)
  expect(onDragMove).toHaveBeenLastCalledWith(760)
  fireEvent.pointerUp(handle, { pointerId: 1, clientX: 500 })
})

test('a key press says the new width is worth keeping', async () => {
  const onValueChange = vi.fn()
  const onCommit = vi.fn()
  render(
    <ResizeHandle
      label="Paneelbreedte"
      value={360}
      min={320}
      max={640}
      onValueChange={onValueChange}
      onCommit={onCommit}
    />,
  )
  screen.getByRole('separator', { name: 'Paneelbreedte' }).focus()

  await userEvent.keyboard('{ArrowRight}')
  // The value travels along: the caller stores it without waiting for the render that shows it.
  expect(onCommit).toHaveBeenCalledTimes(1)
  expect(onCommit).toHaveBeenLastCalledWith(376)

  await userEvent.keyboard('{Home}')
  expect(onCommit).toHaveBeenLastCalledWith(320)
  // A key the handle does not answer is not a change worth keeping either.
  await userEvent.keyboard('{Enter}')
  expect(onCommit).toHaveBeenCalledTimes(2)
})

test('a drag says nothing is worth keeping until it ends', () => {
  const onCommit = vi.fn()
  render(
    <ResizeHandle
      label="Paneelbreedte"
      value={360}
      min={320}
      max={640}
      onValueChange={() => {}}
      onCommit={onCommit}
    />,
  )
  const handle = screen.getByRole('separator', { name: 'Paneelbreedte' })
  fireEvent.pointerDown(handle, { pointerId: 1, clientX: 100 })
  fireEvent.pointerMove(handle, { pointerId: 1, clientX: 140 })
  fireEvent.pointerUp(handle, { pointerId: 1, clientX: 140 })
  // `onDragChange(false)` is the end of a drag; the caller reads the width it already collected.
  expect(onCommit, 'a drag commits through onDragChange, never per frame').not.toHaveBeenCalled()
})

test('a double click asks for the default width', async () => {
  const onReset = vi.fn()
  render(
    <ResizeHandle
      label="Paneelbreedte"
      value={360}
      min={320}
      max={640}
      onValueChange={() => {}}
      onReset={onReset}
    />,
  )
  await userEvent.dblClick(screen.getByRole('separator', { name: 'Paneelbreedte' }))
  expect(onReset).toHaveBeenCalledTimes(1)
})

test('widthAfterDrag clamps the start plus the pointer delta between its bounds', () => {
  expect(widthAfterDrag({ start: 360, dx: 40, min: 320, max: 640 })).toBe(400)
  expect(widthAfterDrag({ start: 330, dx: -50, min: 320, max: 640 })).toBe(320)
  expect(widthAfterDrag({ start: 600, dx: 100, min: 320, max: 640 })).toBe(640)
})
