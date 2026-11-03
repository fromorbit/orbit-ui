import { cva } from 'class-variance-authority'
import { Popover as RadixPopover } from 'radix-ui'
import { type KeyboardEvent, type ReactNode, useId, useMemo, useState } from 'react'
import type { ControlSize } from '../primitives/control-size'
import { controlHeight, controlSize } from '../primitives/control-size'
import { handBackOnlyLostFocus } from '../primitives/hand-back'
import { Icon } from '../primitives/Icon'
import { Input } from '../primitives/Input'
import { COMBOBOX_PANEL } from './panel'
import { usePortalContainer } from './portal'

/** One option of a `Combobox`. */
export interface ComboboxOption<T extends string = string> {
  value: T
  label: string
  /** A quieter line after the label ("eu-west"), also searched. */
  detail?: string
  /** More words the search finds this option by, never shown ("nederland" for "NL"). */
  keywords?: readonly string[]
  disabled?: boolean
}

/** The words of a `Combobox`. */
export interface ComboboxLabels {
  /** The accessible name of the search field, and its placeholder: "Zoeken…". */
  search: string
  /** The line when nothing matches: "Geen treffers voor ‘x’". */
  noResults(query: string): string
}

/** What both comboboxes share. */
interface ComboboxBaseProps<T extends string> {
  /** The accessible name of the trigger. */
  label: string
  options: readonly ComboboxOption<T>[]
  labels: ComboboxLabels
  /** What the trigger says while nothing is chosen: "Kies een regio". */
  placeholder: string
  size?: ControlSize
  disabled?: boolean
  /** `true` for a trigger as wide as its column, as in a form. */
  block?: boolean
  /** Set by `FormField` or `Field`: the visible label wins over `label`. */
  'aria-labelledby'?: string | undefined
  'aria-describedby'?: string | undefined
  /** Set by `FormField` when the choice failed its check: a danger border. */
  'aria-invalid'?: boolean | undefined
  'aria-required'?: boolean | undefined
  id?: string | undefined
}

/** The props of `Combobox`. */
export interface ComboboxProps<T extends string> extends ComboboxBaseProps<T> {
  /** The chosen value, or `null` for none. */
  value: T | null
  onValueChange(value: T): void
}

/** The props of `MultiCombobox`. */
export interface MultiComboboxProps<T extends string> extends ComboboxBaseProps<T> {
  value: readonly T[]
  /** The new set, in the order of `options`. */
  onValueChange(value: T[]): void
  /** What the trigger says once more than `maxShown` are chosen: "5 gekozen". */
  countLabel(count: number): string
  /** How many chosen labels the trigger lists before it gives a count instead; default 2. */
  maxShown?: number
}

const trigger = cva(
  'no-drag inline-flex items-center gap-1.5 rounded-md border bg-surface px-2 text-left outline-focus hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40',
  {
    variants: {
      size: controlSize,
      invalid: { true: 'border-danger', false: 'border-border' },
      block: { true: 'w-full min-w-0', false: 'max-w-56' },
    },
    defaultVariants: { size: 'md', invalid: false, block: false },
  },
)

/** One row of the list, as tall as a `md` control; the active one carries the hover fill. */
const OPTION = `flex ${controlHeight.md} shrink-0 cursor-default items-center gap-2 rounded-md px-2 text-[12px] text-muted select-none data-[active=true]:bg-surface-hover data-[active=true]:text-fg aria-selected:text-fg aria-disabled:opacity-40`

/** Lower case without accents, so "Zurich" finds "Zürich". */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()
}

/** The options whose label, detail or keywords contain every word of the query. */
export function filterComboboxOptions<T extends string>(
  options: readonly ComboboxOption<T>[],
  query: string,
): ComboboxOption<T>[] {
  const words = fold(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return [...options]
  return options.filter((option) => {
    const haystack = fold([option.label, option.detail ?? '', ...(option.keywords ?? [])].join(' '))
    return words.every((word) => haystack.includes(word))
  })
}

/** The next enabled index from `from` in `direction`, wrapping; `-1` when none is enabled. */
function step<T extends string>(
  list: readonly ComboboxOption<T>[],
  from: number,
  direction: 1 | -1,
): number {
  for (let i = 1; i <= list.length; i++) {
    const index = (from + direction * i + list.length * 2) % list.length
    if (!list[index]?.disabled) return index
  }
  return -1
}

/**
 * The panel both comboboxes open: a search field on top, the list of what it finds below.
 *
 * The field is the ARIA combobox (`aria-controls`, `aria-activedescendant`): the focus stays in it
 * while the arrow keys move the active row, so typing goes on to narrow the list. Enter picks the
 * active row; Escape closes, through Radix, which hands the focus back to the trigger.
 */
function ComboboxPanel<T extends string>({
  options,
  labels,
  label,
  multiple,
  isChosen,
  onPick,
}: {
  options: readonly ComboboxOption<T>[]
  labels: ComboboxLabels
  label: string
  multiple: boolean
  isChosen(value: T): boolean
  onPick(value: T): void
}) {
  const listId = useId()
  const [query, setQuery] = useState('')
  const found = useMemo(() => filterComboboxOptions(options, query), [options, query])
  const firstChosen = found.findIndex((option) => isChosen(option.value))
  const [active, setActive] = useState(() => (firstChosen >= 0 ? firstChosen : step(found, -1, 1)))
  // A new query starts at the first row it finds.
  const [lastQuery, setLastQuery] = useState(query)
  if (lastQuery !== query) {
    setLastQuery(query)
    setActive(step(found, -1, 1))
  }
  const activeOption = found[active]
  const optionId = (index: number) => `${listId}-${index}`

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) => step(found, index, event.key === 'ArrowDown' ? 1 : -1))
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      setActive(event.key === 'Home' ? step(found, -1, 1) : step(found, 0, -1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (activeOption && !activeOption.disabled) onPick(activeOption.value)
    }
  }

  return (
    <>
      <div className="shrink-0 border-border border-b p-1">
        <Input
          label={labels.search}
          placeholder={labels.search}
          variant="bare"
          icon="search"
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeOption ? optionId(active) : undefined}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
        />
      </div>
      <div
        id={listId}
        role="listbox"
        aria-label={label}
        aria-multiselectable={multiple || undefined}
        className="flex min-h-0 flex-col overflow-y-auto overscroll-contain p-1"
      >
        {found.length === 0 ? (
          <p className="m-0 px-2 py-1.5 text-[12px] text-muted">{labels.noResults(query)}</p>
        ) : (
          found.map((option, index) => {
            const chosen = isChosen(option.value)
            return (
              // biome-ignore lint/a11y/useFocusableInteractive: an option in the combobox pattern is never focused; the search field keeps the caret and points here with aria-activedescendant.
              // biome-ignore lint/a11y/useKeyWithClickEvents: the keys live on the search field that owns the walk, which is why no row is a tab stop.
              <div
                key={option.value}
                id={optionId(index)}
                role="option"
                aria-selected={chosen}
                aria-disabled={option.disabled || undefined}
                data-active={index === active}
                className={OPTION}
                // Keeps the focus in the search field, where the keys go.
                onMouseDown={(event) => event.preventDefault()}
                onMouseMove={() => {
                  if (!option.disabled && index !== active) setActive(index)
                }}
                onClick={() => {
                  if (!option.disabled) onPick(option.value)
                }}
              >
                <span className="flex size-(--nt-icon-sm) shrink-0 items-center justify-center">
                  {chosen ? <Icon name="check" size="sm" /> : null}
                </span>
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {option.detail === undefined ? null : (
                  <span className="shrink-0 text-muted">{option.detail}</span>
                )}
              </div>
            )
          })
        )}
      </div>
    </>
  )
}

/** The trigger and the layer around the panel, shared by both comboboxes. */
function ComboboxFrame({
  open,
  onOpenChange,
  props,
  shown,
  empty,
  panelLabel,
  children,
}: {
  open: boolean
  onOpenChange(open: boolean): void
  props: ComboboxBaseProps<string>
  shown: ReactNode
  empty: boolean
  panelLabel: string
  children: ReactNode
}) {
  const container = usePortalContainer()
  const invalid = props['aria-invalid'] === true
  return (
    <RadixPopover.Root open={open} onOpenChange={onOpenChange}>
      <RadixPopover.Trigger
        type="button"
        aria-label={props.label}
        aria-labelledby={props['aria-labelledby']}
        aria-describedby={props['aria-describedby']}
        aria-invalid={props['aria-invalid']}
        aria-required={props['aria-required']}
        aria-haspopup="listbox"
        id={props.id}
        disabled={props.disabled}
        className={trigger({ size: props.size, invalid, block: props.block === true })}
      >
        <span className={`min-w-0 flex-1 truncate ${empty ? 'text-muted' : 'text-fg'}`}>
          {shown}
        </span>
        <span className="shrink-0 text-muted">
          <Icon name="chevrons-up-down" size="sm" />
        </span>
      </RadixPopover.Trigger>
      <RadixPopover.Portal container={container}>
        <RadixPopover.Content
          aria-label={panelLabel}
          side="bottom"
          align="start"
          sideOffset={4}
          collisionPadding={8}
          className={COMBOBOX_PANEL}
          onCloseAutoFocus={handBackOnlyLostFocus}
        >
          {children}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  )
}

/**
 * One choice out of a long list, found by typing: a region, a repository, a time zone.
 *
 * Where `Select` lists a handful of options, this one has a search field on top of its list, so a
 * list of two hundred stays usable. The trigger is a button like `Select`'s, so it sits in a
 * `FormField` or a `Field` the same way (spread the field's props onto it); the panel opens below
 * it with the focus in the search field. A pick closes the panel and returns the focus to the
 * trigger. The search ignores case and accents and matches every word, in label, detail or
 * `keywords`.
 */
export function Combobox<T extends string>(props: ComboboxProps<T>) {
  const { options, value, onValueChange, labels, placeholder, label } = props
  const [open, setOpen] = useState(false)
  const chosen = options.find((option) => option.value === value)
  return (
    <ComboboxFrame
      open={open}
      onOpenChange={setOpen}
      props={props as unknown as ComboboxBaseProps<string>}
      shown={chosen?.label ?? placeholder}
      empty={chosen === undefined}
      panelLabel={label}
    >
      <ComboboxPanel
        options={options}
        labels={labels}
        label={label}
        multiple={false}
        isChosen={(option) => option === value}
        onPick={(next) => {
          onValueChange(next)
          setOpen(false)
        }}
      />
    </ComboboxFrame>
  )
}

/**
 * Several choices out of a long list, found by typing: labels on an issue, people on a task.
 *
 * The panel of `Combobox`, with `aria-multiselectable`: a pick toggles the row and the panel stays
 * open, so a reader can tick several in a row; Escape or a click outside closes it. The trigger
 * lists the chosen labels, or their number once there are more than `maxShown`.
 */
export function MultiCombobox<T extends string>(props: MultiComboboxProps<T>) {
  const { options, value, onValueChange, labels, placeholder, label, countLabel } = props
  const maxShown = props.maxShown ?? 2
  const [open, setOpen] = useState(false)
  const chosen = new Set<string>(value)
  const chosenLabels = options.filter((option) => chosen.has(option.value)).map((o) => o.label)
  const shown =
    chosenLabels.length === 0
      ? placeholder
      : chosenLabels.length > maxShown
        ? countLabel(chosenLabels.length)
        : chosenLabels.join(', ')
  return (
    <ComboboxFrame
      open={open}
      onOpenChange={setOpen}
      props={props as unknown as ComboboxBaseProps<string>}
      shown={shown}
      empty={chosenLabels.length === 0}
      panelLabel={label}
    >
      <ComboboxPanel
        options={options}
        labels={labels}
        label={label}
        multiple
        isChosen={(option) => chosen.has(option)}
        onPick={(next) => {
          const after = new Set<string>(chosen)
          if (after.has(next)) after.delete(next)
          else after.add(next)
          onValueChange(options.map((o) => o.value).filter((v) => after.has(v)))
        }}
      />
    </ComboboxFrame>
  )
}
