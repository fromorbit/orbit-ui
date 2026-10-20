import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { HEADING_START_CASES } from '../testing/heading-start-cases'
import { nl } from '../testing/labels'
import { Prose, type ProseDocument } from './Prose'

test('a heading, paragraph, bold and a list become elements, not characters', () => {
  const { container } = render(
    <Prose labels={nl.prose} markdown={'## Resultaat\n\nDit is **vet**.\n\n- Een\n- Twee\n'} />,
  )
  expect(screen.getByRole('heading', { level: 2, name: 'Resultaat' })).toBeInTheDocument()
  expect(container.querySelector('strong')).toHaveTextContent('vet')
  expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(2)
  expect(container.textContent).not.toContain('#')
  expect(container.textContent).not.toContain('*')
})

test('a heading stays within the scale: 15px for h1 and h2, 13px below that', () => {
  const { container } = render(
    <Prose labels={nl.prose} markdown={'# Een\n\n## Twee\n\n### Drie\n'} />,
  )
  const classes = [...container.querySelectorAll('h1, h2, h3')].map((node) => node.className)
  expect(classes[0]).toContain('text-[15px]')
  expect(classes[1]).toContain('text-[15px]')
  expect(classes[2]).toContain('text-[13px]')
  for (const className of classes) expect(className).toContain('font-medium')
})

test('raw HTML stays text and does not become an element', () => {
  const { container } = render(
    <Prose
      labels={nl.prose}
      markdown={'Zie <script>alert(1)</script> en <img src="x" onerror="boom"> hierboven.\n'}
    />,
  )
  expect(container.querySelector('script')).toBeNull()
  expect(container.querySelector('img')).toBeNull()
  expect(container.textContent).toContain('<script>alert(1)</script>')
  expect(container.textContent).toContain('<img src="x" onerror="boom">')
})

test('half a code block does not throw and stands as a code block', () => {
  const { container } = render(
    <Prose labels={nl.prose} markdown={'Bezig:\n\n```ts\nconst x = 1\n'} />,
  )
  const pre = container.querySelector('pre')
  expect(pre).not.toBeNull()
  expect(pre).toHaveTextContent('const x = 1')
  expect(pre?.className).toContain('font-mono')
})

/** Puts a clipboard on `navigator` that remembers what it was handed; happy-dom has none. */
function fakeClipboard() {
  const writeText = vi.fn(async () => {})
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  return writeText
}

/** The clipboard as it was before any of this ran; a global left standing is one the next file inherits. */
const realClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
afterEach(() => {
  if (realClipboard) Object.defineProperty(navigator, 'clipboard', realClipboard)
  else Reflect.deleteProperty(navigator, 'clipboard')
})

test('a code block carries a copy button that holds exactly the code', async () => {
  const writeText = fakeClipboard()
  render(<Prose labels={nl.prose} markdown={'```ts\nconst x = 1\nconst y = 2\n```\n'} />)

  await userEvent.click(screen.getByRole('button', { name: 'Kopiëren' }))
  // The text of the markdown node, not of the DOM: no fence, no language tag, and without the
  // newline mdast-util-to-hast appends behind the value to pretty-print its `<code>`.
  expect(writeText).toHaveBeenCalledWith('const x = 1\nconst y = 2')
})

test('a fenced md block is drawn as a document, and its copy button still holds the markdown source', async () => {
  const writeText = fakeClipboard()
  const source = '# Een Skill\n\n- stap een\n- stap twee'
  const { container } = render(
    <Prose labels={nl.prose} markdown={`\`\`\`md\n${source}\n\`\`\`\n`} />,
  )
  const fence = container.querySelector('[data-nt-markdown-fence]') as HTMLElement
  expect(within(fence).getByRole('heading', { name: 'Een Skill' })).toBeInTheDocument()
  expect(within(fence).getAllByRole('listitem')).toHaveLength(2)
  // Not a block of code: nothing scrolls sideways and no `pre` holds the text.
  expect(fence.querySelector('pre')).toBeNull()
  await userEvent.click(within(fence).getByRole('button', { name: 'Kopiëren' }))
  expect(writeText).toHaveBeenCalledWith(source)
})

test('a code block can wrap its long lines, and says whether it does', async () => {
  const { container } = render(
    <Prose labels={nl.prose} markdown={'```ts\nconst veryLongLine = 1\n```\n'} />,
  )
  const block = container.querySelector('[data-nt-code-block]') as HTMLElement
  const region = within(block).getByRole('group', { name: 'Codeblok' })
  // At rest the line scrolls, and the thumb is visible without pointing at the block.
  expect(region.className).toContain('overflow-x-auto')
  expect(region.className).toContain('scrollbar-thumb')
  const toggle = within(block).getByRole('button', { name: 'Regels afbreken' })
  expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await userEvent.click(toggle)
  expect(within(block).getByRole('button', { name: 'Regels niet afbreken' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(region.className).not.toContain('overflow-x-auto')
  expect(block.querySelector('pre')?.className).toContain('whitespace-pre-wrap')
})

test('a fenced block of another language stays code', () => {
  const { container } = render(<Prose labels={nl.prose} markdown={'```ts\nconst x = 1\n```\n'} />)
  expect(container.querySelector('[data-nt-markdown-fence]')).toBeNull()
  expect(container.querySelector('pre')).not.toBeNull()
})

test('the blank lines of a code block survive; only the parser adds nothing', async () => {
  // Exactly one newline goes, and it is the one mdast-util-to-hast appends to pretty-print its
  // `<code>`. Everything else is the agent's: a blank line between two statements, and a blank
  // line just before the closing fence, which remark keeps in the value of the node.
  const writeText = fakeClipboard()
  render(
    <Prose
      labels={nl.prose}
      markdown={'```\nconst a = 1\n\nconst b = 2\n```\n\n```\nx\n\n```\n'}
    />,
  )

  const buttons = screen.getAllByRole('button', { name: 'Kopiëren' })
  await userEvent.click(buttons[0] as HTMLElement)
  expect(writeText).toHaveBeenLastCalledWith('const a = 1\n\nconst b = 2')
  await userEvent.click(buttons[1] as HTMLElement)
  expect(writeText).toHaveBeenLastCalledWith('x\n')
})

test('a block written with Windows line endings keeps them, and loses one newline at the end', async () => {
  // An agent on Windows, or a file it pasted from, writes CRLF, and remark keeps those endings in
  // the value of the node. So does the clipboard: "exactly the code" means the line endings the
  // agent used, not the ones this app would have picked — pasting it back reproduces the file.
  //
  // The rule about the last newline is unchanged and still counts only the parser's own `\n`: the
  // value ends at `2`, to-hast appends one `\n`, and that one goes.
  const writeText = fakeClipboard()
  render(<Prose labels={nl.prose} markdown={'```\r\nconst a = 1\r\nconst b = 2\r\n```\r\n'} />)

  await userEvent.click(screen.getByRole('button', { name: 'Kopiëren' }))
  expect(writeText).toHaveBeenCalledWith('const a = 1\r\nconst b = 2')
})

test('inline code gets no button of its own', () => {
  render(<Prose labels={nl.prose} markdown={'Dit is `code` in een zin.\n'} />)
  expect(screen.queryByRole('button', { name: 'Kopiëren' })).toBeNull()
})

test('whatever scrolls horizontally is a named region the keyboard can reach', () => {
  // A scroll region that only the mouse can reach hides its overflow from a keyboard user; axe
  // calls that `scrollable-region-focusable`. A tab stop without a name is just as opaque, so
  // each one says what it is, the way `ScrollArea` does.
  render(
    <Prose
      labels={nl.prose}
      markdown={'```\nlang\n```\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n'}
    />,
  )
  const code = screen.getByRole('group', { name: 'Codeblok' })
  const table = screen.getByRole('group', { name: 'Tabel' })
  expect(code.querySelector('pre')).toHaveTextContent('lang')
  expect(within(table).getByRole('table')).toBeInTheDocument()
  for (const node of [code, table]) {
    expect(node).toHaveAttribute('tabindex', '0')
    expect(node.className).toContain('focus-visible:outline-2')
  }
})

test('a single line break stays a line break', () => {
  // An agent writes plain lines far more often than markdown lists; markdown itself would fold
  // them into one paragraph. `pre-line` keeps the break without touching the block structure.
  const { container } = render(
    <Prose labels={nl.prose} markdown={'eerste regel\ntweede regel\n'} />,
  )
  const paragraph = container.querySelector('p')
  expect(paragraph?.className).toContain('whitespace-pre-line')
  expect(paragraph?.textContent).toBe('eerste regel\ntweede regel')
})

test('the line breaks between blocks do not become empty rows', () => {
  // mdast-util-to-hast puts a newline between block children to pretty-print its HTML. Wherever
  // `pre-line` is in force those would show up as a blank line, so no element that preserves
  // newlines may hold one of its own.
  const { container } = render(
    <Prose
      labels={nl.prose}
      markdown={'- Een\n  - Genest\n\n> Citaat\n\n| A |\n| --- |\n| 1 |\n'}
    />,
  )
  const preserving = [...container.querySelectorAll('.whitespace-pre-line')]
  expect(preserving.length).toBeGreaterThan(0)
  for (const node of preserving) {
    const strays = [...node.childNodes].filter(
      (child) => child.nodeType === 3 && child.textContent?.trim() === '',
    )
    expect(strays.map((child) => child.textContent)).toEqual([])
  }
  // The item's own text is just its text; the nested list collapses its own newlines again,
  // instead of inheriting `pre-line` from the item it sits in.
  expect(screen.getAllByRole('listitem')[0]?.firstChild?.textContent).toBe('Een')
  for (const list of container.querySelectorAll('ul, ol')) {
    expect(list.className).toContain('whitespace-normal')
  }
})

test('inline code stands in mono on a surface', () => {
  const { container } = render(<Prose labels={nl.prose} markdown={'Roep `build()` aan.\n'} />)
  const code = container.querySelector('code')
  expect(code).toHaveTextContent('build()')
  expect(code?.className).toContain('font-mono')
  expect(code?.className).toContain('bg-surface')
})

test('a link is no link: the text with the address behind it', () => {
  const { container } = render(
    <Prose labels={nl.prose} markdown={'Zie [de handleiding](https://example.com/uitleg).\n'} />,
  )
  expect(container.querySelector('a')).toBeNull()
  expect(container.textContent).toContain('de handleiding (https://example.com/uitleg)')
})

test('an autolink shows the address once', () => {
  const { container } = render(
    <Prose labels={nl.prose} markdown={'Zie https://example.com/uitleg maar.\n'} />,
  )
  expect(container.querySelector('a')).toBeNull()
  const text = container.textContent ?? ''
  expect(text.split('https://example.com/uitleg')).toHaveLength(2)
})

test('an image does not load; alt text and address stand as text', () => {
  const { container } = render(
    <Prose labels={nl.prose} markdown={'![Een diagram](https://example.com/a.png)\n'} />,
  )
  expect(container.querySelector('img')).toBeNull()
  expect(container.textContent).toContain('Een diagram (https://example.com/a.png)')
})

test('a horizontal rule becomes a separator', () => {
  render(<Prose labels={nl.prose} markdown={'Boven\n\n---\n\nOnder\n'} />)
  expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'horizontal')
})

test('a quote and a table get their own shape', () => {
  const { container } = render(
    <Prose
      labels={nl.prose}
      markdown={'> Let op\n\n| Naam | Waarde |\n| --- | --- |\n| a | 1 |\n'}
    />,
  )
  expect(container.querySelector('blockquote')?.className).toContain('border-l')
  const table = screen.getByRole('table')
  expect(within(table).getAllByRole('columnheader')).toHaveLength(2)
  expect(table.parentElement?.className).toContain('overflow-x-auto')
})

test('a task list from GFM draws its own boxes, with a name', () => {
  const { container } = render(
    <Prose labels={nl.prose} markdown={'- [x] Klaar\n- [ ] Nog niet\n'} />,
  )
  expect(screen.getByRole('img', { name: 'Gedaan' })).toBeInTheDocument()
  expect(screen.getByRole('img', { name: 'Niet gedaan' })).toBeInTheDocument()
  // The browser's own grey checkbox is the one piece of native chrome a conversation must not
  // show; nothing here is a control either, since a task list is not editable.
  expect(container.querySelector('input')).toBeNull()
  // A box replaces the marker; a bullet next to it would be a second marker.
  for (const item of screen.getAllByRole('listitem')) expect(item.className).toContain('list-none')
})

test('a plain list item keeps its bullet', () => {
  render(<Prose labels={nl.prose} markdown={'- Een\n'} />)
  expect(screen.getByRole('listitem').className).not.toContain('list-none')
})

// GFM footnotes arrive with three pieces of generated plumbing: an English `Footnotes` heading
// that is `sr-only` in the HTML remark-gfm writes, a marker linking down to the note, and a back
// link up to the marker. None of it survives the default rendering here — the heading loses its
// class and shouts, and both links show their `#user-content-…` target as text.
test('a GFM footnote shows its number, and none of the plumbing around it', () => {
  const { container } = render(
    <Prose
      labels={nl.prose}
      markdown={'Een bewering met een bron[^1].\n\n[^1]: De bron zelf.\n'}
    />,
  )
  // The marker is the number, nothing else: no anchor id spelled out beside it.
  expect(container.querySelector('sup')).toHaveTextContent('1')
  expect(container.textContent).not.toContain('#user-content')
  // The back link is a navigation control in something that has no navigation: it goes entirely.
  expect(container.textContent).not.toContain('↩')
})

test('the generated Footnotes heading stays hidden, and in the language of the app', () => {
  const { container } = render(
    <Prose
      labels={nl.prose}
      markdown={'Een bewering met een bron[^1].\n\n[^1]: De bron zelf.\n'}
    />,
  )
  const heading = screen.getByRole('heading', { level: 2 })
  // Still a heading, so the section keeps its name for a screen reader; still invisible, so an
  // answer does not suddenly grow a 15px "Footnotes" title nobody wrote.
  expect(heading.className).toContain('sr-only')
  expect(heading).toHaveTextContent('Voetnoten')
  expect(container.querySelector('section')?.textContent).toContain('De bron zelf.')
})

test('empty markdown renders nothing visible', () => {
  const { container } = render(<Prose labels={nl.prose} markdown="" />)
  expect(container.textContent).toBe('')
})

/** References that find `src/app.ts` wherever it stands, and draw it as a marked button. */
function references(seen: { text: string; where: 'code' | 'text' }[] = []) {
  return {
    find(text: string, where: 'code' | 'text') {
      seen.push({ text, where })
      const at = text.indexOf('src/app.ts')
      if (where === 'code' && text.trim() !== 'src/app.ts') return []
      return at === -1 ? [] : [{ start: at, end: at + 'src/app.ts'.length }]
    },
    render(_match: { start: number; end: number }, text: string) {
      return <button type="button">{text}</button>
    },
  }
}

test('without references prose renders as before', () => {
  const { container } = render(
    <Prose labels={nl.prose} markdown={'Zie `src/app.ts` en src/app.ts.\n'} />,
  )
  expect(container.querySelector('button')).toBeNull()
  expect(container.querySelector('code')).toHaveTextContent('src/app.ts')
})

test('references replace a path in text and in inline code', () => {
  const { container } = render(
    <Prose
      labels={nl.prose}
      markdown={'Zie `src/app.ts` en **src/app.ts** hier.\n'}
      references={references()}
    />,
  )
  const buttons = screen.getAllByRole('button', { name: 'src/app.ts' })
  expect(buttons).toHaveLength(2)
  // In inline code the reference takes the place of the code chip.
  expect(container.querySelector('code')).toBeNull()
  expect(container.textContent).toBe('Zie src/app.ts en src/app.ts hier.')
})

test('nothing in a fenced block, a link or a heading is offered', () => {
  const seen: { text: string; where: 'code' | 'text' }[] = []
  render(
    <Prose
      labels={nl.prose}
      markdown={'## src/app.ts\n\n[src/app.ts](https://winkel.test)\n\n```\nsrc/app.ts\n```\n'}
      references={references(seen)}
    />,
  )
  expect(screen.queryByRole('button', { name: 'src/app.ts' })).toBeNull()
  expect(seen.filter((call) => call.text.includes('src/app.ts'))).toEqual([])
})

/** References that draw a link to `https://winkel.test/…` as a marked button with its path. */
function linkReferences(seen: string[] = []) {
  return {
    find: () => [],
    render: () => null,
    link(href: string, words: string | undefined) {
      seen.push(href)
      const url = new URL(href)
      if (url.hostname !== 'winkel.test') return undefined
      return {
        drawn: <button type="button">{`winkel${url.pathname}`}</button>,
        alone: words === 'alleen',
      }
    },
  }
}

describe('links through references', () => {
  test('a bare address the references know becomes what they draw', () => {
    const seen: string[] = []
    const { container } = render(
      <Prose
        labels={nl.prose}
        markdown={'Zie https://winkel.test/pull/1 hier.\n'}
        references={linkReferences(seen)}
      />,
    )
    expect(screen.getByRole('button', { name: 'winkel/pull/1' })).toBeInTheDocument()
    expect(seen).toEqual(['https://winkel.test/pull/1'])
    // The address is not repeated beside it.
    expect(container.textContent).toBe('Zie winkel/pull/1 hier.')
  })

  test('a named link keeps its words, with the drawing in place of the address', () => {
    const { container } = render(
      <Prose
        labels={nl.prose}
        markdown={'Zie [de wijziging](https://winkel.test/pull/2).\n'}
        references={linkReferences()}
      />,
    )
    expect(screen.getByRole('button', { name: 'winkel/pull/2' })).toBeInTheDocument()
    expect(container.textContent).toBe('Zie de wijziging winkel/pull/2.')
  })

  test('a named link whose words only repeat the drawing becomes the drawing alone', () => {
    const { container } = render(
      <Prose
        labels={nl.prose}
        markdown={'Zie [alleen](https://winkel.test/pull/3).\n'}
        references={linkReferences()}
      />,
    )
    expect(screen.getByRole('button', { name: 'winkel/pull/3' })).toBeInTheDocument()
    expect(container.textContent).toBe('Zie winkel/pull/3.')
  })

  test('an address the references do not know stays text, as before', () => {
    const { container } = render(
      <Prose
        labels={nl.prose}
        markdown={'Zie https://elders.test/x hier.\n'}
        references={linkReferences()}
      />,
    )
    expect(screen.queryByRole('button')).toBeNull()
    expect(container.textContent).toBe('Zie https://elders.test/x hier.')
  })

  test('an anchor into the answer is never offered', () => {
    const seen: string[] = []
    render(
      <Prose
        labels={nl.prose}
        markdown={'Zie[^1].\n\n[^1]: Een noot.\n'}
        references={linkReferences(seen)}
      />,
    )
    expect(seen).toEqual([])
  })
})

/** The options of the stand Lezen, with a record of what `onLink` heard. */
function documentOptions(overrides: Partial<ProseDocument> = {}) {
  const opened: string[] = []
  const options: ProseDocument = {
    onLink: (href) => opened.push(href),
    linkable: (href) => !href.startsWith('javascript:'),
    ...overrides,
  }
  return { opened, options }
}

describe('as a document', () => {
  test('without options renders links and images as text as before', () => {
    const { container } = render(
      <Prose
        labels={nl.prose}
        markdown={'[meer](https://voorbeeld.test) en ![schema](schema.png)\n'}
      />,
    )
    expect(container.querySelector('a')).toBeNull()
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toBe('meer (https://voorbeeld.test) en schema (schema.png)')
  })

  test('calls onLink for a link and draws it as a link', async () => {
    const { opened, options } = documentOptions()
    render(
      <Prose
        labels={nl.prose}
        markdown={'Zie [installatie](installatie.md).\n'}
        document={options}
      />,
    )
    const link = screen.getByRole('link', { name: 'installatie' })
    await userEvent.click(link)
    expect(opened).toEqual(['installatie.md'])
  })

  test('only an address for a browser keeps its own href; a path of the document gets none', () => {
    const { options } = documentOptions()
    render(
      <Prose
        labels={nl.prose}
        markdown={
          '[a](installatie.md) [b](#gebruik) [c](https://voorbeeld.test) [d](mailto:x@voorbeeld.test)\n'
        }
        document={options}
      />,
    )
    expect(screen.getByRole('link', { name: 'a' })).toHaveAttribute('href', '#')
    expect(screen.getByRole('link', { name: 'b' })).toHaveAttribute('href', '#')
    expect(screen.getByRole('link', { name: 'c' })).toHaveAttribute(
      'href',
      'https://voorbeeld.test',
    )
    expect(screen.getByRole('link', { name: 'd' })).toHaveAttribute(
      'href',
      'mailto:x@voorbeeld.test',
    )
  })

  test('a link it may not follow stays text with its address', () => {
    const { options } = documentOptions()
    const { container } = render(
      <Prose labels={nl.prose} markdown={'[klik](javascript:alert(1))\n'} document={options} />,
    )
    expect(screen.queryByRole('link')).toBeNull()
    expect(container.textContent).toBe('klik (javascript:alert(1))')
  })

  test('gives headings the ids core gave', () => {
    const { options } = documentOptions({
      headings: [
        { from: 0, anchor: 'handleiding' },
        { from: 15, anchor: 'gebruik-1' },
      ],
    })
    render(
      <Prose labels={nl.prose} markdown={'# Handleiding\n\n## Gebruik\n'} document={options} />,
    )
    expect(screen.getByRole('heading', { name: 'Handleiding' })).toHaveAttribute(
      'id',
      'handleiding',
    )
    expect(screen.getByRole('heading', { name: 'Gebruik' })).toHaveAttribute('id', 'gebruik-1')
  })

  // The library's copy of the table core's `outline` walks: a setext heading after link
  // definitions starts at its text, not at the definitions.
  test.each(HEADING_START_CASES.map((c) => [c.source, c]))(
    'finds the heading core placed in %j',
    (_source, headingCase) => {
      const { options } = documentOptions({
        headings: headingCase.expected.map(([from], index) => ({ from, anchor: `kop-${index}` })),
      })
      const { container } = render(
        <Prose labels={nl.prose} markdown={headingCase.source} document={options} />,
      )
      const headings = [...container.querySelectorAll('h1, h2, h3, h4, h5, h6')]
      expect(headings.map((heading) => heading.id)).toEqual(
        headingCase.expected.map((_range, index) => `kop-${index}`),
      )
      headings.forEach((heading, index) => {
        // Only a top-level block carries its source range.
        if (heading.closest('blockquote, li')) return
        expect([
          Number(heading.getAttribute('data-source-from')),
          Number(heading.getAttribute('data-source-to')),
        ]).toEqual(headingCase.expected[index])
      })
    },
  )

  test('colours a fenced block in a language of the bundle and leaves another bare', async () => {
    const { options } = documentOptions({ highlight: true })
    const { container } = render(
      <Prose
        labels={nl.prose}
        markdown={'```ts\nexport const a = 1\n```\n\n```brainfuck\n+++.\n```\n'}
        document={options}
      />,
    )
    await waitFor(() => expect(container.querySelector('pre[data-nt-highlighted]')).not.toBeNull())
    const [coloured, bare] = [...container.querySelectorAll('pre')]
    expect(coloured).toHaveAttribute('data-nt-highlighted')
    expect(coloured?.querySelector('span[style*="--nt-code-token-keyword"]')).not.toBeNull()
    expect(coloured).toHaveTextContent('export const a = 1')
    expect(bare).not.toHaveAttribute('data-nt-highlighted')
    expect(bare).toHaveTextContent('+++.')
  })

  test('draws the image the loader returns and the alt text when it returns null', async () => {
    const asked: string[] = []
    const { options } = documentOptions({
      image: async (src) => {
        asked.push(src)
        return src === 'schema.png' ? 'data:image/png;base64,iVBORw0KGgo=' : null
      },
    })
    const { container } = render(
      <Prose
        labels={nl.prose}
        markdown={'![Schema](schema.png)\n\n![Logo](logo.svg)\n'}
        document={options}
      />,
    )
    expect(await screen.findByRole('img', { name: 'Schema' })).toHaveAttribute(
      'src',
      'data:image/png;base64,iVBORw0KGgo=',
    )
    await waitFor(() => expect(container.textContent).toContain('Logo (logo.svg)'))
    expect(screen.queryByRole('img', { name: 'Logo' })).toBeNull()
    expect(asked).toEqual(['schema.png', 'logo.svg'])
  })

  test('folds YAML frontmatter', () => {
    const { options } = documentOptions({ frontmatter: 'folded' })
    const { container } = render(
      <Prose
        labels={nl.prose}
        markdown={'---\ntitel: Handleiding\n---\n\n# Handleiding\n'}
        document={options}
      />,
    )
    const details = container.querySelector('details')
    expect(details).not.toBeNull()
    expect(details).not.toHaveAttribute('open')
    expect(within(details as HTMLElement).getByText('Frontmatter')).toBeInTheDocument()
    expect(details).toHaveTextContent('titel: Handleiding')
    // Not a thematic break with a setext heading under it, as without the option.
    expect(screen.getAllByRole('heading')).toHaveLength(1)
  })

  test('marks every top-level block with its source range', () => {
    const { options } = documentOptions()
    const source = '# Kop\n\nTekst\n\n- een\n\n```\ncode\n```\n\n| a |\n|---|\n| 1 |\n'
    const { container } = render(<Prose labels={nl.prose} markdown={source} document={options} />)
    const marked = [...container.querySelectorAll('[data-source-from]')].map((node) => [
      Number(node.getAttribute('data-source-from')),
      Number(node.getAttribute('data-source-to')),
    ])
    expect(marked).toEqual([
      [0, 5],
      [7, 12],
      [14, 19],
      [21, 33],
      [35, 52],
    ])
  })
})
