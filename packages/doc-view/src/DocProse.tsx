import { Check } from 'lucide-react'
import {
  createContext,
  Fragment,
  type MouseEvent,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import Markdown, { type Options } from 'react-markdown'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import { ALERT_KINDS, type AlertKind, alertOf, DEFAULT_ALERT_TITLES, rehypeAlerts } from './alerts'
import { type HighlightedToken, highlightCode } from './highlight'

/**
 * The words `DocProse` says itself, in the reader's language.
 *
 * Props rather than an i18n library: the app and the website each keep their own catalogue, and
 * this package stays free of both.
 */
export interface DocProseLabels {
  /** The name of a fenced block, a scrolling group the keyboard reaches. */
  codeBlock: string
  /** The name of a table, a scrolling group the keyboard reaches. */
  table: string
  /** The summary of the folded YAML frontmatter. */
  frontmatter: string
  /** The hidden heading above the footnotes, in place of the English one of remark-gfm. */
  footnotes: string
  /** A ticked task item. */
  taskDone: string
  /** An open task item. */
  taskOpen: string
  /** The titles of the GitHub alerts, by kind; a kind left out keeps its English one. */
  alerts?: Partial<Record<AlertKind, string>>
  /** The summary of a folded section Contract (`foldTechnical`): "Technisch". */
  technical?: string
}

/** A fenced block as {@link DocProseOptions.renderCodeBlock} hears of it. */
export interface DocCodeBlock {
  /** The language the fence names, as written. */
  lang: string
  /** The literal text of the block, without the fences. */
  value: string
  /** Where the block stands in the source, as offsets. */
  position: { from: number; to: number }
}

/**
 * What a caller tells `DocProse` about the document around it: where a link leads, which image may
 * be shown, the anchors of the headings.
 *
 * `DocProse` knows nothing of files, browsers or a server: it asks `linkable` whether a link may
 * become one, hands a click to `onLink`, and asks `image` for the data URL of an image. What a
 * link leads to, and whether an image may be shown, is the caller's to decide — within two rules of
 * its own that no caller can loosen: only a path of the document (no scheme, no `//host`), or an
 * address with `http:`, `https:` or `mailto:`, is ever a link, and only a path of the document is
 * ever asked for as an image.
 */
export interface DocProseOptions {
  /** A click on a link `linkable` accepted, with the address as the source wrote it. */
  onLink(href: string): void
  /** Whether a link becomes a real, clickable link; any other stays text with its address. */
  linkable(href: string): boolean
  /** The data URL of an image, or `null` to show its alt text and address instead. */
  image?(src: string): Promise<string | null>
  /** The anchors of the headings by their offset in the source (core's `outline`, or `outlineOf`). */
  headings?: readonly { from: number; anchor: string }[]
  /** Colours a fenced block in a language of `shiki-bundle.ts`; any other stays bare. */
  highlight?: boolean
  /** YAML frontmatter as a small folded block; left out, it stands open. */
  frontmatter?: 'folded'
  /**
   * A section Contract folded under `labels.technical`: the
   * reading view of a spec for someone who does not read code. Left out, it stands as written.
   */
  foldTechnical?: boolean
  /**
   * A hook for a fenced block in a language of its own (a chart, a diagram): the caller draws it
   * and this package needs to know nothing of what it is. Asked for every block that names a
   * language, also one Shiki knows (`mermaid` is both); an answer of `null` or `undefined` leaves
   * the block as it would be, highlighted as before.
   */
  renderCodeBlock?(block: DocCodeBlock): ReactNode
  /** Draws a quote that opens with `[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]` or `[!CAUTION]` as a named note. */
  alerts?: boolean
  /**
   * The places the reader's attention is on (a review, for instance): each block
   * they touch carries `nt-doc-focus` — an item of a list or a row of a table rather than the
   * whole list or table, so a review lights the point it is about. `null` or left out: none.
   */
  focus?: DocFocusRange | readonly DocFocusRange[] | null
}

/** A range of the source, in UTF-16 offsets, that the reader's attention is on. */
export interface DocFocusRange {
  from: number
  to: number
}

/** What {@link DocProse} draws. */
export interface DocProseProps extends DocProseOptions {
  markdown: string
  labels: DocProseLabels
  /**
   * The copy button of a fenced block, with its code as a function so nothing is flattened until
   * it is pressed; without it, a block has no button.
   */
  renderCopy?(code: () => string): ReactNode
}

/** The loader of a document's images, as `DocProseOptions.image` offers it. */
interface ImageLoader {
  // biome-ignore lint/style/useShorthandFunctionType: an arrow type reads to the i18n guard of the app as copy between two angle brackets (`=> Promise<`).
  (src: string): Promise<string | null>
}

/** Everything a component below needs of the document it stands in. */
interface DocumentContextValue extends DocProseOptions {
  labels: DocProseLabels
  renderCopy?: ((code: () => string) => ReactNode) | undefined
}

/**
 * The document around a component.
 *
 * A context rather than components rebuilt per render: the map of components stays one module
 * constant, so react-markdown keeps its subtree when the options change.
 */
const DocumentContext = createContext<DocumentContextValue | null>(null)

/** The document around a component; every component of this file stands inside one. */
function useDocument(): DocumentContextValue {
  const document = useContext(DocumentContext)
  if (!document) throw new Error('DocProse: a component outside its document.')
  return document
}

/** The class of a block, with `nt-doc-focus` when {@link focusBlocks} marked it. */
function withFocus(base: string, props: object): string {
  return 'data-nt-focus' in props ? `${base} nt-doc-focus` : base
}

/** The properties a top-level block carries: its range in the source. */
interface SourceProps {
  'data-source-from'?: unknown
  'data-source-to'?: unknown
  /** Set by {@link focusBlocks} on a block in focus; never drawn as an attribute. */
  'data-nt-focus'?: unknown
}

/**
 * The source range of a top-level block, passed on to the element that draws it: the app maps a
 * place in the view back to the source with it (Gesplitst, selections, comments).
 */
function sourceOf(props: object): SourceProps {
  const from = (props as SourceProps)['data-source-from']
  const to = (props as SourceProps)['data-source-to']
  const range: SourceProps =
    from === undefined || to === undefined ? {} : { 'data-source-from': from, 'data-source-to': to }
  // The mark of the focus goes along to the component, which turns it into its class.
  return 'data-nt-focus' in props ? { ...range, 'data-nt-focus': true } : range
}

/** The source range alone, for the element itself: the mark of the focus is a class there. */
function sourceOnly(source: SourceProps | undefined): SourceProps {
  if (!source) return {}
  const { 'data-nt-focus': _focus, ...range } = source
  return range
}

/** The six heading elements, whose start {@link sourceStart} corrects. */
const HEADING_TAG = /^h[1-6]$/

/**
 * The offset where an element really starts in the source, when the parser gave it one.
 *
 * mdast starts a setext heading at the paragraph it grew from, which may have begun with link
 * definitions (`[a]: b\nc\n---` puts the heading at 0, over the definition), and the element
 * inherits that start. A heading whose first child starts on a later line starts at that child.
 * The same rule as `sourceStart` of `@nt/markdown`, which this package may not import;
 * the heading-start cases of the tests hold the two together, so an anchor the host gives by
 * offset finds its heading.
 */
function sourceStart(node: unknown): number | undefined {
  const element = node as TreeNode | undefined
  const start = element?.position?.start
  if (element?.tagName && HEADING_TAG.test(element.tagName)) {
    const child = element.children?.[0]?.position?.start
    if (start?.line !== undefined && child?.line !== undefined && child.line > start.line) {
      return child.offset
    }
  }
  return start?.offset
}

/** The anchor the caller gave the heading that starts at `node`. */
function useHeadingId(node: unknown): string | undefined {
  const document = useDocument()
  const from = sourceStart(node)
  if (!document.headings || from === undefined) return undefined
  return document.headings.find((heading) => heading.from === from)?.anchor
}

/**
 * Flattens the children react-markdown hands a component into plain text, or `undefined` when the
 * node holds anything but text: the address of `<https://x>` is both its text and its target, and
 * showing it twice would read as a mistake.
 */
function plainText(children: ReactNode): string | undefined {
  if (typeof children === 'string') return children
  if (Array.isArray(children) && children.every((child) => typeof child === 'string')) {
    return children.join('')
  }
  return undefined
}

/**
 * The property remark-gfm puts on the `↩` link that leads from a footnote back to its marker; a
 * constant, since a string in JSX position is what the i18n guard of the app hunts for.
 */
const BACKREF = 'data-footnote-backref'
/** The schemes whose address a link may carry as its own `href`: an address for a browser. */
const BROWSER_ADDRESS = /^(?:https?|mailto):/i
/** Any scheme at all; an address with one that is not a browser's is never a link or an image. */
const SCHEME = /^[a-z][a-z0-9+.-]*:/i
/** The `href` of every other link: a link to nowhere, followed only by `onLink`. */
const SAME_PAGE = '#'
/** What an address for a browser carries, so the page it opens cannot reach back. */
const EXTERNAL_REL = 'noopener noreferrer'
/** Between two lines of a highlighted block; a constant for the same reason as {@link BACKREF}. */
const NEWLINE = '\n'

/** A network-path reference (`//host/x`): another host, whatever the scheme of the page. */
const NETWORK_PATH = /^[/\\]{2}/

/**
 * Whether an address is a path of the document: no scheme, and no other host.
 *
 * A tab, a control character or a backslash arrives percent-encoded (mdast-util-to-hast normalises
 * every address), so `java&#9;script:` is the path `java%09script:` here, as a browser reads it too.
 */
function isDocumentPath(address: string): boolean {
  const read = address.trim()
  return !SCHEME.test(read) && !NETWORK_PATH.test(read)
}

/** Whether an address may be a link at all: a path of the document, or one for a browser. */
function mayLink(href: string): boolean {
  return BROWSER_ADDRESS.test(href) || isDocumentPath(href)
}

/**
 * A markdown link: a real link when the caller's `linkable` accepts it (and its scheme may be one),
 * text with its address otherwise.
 *
 * A back-reference of a footnote leaves entirely, and an anchor the caller refused keeps only its
 * text: spelling out `#user-content-fn-1` would bury a one-character marker.
 */
function Reference({
  children,
  href,
  backref,
}: {
  children: ReactNode
  href: string | undefined
  backref: boolean
}) {
  const document = useDocument()
  if (backref) return null
  if (href && mayLink(href) && document.linkable(href)) {
    const follow = (event: MouseEvent) => {
      // The page never navigates itself: the caller decides where the address goes.
      event.preventDefault()
      document.onLink(href)
    }
    // Only an address for a browser keeps its own `href` (the status line and a copy of it are
    // then true); a path of the document gets `#`, so nothing written in the source becomes a
    // navigation target of the page itself.
    const external = BROWSER_ADDRESS.test(href)
    return (
      <a
        href={external ? href : SAME_PAGE}
        {...(external ? { rel: EXTERNAL_REL } : {})}
        onClick={follow}
        className="nt-doc-link"
      >
        {children}
      </a>
    )
  }
  if (href?.startsWith('#')) return <>{children}</>
  const text = plainText(children)
  if (!href || text === href) return <span className="nt-doc-address">{children ?? href}</span>
  return (
    <span>
      {children}
      <span className="nt-doc-address">{` (${href})`}</span>
    </span>
  )
}

/**
 * Drops the newline text nodes mdast-util-to-hast inserts between block children to pretty-print
 * its HTML: they carry no content, and a stylesheet that preserves newlines (a host's own) would
 * show them as a blank line inside a list item or a quote. A plain space between two inline
 * elements (`**a** *b*`) is real content and stays.
 */
function withoutLayoutBreaks(children: ReactNode): ReactNode {
  if (!Array.isArray(children)) return children
  return children.filter(
    (child) => !(typeof child === 'string' && child.includes('\n') && child.trim() === ''),
  )
}

/**
 * The box of a GFM task item: the state as a word, never as a control. A task list is a report,
 * not a form, so it is an `img` with a name rather than a disabled `checkbox`.
 */
function TaskBox({ checked }: { checked: boolean }) {
  const { labels } = useDocument()
  return (
    <span
      role="img"
      aria-label={checked ? labels.taskDone : labels.taskOpen}
      className="nt-doc-task"
    >
      {checked ? (
        <Check aria-hidden="true" strokeWidth={1.75} className="nt-doc-task-check" />
      ) : null}
    </span>
  )
}

/** The little of a hast node this file needs: a value, or children that have one. */
interface TextCarrier {
  type: string
  value?: string | undefined
  children?: TextCarrier[] | undefined
}

/** Everything a node and its descendants say, in order. */
function textOf(node: TextCarrier | undefined): string {
  if (!node) return ''
  if (node.type === 'text') return node.value ?? ''
  return (node.children ?? []).map((child) => textOf(child)).join('')
}

/**
 * The literal source of a fenced block, read from the markdown node instead of from the DOM, less
 * the one trailing newline mdast-util-to-hast appends to every `code` node.
 */
function codeOf(node: TextCarrier | undefined): string {
  const text = textOf(node)
  return text.endsWith('\n') ? text.slice(0, -1) : text
}

/**
 * A fenced block: a scrolling group the keyboard reaches, named, with the caller's copy button over
 * its top-right corner, visible while the block is pointed at or holds the focus.
 *
 * A `group`, not a landmark: a document can hold several blocks, and two landmarks with the same
 * name are a fault of their own (axe: landmark-unique).
 */
function CodeBlock({
  code,
  language,
  source,
  position,
  children,
}: {
  code: () => string
  language?: string | undefined
  source?: SourceProps
  position?: TreeNode['position']
  children: ReactNode
}) {
  const { labels, renderCopy, renderCodeBlock } = useDocument()
  const lines = useHighlighted(code, language)
  if (renderCodeBlock && language !== undefined) {
    const from = position?.start.offset
    const to = position?.end.offset
    const drawn = renderCodeBlock({
      lang: language,
      value: code(),
      position: { from: from ?? 0, to: to ?? 0 },
    })
    if (drawn !== null && drawn !== undefined) return <>{drawn}</>
  }
  return (
    <div
      data-nt-code-block
      className={withFocus('nt-doc-code-block', source ?? {})}
      {...sourceOnly(source)}
    >
      {/* biome-ignore lint/a11y/useSemanticElements: a named group inside a document, not a form. */}
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: a long line scrolls sideways, and WCAG 2.1.1 (axe: scrollable-region-focusable) wants the keyboard to reach that overflow too. */}
      <div role="group" tabIndex={0} aria-label={labels.codeBlock} className="nt-doc-code-region">
        {lines ? (
          <pre data-nt-highlighted className="nt-doc-pre">
            <code>
              <Tokens lines={lines} />
            </code>
          </pre>
        ) : (
          <pre className="nt-doc-pre">{children}</pre>
        )}
      </div>
      {renderCopy ? (
        <div data-nt-code-copy className="nt-doc-code-copy">
          {renderCopy(code)}
        </div>
      ) : null}
    </div>
  )
}

/**
 * The lines of a fenced block coloured by Shiki, when the document asks for it; `null` for a
 * language outside the bundle, and until the grammar has loaded — the block then stands bare.
 */
function useHighlighted(
  code: () => string,
  language: string | undefined,
): HighlightedToken[][] | null {
  const document = useDocument()
  const wanted = document.highlight === true && language !== undefined
  const text = wanted ? code() : ''
  const [lines, setLines] = useState<{ key: string; lines: HighlightedToken[][] } | null>(null)
  const key = `${language ?? ''}\u0000${text}`
  useEffect(() => {
    if (!wanted) return
    let live = true
    highlightCode(text, language).then(
      (found) => {
        if (live && found) setLines({ key, lines: found })
      },
      () => {},
    )
    return () => {
      live = false
    }
  }, [wanted, text, language, key])
  return wanted && lines?.key === key ? lines.lines : null
}

/** Shiki's italic, bold and underline bits as the style of one token. */
function tokenStyle(token: HighlightedToken) {
  const style: Record<string, string> = {}
  if (token.color) style.color = token.color
  if (token.fontStyle && token.fontStyle & 1) style.fontStyle = 'italic'
  if (token.fontStyle && token.fontStyle & 2) style.fontWeight = '600'
  if (token.fontStyle && token.fontStyle & 4) style.textDecoration = 'underline'
  return style
}

/** The tokens of a highlighted block, a newline between two lines, as the source had them. */
function Tokens({ lines }: { lines: HighlightedToken[][] }) {
  return lines.map((line, row) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: the lines of one block, in their order.
    <Fragment key={row}>
      {row === 0 ? null : NEWLINE}
      {line.map((token, column) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the tokens of one line, in their order.
        <span key={column} style={tokenStyle(token)}>
          {token.content}
        </span>
      ))}
    </Fragment>
  ))
}

/**
 * An image of the document: the data URL the caller's loader answers, or — when it answers
 * `null`, or fails — the alt text and the address as text. Nothing shows while it loads: a line of
 * alt text that turns into a picture a moment later moves the page under the reader.
 */
function DocumentImage({
  src,
  alt,
  load,
}: {
  src: string
  alt: string | undefined
  load: ImageLoader
}) {
  const [loaded, setLoaded] = useState<{ src: string; url: string | null } | null>(null)
  useEffect(() => {
    let live = true
    load(src).then(
      (url) => {
        if (live) setLoaded({ src, url })
      },
      () => {
        if (live) setLoaded({ src, url: null })
      },
    )
    return () => {
      live = false
    }
  }, [src, load])
  if (loaded?.src !== src) return null
  if (loaded.url === null) return <ImageAsText src={src} alt={alt} />
  return <img src={loaded.url} alt={alt ?? ''} className="nt-doc-img" />
}

/** An image as text: its alt text and address, never fetched. */
function ImageAsText({ src, alt }: { src: unknown; alt: string | undefined }) {
  return <span className="nt-doc-address">{alt ? `${alt} (${src})` : String(src ?? '')}</span>
}

/**
 * An image: the caller's data URL for a path of the document, text for anything else. An address
 * with a scheme (`https:`, `data:`) or of another host (`//host/x`) is never asked for: an image from
 * outside the document is not shown, whatever the caller's loader would answer.
 */
function Image({ src, alt }: { src: unknown; alt: string | undefined }) {
  const document = useDocument()
  if (document.image && typeof src === 'string' && src.trim() !== '' && isDocumentPath(src)) {
    return <DocumentImage src={src} alt={alt} load={document.image} />
  }
  return <ImageAsText src={src} alt={alt} />
}

/**
 * YAML frontmatter as a small block at the top of the document: folded unless the caller wants it
 * open. Its text is the source, in mono; it is metadata, not part of what is read.
 */
function Frontmatter({ children, source }: { children: ReactNode; source: SourceProps }) {
  const document = useDocument()
  return (
    <details
      {...sourceOnly(source)}
      open={document.frontmatter !== 'folded'}
      className={withFocus('nt-doc-frontmatter', source)}
    >
      <summary className="nt-doc-frontmatter-summary">{document.labels.frontmatter}</summary>
      <pre className="nt-doc-frontmatter-pre">{children}</pre>
    </details>
  )
}

/**
 * A section Contract, folded under Technisch (`foldTechnical`): what it holds is for a developer,
 * so a reader who does not read code passes it by, and one click opens it.
 */
function Technical({ children, source }: { children: ReactNode; source: SourceProps }) {
  const document = useDocument()
  return (
    <details {...sourceOnly(source)} className={withFocus('nt-doc-technical', source)}>
      <summary className="nt-doc-technical-summary">
        {document.labels.technical ?? 'Technical'}
      </summary>
      {children}
    </details>
  )
}

/**
 * The heading remark-gfm puts above the footnotes, kept hidden and in the reader's language: the
 * plugin writes it in English whatever the document is in.
 */
function FootnotesHeading({ id }: { id: string | undefined }) {
  const { labels } = useDocument()
  return (
    <h2 id={id} className="nt-doc-sr-only">
      {labels.footnotes}
    </h2>
  )
}

/** A table wide enough to scroll sideways, named for the same reason as `CodeBlock`. */
function TableRegion({ children, source }: { children: ReactNode; source?: SourceProps }) {
  const { labels } = useDocument()
  const className = withFocus('nt-doc-scrolls', source ?? {})
  const range = sourceOnly(source)
  return (
    // biome-ignore lint/a11y/useSemanticElements: a named group inside a document, not a form.
    // biome-ignore lint/a11y/noNoninteractiveTabindex: the wrapper scrolls a wide table sideways; without tabIndex the keyboard never reaches that overflow.
    <div role="group" tabIndex={0} aria-label={labels.table} className={className} {...range}>
      <table className="nt-doc-table">{children}</table>
    </div>
  )
}

/** The kind `rehypeAlerts` marked a quote with, when it did. */
function alertKindOf(props: object): AlertKind | undefined {
  const kind = (props as { 'data-alert'?: unknown })['data-alert']
  return ALERT_KINDS.find((name) => name === kind)
}

/** A GitHub alert: a named note with its title above the quote's own text. */
function Alert({
  kind,
  source,
  children,
}: {
  kind: AlertKind
  source: SourceProps
  children: ReactNode
}) {
  const { labels } = useDocument()
  return (
    <div
      role="note"
      data-nt-alert={kind}
      className={`nt-doc-alert nt-doc-alert-${kind}`}
      {...source}
    >
      <p className="nt-doc-alert-title">{labels.alerts?.[kind] ?? DEFAULT_ALERT_TITLES[kind]}</p>
      {children}
    </div>
  )
}

/** The class of each heading level: the full scale up to 20px, a level below 3 as a 3. */
const HEADING_CLASS = ['nt-doc-h1', 'nt-doc-h2', 'nt-doc-h3'] as const

/** A heading with the anchor the caller gave it. */
function Heading({
  level,
  node,
  source,
  children,
}: {
  level: 1 | 2 | 3 | 4 | 5 | 6
  node: unknown
  source: SourceProps
  children: ReactNode
}) {
  const id = useHeadingId(node)
  const Tag = `h${level}` as const
  return (
    <Tag
      id={id}
      className={withFocus(HEADING_CLASS[Math.min(level, 3) - 1] ?? 'nt-doc-h3', source)}
      {...sourceOnly(source)}
    >
      {children}
    </Tag>
  )
}

/** A thematic break, inside a box that carries its source range. */
function Rule({ source }: { source: SourceProps }) {
  return (
    <div className={'data-nt-focus' in source ? 'nt-doc-focus' : undefined} {...sourceOnly(source)}>
      <hr aria-orientation="horizontal" className="nt-doc-rule" />
    </div>
  )
}

/** The language a fenced block names (`language-ts` on its `code`), or `undefined`. */
function languageOf(node: unknown): string | undefined {
  const code = (node as TreeNode | undefined)?.children?.find((child) => child.tagName === 'code')
  const classes = code?.properties?.className
  const list = Array.isArray(classes) ? classes : []
  const found = list.find((name) => typeof name === 'string' && name.startsWith('language-'))
  return typeof found === 'string' ? found.slice('language-'.length) : undefined
}

/**
 * How every markdown element looks, built once at module level, so react-markdown gets the same
 * component types on every render and keeps its subtree.
 */
const components: Options['components'] = {
  h1: ({ children, node, ...rest }) => (
    <Heading level={1} node={node} source={sourceOf(rest)}>
      {children}
    </Heading>
  ),
  // The only `h2` not written by the author is the one remark-gfm generates for the footnotes; it
  // is recognised by its fixed id, not by its text.
  h2: ({ children, id, node, ...rest }) =>
    id === 'footnote-label' ? (
      <FootnotesHeading id={id} />
    ) : (
      <Heading level={2} node={node} source={sourceOf(rest)}>
        {children}
      </Heading>
    ),
  h3: ({ children, node, ...rest }) => (
    <Heading level={3} node={node} source={sourceOf(rest)}>
      {children}
    </Heading>
  ),
  h4: ({ children, node, ...rest }) => (
    <Heading level={4} node={node} source={sourceOf(rest)}>
      {children}
    </Heading>
  ),
  h5: ({ children, node, ...rest }) => (
    <Heading level={5} node={node} source={sourceOf(rest)}>
      {children}
    </Heading>
  ),
  h6: ({ children, node, ...rest }) => (
    <Heading level={6} node={node} source={sourceOf(rest)}>
      {children}
    </Heading>
  ),
  p: ({ children, node: _node, ...rest }) => (
    <p className={withFocus('nt-doc-p', rest)} {...sourceOf(rest)}>
      {children}
    </p>
  ),
  strong: ({ children }) => <strong className="nt-doc-strong">{children}</strong>,
  em: ({ children }) => <em className="nt-doc-em">{children}</em>,
  ul: ({ children, node: _node, ...rest }) => (
    <ul className={withFocus('nt-doc-list nt-doc-ul', rest)} {...sourceOf(rest)}>
      {children}
    </ul>
  ),
  ol: ({ children, node: _node, ...rest }) => (
    <ol className={withFocus('nt-doc-list nt-doc-ol', rest)} {...sourceOf(rest)}>
      {children}
    </ol>
  ),
  // `class` is not something markdown can set; the only one that ever arrives here is the
  // `task-list-item` that remark-gfm puts on an item with a checkbox.
  li: ({ children, className, node: _node, ...rest }) => (
    <li
      className={withFocus(
        className?.includes('task-list-item') ? 'nt-doc-li nt-doc-task-item' : 'nt-doc-li',
        rest,
      )}
    >
      {withoutLayoutBreaks(children)}
    </li>
  ),
  a: ({ children, href, ...rest }) => (
    <Reference href={href} backref={BACKREF in rest}>
      {children}
    </Reference>
  ),
  img: ({ src, alt }) => <Image src={src} alt={alt} />,
  code: ({ children }) => <code className="nt-doc-code">{children}</code>,
  // The code is flattened when the copy button is pressed, not here.
  pre: ({ children, node, ...rest }) => (
    <CodeBlock
      code={() => codeOf(node)}
      language={languageOf(node)}
      source={sourceOf(rest)}
      position={(node as TreeNode | undefined)?.position}
    >
      {children}
    </CodeBlock>
  ),
  blockquote: ({ children, node: _node, ...rest }) => {
    const kind = alertKindOf(rest)
    return kind ? (
      <Alert kind={kind} source={sourceOf(rest)}>
        {withoutLayoutBreaks(children)}
      </Alert>
    ) : (
      <blockquote className={withFocus('nt-doc-quote', rest)} {...sourceOf(rest)}>
        {withoutLayoutBreaks(children)}
      </blockquote>
    )
  },
  hr: ({ node: _node, ...rest }) => <Rule source={sourceOf(rest)} />,
  table: ({ children, node: _node, ...rest }) => (
    <TableRegion source={sourceOf(rest)}>{children}</TableRegion>
  ),
  // The YAML frontmatter (`frontmatterAsDetails`) or a section Contract (`technicalAsDetails`).
  details: ({ children, node: _node, ...rest }) =>
    'data-nt-technical' in rest ? (
      <Technical source={sourceOf(rest)}>{children}</Technical>
    ) : (
      <Frontmatter source={sourceOf(rest)}>{children}</Frontmatter>
    ),
  // A row carries a class only while it is in focus, so the golden HTML of a table stays bare.
  tr: ({ children, node: _node, ...rest }) => (
    <tr className={'data-nt-focus' in rest ? 'nt-doc-focus' : undefined}>{children}</tr>
  ),
  th: ({ children }) => <th className="nt-doc-th">{children}</th>,
  td: ({ children }) => <td className="nt-doc-td">{children}</td>,
  input: ({ type, checked }) =>
    type === 'checkbox' ? <TaskBox checked={checked === true} /> : null,
}

/** The node of a remark or rehype tree, as far as the two plugins below need it. */
interface TreeNode {
  type: string
  value?: string
  tagName?: string
  properties?: Record<string, unknown>
  position?: { start: { line?: number; offset?: number }; end: { offset?: number } }
  data?: Record<string, unknown>
  children?: TreeNode[]
}

/**
 * Turns YAML frontmatter into a `details` element with its text, which the `details` mapping
 * above draws folded. Without it, react-markdown would drop the node, and without
 * remark-frontmatter the fence would read as a rule with a heading under it.
 */
function frontmatterAsDetails() {
  return (tree: TreeNode) => {
    for (const node of tree.children ?? []) {
      if (node.type !== 'yaml') continue
      // A type of its own: mdast-util-to-hast ignores `yaml` on purpose, and hands anything it
      // does not know to its default handler, which honours `hName` and `hChildren`.
      node.type = 'ntFrontmatter'
      node.data = { hName: 'details', hChildren: [{ type: 'text', value: node.value ?? '' }] }
    }
  }
}

/** The names of a section that is for a developer only: folded under Technisch. */
const TECHNICAL_SECTIONS = ['contract']

/** The words of a heading node, lower case, without a number before them. */
function headingWords(node: TreeNode): string {
  const words = (inner: TreeNode): string =>
    inner.value ?? (inner.children ?? []).map((child) => words(child)).join('')
  return words(node)
    .replace(/^\s*\d+(\.\d+)*\.?\s*/, '')
    .trim()
    .toLowerCase()
}

/**
 * Folds a section Contract into a `details` element: the
 * heading and everything under it up to the next heading as high, which the `details` mapping
 * draws closed under the label Technisch. A reader who does not read code passes it by; one
 * click opens it. Only a section of the top of the tree: a Contract inside a list is no section.
 */
function technicalAsDetails() {
  return (tree: TreeNode) => {
    const children = tree.children ?? []
    const out: TreeNode[] = []
    for (let index = 0; index < children.length; index++) {
      const node = children[index] as TreeNode
      const depth = node.type === 'heading' ? (node as { depth?: number }).depth : undefined
      if (depth === undefined || !TECHNICAL_SECTIONS.includes(headingWords(node))) {
        out.push(node)
        continue
      }
      const section = [node]
      while (index + 1 < children.length) {
        const next = children[index + 1] as TreeNode
        const nextDepth = next.type === 'heading' ? (next as { depth?: number }).depth : undefined
        if (nextDepth !== undefined && nextDepth <= depth) break
        section.push(next)
        index++
      }
      const last = section.at(-1) as TreeNode
      out.push({
        type: 'ntTechnical',
        data: { hName: 'details', hProperties: { dataNtTechnical: '' } },
        children: section,
        ...(node.position && last.position
          ? { position: { start: node.position.start, end: last.position.end } }
          : {}),
      })
    }
    tree.children = out
  }
}

/**
 * Folds every soft line break of the text into a space, as CommonMark reads it: a document is
 * wrapped at a fixed width in its source, and those line endings are not the author's breaks.
 *
 * Done on the text itself rather than left to the stylesheet, so the website's copy draws the same
 * whatever its CSS does. Only `text` nodes: code, inline code and frontmatter keep their lines, and
 * a hard break (two spaces or a backslash) is a `break` node of its own. The chat keeps a single
 * newline as a break on purpose, but it draws answers with its own renderer, not with this one.
 */
function softBreaksAsSpaces() {
  const fold = (node: TreeNode): void => {
    if (node.type === 'text' && node.value !== undefined) {
      // The line break after an alert marker (`[!NOTE]`) is what tells it from a quote that merely
      // starts with those characters; `rehypeAlerts` strips it, so it is the one break kept.
      const alert = alertOf(node.value)
      const keep = alert ? node.value.slice(0, node.value.length - alert.rest.length) : ''
      node.value = keep + (alert ? alert.rest : node.value).replace(/[ \t]*\r?\n[ \t]*/g, ' ')
    }
    for (const child of node.children ?? []) fold(child)
  }
  return fold
}

/**
 * Puts the source range of every top-level block on its element (`data-source-from`/`-to`), from
 * the positions the parser left on the tree, with a heading's start as {@link sourceStart} gives it.
 */
function sourceRanges() {
  const mark = (nodes: readonly TreeNode[]) => {
    for (const node of nodes) {
      // The blocks of a folded section Technisch stay blocks of the document: a jump reaches them.
      if (node.type === 'element' && node.properties?.dataNtTechnical !== undefined) {
        mark(node.children ?? [])
      }
      const from = sourceStart(node)
      const to = node.position?.end.offset
      if (node.type !== 'element' || from === undefined || to === undefined) continue
      node.properties = { ...node.properties, dataSourceFrom: from, dataSourceTo: to }
    }
  }
  return (tree: TreeNode) => mark(tree.children ?? [])
}

/** The range of a node in the source, from the positions the parser left on it. */
function rangeOf(node: TreeNode): DocFocusRange | null {
  const from = sourceStart(node)
  const to = node.position?.end.offset
  return from === undefined || to === undefined ? null : { from, to }
}

/** The elements of a tree with a tag, at any depth: the rows of a table under its head and body. */
function elementsOf(node: TreeNode, tag: string): TreeNode[] {
  return (node.children ?? []).flatMap((child) =>
    child.type !== 'element'
      ? []
      : child.tagName === tag
        ? [child]
        : child.tagName === 'ul' || child.tagName === 'ol'
          ? []
          : elementsOf(child, tag),
  )
}

/**
 * Marks the blocks the focus touches: a top-level block, or
 * — for a list or a table — the items or rows it touches, so a review lights one point of a list
 * rather than all of it. A range that touches none of them marks the list or table itself.
 */
function focusBlocks(ranges: readonly DocFocusRange[]) {
  const touches = (node: TreeNode) => {
    const range = rangeOf(node)
    if (range === null) return false
    return ranges.some(
      (focus) => range.from < Math.max(focus.to, focus.from + 1) && range.to > focus.from,
    )
  }
  const mark = (node: TreeNode) => {
    node.properties = { ...node.properties, dataNtFocus: true }
  }
  return () => (tree: TreeNode) => {
    for (const node of tree.children ?? []) {
      if (node.type !== 'element' || !touches(node)) continue
      const tag = node.tagName
      const parts =
        tag === 'ul' || tag === 'ol'
          ? elementsOf(node, 'li')
          : tag === 'table'
            ? elementsOf(node, 'tr')
            : []
      const touched = parts.filter(touches)
      if (touched.length > 0) for (const part of touched) mark(part)
      else mark(node)
    }
  }
}

/**
 * Tables, task lists, autolinks and YAML frontmatter — the syntax core parses with
 * `@nt/markdown`, so an offset core gives (a heading's anchor, a block) is the offset here.
 *
 * Deliberately no `rehype-raw` or any other HTML plugin: react-markdown then turns raw HTML into
 * literal text rather than into live elements, so the tree holds React elements only and no
 * `dangerouslySetInnerHTML`.
 */
const remarkPlugins: Options['remarkPlugins'] = [
  remarkGfm,
  [remarkFrontmatter, ['yaml']],
  frontmatterAsDetails,
  softBreaksAsSpaces,
]
/** The same, with a section Contract folded (`foldTechnical`): a second constant, as below. */
const remarkPluginsFolded: Options['remarkPlugins'] = [...remarkPlugins, technicalAsDetails]
const rehypePlugins: Options['rehypePlugins'] = [sourceRanges]
/** Two module constants, so react-markdown keeps its subtree; alerts are marked before the ranges. */
const rehypePluginsWithAlerts: Options['rehypePlugins'] = [rehypeAlerts, sourceRanges]

/**
 * Addresses reach the components as written: nothing is ever followed unless `mayLink` and the
 * caller's `linkable` say so, and an image is only ever the data URL the caller answered.
 * react-markdown's own transform would blank a `javascript:` address, and the reader could no
 * longer see what it was.
 */
const asWritten = (url: string) => url

/**
 * A markdown document in the typography of the app: the stand Lezen of a file or a spec, and a
 * document on the website. Never renders raw HTML.
 *
 * Styled by `doc-view.css` on the design tokens (`var(--nt-*)`); every top-level block carries its
 * source range, a heading the anchor the caller gave it.
 */
export function DocProse({
  markdown,
  labels,
  renderCopy,
  focus = null,
  ...options
}: DocProseProps): ReactNode {
  const ranges: readonly DocFocusRange[] = focus === null ? [] : 'from' in focus ? [focus] : focus
  const key = ranges.map((range) => `${range.from}-${range.to}`).join(',')
  // A new list of plugins only when the focus moves; without one, the constant list.
  const alerts = options.alerts === true
  // biome-ignore lint/correctness/useExhaustiveDependencies: the key is the focus, by value.
  const plugins = useMemo(() => {
    const base = alerts ? rehypePluginsWithAlerts : rehypePlugins
    return ranges.length === 0 ? base : [...(base ?? []), focusBlocks(ranges)]
  }, [key, alerts])
  return (
    <DocumentContext.Provider value={{ ...options, labels, renderCopy }}>
      <div className="nt-doc">
        <Markdown
          components={components}
          remarkPlugins={options.foldTechnical === true ? remarkPluginsFolded : remarkPlugins}
          rehypePlugins={plugins}
          urlTransform={asWritten}
        >
          {markdown}
        </Markdown>
      </div>
    </DocumentContext.Provider>
  )
}
