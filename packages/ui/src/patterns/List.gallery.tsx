import { type ReactNode, useId, useState } from 'react'
import type { Story } from '../gallery/story'
import { DropdownMenu } from '../overlays/DropdownMenu'
import { IconButton } from '../primitives/IconButton'
import { ProjectMark } from '../primitives/ProjectMark'
import { nl } from '../testing/labels'
import { List, ListGroup, ListRow } from './List'
import { formatRelativeTime, RelativeTime } from './RelativeTime'

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

/**
 * The same rows twice, side by side: in the theme of the gallery (Midnight) and on Paper, each on the plane it lies on in a
 * host (the side panel for the chats, the canvas for the projects).
 */
function BothThemes({
  plane = 'side-panel',
  children,
}: {
  plane?: 'side-panel' | 'canvas'
  children: () => ReactNode
}) {
  const ground = plane === 'canvas' ? 'bg-canvas' : 'bg-side-panel'
  return (
    <div className="flex flex-wrap gap-4">
      <div className={`rounded-lg p-2 text-fg ${ground}`}>{children()}</div>
      <div data-theme="light" className={`rounded-lg p-2 text-fg ${ground}`}>
        {children()}
      </div>
    </div>
  )
}

/** The controls of a chat row: one move, and the menu. Named by the row's title. */
function ChatActions({ titleId }: { titleId: string }) {
  return (
    <>
      <IconButton
        icon="check-check"
        size="sm"
        tone="faint"
        label="Afronden"
        aria-describedby={titleId}
      />
      <DropdownMenu
        label="Meer"
        trigger={
          <IconButton
            icon="more-horizontal"
            size="sm"
            tone="faint"
            label="Meer"
            aria-describedby={titleId}
          />
        }
        items={[{ id: 'archive', label: 'Archiveren', onSelect() {} }]}
      />
    </>
  )
}

/** One chat of the side panel: the title in 13px, under it the project and the time in DM Mono. */
function ChatRow({
  title,
  kind,
  status,
  word,
  project,
  at,
  unread = false,
  current = false,
}: {
  title: string
  kind: 'running' | 'attention' | 'failed' | 'done' | 'queued'
  status: string
  word?: string
  project: string
  at: number
  unread?: boolean
  current?: boolean
}) {
  const titleId = useId()
  // The status is in the row's name already; the line adds where and when, never the word again.
  const heard = formatRelativeTime(at, now, nl.time)
  return (
    <ListRow
      title={title}
      titleId={titleId}
      kind={kind}
      status={status}
      shape={{ label: status }}
      markerSide="end"
      size="comfortable"
      emphasis="strong"
      meta={false}
      current={current}
      {...(unread ? { titleWeight: 'semibold' as const } : {})}
      subline={{
        mono: true,
        label: `${project}, ${heard}`,
        content: (
          <span className="flex min-w-0 items-center gap-1">
            {word ? <span className="shrink-0 font-sans">{word} ·</span> : null}
            <span className="min-w-0 truncate">{project}</span>
            <span className="shrink-0">·</span>
            <RelativeTime labels={nl.time} at={at} now={now} />
          </span>
        ),
      }}
      actions={<ChatActions titleId={titleId} />}
    />
  )
}

/** The chats of the side panel, as the design draws them, one tab stop for the whole list. */
function SidePanelChats() {
  return (
    <div className="w-62">
      <List label="Gesprekken" roving>
        <ChatRow
          title="Verzendadres-test repareren"
          kind="attention"
          status="Wacht op jou"
          word="Wacht op jou"
          project="webwinkel"
          at={now - 2 * minute}
        />
        <ChatRow
          title="Pogingen met kortingscodes beperken"
          kind="done"
          status="Klaar"
          project="webwinkel"
          at={now - 30_000}
          current
        />
        <ChatRow
          title="Testrun 1284 mislukt op pr-482"
          kind="failed"
          status="Mislukt"
          project="webwinkel"
          at={now - 12 * minute}
          unread
        />
        <ChatRow
          title="Het kortingsveld proberen met een spatie"
          kind="running"
          status="Loopt"
          project="kassa-api"
          at={now - 40 * minute}
        />
      </List>
    </div>
  )
}

/**
 * The groups under the chats of a side panel, as the design draws them: Runs open, Integraties
 * open, Afgerond folded at the foot, each a heading with its chevron before the word and its count
 * at the end. The names are made up.
 */
function ColumnGroups({ column = false }: { column?: boolean }) {
  const [open, setOpen] = useState({ runs: true, integrations: true, settled: false })
  const toggle = (key: keyof typeof open) => (next: boolean) =>
    setOpen((value) => ({ ...value, [key]: next }))
  // The column of the design: the words 20px from the edge of a column with an 8px gutter, 14px
  // between the groups and 1px between the rows, every heading a row of one roving list and a 3
  // beside the `SectionHeading`s above it.
  const form = column
    ? ({ inset: true, spacing: 'column', rowMark: true, level: 3 } as const)
    : ({} as const)
  return (
    <div className={column ? 'w-62 px-2' : 'w-62'}>
      <List label="Zijpaneel" roving={column}>
        <ListGroup
          variant="disclosure"
          {...form}
          heading="Runs"
          count="1 bezig"
          label="Runs, 1 bezig"
          open={open.runs}
          onOpenChange={toggle('runs')}
        >
          <ListRow
            title="Checkout suite · run 1284"
            kind="failed"
            status="Mislukt"
            meta={false}
            size="comfortable"
            markerSide="end"
            emphasis="secondary"
            subline={{ content: 'pr-482 · mislukt · 18 min', label: 'pr-482, 18 min', mono: true }}
          />
          <ListRow
            title="Space pr-203"
            kind="running"
            status="Bouwen"
            meta={false}
            size="comfortable"
            markerSide="end"
            emphasis="secondary"
            subline={{ content: 'kassa-api · bouwen', label: 'kassa-api', mono: true }}
          />
        </ListGroup>
        <ListGroup
          variant="disclosure"
          {...form}
          heading="Integraties"
          count="1 vraagt iets"
          label="Integraties, 1 vraagt iets"
          open={open.integrations}
          onOpenChange={toggle('integrations')}
        >
          <ListRow title="studio-noord" monoTitle status="3 repositories" emphasis="secondary" />
          <ListRow
            title="Mistral Vibe"
            status="Aanmelden nodig"
            emphasis="secondary"
            meta={<span className="text-attention">Aanmelden nodig</span>}
          />
        </ListGroup>
        <ListGroup
          variant="disclosure"
          {...form}
          heading="Afgerond"
          count={143}
          label="Afgerond, 143 gesprekken"
          open={open.settled}
          onOpenChange={toggle('settled')}
        >
          <ListRow title="Kortingscodes valideren" status="Klaar" kind="done" />
        </ListGroup>
      </List>
    </div>
  )
}

/** The projects of a start screen: a mark, the name in DM Mono, and where it stands in git. */
function StartProjects() {
  const [chosen, setChosen] = useState('webwinkel')
  const projects = [
    {
      name: 'webwinkel',
      remote: 'studio-noord/webwinkel',
      branch: 'main',
      note: '2 wijzigingen niet gecommit',
      chats: '4 gesprekken',
    },
    {
      name: 'kassa-api',
      remote: 'studio-noord/kassa-api',
      branch: 'release',
      note: 'alles gecommit',
      chats: '1 gesprek',
    },
    {
      name: 'huisstijl',
      remote: null,
      branch: 'main',
      note: 'alles gecommit',
      chats: 'geen gesprekken',
    },
  ]
  return (
    <div className="w-120">
      <List label="Projecten" card>
        {projects.map((project) => {
          const where = project.remote ? `${project.remote} op ${project.branch}` : project.branch
          return (
            <ListRow
              key={project.name}
              title={project.name}
              monoTitle
              size="comfortable"
              titleWeight="medium"
              emphasis="strong"
              status=""
              marker={<ProjectMark name={project.name} />}
              meta={project.chats}
              aria-pressed={chosen === project.name}
              onClick={() => setChosen(project.name)}
              subline={{
                label: `${where}, ${project.note}`,
                content: (
                  <span className="min-w-0 truncate">
                    <span className="font-mono">{project.remote ?? project.branch}</span>
                    {project.remote ? (
                      <>
                        {' op '}
                        <span className="font-mono">{project.branch}</span>
                      </>
                    ) : null}
                    {`, ${project.note}`}
                  </span>
                ),
              }}
            />
          )
        })}
      </List>
    </div>
  )
}

export default {
  group: 'patterns',
  title: 'List',
  states: {
    'Elke soort, en een rij zonder': () => (
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
    'Status als enige detail': () => (
      <Column>
        <List label="Runs">
          <ListRow title="Transport herschrijven" kind="running" status="Loopt" />
          <ListRow title="Releasenotes schrijven" kind="queued" status="In de wachtrij" />
        </List>
      </Column>
    ),
    'Gekozen, en een titel te lang voor de kolom': () => {
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
    'Twee groepen (de pijltjes lopen door beide)': () => (
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
    'Inklapbare groepen met statusvormen (de zijbalk)': () => {
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
    'Twee regels: waar en hoeveel': () => (
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
    'Rijen die inklappen, open en dicht': () => (
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
    'Dichte rijen': () => (
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
    'Compacte rijen en een detail voor de muis': () => (
      <Column>
        <List label="Plan">
          <ListRow title="Plan afrekenen" status="Plan, actief" meta="1/3" hoverMeta="PLAN-9" />
          <ListRow title="De winkelmand" status="Klaar" meta={false} compact />
          <ListRow title="De betaalkoppeling" status="Bezig" meta={false} compact />
          <ListRow title="Voorraad per winkel" status="Spec, concept" hoverMeta="SPEC-4" />
        </List>
      </Column>
    ),
    // Last, so they move no reference image above them. The chat row of a side panel: the shape at
    // the end, the title at 13px (600 while unread), the project and the time in DM Mono, and the
    // controls in the place of the shape on hover and keyboard focus.
    'Chatrij: vorm rechts, twee regels (donker en licht)': () => (
      <BothThemes>{() => <SidePanelChats />}</BothThemes>
    ),
    // The projects of a start screen: in a card with a line between the rows, the name in DM Mono,
    // the second line under the name beside a 16px mark, and the chosen one pressed.
    'Projectrij in een kaart (donker en licht)': () => (
      <BothThemes plane="canvas">{() => <StartProjects />}</BothThemes>
    ),
    // Last, so they move no reference image above them. The groups of a side panel's column: the
    // chevron before the word and always in sight, the count at the end in DM Mono, one form for
    // Runs, Integraties and Afgerond.
    'Groepen van een kolom: chevron voor het woord (donker en licht)': () => (
      <BothThemes>{() => <ColumnGroups />}</BothThemes>
    ),
    // Last, so they move no reference image above them. The same groups in the column of the
    // design: inset to the line of the rows, 14px and 1px apart, the headings rows of the list.
    'Groepen van een kolom: ingesprongen, 14px en 1px (donker en licht)': () => (
      <BothThemes>{() => <ColumnGroups column />}</BothThemes>
    ),
  },
} satisfies Story
