import { useEffect, useState } from 'react'

/**
 * Whether `active` has held long enough to be worth showing.
 *
 * A placeholder that appears and disappears within a blink is worse than none at all: the eye
 * registers the flash, not the content. So anything that stands in for work in progress (a
 * `Skeleton` row, a busy line) asks here first, and a wait that turns out to be short is never
 * drawn at all. The moment `active` ends the answer is `false` again, without a second delay:
 * hiding is what the user was waiting for.
 *
 * @param delayMs how long `active` must hold; 150 ms, the upper bound of the interface's motion
 * range, so the threshold matches what already counts as "instant" in this interface.
 */
export function useDelayed(active: boolean, delayMs = 150): boolean {
  const [elapsed, setElapsed] = useState(false)

  useEffect(() => {
    if (!active) {
      setElapsed(false)
      return
    }
    const timer = setTimeout(() => setElapsed(true), delayMs)
    return () => clearTimeout(timer)
  }, [active, delayMs])

  // Not `elapsed` alone: the effect that resets it runs after the render in which `active` turned
  // false, and one frame of a stale `true` is exactly the flash this hook exists to prevent.
  return active && elapsed
}
