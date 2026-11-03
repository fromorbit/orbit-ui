import { type ReactNode, useEffect, useState } from 'react'
import {
  Avatar,
  AvatarGroup,
  Button,
  Checkbox,
  Chip,
  DataTable,
  type DataTableColumn,
  Dialog,
  DropdownMenu,
  FormField,
  IconButton,
  Input,
  PageHeader,
  RelativeTime,
  ScrollArea,
  Select,
  Tag,
  Textarea,
} from '../../../src'
import { galleryLabels } from '../../../src/gallery'
import type { DemoModule, DemoScreenProps } from '../demo-kit/types'
import { AppFrame, DAY, HOUR, NOW } from './parts/AppFrame'
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
  /** When the member was last active, before {@link NOW}. */
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
  'Overnemen in main',
  'Reviews plaatsen',
  'Leden uitnodigen',
  'Abonnement wijzigen',
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
  onChange,
}: {
  matrix: Record<Assignable, boolean[]>
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
          <span className="inline-flex align-middle">
            <Checkbox
              label={`${ROLE_LABEL[role]}: ${row.right}`}
              checked={role === 'owner' ? true : (matrix[role][row.index] ?? false)}
              disabled={role === 'owner'}
              onCheckedChange={(on) => {
                if (role !== 'owner') onChange(role, row.index, on)
              }}
            />
          </span>
        ),
      }),
    ),
  ]
  return (
    <DataTable
      label="Rechten per rol"
      columns={columns}
      rows={RIGHT_ROWS}
      rowKey={(row) => row.right}
      labels={{ selectAll: 'Alles selecteren', selectRow: (name) => `Selecteer ${name}` }}
    />
  )
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
      <span className="hidden w-24 shrink-0 text-[12px] text-muted @2xl:block">
        {member.seen === 0 ? (
          'Nu actief'
        ) : (
          <RelativeTime labels={galleryLabels.time} at={NOW - member.seen} now={NOW} />
        )}
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
              <>
                <span className="hidden @xl:inline-flex">
                  <AvatarGroup
                    names={members.map((member) => member.name)}
                    label={`${members.length} leden`}
                  />
                </span>
                <Button variant="primary" size="sm" onClick={() => setInviting(true)}>
                  Uitnodigen
                </Button>
              </>
            }
          />
          <div className="grid grid-cols-1 items-start gap-5 @6xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
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
                          {`${ROLE_LABEL[invite.role]} · verstuurd `}
                          <RelativeTime
                            labels={galleryLabels.time}
                            at={NOW - invite.sent}
                            now={NOW}
                          />
                        </span>
                      </div>
                      <Button variant="ghost" size="sm">
                        Opnieuw sturen
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setInvited((now) => now.filter((entry) => entry.email !== invite.email))
                        }
                      >
                        Intrekken
                      </Button>
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
            <Panel title="Rechten per rol" meta="voor de hele werkruimte" flush>
              <div>
                <Permissions
                  matrix={matrix}
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
