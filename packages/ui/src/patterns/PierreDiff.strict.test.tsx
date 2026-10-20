import { render, waitFor, within } from '@testing-library/react'
import { StrictMode } from 'react'
import { expect, test } from 'vitest'
import { PierreDiff } from './PierreDiff'

/**
 * `PierreDiff` under `StrictMode`, the way `bun run dev` renders it, in a file of its own.
 *
 * Its own file because the bug it guards needs a highlighter that has never loaded: `@pierre/diffs`
 * keeps one per module, and Vitest gives every test file fresh modules. Under `StrictMode` React
 * mounts the block, cleans it up and mounts it again before the highlighter is ready; the library's
 * second instance then took the empty `<pre>` of the first for server-rendered HTML and never drew
 * a line — two empty blocks on the first expand of a file in the dev app.
 */

/** The shadow root `PatchDiff` draws into; see `PierreDiff.test.tsx` for why it is found this way. */
function shadowRootOf(container: HTMLElement): HTMLElement {
  const host = [...container.querySelectorAll<HTMLElement>('*')].find(
    (element) => element.shadowRoot !== null,
  )
  if (host?.shadowRoot == null) throw new Error('PatchDiff did not attach a shadow root')
  return host.shadowRoot as unknown as HTMLElement
}

test('draws its lines under StrictMode before the highlighter has ever loaded', async () => {
  const diff = ['@@ -0,0 +1,2 @@', '+export const first = 1', '+export const second = 2'].join('\n')
  const { container } = render(
    <StrictMode>
      <PierreDiff
        diff={diff}
        path="spel/src/main.ts"
        kind="add"
        view={{ style: 'stacked', wordWrap: false, ignoreWhitespace: false }}
        emptyLabel="niets"
      />
    </StrictMode>,
  )

  await waitFor(() => {
    expect(within(shadowRootOf(container)).getByText(/second/)).toBeTruthy()
  })
})
