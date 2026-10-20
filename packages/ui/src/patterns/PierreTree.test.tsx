import { FileTree } from '@pierre/trees'
import { act, render, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { nl } from '../testing/labels'
import { PierreTree, type PierreTreeHandle } from './PierreTree'

const entries = [
  { path: 'src/greet.ts', status: 'modified' as const },
  { path: 'src/utils/format.ts', status: 'added' as const },
]

/**
 * `FileTree` draws into a shadow root of its own, so its rows cannot be reached with `getByRole`
 * at the light-DOM level — this walks the rendered tree for the one element that carries a shadow
 * root, without naming the library's own custom element tag.
 */
function shadowRootOf(container: HTMLElement): HTMLElement {
  const host = [...container.querySelectorAll<HTMLElement>('*')].find(
    (element) => element.shadowRoot !== null,
  )
  if (host?.shadowRoot == null) throw new Error('FileTree did not attach a shadow root')
  return host.shadowRoot as unknown as HTMLElement
}

test('groups the files it was given by folder', () => {
  const { container } = render(
    <PierreTree entries={entries} onSelect={() => {}} label="Bestanden van deze chat" />,
  )

  const shadow = shadowRootOf(container)
  expect(within(shadow).getByRole('treeitem', { name: 'src' })).toBeInTheDocument()
  expect(within(shadow).getByRole('treeitem', { name: 'utils' })).toBeInTheDocument()
  expect(within(shadow).getByRole('treeitem', { name: 'greet.ts' })).toBeInTheDocument()
  expect(within(shadow).getByRole('treeitem', { name: 'format.ts' })).toBeInTheDocument()
})

test('reports the path of the row that was picked', async () => {
  const onSelect = vi.fn()
  const { container } = render(
    <PierreTree entries={entries} onSelect={onSelect} label="Bestanden van deze chat" />,
  )

  const shadow = shadowRootOf(container)
  const row = within(shadow).getByRole('treeitem', { name: 'greet.ts' })
  await userEvent.click(row)

  expect(onSelect).toHaveBeenCalledWith('src/greet.ts')
})

test('carries the name it was given', () => {
  const { container } = render(
    <PierreTree entries={entries} onSelect={() => {}} label="Bestanden van deze chat" />,
  )

  const host = [...container.querySelectorAll<HTMLElement>('*')].find(
    (element) => element.shadowRoot !== null,
  )
  expect(host).toHaveAttribute('aria-label', 'Bestanden van deze chat')
})

test('takes the colour scheme of the app, live, for the colours we leave to the library', async () => {
  document.documentElement.dataset.theme = 'light'
  try {
    const { container } = render(
      <PierreTree entries={entries} onSelect={() => {}} label="Bestanden van deze chat" />,
    )
    const host = [...container.querySelectorAll<HTMLElement>('*')].find(
      (element) => element.shadowRoot !== null,
    )
    expect(host?.style.colorScheme).toBe('light')
    await act(async () => {
      document.documentElement.dataset.theme = 'dark'
      await Promise.resolve()
    })
    expect(host?.style.colorScheme).toBe('dark')
  } finally {
    delete document.documentElement.dataset.theme
  }
})

test('marks each row with the status it was given', () => {
  const { container } = render(
    <PierreTree entries={entries} onSelect={() => {}} label="Bestanden van deze chat" />,
  )

  // The status is what colours the row, and it only lands when the paths are relative — an
  // absolute one leaves every row grey without an error anywhere (see `PierreTreeEntry`).
  const shadow = shadowRootOf(container)
  expect(within(shadow).getByRole('treeitem', { name: /greet\.ts/ })).toHaveAttribute(
    'data-item-git-status',
    'modified',
  )
  expect(within(shadow).getByRole('treeitem', { name: /format\.ts/ })).toHaveAttribute(
    'data-item-git-status',
    'added',
  )
})

test('stands as tall as the rows it shows', () => {
  const { container } = render(
    <PierreTree entries={entries} onSelect={() => {}} label="Bestanden van deze chat" />,
  )

  // `FileTree` always virtualizes, and a virtualized host is `height: 100%` — inside a box that
  // sizes to its content that resolves to nothing at all, which is a tree nobody can see. Four
  // rows here: `src`, `greet.ts`, `utils` and `format.ts`.
  const host = [...container.querySelectorAll<HTMLElement>('*')].find(
    (element) => element.shadowRoot !== null,
  )
  expect(host).toHaveStyle({ height: '96px' })
})

test('the rows can be walked with the keyboard', async () => {
  const { container } = render(
    <PierreTree entries={entries} onSelect={() => {}} label="Bestanden van deze chat" />,
  )

  const shadow = shadowRootOf(container)
  const format = within(shadow).getByRole('treeitem', { name: 'format.ts' })
  format.focus()
  await userEvent.keyboard('{ArrowUp}')

  const utils = within(shadow).getByRole('treeitem', { name: 'utils' })
  expect(utils).toHaveAttribute('tabindex', '0')
})

test('draws as before without the new props', () => {
  const { container } = render(
    <PierreTree entries={entries} onSelect={() => {}} label="Bestanden van deze chat" />,
  )

  const host = [...container.querySelectorAll<HTMLElement>('*')].find(
    (element) => element.shadowRoot !== null,
  )
  // Unchanged: every row measured, everything expanded, as Wijzigingen has always seen it.
  expect(host).toHaveStyle({ height: '96px' })
  const shadow = shadowRootOf(container)
  expect(within(shadow).getByRole('treeitem', { name: 'greet.ts' })).toBeInTheDocument()
})

test('fills its parent instead of measuring its rows when asked to', () => {
  const { container } = render(
    <PierreTree entries={entries} onSelect={() => {}} label="Bestanden van deze chat" fill />,
  )

  const host = [...container.querySelectorAll<HTMLElement>('*')].find(
    (element) => element.shadowRoot !== null,
  )
  // No inline height computed from the row count: the parent decides how tall this stands.
  expect(host?.style.height).toBe('')
})

test('starts with only the top level visible when collapsed', () => {
  const { container } = render(
    <PierreTree
      entries={entries}
      onSelect={() => {}}
      label="Bestanden van deze chat"
      expansion="closed"
    />,
  )

  const shadow = shadowRootOf(container)
  expect(within(shadow).getByRole('treeitem', { name: 'src' })).toBeInTheDocument()
  expect(within(shadow).queryByRole('treeitem', { name: 'greet.ts' })).not.toBeInTheDocument()
})

test('reports opening a folder whose contents are not loaded', async () => {
  const onOpenFolder = vi.fn()
  const notLoaded = [{ path: 'other', kind: 'dir' as const }]
  const { container } = render(
    <PierreTree
      entries={notLoaded}
      onSelect={() => {}}
      label="Bestanden van deze chat"
      expansion="closed"
      onOpenFolder={onOpenFolder}
    />,
  )

  const shadow = shadowRootOf(container)
  const row = within(shadow).getByRole('treeitem', { name: 'other' })
  row.focus()
  await userEvent.keyboard('{ArrowRight}')

  expect(onOpenFolder).toHaveBeenCalledWith('other')
})

test('starts with folders already open from initialExpandedPaths', () => {
  const nested = [{ path: 'src/greet.ts' }, { path: 'src/utils/format.ts' }]
  const { container } = render(
    <PierreTree
      entries={nested}
      onSelect={() => {}}
      label="Bestanden van deze chat"
      expansion="closed"
      initialExpandedPaths={['src', 'src/utils']}
    />,
  )

  const shadow = shadowRootOf(container)
  expect(within(shadow).getByRole('treeitem', { name: 'greet.ts' })).toBeInTheDocument()
  expect(within(shadow).getByRole('treeitem', { name: 'format.ts' })).toBeInTheDocument()
})

test('reports the open folders whenever they change', async () => {
  const onExpansionChange = vi.fn()
  const nested = [{ path: 'src/greet.ts' }]
  const { container } = render(
    <PierreTree
      entries={nested}
      onSelect={() => {}}
      label="Bestanden van deze chat"
      expansion="closed"
      onExpansionChange={onExpansionChange}
    />,
  )

  const shadow = shadowRootOf(container)
  onExpansionChange.mockClear()
  const src = within(shadow).getByRole('treeitem', { name: 'src' })
  src.focus()
  await userEvent.keyboard('{ArrowRight}')

  expect(onExpansionChange).toHaveBeenLastCalledWith(['src'])
})

test('keeps open folders open when paths are added', async () => {
  const start = [{ path: 'src/greet.ts', status: 'modified' as const }]
  const { container, rerender } = render(
    <PierreTree
      entries={start}
      onSelect={() => {}}
      label="Bestanden van deze chat"
      expansion="closed"
    />,
  )

  const shadow = shadowRootOf(container)
  const src = within(shadow).getByRole('treeitem', { name: 'src' })
  src.focus()
  await userEvent.keyboard('{ArrowRight}')
  expect(within(shadow).getByRole('treeitem', { name: 'greet.ts' })).toBeInTheDocument()

  const grown = [
    ...start,
    { path: 'src/utils/format.ts', status: 'added' as const },
    { path: 'README.md', status: 'modified' as const },
  ]
  rerender(
    <PierreTree
      entries={grown}
      onSelect={() => {}}
      label="Bestanden van deze chat"
      expansion="closed"
    />,
  )

  // Still expanded after paths grew: no collapse back to only the top level.
  expect(within(shadow).getByRole('treeitem', { name: 'greet.ts' })).toBeInTheDocument()
  expect(within(shadow).queryByRole('treeitem', { name: 'format.ts' })).not.toBeInTheDocument()
})

test('getFocusedPath names the row a click landed on', async () => {
  const ref = createRef<PierreTreeHandle>()
  const { container } = render(
    <PierreTree ref={ref} entries={entries} onSelect={() => {}} label="Bestanden van deze chat" />,
  )
  const shadow = shadowRootOf(container)

  await userEvent.click(within(shadow).getByRole('treeitem', { name: 'greet.ts' }))
  expect(ref.current?.getFocusedPath()).toBe('src/greet.ts')
})

describe('filter', () => {
  const workdir = [
    { path: 'src/app.ts' },
    { path: 'src/winkelmand/totaal.ts' },
    { path: 'README.md' },
    { path: 'docs/gids.md' },
  ]

  /** A tree of `workdir`, closed, with `src` opened by hand so there is a stand to restore. */
  async function openTree(filter = '', extra: Partial<Parameters<typeof PierreTree>[0]> = {}) {
    const props = {
      entries: workdir,
      onSelect: () => {},
      label: 'Bestanden van deze chat',
      expansion: 'closed' as const,
      filter,
      ...extra,
    }
    const view = render(<PierreTree {...props} />)
    const shadow = shadowRootOf(view.container)
    return { ...view, shadow, props }
  }

  test('narrows the tree to the paths that match and opens their folders', async () => {
    const { shadow } = await openTree('totaal')
    expect(within(shadow).getByRole('treeitem', { name: 'totaal.ts' })).toBeInTheDocument()
    expect(within(shadow).queryByRole('treeitem', { name: 'README.md' })).toBeNull()
    expect(within(shadow).queryByRole('treeitem', { name: 'app.ts' })).toBeNull()
  })

  test('matches a part of the path without regard to case', async () => {
    const { shadow } = await openTree('WINKELMAND/TO')
    expect(within(shadow).getByRole('treeitem', { name: 'totaal.ts' })).toBeInTheDocument()
    expect(within(shadow).queryByRole('treeitem', { name: 'gids.md' })).toBeNull()
  })

  test('clearing the filter restores the folders that were open', async () => {
    const { shadow, rerender, props } = await openTree('')
    within(shadow).getByRole('treeitem', { name: 'docs' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(within(shadow).getByRole('treeitem', { name: 'gids.md' })).toBeInTheDocument()

    rerender(<PierreTree {...props} filter="totaal" />)
    await waitFor(() =>
      expect(within(shadow).queryByRole('treeitem', { name: 'gids.md' })).toBeNull(),
    )

    rerender(<PierreTree {...props} filter="" />)
    // `docs` open again as before, `src` shut again as before.
    await waitFor(() =>
      expect(within(shadow).getByRole('treeitem', { name: 'gids.md' })).toBeInTheDocument(),
    )
    expect(within(shadow).queryByRole('treeitem', { name: 'app.ts' })).toBeNull()
  })

  test('reports the paths that match, and none for a filter that matches nothing', async () => {
    const onFilterMatches = vi.fn()
    const { rerender, props } = await openTree('', { onFilterMatches })
    rerender(<PierreTree {...props} onFilterMatches={onFilterMatches} filter="gids" />)
    expect(onFilterMatches).toHaveBeenLastCalledWith(['docs/gids.md'])
    rerender(<PierreTree {...props} onFilterMatches={onFilterMatches} filter="zzz" />)
    expect(onFilterMatches).toHaveBeenLastCalledWith([])
  })

  test('narrows paths that arrive while a filter stands', async () => {
    const { shadow, rerender, props } = await openTree('korting')
    rerender(
      <PierreTree
        {...props}
        entries={[...workdir, { path: 'src/winkelmand/korting.ts' }]}
        filter="korting"
      />,
    )
    await waitFor(() =>
      expect(within(shadow).getByRole('treeitem', { name: 'korting.ts' })).toBeInTheDocument(),
    )
    expect(within(shadow).queryByRole('treeitem', { name: 'README.md' })).toBeNull()
  })

  test('never takes the folders a filter opens for folders the reader opened', async () => {
    const onOpenFolder = vi.fn()
    const onExpansionChange = vi.fn()
    const unloaded = [{ path: 'src/app.ts' }, { path: 'winkelmand', kind: 'dir' as const }]
    const { rerender, props } = await openTree('', {
      entries: unloaded,
      onOpenFolder,
      onExpansionChange,
    })
    onExpansionChange.mockClear()
    rerender(<PierreTree {...props} filter="winkel" />)
    rerender(<PierreTree {...props} filter="app" />)
    expect(onOpenFolder).not.toHaveBeenCalled()
    expect(onExpansionChange).not.toHaveBeenCalled()
  })

  test('focusFirst puts the focus on the first row that shows', async () => {
    const ref = createRef<PierreTreeHandle>()
    const { container } = render(
      <PierreTree
        ref={ref}
        entries={workdir}
        onSelect={() => {}}
        label="Bestanden van deze chat"
        expansion="closed"
        filter="gids"
      />,
    )
    shadowRootOf(container)
    act(() => ref.current?.focusFirst())
    expect(ref.current?.getFocusedPath()).toBe('docs/')
    expect(ref.current?.isFirstFocused()).toBe(true)
  })

  test('firstMatch names the first matching file, not a folder above it', async () => {
    const ref = createRef<PierreTreeHandle>()
    const { container } = render(
      <PierreTree
        ref={ref}
        entries={workdir}
        onSelect={() => {}}
        label="Bestanden van deze chat"
        expansion="closed"
        filter="winkelmand"
      />,
    )
    shadowRootOf(container)
    expect(ref.current?.firstMatch()).toBe('src/winkelmand/totaal.ts')
  })

  // The library treats a search as its own open search field: Escape and Enter on a row would
  // close it, and the tree would show everything while the tab's field still holds the text.
  test.each(['{Escape}', '{Enter}'])('keeps the filter after %s on a row', async (key) => {
    const onSelect = vi.fn()
    const { shadow } = await openTree('totaal', { onSelect })
    within(shadow).getByRole('treeitem', { name: 'totaal.ts' }).focus()
    await userEvent.keyboard(key)
    await waitFor(() =>
      expect(within(shadow).getByRole('treeitem', { name: 'totaal.ts' })).toBeInTheDocument(),
    )
    expect(within(shadow).queryByRole('treeitem', { name: 'README.md' })).toBeNull()
    // Enter still chooses the row it stands on.
    if (key === '{Enter}') expect(onSelect).toHaveBeenCalled()
  })
})

test('builds the model again only when the paths change', () => {
  const reset = vi.spyOn(FileTree.prototype, 'resetPaths')
  try {
    const { rerender } = render(
      <PierreTree entries={entries} onSelect={() => {}} label="Bestanden van deze chat" />,
    )
    const before = reset.mock.calls.length
    // The same paths in a new array, as a refresh with nothing new hands them over.
    rerender(
      <PierreTree
        entries={entries.map((entry) => ({ ...entry }))}
        onSelect={() => {}}
        label="Bestanden van deze chat"
      />,
    )
    expect(reset.mock.calls.length).toBe(before)
    rerender(
      <PierreTree
        entries={[...entries, { path: 'README.md', status: 'added' as const }]}
        onSelect={() => {}}
        label="Bestanden van deze chat"
      />,
    )
    expect(reset.mock.calls.length).toBe(before + 1)
  } finally {
    reset.mockRestore()
  }
})

/** The mark drawn at the right of a row of the tab Bestanden, or `null` when it has none. */
function markOf(row: HTMLElement): HTMLElement | null {
  return row.querySelector<HTMLElement>('[data-item-section="decoration"] > span')
}

test('marks a changed, a staged and a new file with M, A and U, the word as tooltip', () => {
  const withMarks = [{ path: 'src/app.ts' }, { path: 'src/staged.ts' }, { path: 'notities.md' }]
  const statuses = [
    { path: 'src/app.ts', mark: 'modified' as const },
    { path: 'src/staged.ts', mark: 'added' as const },
    { path: 'notities.md', mark: 'new' as const },
  ]
  const { container } = render(
    <PierreTree
      entries={withMarks}
      onSelect={() => {}}
      label="Bestanden van deze chat"
      markLabels={nl.treeMarks}
      statuses={statuses}
    />,
  )

  const shadow = shadowRootOf(container)
  const cases = [
    ['app.ts', 'modified', 'M', 'Gewijzigd'],
    ['staged.ts', 'added', 'A', 'Toegevoegd'],
    ['notities.md', 'untracked', 'U', 'Nieuw'],
  ] as const
  for (const [name, status, letter, word] of cases) {
    const row = within(shadow).getByRole('treeitem', { name })
    // The status colours the name through the library's own token for it.
    expect(row, name).toHaveAttribute('data-item-git-status', status)
    expect(markOf(row), name).toHaveTextContent(letter)
    expect(markOf(row), name).toHaveAttribute('title', word)
  }
  // That the library's own lane, with its fixed English tooltips, is hidden is CSS inside the
  // shadow root: Orbit's end-to-end tests prove it in a real browser.
})

test('a folder with a changed file below it carries a dot, loaded or not', () => {
  // `src` is a leaf `dir` entry, its own contents not loaded, yet the mark still names
  // a path below it: the dot comes from the marked paths themselves, not from what is loaded.
  const notLoaded = [{ path: 'src', kind: 'dir' as const }]
  const statuses = [{ path: 'src/verborgen.ts', mark: 'modified' as const }]
  const { container } = render(
    <PierreTree
      entries={notLoaded}
      onSelect={() => {}}
      label="Bestanden van deze chat"
      markLabels={nl.treeMarks}
      statuses={statuses}
    />,
  )

  const shadow = shadowRootOf(container)
  const src = within(shadow).getByRole('treeitem', { name: 'src' })
  expect(markOf(src)).toHaveAttribute('title', 'Bevat wijzigingen')
  expect(markOf(src)?.querySelector('svg')).not.toBeNull()
})

test('dims what git ignores, without a letter and without a dot on the folder above', () => {
  const withIgnored = [
    { path: 'dist', kind: 'dir' as const },
    { path: 'src/app.ts' },
    { path: 'src/fout.log' },
  ]
  const statuses = [
    { path: 'dist', mark: 'ignored' as const, kind: 'dir' as const },
    { path: 'src/fout.log', mark: 'ignored' as const },
  ]
  const { container } = render(
    <PierreTree
      entries={withIgnored}
      onSelect={() => {}}
      label="Bestanden van deze chat"
      markLabels={nl.treeMarks}
      statuses={statuses}
    />,
  )

  const shadow = shadowRootOf(container)
  const dist = within(shadow).getByRole('treeitem', { name: 'dist' })
  const log = within(shadow).getByRole('treeitem', { name: 'fout.log' })
  expect(dist).toHaveAttribute('data-item-git-status', 'ignored')
  expect(log).toHaveAttribute('data-item-git-status', 'ignored')
  expect(markOf(dist)).toBeNull()
  expect(markOf(log)).toBeNull()
  expect(markOf(within(shadow).getByRole('treeitem', { name: 'src' }))).toBeNull()
})

test('draws no marks when the status is none', () => {
  const plain = [{ path: 'README.md' }]
  const { container } = render(
    <PierreTree entries={plain} onSelect={() => {}} label="Bestanden van deze chat" />,
  )

  const shadow = shadowRootOf(container)
  const row = within(shadow).getByRole('treeitem', { name: 'README.md' })
  expect(row).not.toHaveAttribute('data-item-git-status')
  expect(row.querySelector('[data-item-section="git"]')).toBeNull()
  expect(markOf(row)).toBeNull()
})

describe('file types beyond the web', () => {
  test('the tree draws the same icon for a file as a row outside it', () => {
    const { container } = render(
      <PierreTree
        entries={[{ path: 'src/Winkel.java' }, { path: 'build.gradle' }]}
        onSelect={() => {}}
        label="Bestanden van deze chat"
      />,
    )

    const shadow = shadowRootOf(container)
    for (const [name, icon] of [
      ['Winkel.java', 'nt-file-icon-java'],
      ['build.gradle', 'nt-file-icon-gradle'],
    ] as const) {
      const row = within(shadow).getByRole('treeitem', { name })
      expect(row.querySelector('use')?.getAttribute('href')).toBe(`#${icon}`)
      // The symbol it points at is really in the tree's shadow root.
      expect(shadow.querySelector(`symbol#${icon}`)).not.toBeNull()
    }
  })
})
