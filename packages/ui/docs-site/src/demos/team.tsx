import { type ReactNode, useEffect, useState } from 'react'
import {
  Avatar,
  Button,
  Checkbox,
  Chip,
  DataTable,
  type DataTableColumn,
  Dialog,
  DropdownMenu,
  FormField,
  Icon,
  IconButton,
  Input,
  PageHeader,
  ScrollArea,
  SegmentedControl,
  Select,
  Tag,
  Textarea,
} from '../../../src'
import type { DemoModule, DemoScreenProps } from '../demo-kit/types'
import { AppFrame, ago, DAY, HOUR } from './parts/AppFrame'
import { Panel } from './parts/Panel'

type Role = 'owner' | 'admin' | 'member' | 'guest'
type Assignable = Exclude<Role, 'owner'>

const ROLES = [
  { value: 'admin', label: 'Beheerder' },
  { value: 'member', label: 'Lid' },
  { value: 'guest', label: 'Gast' },
] as const

const ROLE_LABEL: Record<Role, string> = {
  owner: 'Eigenaar',
  admin: 'Beheerder',
  member: 'Lid',
  guest: 'Gast',
}

interface Member {
  name: string
  email: string
  role: Role
  /** When the member was last active, how long ago, in ms. */
  seen: number
}

const MEMBERS: Member[] = [
  { name: 'Iris Kamphorst', email: 'iris@zilverberg.example', role: 'owner', seen: 0 },
  { name: 'Daan Velthuis', email: 'daan@zilverberg.example', role: 'admin', seen: 20 * 60_000 },
  { name: 'Mila Terhorst', email: 'mila@zilverberg.example', role: 'member', seen: 2 * HOUR },
  { name: 'Sem Oudeweg', email: 'sem@zilverberg.example', role: 'member', seen: 5 * HOUR },
  { name: 'Fenna Brouwsma', email: 'fenna@zilverberg.example', role: 'member', seen: DAY },
  { name: 'Joris Lindeboom', email: 'joris@zilverberg.example', role: 'guest', seen: 4 * DAY },
]

/** What a role may do in the workspace; the owner may do everything. */
const RIGHTS = [
  'Agents laten werken',
  'Specs goedkeuren',
  'Samenvoegen in main',
  'Reviews plaatsen',
  'Leden uitnodigen',
  'Plan wijzigen',
] as const

/** Who may do what by default: rows are rights, columns roles. */
const MATRIX: Record<Assignable, boolean[]> = {
  admin: [true, true, true, true, true, false],
  member: [true, true, true, false, false, false],
  guest: [true, false, false, false, false, false],
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * The addresses to invite as chips in one field, left to right as a form reads; `ChipListField`
 * is laid out for the right edge of a settings row.
 */
function AddressField({
  labelId,
  emails,
  onChange,
}: {
  labelId: string
  emails: readonly string[]
  onChange(next: readonly string[]): void
}): ReactNode {
  const [draft, setDraft] = useState('')
  const wrong = draft.trim() !== '' && !EMAIL.test(draft.trim())
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex min-h-9 flex-wrap items-center gap-1 rounded-md border border-border bg-surface p-1 focus-within:border-accent-border">
        {emails.map((email) => (
          <Chip
            key={email}
            size="sm"
            label={email}
            remove={{
              label: `${email} weghalen`,
              onRemove: () => onChange(emails.filter((entry) => entry !== email)),
            }}
          />
        ))}
        <div className="min-w-40 flex-1 *:w-full">
          <Input
            label="E-mailadres toevoegen"
            aria-labelledby={labelId}
            variant="bare"
            size="sm"
            placeholder="naam@zilverberg.example"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' || wrong || draft.trim() === '') return
              event.preventDefault()
              onChange([...emails, draft.trim()])
              setDraft('')
            }}
          />
        </div>
      </div>
      {wrong ? <span className="text-[12px] text-danger">Geen geldig e-mailadres</span> : null}
    </div>
  )
}

/** The dialog to invite people: addresses, a role and a note. */
function InviteDialog({
  open,
  onOpenChange,
  onInvite,
}: {
  open: boolean
  onOpenChange(open: boolean): void
  onInvite(emails: readonly string[], role: Assignable): void
}): ReactNode {
  const [emails, setEmails] = useState<readonly string[]>([
    'noa@zilverberg.example',
    'ruben@zilverberg.example',
  ])
  const [role, setRole] = useState<Assignable>('member')
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Mensen uitnodigen"
      description="Ze krijgen een e-mail met een link die zeven dagen geldig is."
      closeLabel="Sluiten"
      initialFocus="panel"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button
            variant="primary"
            disabled={emails.length === 0}
            onClick={() => {
              onInvite(emails, role)
              setEmails([])
              onOpenChange(false)
            }}
          >
            {emails.length > 1 ? `${emails.length} mensen uitnodigen` : 'Uitnodigen'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="E-mailadressen" description="Enter na elk adres">
          {(field) => (
            <AddressField labelId={field['aria-labelledby']} emails={emails} onChange={setEmails} />
          )}
        </FormField>
        <FormField label="Rol" description="Een lid mag agents laten werken, maar niet uitnodigen">
          {(field) => (
            <div className="*:w-full">
              <Select<Assignable>
                label="Rol"
                {...field}
                value={role}
                options={ROLES}
                onValueChange={setRole}
              />
            </div>
          )}
        </FormField>
        <FormField label="Persoonlijk bericht">
          {(field) => (
            <Textarea
              label="Persoonlijk bericht"
              {...field}
              defaultValue="Welkom! We werken in Orbit aan de nieuwe kassa van de webwinkel."
              minRows={2}
            />
          )}
        </FormField>
      </div>
    </Dialog>
  )
}

/**
 * Whether a role has a right, as a quiet mark for reading: a check in the secondary text colour or
 * a faint dash, never a filled box. The matrix is read far more often than changed, so the boxes
 * only come out under "Aanpassen" and the page keeps "Uitnodigen" as its one emphasis.
 */
function RightMark({ on, label }: { on: boolean; label: string }): ReactNode {
  return (
    <span
      role="img"
      aria-label={`${label}: ${on ? 'ja' : 'nee'}`}
      className="inline-flex size-4 items-center justify-center align-middle"
    >
      {on ? (
        <span className="flex text-secondary">
          <Icon name="check" size="sm" />
        </span>
      ) : (
        <Icon name="minus" size="sm" tone="faint" />
      )}
    </span>
  )
}

/** A box to change a right, or its quiet mark while the matrix is only read. */
function RightCell({
  role,
  right,
  on,
  editing,
  onChange,
}: {
  role: Role
  right: string
  on: boolean
  editing: boolean
  onChange(on: boolean): void
}): ReactNode {
  const label = `${ROLE_LABEL[role]}: ${right}`
  if (!editing) return <RightMark on={on} label={label} />
  return (
    <span className="inline-flex align-middle">
      <Checkbox
        label={label}
        checked={on}
        disabled={role === 'owner'}
        onCheckedChange={(next) => {
          if (role !== 'owner') onChange(next)
        }}
      />
    </span>
  )
}

/** One right, as a row of the table of rights. */
interface RightRow {
  right: string
  index: number
}

const RIGHT_ROWS: readonly RightRow[] = RIGHTS.map((right, index) => ({ right, index }))

/**
 * Roles against rights: a `DataTable` whose role columns hold a box per right. The owner may do
 * everything, so the owner's boxes are on and cannot be changed.
 */
function Permissions({
  matrix,
  editing,
  onChange,
}: {
  matrix: Record<Assignable, boolean[]>
  editing: boolean
  onChange(role: Assignable, index: number, on: boolean): void
}): ReactNode {
  const roles: Role[] = ['owner', 'admin', 'member', 'guest']
  const columns: DataTableColumn<RightRow>[] = [
    {
      id: 'right',
      header: 'Recht',
      cell: (row) => <span className="whitespace-nowrap text-secondary">{row.right}</span>,
    },
    ...roles.map(
      (role): DataTableColumn<RightRow> => ({
        id: role,
        header: ROLE_LABEL[role],
        align: 'center',
        cell: (row) => (
          <RightCell
            role={role}
            right={row.right}
            on={role === 'owner' ? true : (matrix[role][row.index] ?? false)}
            editing={editing}
            onChange={(on) => {
              if (role !== 'owner') onChange(role, row.index, on)
            }}
          />
        ),
      }),
    ),
  ]
  return (
    <>
      {/* A phone has no room for four columns of boxes: one role at a time, its rights a list. */}
      <div className="@xl:hidden">
        <RoleRights matrix={matrix} editing={editing} onChange={onChange} />
      </div>
      <div className="hidden @xl:block">
        <DataTable
          label="Rechten per rol"
          columns={columns}
          rows={RIGHT_ROWS}
          rowKey={(row) => row.right}
          labels={{ selectAll: 'Alles selecteren', selectRow: (name) => `Selecteer ${name}` }}
        />
      </div>
    </>
  )
}

const ROLE_OPTIONS = [{ value: 'owner', label: 'Eigenaar' }, ...ROLES] as const

/** The rights of one role, picked with a segmented control: the narrow form of the matrix. */
function RoleRights({
  matrix,
  editing,
  onChange,
}: {
  matrix: Record<Assignable, boolean[]>
  editing: boolean
  onChange(role: Assignable, index: number, on: boolean): void
}): ReactNode {
  const [role, setRole] = useState<Role>('member')
  return (
    <div className="flex flex-col gap-2 px-4 pb-3">
      <div className="*:w-full">
        <SegmentedControl<Role>
          label="Rol"
          size="sm"
          value={role}
          options={ROLE_OPTIONS}
          onValueChange={setRole}
        />
      </div>
      <ul className="m-0 list-none p-0">
        {RIGHTS.map((right, index) => (
          <li
            key={right}
            className="flex min-h-10 items-center justify-between gap-3 border-border border-t first:border-t-0"
          >
            <span className="text-[13px] text-secondary">{right}</span>
            <RightCell
              role={role}
              right={right}
              on={role === 'owner' ? true : (matrix[role][index] ?? false)}
              editing={editing}
              onChange={(on) => {
                if (role !== 'owner') onChange(role, index, on)
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

/** When a member was last active, as the row says it. */
function seenText(ms: number): string {
  return ms === 0 ? 'Nu actief' : `Actief ${ago(ms)}`
}

/** One member: face, name and address, when last seen, the role and a menu. */
function MemberRow({
  member,
  onRole,
}: {
  member: Member
  onRole(role: Assignable): void
}): ReactNode {
  return (
    <li className="flex items-center gap-3 border-border border-t px-4 py-2.5 first:border-t-0">
      <Avatar name={member.name} size="md" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13px] text-fg">{member.name}</span>
        <span className="truncate text-[12px] text-muted">{member.email}</span>
      </div>
      {/* The name and address take the room; when the row is short of it, the activity goes
          first, so an address is never cut while a column of times keeps its space. */}
      <span className="hidden w-28 shrink-0 whitespace-nowrap text-[12px] text-muted @3xl:block">
        {seenText(member.seen)}
      </span>
      <div className="flex shrink-0 justify-end @2xl:w-28">
        {member.role === 'owner' ? (
          <Tag>Eigenaar</Tag>
        ) : (
          <Select<Assignable>
            label={`Rol van ${member.name}`}
            size="sm"
            value={member.role}
            options={ROLES}
            onValueChange={onRole}
          />
        )}
      </div>
      <span className="hidden @lg:contents">
        <DropdownMenu
          trigger={
            <IconButton icon="more-horizontal" size="sm" label={`Acties voor ${member.name}`} />
          }
          label={`Acties voor ${member.name}`}
          align="end"
          items={[
            { id: 'profile', label: 'Profiel bekijken', icon: 'user' },
            { id: 'mail', label: 'E-mail sturen', icon: 'at-sign' },
            {
              id: 'remove',
              label: 'Uit het team halen',
              icon: 'trash-2',
              tone: 'danger',
              separated: true,
              disabled: member.role === 'owner',
            },
          ]}
        />
      </span>
    </li>
  )
}

/** Team and rights: the members with their role, open invitations, and what each role may do. */
function Team({ variant }: DemoScreenProps): ReactNode {
  const [members, setMembers] = useState(MEMBERS)
  const [invited, setInvited] = useState<{ email: string; role: Assignable; sent: number }[]>([
    { email: 'lotte@zilverberg.example', role: 'guest', sent: 2 * DAY },
  ])
  const [inviting, setInviting] = useState(variant === 'uitnodigen')
  // The block's switch opens and closes the dialog, as a click on "Uitnodigen" would.
  useEffect(() => setInviting(variant === 'uitnodigen'), [variant])
  const [query, setQuery] = useState('')
  const [matrix, setMatrix] = useState(MATRIX)
  const [editingRights, setEditingRights] = useState(false)
  const shown = members.filter((member) =>
    `${member.name} ${member.email}`.toLowerCase().includes(query.trim().toLowerCase()),
  )
  const setRole = (email: string, role: Assignable) =>
    setMembers((now) =>
      now.map((member) => (member.email === email ? { ...member, role } : member)),
    )
  return (
    <AppFrame product="orbit" current="team">
      <ScrollArea>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 @3xl:px-8 @3xl:py-7">
          <PageHeader
            title="Team"
            meta={`${members.length} leden · ${invited.length === 1 ? '1 uitnodiging' : `${invited.length} uitnodigingen`} open`}
            actions={
              <Button variant="primary" size="sm" onClick={() => setInviting(true)}>
                Uitnodigen
              </Button>
            }
          />
          <div className="grid grid-cols-1 items-start gap-5 @6xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-5">
              <Panel
                title="Leden"
                meta={String(members.length)}
                flush
                actions={
                  <div className="hidden w-56 *:w-full @xl:block">
                    <Input
                      label="Zoek een lid"
                      icon="search"
                      size="sm"
                      placeholder="Naam of e-mail…"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </div>
                }
              >
                <ul className="m-0 list-none p-0">
                  {shown.map((member) => (
                    <MemberRow
                      key={member.email}
                      member={member}
                      onRole={(role) => setRole(member.email, role)}
                    />
                  ))}
                  {shown.length === 0 ? (
                    <li className="px-4 py-6 text-center text-[13px] text-muted">
                      {`Niemand gevonden voor ‘${query}’`}
                    </li>
                  ) : null}
                </ul>
              </Panel>
              <Panel title="Openstaande uitnodigingen" meta={String(invited.length)} flush>
                <ul className="m-0 list-none p-0">
                  {invited.map((invite) => (
                    <li
                      key={invite.email}
                      className="flex items-center gap-3 border-border border-t px-4 py-2.5 first:border-t-0"
                    >
                      <Avatar name={null} size="md" />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[13px] text-fg">{invite.email}</span>
                        <span className="truncate text-[12px] text-muted">
                          {`${ROLE_LABEL[invite.role]} · verstuurd ${invite.sent === 0 ? 'zojuist' : ago(invite.sent)}`}
                        </span>
                      </div>
                      {/* Beside the address where there is room; behind ⋯ on a phone, so the
                          address itself stays readable. */}
                      <span className="hidden shrink-0 items-center gap-1 @xl:flex">
                        <Button variant="secondary" size="sm">
                          Opnieuw sturen
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setInvited((now) => now.filter((entry) => entry.email !== invite.email))
                          }
                        >
                          Intrekken
                        </Button>
                      </span>
                      <span className="@xl:hidden">
                        <DropdownMenu
                          trigger={
                            <IconButton
                              icon="more-horizontal"
                              size="sm"
                              label={`Acties voor ${invite.email}`}
                            />
                          }
                          label={`Acties voor ${invite.email}`}
                          align="end"
                          items={[
                            { id: 'resend', label: 'Opnieuw sturen', icon: 'rotate-cw' },
                            {
                              id: 'revoke',
                              label: 'Intrekken',
                              icon: 'x',
                              tone: 'danger',
                              separated: true,
                              onSelect: () =>
                                setInvited((now) =>
                                  now.filter((entry) => entry.email !== invite.email),
                                ),
                            },
                          ]}
                        />
                      </span>
                    </li>
                  ))}
                  {invited.length === 0 ? (
                    <li className="px-4 py-6 text-center text-[13px] text-muted">
                      Geen uitnodigingen open
                    </li>
                  ) : null}
                </ul>
              </Panel>
            </div>
            <Panel
              title="Rechten per rol"
              meta="voor de hele werkruimte"
              flush
              actions={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingRights((now) => !now)}
                >
                  {editingRights ? 'Klaar' : 'Aanpassen'}
                </Button>
              }
            >
              <div>
                <Permissions
                  matrix={matrix}
                  editing={editingRights}
                  onChange={(role, index, on) =>
                    setMatrix((now) => ({
                      ...now,
                      [role]: now[role].map((value, at) => (at === index ? on : value)),
                    }))
                  }
                />
              </div>
            </Panel>
          </div>
        </div>
      </ScrollArea>
      <InviteDialog
        open={inviting}
        onOpenChange={setInviting}
        onInvite={(emails, role) =>
          setInvited((now) => [...now, ...emails.map((email) => ({ email, role, sent: 0 }))])
        }
      />
    </AppFrame>
  )
}

export default {
  title: 'Team en rechten',
  description:
    'Wie er in de werkruimte zit, met welke rol, en wat elke rol mag. Uitnodigen gaat via een dialoog die binnen het venster blijft.',
  icon: 'users',
  product: 'orbit',
  variants: [
    { value: 'leden', label: 'Leden' },
    { value: 'uitnodigen', label: 'Uitnodigen' },
  ],
  Screen: Team,
} satisfies DemoModule
