import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { useDelayed } from './use-delayed'

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

/** Lets the timers run for `ms`, with the re-render that follows flushed inside `act`. */
async function wait(ms: number): Promise<void> {
  await act(async () => {
    vi.advanceTimersByTime(ms)
  })
}

test('a short wait never shows: within 150 ms the answer stays false', async () => {
  const { result } = renderHook(() => useDelayed(true))
  expect(result.current).toBe(false)
  await wait(149)
  expect(result.current).toBe(false)
})

test('when it takes longer, the answer becomes true', async () => {
  const { result } = renderHook(() => useDelayed(true))
  await wait(150)
  expect(result.current).toBe(true)
})

test('when the wait ends earlier, nothing flashes: the answer stays false', async () => {
  const { result, rerender } = renderHook(({ active }) => useDelayed(active), {
    initialProps: { active: true },
  })
  await wait(100)
  rerender({ active: false })
  await wait(1000)
  expect(result.current).toBe(false)
})

test('afterwards the answer falls back to false', async () => {
  const { result, rerender } = renderHook(({ active }) => useDelayed(active), {
    initialProps: { active: true },
  })
  await wait(150)
  expect(result.current).toBe(true)
  rerender({ active: false })
  expect(result.current).toBe(false)
})

test('the wait is configurable', async () => {
  const { result } = renderHook(() => useDelayed(true, 500))
  await wait(150)
  expect(result.current).toBe(false)
  await wait(350)
  expect(result.current).toBe(true)
})
