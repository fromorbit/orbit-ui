import { Accordion as RadixAccordion } from 'radix-ui'
import type { ReactNode } from 'react'
import { Icon } from './Icon'

/** One fold of an `Accordion`. */
export interface AccordionItem {
  id: string
  /** The row that is always visible: the button's name. */
  title: string
  /** A quieter word at the end of the row: a count, a state. */
  detail?: string
  content: ReactNode
  disabled?: boolean
}

/** What both kinds of accordion share. */
interface AccordionBaseProps {
  items: readonly AccordionItem[]
}

/** One fold open at a time: opening one closes the other. */
export interface SingleAccordionProps extends AccordionBaseProps {
  type: 'single'
  /** The open fold, or `null` for none. */
  value: string | null
  onValueChange(value: string | null): void
}

/** Any number open at once. */
export interface MultipleAccordionProps extends AccordionBaseProps {
  type: 'multiple'
  value: readonly string[]
  onValueChange(value: string[]): void
}

/** The props of `Accordion`. */
export type AccordionProps = SingleAccordionProps | MultipleAccordionProps

/** The row of one fold: the title, a detail and a chevron that turns a quarter. */
function Row({ item }: { item: AccordionItem }) {
  return (
    <RadixAccordion.Item
      value={item.id}
      {...(item.disabled ? { disabled: true } : {})}
      className="border-border border-b last:border-b-0"
    >
      <RadixAccordion.Header className="m-0">
        <RadixAccordion.Trigger className="no-drag group flex min-h-10 w-full items-center gap-2 rounded-sm px-1 text-left text-[13px] text-fg outline-focus hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:opacity-40">
          <span className="flex size-(--nt-icon-sm) shrink-0 items-center justify-center text-muted transition-transform duration-100 group-data-[state=open]:rotate-90 motion-reduce:transition-none">
            <Icon name="chevron-right" size="sm" />
          </span>
          <span className="min-w-0 flex-1 truncate font-medium">{item.title}</span>
          {item.detail === undefined ? null : (
            <span className="shrink-0 text-[12px] text-muted">{item.detail}</span>
          )}
        </RadixAccordion.Trigger>
      </RadixAccordion.Header>
      <RadixAccordion.Content className="nt-fade-in ps-7 pe-1 pb-3 text-[13px] text-secondary">
        {item.content}
      </RadixAccordion.Content>
    </RadixAccordion.Item>
  )
}

/**
 * Several folds under each other, of which one (`single`) or any number (`multiple`) stand open:
 * questions and answers, the sections of a long form, the steps of a log.
 *
 * Radix Accordion: each title is a button in a heading with `aria-expanded`, and the arrows move
 * between the titles (Home and End to the first and last). Where `Collapsible` folds one block
 * that belongs to the thing above it, this is a list of them. A closed fold is out of the document,
 * and an opened one fades in rather than growing, as with `Collapsible`. Controlled: what is open
 * belongs to the caller.
 */
export function Accordion(props: AccordionProps) {
  const rows = props.items.map((item) => <Row key={item.id} item={item} />)
  const frame = 'flex flex-col'
  if (props.type === 'single') {
    const { value, onValueChange } = props
    return (
      <RadixAccordion.Root
        type="single"
        collapsible
        value={value ?? ''}
        onValueChange={(next) => onValueChange(next === '' ? null : next)}
        className={frame}
      >
        {rows}
      </RadixAccordion.Root>
    )
  }
  const { value, onValueChange } = props
  return (
    <RadixAccordion.Root
      type="multiple"
      value={[...value]}
      onValueChange={onValueChange}
      className={frame}
    >
      {rows}
    </RadixAccordion.Root>
  )
}
