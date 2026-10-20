import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import { DocProse, type DocProseLabels, type DocProseOptions } from '../src/index'
import { HEADING_START_CASES } from './heading-start-cases'

const LABELS: DocProseLabels = {
  codeBlock: 'Codeblok',
  table: 'Tabel',
  frontmatter: 'Frontmatter',
  footnotes: 'Voetnoten',
  taskDone: 'Klaar',
  taskOpen: 'Open',
}

/** The options of a document, with a record of what `onLink` heard. */
function documentOptions(overrides: Partial<DocProseOptions> = {}) {
  const opened: string[] = []
  const options: DocProseOptions = {
    onLink: (href) => opened.push(href),
    linkable: (href) => !href.startsWith('javascript:'),
    ...overrides,
  }
  return { opened, options }
}

function draw(markdown: string, options: DocProseOptions = documentOptions().options) {
  return render(<DocProse markdown={markdown} labels={LABELS} {...options} />)
}

describe('DocProse', () => {
  test('marks the blocks of the focus with nt-doc-focus: the item of a list, not the list', () => {
    const markdown = '# Bon\n\nEen alinea.\n\n- een\n- twee\n\n| a | b |\n|---|---|\n| x | y |\n'
    const twee = markdown.indexOf('- twee')
    const { container, rerender } = render(
      <DocProse
        markdown={markdown}
        labels={LABELS}
        {...documentOptions().options}
        focus={[
          { from: twee, to: twee + 6 },
          { from: markdown.indexOf('| x'), to: markdown.indexOf('| x') + 3 },
        ]}
      />,
    )
    const lit = [...container.querySelectorAll('.nt-doc-focus')]
    expect(lit.map((element) => [element.tagName, element.textContent])).toEqual([
      ['LI', 'twee'],
      ['TR', 'xy'],
    ])
    // One range alone, and none.
    const alinea = markdown.indexOf('Een alinea')
    rerender(
      <DocProse
        markdown={markdown}
        labels={LABELS}
        {...documentOptions().options}
        focus={{ from: alinea, to: alinea + 4 }}
      />,
    )
    expect([...container.querySelectorAll('.nt-doc-focus')].map((e) => e.tagName)).toEqual(['P'])
    rerender(
      <DocProse markdown={markdown} labels={LABELS} {...documentOptions().options} focus={null} />,
    )
    expect(container.querySelectorAll('.nt-doc-focus')).toHaveLength(0)
  })

  test('folds a soft line break into a space, and keeps a hard one', () => {
    // A document is wrapped at a fixed width in its source (CommonMark); unlike the chat, a
    // single newline is not the author's break.
    const { container } = draw(
      '- een punt dat de\n  extensie noemt\n\n> een citaat dat\n> doorloopt\n\nhard  \nbreuk\n\n```\ncode\nblijft\n```\n',
    )
    expect(container.querySelector('li')?.textContent).toBe('een punt dat de extensie noemt')
    expect(container.querySelector('blockquote')?.textContent).toBe('een citaat dat doorloopt')
    expect(container.querySelectorAll('br')).toHaveLength(1)
    expect(container.querySelector('pre')?.textContent).toBe('code\nblijft\n')
  })

  test('folds a section Contract under Technisch, up to the next heading as high', async () => {
    const markdown = [
      '# Cadeaubonnen',
      '',
      '## Contract',
      '',
      '`redeemGiftCard(cart, code)` in `src/kassa/bon.ts`.',
      '',
      '### Fouten',
      '',
      'Een code van een ander.',
      '',
      '## Acceptatiecriteria',
      '',
      '1. Een bon telt op.',
      '',
    ].join('\n')
    const { container, rerender } = render(
      <DocProse
        markdown={markdown}
        labels={{ ...LABELS, technical: 'Technisch' }}
        {...documentOptions().options}
        foldTechnical
      />,
    )
    const folded = container.querySelector('details.nt-doc-technical') as HTMLDetailsElement
    expect(folded.open).toBe(false)
    expect(folded.querySelector('summary')?.textContent).toBe('Technisch')
    expect(folded.textContent).toContain('Een code van een ander.')
    expect(folded.textContent).not.toContain('Een bon telt op.')
    // Its blocks keep their place in the source, so a jump still reaches them.
    expect(folded.querySelector('h2')?.getAttribute('data-source-from')).toBe(
      String(markdown.indexOf('## Contract')),
    )
    await userEvent.click(within(folded).getByText('Technisch'))
    expect(folded.open).toBe(true)
    rerender(<DocProse markdown={markdown} labels={LABELS} {...documentOptions().options} />)
    expect(container.querySelector('details')).toBeNull()
  })

  test('calls onLink for a link and draws it as a link', async () => {
    const { opened, options } = documentOptions()
    draw('Zie [installatie](installatie.md).\n', options)
    await userEvent.click(screen.getByRole('link', { name: 'installatie' }))
    expect(opened).toEqual(['installatie.md'])
  })

  test('only an address for a browser keeps its own href, and opens nothing of the page', () => {
    draw(
      '[a](installatie.md) [b](#gebruik) [c](https://voorbeeld.test) [d](mailto:x@voorbeeld.test)\n',
    )
    expect(screen.getByRole('link', { name: 'a' })).toHaveAttribute('href', '#')
    expect(screen.getByRole('link', { name: 'b' })).toHaveAttribute('href', '#')
    const external = screen.getByRole('link', { name: 'c' })
    expect(external).toHaveAttribute('href', 'https://voorbeeld.test')
    expect(external).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByRole('link', { name: 'a' })).not.toHaveAttribute('rel')
    expect(screen.getByRole('link', { name: 'd' })).toHaveAttribute(
      'href',
      'mailto:x@voorbeeld.test',
    )
  })

  test('a link it may not follow stays text with its address', () => {
    const { container } = draw('[klik](javascript:alert(1))\n')
    expect(screen.queryByRole('link')).toBeNull()
    expect(container.textContent).toBe('klik (javascript:alert(1))')
  })

  test('never makes a link of another scheme, whatever linkable says', () => {
    const { options } = documentOptions({ linkable: () => true })
    const { container } = draw(
      '[a](javascript:alert(1)) [b](data:text/html,x) [c](vbscript:x) [d](file:///etc/passwd)\n',
      options,
    )
    expect(screen.queryByRole('link')).toBeNull()
    expect(container.innerHTML).not.toContain('href="javascript:')
    expect(container.innerHTML).not.toContain('href="data:')
  })

  test('raw HTML stays text: no script, no element, no handler', () => {
    const { container } = draw(
      '<script>alert(1)</script>\n\n<img src="x" onerror="alert(1)">\n\n<b>vet</b> en <a href="javascript:alert(1)">klik</a>\n',
    )
    expect(container.querySelector('script, img, b, a, iframe, [onerror], [href]')).toBeNull()
    expect(container.textContent).toContain('<script>alert(1)</script>')
  })

  test('asks for no image outside the document and draws it as text', async () => {
    const asked: string[] = []
    const { options } = documentOptions({
      image: async (src) => {
        asked.push(src)
        return 'data:image/png;base64,iVBORw0KGgo='
      },
    })
    const { container } = draw(
      '![Van buiten](https://voorbeeld.test/a.png)\n\n![Data](data:image/png;base64,AAAA)\n\n![Eigen](schema.png)\n',
      options,
    )
    expect(await screen.findByRole('img', { name: 'Eigen' })).toBeInTheDocument()
    expect(asked).toEqual(['schema.png'])
    expect(screen.queryByRole('img', { name: 'Van buiten' })).toBeNull()
    expect(container.textContent).toContain('Van buiten (https://voorbeeld.test/a.png)')
  })

  // Every way to write an address with a scheme or another host: capitals, an entity, an autolink,
  // a reference definition, a protocol-relative `//host`.
  test('hostile markdown makes no link and asks for no image, whatever the caller accepts', async () => {
    const asked: string[] = []
    const opened: string[] = []
    const { container } = draw(
      [
        '[a](JAVASCRIPT:alert(1)) [b](&#106;avascript:alert(1)) [c](VBScript:x) [d](Data:text/html,x)',
        '[e](//voorbeeld.test/x) [f][r] [g][s] <javascript:alert(1)> <vbscript:x>',
        '',
        '![1](//voorbeeld.test/a.png) ![2](DATA:image/png;base64,AA) ![3][s]',
        '![4](&#x2F;/voorbeeld.test/a.png) ![5](https://voorbeeld.test/a.png)',
        '',
        '[r]: javascript:alert(1)',
        '[s]: //voorbeeld.test/a.png',
        '',
      ].join('\n'),
      {
        linkable: () => true,
        onLink: (href) => opened.push(href),
        image: async (src) => {
          asked.push(src)
          return 'data:image/png;base64,iVBORw0KGgo='
        },
      },
    )
    // Give a loader that was asked the time to answer.
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(container.querySelector('a, img')).toBeNull()
    expect(asked).toEqual([])
    expect(opened).toEqual([])
  })

  // A tab, a control character or a backslash reaches the components percent-encoded
  // (mdast-util-to-hast), so what a browser would read as a scheme or a host is a path by then.
  test('an obfuscated address reaches the caller as the path a browser reads', async () => {
    const { opened, options } = documentOptions({ linkable: () => true })
    const { container } = draw(
      '[a](java&#9;script:alert(1)) [b](<java\tscript:x>) [c](&#1;javascript:x) [d](\\\\voorbeeld.test\\x) [e](/&#9;/voorbeeld.test/x)\n',
      options,
    )
    for (const link of container.querySelectorAll('a')) expect(link).toHaveAttribute('href', '#')
    for (const name of ['a', 'b', 'c', 'd', 'e']) {
      await userEvent.click(screen.getByRole('link', { name }))
    }
    expect(opened).toEqual([
      'java%09script:alert(1)',
      'java%09script:x',
      '%EF%BF%BDjavascript:x',
      '%5Cvoorbeeld.test%5Cx',
      '/%09/voorbeeld.test/x',
    ])
  })

  test('a path of the document stays a link and an image', async () => {
    const asked: string[] = []
    const { opened, options } = documentOptions({
      linkable: () => true,
      image: async (src) => {
        asked.push(src)
        return 'data:image/png;base64,iVBORw0KGgo='
      },
    })
    draw('[a](../b/c.md) [b](/docs/x.md) [c](#kop)\n\n![Eigen](./img/a.png)\n', options)
    expect(await screen.findByRole('img', { name: 'Eigen' })).toBeInTheDocument()
    expect(asked).toEqual(['./img/a.png'])
    for (const name of ['a', 'b', 'c']) await userEvent.click(screen.getByRole('link', { name }))
    expect(opened).toEqual(['../b/c.md', '/docs/x.md', '#kop'])
  })

  test('without a loader an image is its alt text and address', () => {
    const { container } = draw('![Schema](schema.png)\n')
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toBe('Schema (schema.png)')
  })

  test('gives headings the ids the caller gave', () => {
    const { options } = documentOptions({
      headings: [
        { from: 0, anchor: 'handleiding' },
        { from: 15, anchor: 'gebruik-1' },
      ],
    })
    draw('# Handleiding\n\n## Gebruik\n', options)
    expect(screen.getByRole('heading', { name: 'Handleiding' })).toHaveAttribute(
      'id',
      'handleiding',
    )
    expect(screen.getByRole('heading', { name: 'Gebruik' })).toHaveAttribute('id', 'gebruik-1')
  })

  // The same table the app's parser walks (`heading-start-cases.ts`): a setext heading after link
  // definitions starts at its text, not at the definitions.
  test.each(HEADING_START_CASES.map((c) => [c.source, c]))(
    'finds the heading the host placed in %j',
    (_source, headingCase) => {
      const { options } = documentOptions({
        headings: headingCase.expected.map(([from], index) => ({ from, anchor: `kop-${index}` })),
      })
      const { container } = draw(headingCase.source, options)
      const headings = [...container.querySelectorAll('h1, h2, h3, h4, h5, h6')]
      expect(headings.map((heading) => heading.id)).toEqual(
        headingCase.expected.map((_range, index) => `kop-${index}`),
      )
    },
  )

  test('colours a fenced block in a language of the bundle and leaves another bare', async () => {
    const { options } = documentOptions({ highlight: true })
    const { container } = draw(
      '```ts\nexport const a = 1\n```\n\n```brainfuck\n+++.\n```\n',
      options,
    )
    await waitFor(() => expect(container.querySelector('pre[data-nt-highlighted]')).not.toBeNull())
    const [coloured, bare] = [...container.querySelectorAll('pre')]
    expect(coloured?.querySelector('span[style*="--nt-code-token-keyword"]')).not.toBeNull()
    expect(coloured).toHaveTextContent('export const a = 1')
    expect(bare).not.toHaveAttribute('data-nt-highlighted')
  })

  test('a code block is a named group, with the copy button of the caller', () => {
    const copied: string[] = []
    const { options } = documentOptions()
    render(
      <DocProse
        markdown={'```\nregel 1\n\nregel 3\n```\n'}
        labels={LABELS}
        {...options}
        renderCopy={(code) => (
          <button type="button" onClick={() => copied.push(code())}>
            kopieer
          </button>
        )}
      />,
    )
    expect(screen.getByRole('group', { name: 'Codeblok' })).toHaveTextContent('regel 1')
    screen.getByRole('button', { name: 'kopieer' }).click()
    expect(copied).toEqual(['regel 1\n\nregel 3'])
  })

  test('without a copy button of the caller a code block has none', () => {
    const { container } = draw('```\ncode\n```\n')
    expect(container.querySelector('[data-nt-code-copy]')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
  })

  test('says the words of the caller: table, task and footnotes', () => {
    const { container } = draw(
      '| a |\n|---|\n| 1 |\n\n- [x] af\n- [ ] niet\n\nNoot[^1]\n\n[^1]: tekst\n',
    )
    expect(screen.getByRole('group', { name: 'Tabel' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Klaar' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Open' })).toBeInTheDocument()
    expect(container.querySelector('#footnote-label')).toHaveTextContent('Voetnoten')
  })

  test('folds YAML frontmatter', () => {
    const { options } = documentOptions({ frontmatter: 'folded' })
    const { container } = draw('---\ntitel: Handleiding\n---\n\n# Handleiding\n', options)
    const details = container.querySelector('details')
    expect(details).not.toHaveAttribute('open')
    expect(within(details as HTMLElement).getByText('Frontmatter')).toBeInTheDocument()
    expect(details).toHaveTextContent('titel: Handleiding')
    expect(screen.getAllByRole('heading')).toHaveLength(1)
  })

  test('marks every top-level block with its source range', () => {
    const source = '# Kop\n\nTekst\n\n- een\n\n```\ncode\n```\n\n| a |\n|---|\n| 1 |\n'
    const { container } = draw(source)
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

  test('styles with the classes of doc-view.css, not with a utility framework', () => {
    const { container } = draw('# Kop\n\nTekst met `code`.\n')
    expect(container.firstElementChild).toHaveClass('nt-doc')
    expect(container.querySelector('h1')).toHaveClass('nt-doc-h1')
    expect(container.querySelector('p')).toHaveClass('nt-doc-p')
    expect(container.querySelector('code')).toHaveClass('nt-doc-code')
  })
})

describe('DocProse: renderCodeBlock', () => {
  const chart = '```chart\n{"type":"bar"}\n```\n'

  test('hands a block in a language of its own to the callback, with its place in the source', () => {
    const seen: unknown[] = []
    const { options } = documentOptions({
      renderCodeBlock: (block) => {
        seen.push(block)
        return <figure data-testid="chart">{block.value}</figure>
      },
    })
    draw(`Voor\n\n${chart}`, options)
    expect(seen).toEqual([
      { lang: 'chart', value: '{"type":"bar"}', position: { from: 6, to: 6 + chart.length - 1 } },
    ])
    expect(screen.getByTestId('chart')).toHaveTextContent('{"type":"bar"}')
    expect(document.querySelector('pre')).toBeNull()
  })

  test('a callback that answers null leaves the block as it was', () => {
    const { options } = documentOptions({ renderCodeBlock: () => null })
    const { container } = draw(chart, options)
    expect(container.querySelector('pre')).not.toBeNull()
  })

  test('a language of the highlighter bundle is offered too, and shiki keeps it when the callback declines', async () => {
    const seen: string[] = []
    const { options } = documentOptions({
      highlight: true,
      renderCodeBlock: (block) => {
        seen.push(block.lang)
        return null
      },
    })
    const { container } = draw('```ts\nconst a = 1\n```\n\n```\nbare\n```\n', options)
    await waitFor(() => expect(container.querySelector('[data-nt-highlighted]')).not.toBeNull())
    expect([...new Set(seen)]).toEqual(['ts'])
  })

  test('a language Shiki knows can be drawn by the callback (mermaid is both)', () => {
    const { options } = documentOptions({
      highlight: true,
      renderCodeBlock: (block) =>
        block.lang === 'mermaid' ? <figure data-testid="diagram">{block.value}</figure> : null,
    })
    const { container } = draw('```mermaid\ngraph TD; A-->B\n```\n', options)
    expect(screen.getByTestId('diagram')).toHaveTextContent('graph TD; A-->B')
    expect(container.querySelector('pre')).toBeNull()
  })

  test('without the prop the output is the same as before', () => {
    const plain = draw(chart).container.innerHTML
    const hooked = draw(chart, documentOptions({ renderCodeBlock: () => null }).options).container
      .innerHTML
    expect(hooked).toBe(plain)
  })
})

describe('DocProse: alerts', () => {
  const KINDS = ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION'] as const

  test('draws the five kinds as a named note when alerts is on', () => {
    const markdown = KINDS.map((kind) => `> [!${kind}]\n> Tekst ${kind}\n`).join('\n')
    const { container } = draw(markdown, documentOptions({ alerts: true }).options)
    const alerts = [...container.querySelectorAll('[data-nt-alert]')]
    expect(alerts.map((alert) => alert.getAttribute('data-nt-alert'))).toEqual([
      'note',
      'tip',
      'important',
      'warning',
      'caution',
    ])
    for (const alert of alerts) {
      expect(alert).toHaveAttribute('role', 'note')
      expect(alert.textContent).not.toContain('[!')
    }
    expect(alerts[3]).toHaveTextContent('Warning')
    expect(alerts[3]).toHaveTextContent('Tekst WARNING')
    expect(container.querySelector('blockquote')).toBeNull()
  })

  test('takes the titles from the labels', () => {
    const { container } = render(
      <DocProse
        markdown={'> [!TIP]\n> Tekst\n'}
        labels={{ ...LABELS, alerts: { tip: 'Tip van de dag' } }}
        {...documentOptions({ alerts: true }).options}
      />,
    )
    expect(container.querySelector('[data-nt-alert]')).toHaveTextContent('Tip van de dag')
  })

  test('without alerts the quote is the quote it was', () => {
    const { container } = draw('> [!NOTE]\n> Tekst\n')
    expect(container.querySelector('[data-nt-alert]')).toBeNull()
    expect(container.querySelector('blockquote')?.textContent).toContain('[!NOTE]')
  })

  test('an ordinary quote stays a quote with alerts on', () => {
    const { container } = draw('> Gewoon\n', documentOptions({ alerts: true }).options)
    expect(container.querySelector('blockquote')).not.toBeNull()
  })
})
