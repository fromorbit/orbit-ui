import type { ReactNode } from 'react'

/** One row of a property list: a label and whatever says its value. */
export interface Property {
  label: string
  /** Text, a status menu, a person, a list of plans with their `ProgressMeter`. */
  value: ReactNode
}

/** The props of `PropertyList`. */
export interface PropertyListProps {
  /** The name of the whole list ("Eigenschappen"). */
  label: string
  /**
   * The rows in groups; a hairline stands between two groups. Status, Houder and Project; then the
   * links; then Controle and Acceptatie.
   */
  groups: readonly (readonly Property[])[]
}

/**
 * The properties of a document in the panel of the Specs screen: rows of label · value in groups,
 * with a hairline between the groups.
 *
 * A description list per group (`<dl>`), so a screen reader hears each label with its value, the
 * whole named as one group. The label is 13px `muted` in a column of 96px, so every value starts
 * on one line; the value is 13px `text` and may take several lines (the plans of a spec, each with
 * its meter). Rows are at least 32px, on the 4px grid.
 */
export function PropertyList({ label, groups }: PropertyListProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset is for forms; this is a named group of values, and a named section would be a landmark.
    <div role="group" aria-label={label} className="flex min-w-0 flex-col">
      {groups.map((group, index) => (
        <dl
          // biome-ignore lint/suspicious/noArrayIndexKey: the groups of a document never reorder; their place is their key
          key={index}
          data-nt-property-group
          className="m-0 border-t border-border py-2 first:border-t-0 first:pt-0"
        >
          {group.map((property) => (
            <div key={property.label} className="flex min-h-8 min-w-0 items-start gap-3 py-1.5">
              <dt className="w-24 shrink-0 truncate text-[13px] leading-5 text-muted">
                {property.label}
              </dt>
              <dd className="m-0 flex min-w-0 flex-1 flex-col gap-1 text-[13px] leading-5 text-fg">
                {property.value}
              </dd>
            </div>
          ))}
        </dl>
      ))}
    </div>
  )
}
