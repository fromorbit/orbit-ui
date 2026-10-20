/**
 * GitHub alerts (`> [!NOTE]`): a quote whose first line is a marker, drawn as a named note when the
 * caller turns `alerts` on. Pure text and tree work; `DocProse` draws them.
 */

/** The five kinds of GitHub, in the order the documentation lists them. */
export const ALERT_KINDS = ['note', 'tip', 'important', 'warning', 'caution'] as const

/** One of {@link ALERT_KINDS}. */
export type AlertKind = (typeof ALERT_KINDS)[number]

/** The title of each kind when the caller gives none of its own. */
export const DEFAULT_ALERT_TITLES: Record<AlertKind, string> = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution',
}

/** A marker alone on the first line of a quote, as GitHub reads it; the case is not significant. */
const MARKER = /^\[!(note|tip|important|warning|caution)\][ \t]*(?:\r?\n|$)/i

/** The kind a text opens with, and the text after the marker line; `undefined` for a plain quote. */
export function alertOf(text: string): { kind: AlertKind; rest: string } | undefined {
  const found = MARKER.exec(text)
  const name = found?.[1]
  if (!found || !name) return undefined
  return { kind: name.toLowerCase() as AlertKind, rest: text.slice(found[0].length) }
}

/** The little of a hast node this plugin needs. */
interface AlertNode {
  type: string
  value?: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: AlertNode[]
}

/**
 * Marks every quote that opens with an alert marker (`data-alert` = the kind) and strips the marker
 * from its text; a paragraph that held nothing else leaves with it. Applied only when the caller
 * asks for alerts, so a document without the option is drawn as it always was.
 */
export function rehypeAlerts() {
  const visit = (node: AlertNode): void => {
    if (node.tagName === 'blockquote') mark(node)
    for (const child of node.children ?? []) visit(child)
  }
  return (tree: AlertNode) => visit(tree)
}

function mark(quote: AlertNode): void {
  const paragraph = quote.children?.find((child) => child.type === 'element')
  const first = paragraph?.children?.[0]
  if (paragraph?.tagName !== 'p' || first?.type !== 'text') return
  const alert = alertOf(first.value ?? '')
  if (!alert) return
  quote.properties = { ...quote.properties, dataAlert: alert.kind }
  if (alert.rest !== '') {
    first.value = alert.rest
    return
  }
  paragraph.children = (paragraph.children ?? []).slice(1)
  // A break after the marker (`[!NOTE]  \n`) is layout, not content.
  if (paragraph.children[0]?.tagName === 'br') paragraph.children.shift()
  if (paragraph.children.length === 0) {
    quote.children = (quote.children ?? []).filter((child) => child !== paragraph)
  }
}
