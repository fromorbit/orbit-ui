import { DocProse, type DocProseLabels, type DocProseOptions } from '@fromorbit/doc-view'
import { createContext, Fragment, type ReactNode, useContext, useMemo, useState } from 'react'
import Markdown, { type Options } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Tooltip } from '../overlays/Tooltip'
import { Icon } from '../primitives/Icon'
import { IconButton } from '../primitives/IconButton'
import { Separator } from '../primitives/Separator'
import { CopyButton, type CopyButtonLabels } from './CopyButton'
import { createMarkdownCache } from './markdown-cache'

/**
 * Flattens the children react-markdown hands a component into plain text, or `undefined` when the
 * node holds anything but text.
 *
 * Only used to decide how to present a link: the address of `<https://x>` is both its text and its
 * target, and showing it twice would read as a mistake.
 */
function plainText(children: ReactNode): string | undefined {
  if (typeof children === 'string') return children
  if (Array.isArray(children) && children.every((child) => typeof child === 'string')) {
    return children.join('')
  }
  return undefined
}

/** Where a reference stands in a piece of text: `[start, end)`. */
export interface ProseMatch {
  start: number
  end: number
}

/**
 * What a caller offers `Prose` to turn pieces of an answer into something else — a path into a
 * link to its file — without `Prose` knowing what they are.
 *
 * `find` is asked about every text of a paragraph, a list item, a table cell, bold and italic, and
 * about the whole of every inline code; never about a fenced block, a link or a heading. It runs at every render of a streaming answer, so it must be cheap.
 * `render` draws one match, with the text it covers.
 */
export interface ProseReferences<M extends ProseMatch = ProseMatch> {
  find(text: string, where: 'code' | 'text'): readonly M[]
  render(match: M, text: string): ReactNode
  /**
   * Draws a link of the answer as something else — an address of a pull request as its chip —
   * or `undefined` to leave it as it was. Asked about every link but an anchor into the answer
   * itself, with the link's words when they are plain text. A bare address is replaced whole; a
   * named link keeps its words and gets the drawing in place of its address, unless the drawing
   * says it stands `alone` because the words say nothing more than it does.
   */
  link?(href: string, words: string | undefined): ProseLink | undefined
}

/** What `ProseReferences.link` draws for a link. */
export interface ProseLink {
  drawn: ReactNode
  /** The words of a named link only repeat the drawing (`[#12](…/pull/12)`), so they go. */
  alone?: boolean
}

/**
 * The references of the `Prose` around a component; `null` without them, and then nothing changes.
 *
 * A context rather than components rebuilt per render: the map of components stays one module
 * constant, so react-markdown keeps its subtree across the deltas of a stream.
 */
const ReferencesContext = createContext<ProseReferences | null>(null)

/**
 * The words of `Prose`, in the host's language: those of `DocProse` for a document, and for an
 * answer the names of its code blocks and tables, the wrap toggle and the copy button.
 *
 * @see `DocProseLabels` in `@fromorbit/doc-view`
 */
export interface ProseLabels extends DocProseLabels {
  /** The wrap toggle of a code block while lines scroll: "Regels afbreken". */
  codeWrap: string
  /** The same toggle while they wrap: "Regels niet afbreken". */
  codeWrapOff: string
  /** The copy button of every fenced block. */
  copy: CopyButtonLabels
}

/**
 * The words of the `Prose` around a component. A context for the same reason as the references:
 * the components stay module constants, and a parsed answer from the cache reads today's words.
 */
const LabelsContext = createContext<ProseLabels | null>(null)

/** The words of the nearest `Prose`; every component that reads them stands inside one. */
function useProseLabels(): ProseLabels {
  const labels = useContext(LabelsContext)
  if (labels === null) throw new Error('A part of Prose is drawn outside a Prose')
  return labels
}

/** Whether an element stands inside a fenced block, where nothing is offered. */
const InsideBlockContext = createContext(false)

/**
 * What a caller offers `Prose` to show a markdown **document** rather than an answer: the stand
 * Lezen of the file tab and of a spec. Without it, `Prose` draws the chat exactly as
 * before.
 *
 * The document itself is drawn by `DocProse` of `@fromorbit/doc-view`, the view the website shares;
 * `Prose` only gives it the words of the app's catalogue and its copy button.
 */
export type ProseDocument = DocProseOptions

/** The string children of a text element with their references drawn, the rest as it was. */
function Linked({ children }: { children: ReactNode }): ReactNode {
  const references = useContext(ReferencesContext)
  if (!references) return children
  if (typeof children === 'string') {
    const matches = references.find(children, 'text')
    return matches.length === 0 ? children : split(children, matches, references)
  }
  if (!Array.isArray(children)) return children
  return children.map((child, index) => {
    if (typeof child !== 'string') return child
    const matches = references.find(child, 'text')
    if (matches.length === 0) return child
    // biome-ignore lint/suspicious/noArrayIndexKey: the children of one text node, in their order.
    return <Fragment key={index}>{split(child, matches, references)}</Fragment>
  })
}

/**
 * A text cut at its matches, each match drawn by `render`. Kept out of the JSX above: the scan for
 * hardcoded copy reads source text, and a comparison between tags reads to it as words.
 */
function split(
  text: string,
  matches: readonly ProseMatch[],
  references: ProseReferences,
): ReactNode[] {
  const drawn: ReactNode[] = []
  let at = 0
  for (const match of matches) {
    if (match.start < at) continue
    if (match.start !== at) drawn.push(text.slice(at, match.start))
    const covered = text.slice(match.start, match.end)
    drawn.push(<Fragment key={match.start}>{references.render(match, covered)}</Fragment>)
    at = match.end
  }
  if (at !== text.length) drawn.push(text.slice(at))
  return drawn
}

/** Inline code, or — when it is one reference as a whole — that reference in its place. */
function InlineCode({ children }: { children: ReactNode }): ReactNode {
  const references = useContext(ReferencesContext)
  const inside = useContext(InsideBlockContext)
  const text = plainText(children)
  if (references && !inside && text !== undefined) {
    const [match] = references.find(text, 'code')
    if (match) return references.render(match, text)
  }
  return <code className="rounded-sm bg-surface px-1 py-0.5 font-mono text-[12px]">{children}</code>
}

/**
 * The property remark-gfm puts on the `↩` link that leads from a footnote back to its marker.
 *
 * A module-level constant rather than a literal in the mapping below, because a string in JSX
 * position is exactly what the i18n guard hunts for (`shared/i18n/i18n.test.ts`).
 */
const BACKREF = 'data-footnote-backref'

/**
 * A markdown link, rendered as text rather than as a link.
 *
 * Nothing here is clickable on purpose: `main` denies `window.open` and blocks cross-origin
 * navigation, and there is no host service yet that opens an address in the user's browser. A dead
 * `<a>` would look like a link and do nothing, so the address is shown instead — plain, copyable,
 * and visibly not a control.
 *
 * Two kinds of link never show their address. A back-reference is a way to jump from a note to the
 * marker that called it, and in a timeline nothing navigates, so it leaves entirely rather than
 * sitting at the end of every note as an arrow that does nothing. An anchor into the answer itself
 * — the marker remark-gfm writes for a footnote — keeps only its number: spelling out
 * `#user-content-fn-1` would bury a one-character marker under twenty characters of plumbing.
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
  const references = useContext(ReferencesContext)
  if (backref) return null
  if (href?.startsWith('#')) return <>{children}</>
  const text = plainText(children)
  const link = href ? references?.link?.(href, text) : undefined
  if (link !== undefined) {
    return text === href || link.alone ? (
      link.drawn
    ) : (
      <span>
        {children} {link.drawn}
      </span>
    )
  }
  if (!href || text === href)
    return <span className="font-mono text-muted">{children ?? href}</span>
  return (
    <span>
      {children}
      <span className="font-mono text-muted">{` (${href})`}</span>
    </span>
  )
}

/**
 * Drops the newline text nodes mdast-util-to-hast inserts between block children to pretty-print
 * its HTML.
 *
 * They carry no content, but under `white-space: pre-line` they would show as a blank line inside
 * a list item or a quote. Only whitespace that contains a newline goes: a plain space between two
 * inline elements (`**a** *b*`) is real content and stays.
 */
function withoutLayoutBreaks(children: ReactNode): ReactNode {
  if (!Array.isArray(children)) return children
  return children.filter(
    (child) => !(typeof child === 'string' && child.includes('\n') && child.trim() === ''),
  )
}

/**
 * The box of a GFM task item: the state as a word, never as a control.
 *
 * Drawn here rather than left to the browser's own checkbox, which would be the only piece of
 * native chrome in a conversation. A task list is a report, not a form: nothing about it is
 * operable, so it is an `img` with a name rather than a disabled `checkbox`. Status is never
 * carried by colour or shape alone, hence the word.
 */
function TaskBox({ checked }: { checked: boolean }) {
  const labels = useProseLabels()
  return (
    <span
      role="img"
      aria-label={checked ? labels.taskDone : labels.taskOpen}
      className="mr-2 inline-flex size-3.5 shrink-0 items-center justify-center rounded-sm border border-border align-middle"
    >
      {/* `xs`: the box is 14px with a 1px border, so 12px is what fits inside it. */}
      {checked ? <Icon name="check" size="xs" /> : null}
    </span>
  )
}

/** The little of a hast node this file needs: a value, or children that have one. */
interface TextCarrier {
  type: string
  value?: string | undefined
  properties?: { className?: unknown } | undefined
  children?: TextCarrier[] | undefined
}

/** The language a fenced block names (`language-mermaid` on its `code`), or `undefined`. */
function languageOf(node: TextCarrier | undefined): string | undefined {
  const names = node?.children?.[0]?.properties?.className
  const named = Array.isArray(names)
    ? names.find((n): n is string => typeof n === 'string' && n.startsWith('language-'))
    : undefined
  return named?.slice('language-'.length)
}

/**
 * What a caller offers `Prose` to draw a fenced block of an answer as something else (a diagram, a
 * chart); `null` leaves the block as a code block. The second argument is that code block, for a
 * drawing that may fail and then gives way to it.
 */
export type ProseBlocks = (
  block: { lang: string; value: string; position: { from: number; to: number } },
  fallback: ReactNode,
) => ReactNode

const BlocksContext = createContext<ProseBlocks | null>(null)

/** Everything a node and its descendants say, in order. */
function textOf(node: TextCarrier | undefined): string {
  if (!node) return ''
  if (node.type === 'text') return node.value ?? ''
  return (node.children ?? []).map((child) => textOf(child)).join('')
}

/**
 * The literal source of a fenced block, read from the markdown node instead of from the DOM.
 *
 * The DOM is a rendering: it holds whatever `components` made of the block, and a reader who
 * selects it gets the element's text, not the agent's. The node still holds exactly what stood
 * between the fences.
 *
 * Exactly one trailing newline goes, and only at the end of the whole block: mdast-util-to-hast
 * appends it to the value of every `code` node to pretty-print its `<pre><code>…\n</code></pre>`,
 * so it is the parser's, not the agent's. Blank lines *inside* the block are untouched.
 */
function codeOf(node: TextCarrier | undefined): string {
  const text = textOf(node)
  return text.endsWith('\n') ? text.slice(0, -1) : text
}

/**
 * A block that scrolls sideways: a tab stop, and therefore a named one, with a button that takes
 * the code along.
 *
 * `ScrollArea` sets the precedent: a viewport reachable by keyboard needs an accessible name,
 * since a screen-reader user who lands there has nothing else to go on. Axe's
 * `scrollable-region-focusable` only asks for the tab stop, not for the name, so this is on us.
 *
 * The button sits outside the scrolling region and over its top-right corner. Inside it would
 * scroll away with a long first line, and it would cover text that a reader then could not scroll
 * back to; out here it always stands in the same place, and it is only visible while the block is
 * hovered or holds the focus — hidden with opacity, so it keeps both its place in the tab order
 * and its room on screen.
 */
function CodeBlock({ code, children }: { code: () => string; children: ReactNode }) {
  const labels = useProseLabels()
  // Long lines either scroll (a thumb that stays visible, since the app's own bar shows only on
  // hover and a block cut off at the edge looked like it ended there) or wrap, by choice.
  const [wrap, setWrap] = useState(false)
  const region = wrap ? CODE_REGION_WRAPPED : CODE_REGION
  return (
    // A named group: the message around this block is a `group` of its own (its own row of time
    // and copy button hangs off it), and an unnamed `group-hover` would answer to that one too,
    // so pointing at a sentence would light up every code block in the answer.
    <div data-nt-code-block className="group/code relative">
      {/* `group`, not a landmark: an answer can hold several code blocks, and two landmarks with
          the same name are a fault of their own (axe: landmark-unique). A group still carries a
          name. */}
      {/* biome-ignore lint/a11y/useSemanticElements: a named group inside an answer, not a form. */}
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: a long line scrolls sideways, and WCAG 2.1.1 (axe: scrollable-region-focusable) wants the keyboard to reach that overflow too. */}
      <div role="group" tabIndex={0} aria-label={labels.codeBlock} className={region}>
        <InsideBlockContext.Provider value={true}>
          <pre className={wrap ? PRE_WRAPPED : PRE}>{children}</pre>
        </InsideBlockContext.Provider>
      </div>
      <div data-nt-code-copy className={CODE_COPY}>
        <Tooltip label={wrap ? labels.codeWrapOff : labels.codeWrap}>
          <IconButton
            icon="wrap-text"
            size="sm"
            label={wrap ? labels.codeWrapOff : labels.codeWrap}
            aria-pressed={wrap}
            onClick={() => setWrap(!wrap)}
          />
        </Tooltip>
        <CopyButton text={code} {...labels.copy} />
      </div>
    </div>
  )
}

/** The languages whose fence is a document: markdown is meant to be read, not to scroll sideways. */
const MARKDOWN_LANGS: ReadonlySet<string> = new Set(['md', 'markdown'])

/** What the markdown inside a fence is drawn with: plain, no link and no image of its own. */
const FENCE_DOCUMENT: ProseDocument = {
  onLink: () => {},
  linkable: () => false,
  frontmatter: 'folded',
}

/**
 * A fenced block in `md` or `markdown`: the text drawn as a document inside a framed surface, with
 * the copy button taking the markdown source along. A long Skill or document an agent shows in
 * an answer reads as text then, instead of as one wide line of code behind a scrollbar.
 */
function MarkdownFence({ code }: { code: () => string }) {
  const labels = useProseLabels()
  return (
    <div data-nt-code-block data-nt-markdown-fence className="group/code relative">
      <div className="rounded-md border border-border bg-surface p-3">
        <DocumentView markdown={code()} document={FENCE_DOCUMENT} labels={labels} />
      </div>
      <div data-nt-code-copy className={CODE_COPY}>
        <CopyButton text={code} {...labels.copy} />
      </div>
    </div>
  )
}

/** A fenced block of an answer: drawn by the caller's `blocks` when it can, else the code block. */
function FencedBlock({ node, children }: { node: TextCarrier | undefined; children: ReactNode }) {
  const blocks = useContext(BlocksContext)
  const inside = useContext(InsideBlockContext)
  const code = <CodeBlock code={() => codeOf(node)}>{children}</CodeBlock>
  const lang = languageOf(node)
  if (!inside && lang !== undefined && MARKDOWN_LANGS.has(lang.toLowerCase())) {
    return <MarkdownFence code={() => codeOf(node)} />
  }
  if (!blocks || lang === undefined) return code
  return blocks({ lang, value: codeOf(node), position: { from: 0, to: 0 } }, code) ?? code
}

/** An image as text: its alt text and address, never fetched. */
function ImageAsText({ src, alt }: { src: unknown; alt: string | undefined }) {
  return <span className="font-mono text-muted">{alt ? `${alt} (${src})` : String(src ?? '')}</span>
}

/**
 * The heading remark-gfm puts above the footnotes, kept hidden and in the app's own language.
 *
 * remark-gfm writes `<h2 id="footnote-label" class="sr-only">Footnotes</h2>`: a name for the
 * section, meant for a screen reader only. The class is dropped by the `h2` mapping below, which
 * would leave a 15px English "Footnotes" title in the middle of a Dutch answer that nobody wrote.
 * So the class comes back and the word comes from the host's `labels` instead of from the plugin.
 */
function FootnotesHeading({ id }: { id: string | undefined }) {
  const labels = useProseLabels()
  return (
    <h2 id={id} className="sr-only">
      {labels.footnotes}
    </h2>
  )
}

/** A table wide enough to scroll sideways, named for the same reason as `CodeBlock`. */
function TableRegion({ children }: { children: ReactNode }) {
  const labels = useProseLabels()
  return (
    // biome-ignore lint/a11y/useSemanticElements: a named group inside an answer, not a form.
    // biome-ignore lint/a11y/noNoninteractiveTabindex: the wrapper scrolls a wide table sideways; without tabIndex the keyboard never reaches that overflow.
    <div role="group" tabIndex={0} aria-label={labels.table} className={SCROLLS}>
      <table className="w-full border-collapse text-[13px]">{children}</table>
    </div>
  )
}

// A block that can scroll sideways, focusable so the keyboard reaches its overflow too.
const SCROLLS =
  'no-drag overflow-x-auto outline-focus focus-visible:outline-2 focus-visible:outline-offset-2'
const CODE_REGION = `${SCROLLS} rounded-md border border-border bg-surface p-3 [&::-webkit-scrollbar-thumb]:bg-(--nt-scrollbar-thumb)`
// Quiet until you go there: 100 ms is the shortest step the guidelines allow, and under reduced
// motion there is no step at all. Opacity only, so nothing moves when it appears — and no reach
// while it is invisible, or it would swallow a selection drag that starts at the right end of the
// first line. Focus is unaffected: `pointer-events` says nothing about the keyboard, and landing
// on the button is itself what makes the block show it.
const CODE_COPY =
  'absolute top-1 right-1 flex items-center gap-0.5 opacity-0 pointer-events-none transition-opacity duration-100 ease-out group-hover/code:opacity-100 group-hover/code:pointer-events-auto group-focus-within/code:opacity-100 group-focus-within/code:pointer-events-auto motion-reduce:transition-none'
// The thumb of a code block stays visible at rest, so a line that runs on past the edge says so;
// the rest of the app shows its scrollbars only while they are pointed at (index.css).
const CODE_REGION_WRAPPED =
  'no-drag rounded-md border border-border bg-surface p-3 outline-focus focus-visible:outline-2 focus-visible:outline-offset-2'
const PRE_WRAPPED =
  'm-0 font-mono text-[12px] leading-normal whitespace-pre-wrap break-words [&>code]:bg-transparent [&>code]:p-0'
const PRE = 'm-0 font-mono text-[12px] leading-normal [&>code]:bg-transparent [&>code]:p-0'
// The capped scale of a conversation: an answer is not a document, so a `#` heading must not tower
// over the text around it.
const HEADING_LARGE = 'm-0 mt-2 text-[15px] font-medium first:mt-0'
const HEADING_SMALL = 'm-0 mt-2 text-[13px] font-medium first:mt-0'
// `whitespace-normal` undoes the `pre-line` a list inherits from the item it is nested in: a list
// holds no text of its own, so the newlines to-hast puts between its items are layout only.
const LIST = 'm-0 whitespace-normal pl-4'
const ITEM = 'm-0 whitespace-pre-line text-[13px] leading-normal'
// A task item carries a checkbox instead of a marker, but keeps the indent of the list it is in,
// so the boxes line up with the bullets and numbers around them.
const TASK_ITEM = `${ITEM} list-none`

/** A heading on the chat's capped scale. */
function Heading({ level, children }: { level: 1 | 2 | 3 | 4 | 5 | 6; children: ReactNode }) {
  const Tag = `h${level}` as const
  return <Tag className={level <= 2 ? HEADING_LARGE : HEADING_SMALL}>{children}</Tag>
}

/**
 * How every markdown element looks, built once at module level.
 *
 * The timeline re-renders `Prose` with the whole answer on every streamed delta; a map rebuilt per
 * render would give react-markdown a new component type for each element each time, throwing away
 * the whole subtree on every token.
 */
const components: Options['components'] = {
  h1: ({ children }) => <Heading level={1}>{children}</Heading>,
  // The only `h2` that is not written by the agent is the one remark-gfm generates for the
  // footnotes; it is recognised by its fixed id, not by its text, which the plugin writes in
  // English whatever the answer is in.
  h2: ({ children, id }) =>
    id === 'footnote-label' ? (
      <FootnotesHeading id={id} />
    ) : (
      <Heading level={2}>{children}</Heading>
    ),
  h3: ({ children }) => <Heading level={3}>{children}</Heading>,
  h4: ({ children }) => <Heading level={4}>{children}</Heading>,
  h5: ({ children }) => <Heading level={5}>{children}</Heading>,
  h6: ({ children }) => <Heading level={6}>{children}</Heading>,
  // `pre-line`: an agent writes plain lines at least as often as markdown, and markdown itself
  // would fold a single newline into the previous line.
  p: ({ children }) => (
    <p className="m-0 whitespace-pre-line text-[13px] leading-normal">
      <Linked>{children}</Linked>
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold">
      <Linked>{children}</Linked>
    </strong>
  ),
  em: ({ children }) => (
    <em className="italic">
      <Linked>{children}</Linked>
    </em>
  ),
  ul: ({ children }) => <ul className={`${LIST} list-disc`}>{children}</ul>,
  ol: ({ children }) => <ol className={`${LIST} list-decimal`}>{children}</ol>,
  // `class` is not something markdown can set; the only one that ever arrives here is the
  // `task-list-item` that remark-gfm puts on an item with a checkbox.
  li: ({ children, className }) => (
    <li className={className?.includes('task-list-item') ? TASK_ITEM : ITEM}>
      <Linked>{withoutLayoutBreaks(children)}</Linked>
    </li>
  ),
  a: ({ children, href, ...rest }) => (
    <Reference href={href} backref={BACKREF in rest}>
      {children}
    </Reference>
  ),
  // Never fetched: the alt text and the address, the same shape as a link. A remote image would
  // also be refused by the app's content security policy.
  img: ({ src, alt }) => <ImageAsText src={src} alt={alt} />,
  code: ({ children }) => <InlineCode>{children}</InlineCode>,
  // The inner `code` drops its own chip styling: inside a block it is the block that carries the
  // surface, the border and the scroll.
  // The code is flattened when the button is pressed, not here: the timeline re-renders `Prose`
  // with the whole answer on every streamed delta, and walking every code block's node each time
  // would build strings nobody has asked for.
  pre: ({ children, node }) => <FencedBlock node={node}>{children}</FencedBlock>,
  blockquote: ({ children }) => (
    <blockquote className="m-0 whitespace-pre-line border-l border-border pl-3 text-[13px] leading-normal text-muted">
      {withoutLayoutBreaks(children)}
    </blockquote>
  ),
  hr: () => <Separator />,
  table: ({ children }) => <TableRegion>{children}</TableRegion>,
  th: ({ children }) => (
    <th className="border border-border px-2 py-1 text-left font-medium">
      <Linked>{children}</Linked>
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-border px-2 py-1">
      <Linked>{children}</Linked>
    </td>
  ),
  input: ({ type, checked }) =>
    type === 'checkbox' ? <TaskBox checked={checked === true} /> : null,
}

/**
 * Tables, task lists and autolinks; nothing that would need raw HTML.
 *
 * Deliberately no `rehype-raw` or any other HTML plugin: react-markdown then turns raw HTML in an
 * answer into literal text rather than into live elements, so the tree holds React elements only
 * and no `dangerouslySetInnerHTML`. `Prose.test.tsx` pins that down.
 */
const plugins = [remarkGfm]

/** How many finished answers stay parsed: a few long chats' worth, a few MB at most. */
const SETTLED_ANSWERS = 2_000

/**
 * The markdown of a finished answer as `Markdown` draws it, parsed once (see `createMarkdownCache`).
 *
 * Called as a function rather than mounted: `Markdown` uses no hooks, and its output depends on the
 * text alone — `components` and `plugins` are the module constants above, and what the components
 * read (references, blocks) they take from context when they render, not from here.
 */
const settledAnswer = createMarkdownCache(
  (text: string) => Markdown({ children: text, components, remarkPlugins: plugins }),
  SETTLED_ANSWERS,
)

/**
 * A markdown document in the stand Lezen: `DocProse` of `@fromorbit/doc-view` with the host's words and
 * the library's copy button.
 */
function DocumentView({
  markdown,
  document,
  labels,
}: {
  markdown: string
  document: ProseDocument
  labels: ProseLabels
}) {
  const copy = labels.copy
  const renderCopy = useMemo(
    () => (code: () => string) => <CopyButton text={code} {...copy} />,
    [copy],
  )
  return <DocProse markdown={markdown} labels={labels} renderCopy={renderCopy} {...document} />
}

/**
 * Renders markdown written by an agent. Never renders raw HTML.
 *
 * Only the fixed typographic scale of the design system is used, capped at 15px: an answer is part of
 * a conversation, not a document, so a `#` heading must not tower over the text around it.
 * `references` lets a caller draw pieces of text as something else (a path as a link to its file);
 * `Prose` itself knows nothing of files, nor of a language: every word
 * comes in as `labels`. With `document` it draws a
 * markdown document instead, through the view the app shares with the website.
 */
export function Prose<M extends ProseMatch>({
  markdown,
  references,
  document,
  blocks,
  labels,
  settled = false,
}: {
  markdown: string
  /** The words of the view, in the host's language; see {@link ProseLabels}. */
  labels: ProseLabels
  /**
   * Whether this text will not change any more, such as a finished answer: it is then parsed once
   * and drawn from memory the next time a chat opens. Never for a text that streams.
   */
  settled?: boolean
  /** Pieces of the answer to draw as something else; without it, the answer renders as always. */
  references?: ProseReferences<M>
  /** Draws a markdown document (the stand Lezen) instead of an answer; see {@link ProseDocument}. */
  document?: ProseDocument
  /** Draws fenced blocks of the answer (a diagram, a chart); without it they stay code blocks. */
  blocks?: ProseBlocks
}): ReactNode {
  if (document) return <DocumentView markdown={markdown} document={document} labels={labels} />
  return (
    <LabelsContext.Provider value={labels}>
      <ReferencesContext.Provider value={(references as ProseReferences | undefined) ?? null}>
        <BlocksContext.Provider value={blocks ?? null}>
          <div className="flex min-w-0 flex-col gap-2">
            {settled ? (
              settledAnswer(markdown)
            ) : (
              <Markdown components={components} remarkPlugins={plugins}>
                {markdown}
              </Markdown>
            )}
          </div>
        </BlocksContext.Provider>
      </ReferencesContext.Provider>
    </LabelsContext.Provider>
  )
}
