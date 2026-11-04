import { type ReactNode, useId, useState } from 'react'
import type { Story } from '../gallery/story'
import { nl } from '../testing/labels'
import { List, ListGroup, ListRow } from './List'
import { RelativeTime } from './RelativeTime'

/** A fixed moment, not the clock: a screenshot reference must read the same tomorrow. */
const now = Date.UTC(2026, 8, 19, 12, 0, 0)
const minute = 60_000
const hour = 60 * minute

/** The width of the sidebar's own column, so truncation happens here exactly as it does there. */
function Column({ children }: { children: ReactNode }) {
  return <div className="w-56">{children}</div>
}

/**
 * A named group of rows inside a list: a list item holding a heading and a nested list.
 *
 * The shape `ChatSidebar` will use — an `<ul>` may only contain list items, so the section with
 * its heading lives inside one. `role="group"` is part of that shape: a `<section>` with a name is
 * a `region`, and turning every project in the sidebar into a landmark would fill the landmark
 * menu of a screen reader with rows of chats.
 */
function Group({ heading, children }: { heading: string; children: ReactNode }) {
  const headingId = useId()
  return (
    <li className="mt-3 first:mt-0">
      {/* biome-ignore lint/a11y/useSemanticElements: a fieldset is for forms; this is a named group in a list, and a named section would be a landmark. */}
      <section role="group" aria-labelledby={headingId}>
        <h3
          id={headingId}
          className="m-0 flex h-6 items-center px-2 text-[11px] font-medium text-muted"
        >
          {heading}
        </h3>
        <ul className="m-0 list-none p-0">{children}</ul>
      </section>
    </li>
  )
}

export default {
  group: 'patterns',
  title: 'List',
  states: {
    'Every kind, and a row without one': () => (
      <Column>
        <List label="Runs">
          <ListRow
            title="Transport herschrijven"
            kind="running"
            status="Loopt"
            meta={<RelativeTime labels={nl.time} at={now - 5 * minute} now={now} />}
          />
          <ListRow
            title="Akkoordkaart toevoegen"
            kind="attention"
            status="Wacht op akkoord"
            meta={<RelativeTime labels={nl.time} at={now - 2 * hour} now={now} />}
          />
          <ListRow
            title="Provider-SDK bijwerken"
            kind="failed"
            status="Mislukt"
            meta={<RelativeTime labels={nl.time} at={now - 26 * hour} now={now} />}
          />
          <ListRow
            title="Releasenotes schrijven"
            kind="queued"
            status="In de wachtrij"
            meta={<RelativeTime labels={nl.time} at={now - 8 * 24 * hour} now={now} />}
          />
          <ListRow
            title="Statusiconen uitleveren"
            kind="done"
            status="Klaar"
            meta={<RelativeTime labels={nl.time} at={now - 3 * 24 * hour} now={now} />}
          />
          <ListRow
            title="Transportpoort hernoemen"
            kind="interrupted"
            status="Onderbroken"
            meta={<RelativeTime labels={nl.time} at={now - 5 * 24 * hour} now={now} />}
          />
          <ListRow
            title="Zonder status"
            meta={<RelativeTime labels={nl.time} at={now - 30_000} now={now} />}
          />
        </List>
      </Column>
    ),
    'Status as the only detail': () => (
      <Column>
        <List label="Runs">
          <ListRow title="Transport herschrijven" kind="running" status="Loopt" />
          <ListRow title="Releasenotes schrijven" kind="queued" status="In de wachtrij" />
        </List>
      </Column>
    ),
    'Selected, and a title too long for its column': () => {
      const [current, setCurrent] = useState('a')
      return (
        <Column>
          <List label="Runs">
            <ListRow
              title="De gekozen rij"
              current={current === 'a'}
              onClick={() => setCurrent('a')}
              meta={<RelativeTime labels={nl.time} at={now - 5 * minute} now={now} />}
            />
            <ListRow
              title="Een rij met een titel die veel te lang is voor deze kolom"
              current={current === 'b'}
              onClick={() => setCurrent('b')}
              kind="running"
              status="Loopt"
              meta={<RelativeTime labels={nl.time} at={now - hour} now={now} />}
            />
          </List>
        </Column>
      )
    },
    'Two groups (the arrows run through both)': () => (
      <Column>
        <List label="Gesprekken">
          <Group heading="nt-agent">
            <ListRow
              title="Transport herschrijven"
              kind="running"
              status="Loopt"
              meta={<RelativeTime labels={nl.time} at={now - 5 * minute} now={now} />}
            />
            <ListRow
              title="Akkoordkaart toevoegen"
              kind="done"
              status="Klaar"
              meta={<RelativeTime labels={nl.time} at={now - 2 * hour} now={now} />}
            />
          </Group>
          <Group heading="webwinkel">
            <ListRow
              title="Afrekenen repareren"
              kind="failed"
              status="Mislukt"
              meta={<RelativeTime labels={nl.time} at={now - 26 * hour} now={now} />}
            />
            <ListRow
              title="Prijsregels bijwerken"
              meta={<RelativeTime labels={nl.time} at={now - 8 * 24 * hour} now={now} />}
            />
          </Group>
        </List>
      </Column>
    ),
    // Last, so it moves no reference image above it.
    'Foldable groups with status shapes (the sidebar)': () => {
      const [open, setOpen] = useState({ agent: true, shop: false })
      return (
        <Column>
          <List label="Gesprekken">
            <ListGroup
              heading="nt-agent"
              count={2}
              label="nt-agent, 2 gesprekken"
              open={open.agent}
              onOpenChange={(agent) => setOpen((value) => ({ ...value, agent }))}
            >
              <ListRow
                title="Transport herschrijven"
                kind="running"
                status="Loopt"
                marker="shape"
                emphasis="strong"
                current
                meta={<RelativeTime labels={nl.time} at={now - 5 * minute} now={now} />}
              />
              <ListRow
                title="Akkoordkaart toevoegen"
                kind="done"
                status="Klaar"
                marker="shape"
                emphasis="strong"
                meta={<RelativeTime labels={nl.time} at={now - 2 * hour} now={now} />}
              />
            </ListGroup>
            <ListGroup
              heading="webwinkel"
              count={1}
              label="webwinkel, 1 gesprek"
              open={open.shop}
              onOpenChange={(shop) => setOpen((value) => ({ ...value, shop }))}
            >
              <ListRow
                title="Afrekenen repareren"
                kind="failed"
                status="Mislukt"
                marker="shape"
                emphasis="strong"
                meta={<RelativeTime labels={nl.time} at={now - 26 * hour} now={now} />}
              />
            </ListGroup>
          </List>
        </Column>
      )
    },
    // Last, so it moves no reference image above it.
    'Two lines: where and how much': () => (
      <Column>
        <List label="Gesprekken">
          <ListRow
            title="Transport herschrijven"
            kind="running"
            status="Loopt"
            marker="shape"
            emphasis="strong"
            current
            meta={<RelativeTime labels={nl.time} at={now - 5 * minute} now={now} />}
            subline={{
              content: <span className="min-w-0 flex-1 truncate">nt/transport-herschrijven</span>,
              label: 'nt/transport-herschrijven',
            }}
          />
          <ListRow
            title="Akkoordkaart toevoegen"
            kind="done"
            status="Klaar"
            marker="shape"
            emphasis="strong"
            meta={<RelativeTime labels={nl.time} at={now - 2 * hour} now={now} />}
            subline={{
              content: <span className="min-w-0 flex-1 truncate">projectmap</span>,
              label: 'projectmap',
            }}
          />
        </List>
      </Column>
    ),
    'Rows that fold, open and closed': () => (
      // `px-2`: the chevron needs the 8px gutter left of the row, as in the sidebar's column.
      <Column>
        <div className="px-2">
          <List label="Gesprekken">
            <ListRow
              title="Winkelmand"
              kind="done"
              status="Klaar"
              marker="shape"
              emphasis="strong"
              meta={<RelativeTime labels={nl.time} at={now - 5 * minute} now={now} />}
              fold={{ open: true, label: 'Subagents van Winkelmand', onToggle() {} }}
            />
            <li className="m-0 list-none">
              {/* biome-ignore lint/a11y/useSemanticElements: a fieldset is for forms; these are the rows under one row, a named group in a list. */}
              <div role="group" aria-label="Subagents van Winkelmand">
                <ul className="m-0 ms-4 flex list-none flex-col gap-1 border-s border-border p-0 ps-1">
                  <ListRow
                    title="Tests voor de winkelmand"
                    kind="running"
                    status="Loopt"
                    marker="shape"
                    emphasis="strong"
                    meta={<RelativeTime labels={nl.time} at={now - 2 * minute} now={now} />}
                  />
                </ul>
              </div>
            </li>
            <ListRow
              title="Inlogscherm"
              kind="attention"
              status="Klaar, 1 subagent wacht op jou"
              marker="shape"
              emphasis="strong"
              meta={<RelativeTime labels={nl.time} at={now - hour} now={now} />}
              fold={{ open: false, label: 'Subagents van Inlogscherm', onToggle() {} }}
            />
            {/* Current: the chevron on the row's left edge, over the rounded end of its fill. */}
            <ListRow
              title="Betaalpagina"
              kind="running"
              status="Loopt"
              marker="shape"
              emphasis="strong"
              current
              meta={<RelativeTime labels={nl.time} at={now - 20 * minute} now={now} />}
              fold={{ open: false, label: 'Subagents van Betaalpagina', onToggle() {} }}
            />
          </List>
        </div>
      </Column>
    ),
    // The rows of the Specs column: 28px in the 13px of the base (`dense`), with a status word or
    // nothing at the right, and the number under the pointer.
    'Dense rows': () => (
      <Column>
        <List label="Documenten">
          <ListRow title="Retour zonder account" status="Spec, in review" dense meta="Review" />
          <ListRow
            title="Voorraad per winkel"
            status="Spec, concept"
            dense
            meta={false}
            hoverMeta="SPEC-4"
          />
        </List>
      </Column>
    ),
    // A plan with its progress at rest and its number under the pointer (`hoverMeta`), and its
    // steps as compact rows under it without a detail of their own (`meta={false}`).
    'Compact rows and a detail for the pointer': () => (
      <Column>
        <List label="Plan">
          <ListRow title="Plan afrekenen" status="Plan, actief" meta="1/3" hoverMeta="PLAN-9" />
          <ListRow title="De winkelmand" status="Klaar" meta={false} compact />
          <ListRow title="De betaalkoppeling" status="Bezig" meta={false} compact />
          <ListRow title="Voorraad per winkel" status="Spec, concept" hoverMeta="SPEC-4" />
        </List>
      </Column>
    ),
  },
} satisfies Story
