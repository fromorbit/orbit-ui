/** The props of `SectionHeading`. */
export interface SectionHeadingProps {
  /** The words of the heading, as written: the capitals are only the look. */
  children: string
  /**
   * The level in the outline of the page; a group in a column is a 3 by default. `label` draws the
   * same words as a paragraph, for the name of a group inside a widget whose role holds no heading
   * (the groups of a listbox: the command palette).
   */
  level?: 2 | 3 | 'label'
  /** For a list that is named by its heading (`List labelledBy`). */
  id?: string
  /** A figure beside the heading, in mono: `2/5` over the plans of a spec. */
  count?: string
  /** A hairline from the words to the end of the row, for a heading over a stream (Activiteit). */
  rule?: boolean
}

/**
 * The heading of a group of rows in a list: 12px/500 `muted`, in sentence case, 32px high. A label
 * that whispers: capitals and letter-spacing made every group shout at the same level as the rows
 * it names (Von Restorff: one emphasis per view, and a heading is not it).
 *
 * For the groups of the Specs list and the sections of a document (Wacht op jou, In uitvoering,
 * Open, Plannen en besluiten, Activiteit) and for the groups of the settings screen
 * (`SettingsGroup`, at level 2); not for the chat list, which has no headings. The one
 * place besides `ListGroup` where capitals are a style: a section of
 * a column has to read as a section and not as one more row. A heading and nothing else — it does
 * not fold; a group that folds is `ListGroup` or, at the foot of a list, `ShelfGroup`.
 */
export function SectionHeading({
  children,
  level = 3,
  id,
  count,
  rule = false,
}: SectionHeadingProps) {
  const Tag = level === 'label' ? 'p' : level === 2 ? 'h2' : 'h3'
  return (
    <Tag
      id={id}
      className="m-0 flex h-(--nt-control-md) min-w-0 items-center gap-2 px-2 text-[12px] font-medium text-muted"
    >
      <span className="min-w-0 truncate">{children}</span>
      {count === undefined ? null : (
        <span className="shrink-0 font-normal tabular-nums">{count}</span>
      )}
      {rule ? (
        <span aria-hidden="true" data-nt-heading-rule className="h-px flex-1 bg-border" />
      ) : null}
    </Tag>
  )
}
