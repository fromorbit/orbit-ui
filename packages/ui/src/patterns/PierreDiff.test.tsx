import { act, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { PierreDiff, PierreFile } from './PierreDiff'

const stackedView = { style: 'stacked' as const, wordWrap: false, ignoreWhitespace: false }

/**
 * `PatchDiff` draws into a shadow root of its own, so its *content* cannot be reached with
 * `getByText` the way our own components can — the patch summary in the plan says why. This walks
 * the rendered tree for the one element that carries a shadow root, without naming the library's
 * own tag: a version bump that renames it should not also break this.
 *
 * Cast to `HTMLElement`: `within()` only needs the query methods a `ShadowRoot` really has
 * (`querySelector` and friends), not the rest of the interface TypeScript asks for.
 */
function shadowRootOf(container: HTMLElement): HTMLElement {
  const host = [...container.querySelectorAll<HTMLElement>('*')].find(
    (element) => element.shadowRoot !== null,
  )
  if (host?.shadowRoot == null) throw new Error('PatchDiff did not attach a shadow root')
  return host.shadowRoot as unknown as HTMLElement
}

test('renders a patch that carries no headers of its own', async () => {
  const diff = ['@@ -1,1 +1,1 @@', '-old', '+new'].join('\n')
  const { container } = render(
    <PierreDiff
      diff={diff}
      path="src/greet.ts"
      kind="modify"
      view={stackedView}
      emptyLabel="niets"
    />,
  )

  // Syntax highlighting resolves asynchronously; the assertion waits for it rather than assuming
  // the first render already carries it — see the finding in Afwijkingen.
  await waitFor(() => {
    expect(within(shadowRootOf(container)).getByText('new')).toBeTruthy()
  })
})

test('draws no file header of its own', async () => {
  // The row above the diff already names the file and carries its counters; a second header
  // inside the block would say the same thing twice, one line apart.
  const diff = ['@@ -1,1 +1,1 @@', '-old', '+new'].join('\n')
  const { container } = render(
    <PierreDiff
      diff={diff}
      path="src/greet.ts"
      kind="modify"
      view={stackedView}
      emptyLabel="niets"
    />,
  )

  await waitFor(() => {
    expect(within(shadowRootOf(container)).getByText('new')).toBeTruthy()
  })
  expect(shadowRootOf(container).querySelector('[data-diffs-header]')).toBeNull()
})

test('follows the theme of the app, live', async () => {
  const diff = ['@@ -1,1 +1,1 @@', '-old', '+new'].join('\n')
  document.documentElement.dataset.theme = 'light'
  try {
    const { container } = render(
      <PierreDiff diff={diff} path="src/greet.ts" kind="modify" view={stackedView} emptyLabel="" />,
    )
    const block = screen.getByRole('group', { name: 'src/greet.ts' })
    expect(block.style.colorScheme).toBe('light')
    await waitFor(() => {
      expect(shadowRootOf(container).innerHTML).toMatch(/color-scheme:\s*light/)
    })
    await act(async () => {
      document.documentElement.dataset.theme = 'dark'
      await Promise.resolve()
    })
    expect(block.style.colorScheme).toBe('dark')
    await waitFor(() => {
      expect(shadowRootOf(container).innerHTML).toMatch(/color-scheme:\s*dark/)
    })
  } finally {
    delete document.documentElement.dataset.theme
  }
})

test('names the block after the file it belongs to', () => {
  const diff = ['@@ -1,1 +1,1 @@', '-old', '+new'].join('\n')
  render(
    <PierreDiff
      diff={diff}
      path="src/greet.ts"
      kind="modify"
      view={stackedView}
      emptyLabel="niets"
    />,
  )

  expect(screen.getByRole('group', { name: 'src/greet.ts' })).toBeInTheDocument()
})

test('the scrollable block can be reached by keyboard', () => {
  const diff = ['@@ -1,1 +1,1 @@', '-old', '+new'].join('\n')
  render(
    <PierreDiff
      diff={diff}
      path="src/greet.ts"
      kind="modify"
      view={stackedView}
      emptyLabel="niets"
    />,
  )

  expect(screen.getByRole('group', { name: 'src/greet.ts' })).toHaveProperty('tabIndex', 0)
})

test('the focusable block is the one that scrolls sideways', () => {
  // A tab stop that cannot scroll is a dead stop: `scrollable-region-focusable` wants the focused
  // rectangle itself to reach the overflow, and the focus ring is the app's accent, not the UA's.
  const diff = ['@@ -1,1 +1,1 @@', '-old', '+new'].join('\n')
  render(
    <PierreDiff
      diff={diff}
      path="src/greet.ts"
      kind="modify"
      view={stackedView}
      emptyLabel="niets"
    />,
  )

  expect(screen.getByRole('group', { name: 'src/greet.ts' })).toHaveClass(
    'overflow-x-auto',
    'outline-focus',
    'focus-visible:outline-2',
    'focus-visible:-outline-offset-2',
  )
})

test('a reader who ignores whitespace sees the trimmed patch', () => {
  // Every change in this diff is whitespace-only, so ignoring it trims the patch to nothing.
  const wholeDiffIsWhitespace = [
    '@@ -1,1 +1,1 @@',
    '-  return greeting',
    '+    return greeting',
  ].join('\n')

  const { rerender } = render(
    <PierreDiff
      diff={wholeDiffIsWhitespace}
      path="src/greet.ts"
      kind="modify"
      view={{ ...stackedView, ignoreWhitespace: false }}
      emptyLabel="niets zichtbaar"
    />,
  )
  expect(screen.queryByText('niets zichtbaar')).not.toBeInTheDocument()

  rerender(
    <PierreDiff
      diff={wholeDiffIsWhitespace}
      path="src/greet.ts"
      kind="modify"
      view={{ ...stackedView, ignoreWhitespace: true }}
      emptyLabel="niets zichtbaar"
    />,
  )
  expect(screen.getByText('niets zichtbaar')).toBeInTheDocument()
})

test("a change without a diff says so in the caller's words", () => {
  render(
    <PierreDiff
      diff=""
      path="src/greet.ts"
      kind="modify"
      view={stackedView}
      emptyLabel="geen wijziging zichtbaar"
    />,
  )

  expect(screen.getByText('geen wijziging zichtbaar')).toBeInTheDocument()
})

test('a file in a language we do not bundle still renders', async () => {
  const diff = ['@@ -1,1 +1,1 @@', '-old', '+new'].join('\n')
  const { container } = render(
    <PierreDiff
      diff={diff}
      path="src/greet.zzz"
      kind="modify"
      view={stackedView}
      emptyLabel="niets"
    />,
  )

  await waitFor(() => {
    expect(within(shadowRootOf(container)).getByText('new')).toBeTruthy()
  })
})

test('a selectable diff draws its note under the selection', async () => {
  const diff = ['@@ -1,2 +1,2 @@', ' same', '-old', '+new'].join('\n')
  const value = {
    side: 'new' as const,
    from: 1,
    to: 2,
    lines: ['same', 'new'],
    last: { lineNumber: 2, side: 'additions' as const },
    range: { start: 1, side: 'additions' as const, end: 2, endSide: 'additions' as const },
  }
  const { rerender } = render(
    <PierreDiff
      diff={diff}
      path="src/greet.ts"
      kind="modify"
      view={stackedView}
      emptyLabel="niets"
      selection={{ value, onChange() {}, note: <p>notitievak</p> }}
    />,
  )
  // The note is ours, slotted into the library's shadow root, so it stays in reach of a query.
  await waitFor(() => expect(screen.getByText('notitievak')).toBeInTheDocument())

  rerender(
    <PierreDiff
      diff={diff}
      path="src/greet.ts"
      kind="modify"
      view={stackedView}
      emptyLabel="niets"
      selection={{ value: null, onChange() {}, note: <p>notitievak</p> }}
    />,
  )
  expect(screen.queryByText('notitievak')).toBeNull()
})

describe('PierreFile', () => {
  const source = ['export function totaal(): number {', '  return 42', '}', ''].join('\n')

  test('a file is drawn read-only with line numbers', async () => {
    const { container } = render(<PierreFile text={source} path="src/winkelmand/totaal.ts" />)
    expect(screen.getByRole('group', { name: 'src/winkelmand/totaal.ts' })).toHaveAttribute(
      'tabindex',
      '0',
    )
    await waitFor(() => {
      expect(within(shadowRootOf(container)).getByText('42')).toBeTruthy()
    })
    const root = shadowRootOf(container)
    expect(within(root).getAllByText('3').length).toBeGreaterThan(0)
    expect(root.querySelector('[contenteditable="true"]')).toBeNull()
  })

  test('the given line is marked and scrolled into view within the file itself', async () => {
    const scrolled: { element: Element; top: number | undefined }[] = []
    const original = HTMLElement.prototype.scrollTo
    const intoView = Element.prototype.scrollIntoView
    let ancestorsScrolled = 0
    HTMLElement.prototype.scrollTo = function (
      this: HTMLElement,
      options?: ScrollToOptions | number,
    ) {
      scrolled.push({ element: this, top: typeof options === 'object' ? options.top : undefined })
    } as typeof HTMLElement.prototype.scrollTo
    Element.prototype.scrollIntoView = () => {
      ancestorsScrolled += 1
    }
    try {
      const { container } = render(
        <PierreFile text={source} path="src/winkelmand/totaal.ts" line={2} />,
      )
      await waitFor(() => {
        expect(shadowRootOf(container).querySelector('[data-selected-line]')).not.toBeNull()
      })
      await waitFor(() => expect(scrolled.length).toBeGreaterThan(0))
      expect(scrolled[0]?.element).toBe(
        screen.getByRole('group', { name: 'src/winkelmand/totaal.ts' }),
      )
      expect(scrolled[0]?.top).toBeTypeOf('number')
      expect(ancestorsScrolled, 'no ancestor of the file scrolls along').toBe(0)
    } finally {
      HTMLElement.prototype.scrollTo = original
      Element.prototype.scrollIntoView = intoView
    }
  })

  test('without wrap a long line scrolls sideways, as in the file tab', async () => {
    const { container } = render(<PierreFile text={source} path="src/winkelmand/totaal.ts" />)
    await waitFor(() => {
      expect(shadowRootOf(container).querySelector('[data-overflow="scroll"]')).not.toBeNull()
    })
  })

  test('with wrap a long line wraps', async () => {
    const { container } = render(<PierreFile text={source} path="src/winkelmand/totaal.ts" wrap />)
    await waitFor(() => {
      expect(shadowRootOf(container).querySelector('[data-overflow="wrap"]')).not.toBeNull()
    })
    expect(shadowRootOf(container).querySelector('[data-overflow="scroll"]')).toBeNull()
  })

  test('with autoFocus the file takes the focus once drawn, unless the reader went elsewhere', async () => {
    const { container, unmount } = render(
      <PierreFile text={source} path="src/winkelmand/totaal.ts" autoFocus />,
    )
    const file = screen.getByRole('group', { name: 'src/winkelmand/totaal.ts' })
    await waitFor(() => expect(file).toHaveFocus())
    expect(shadowRootOf(container)).toBeTruthy()
    unmount()

    const elsewhere = document.createElement('button')
    document.body.append(elsewhere)
    elsewhere.focus()
    render(<PierreFile text={source} path="src/winkelmand/totaal.ts" autoFocus />)
    await waitFor(() =>
      expect(screen.getByRole('group', { name: 'src/winkelmand/totaal.ts' })).toBeInTheDocument(),
    )
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(elsewhere).toHaveFocus()
    elsewhere.remove()
  })

  test.each([
    ['src/main/java/org/voorbeeld/winkel/Kassa.java', 'public class Kassa {}\n', 'public'],
    ['src/main/kotlin/Kassa.kt', 'class Kassa(val naam: String)\n', 'class'],
    ['build.gradle', "plugins { id 'java' }\n", "'java'"],
    ['build.gradle.kts', 'plugins { java }\nval versie = "1.0"\n', 'val'],
    ['app/Http/Controllers/WinkelController.php', '<?php\nclass WinkelController {}\n', 'class'],
    ['resources/views/winkel.blade.php', '@if ($open)\n<p>Open</p>\n@endif\n', '@if'],
    ['artisan', '<?php\nclass Kassa {}\n', 'class'],
    ['.env.example', 'APP_NAME=Winkel\n', 'APP_NAME'],
    ['phpunit.xml', '<phpunit colors="true"/>\n', 'phpunit'],
    ['Dockerfile', 'FROM php:8.3-fpm\n', 'FROM'],
    ['docker/Dockerfile.prod', 'FROM php:8.3-fpm\n', 'FROM'],
    ['docker-compose.yml', 'services:\n  app:\n    image: winkel\n', 'services'],
  ])('%s is drawn with the colours of its language', async (path, text, keyword) => {
    const { container } = render(<PierreFile text={text} path={path} />)
    // A token of its own with a colour: a plain-text file draws the whole line as one span.
    await waitFor(() => {
      const token = within(shadowRootOf(container)).getByText(keyword, { exact: true })
      expect(token.getAttribute('style') ?? '').toMatch(/--diffs-token-dark:/)
    })
  })

  test('an unknown language falls back to plain text', async () => {
    const { container } = render(
      <PierreFile text={'regel een\nregel twee\n'} path="notities.onbekend" />,
    )
    await waitFor(() => {
      expect(within(shadowRootOf(container)).getByText(/regel twee/)).toBeTruthy()
    })
  })
})
