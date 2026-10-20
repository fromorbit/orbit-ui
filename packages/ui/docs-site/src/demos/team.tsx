import { type ReactNode, useState } from 'react'
import {
  Avatar,
  Button,
  Checkbox,
  ChipListField,
  Dialog,
  DropdownMenu,
  IconButton,
  Input,
  PageHeader,
  ScrollArea,
  Select,
  SettingsGroup,
  Tag,
  Textarea,
} from '../../../src'
import { galleryLabels } from '../../../src/gallery'
import { Missing } from '../demo-kit/Missing'
import type { DemoModule } from '../demo-kit/types'
import { AppFrame } from './parts/AppFrame'
import { FormFieldSketch } from './parts/FormFieldSketch'

type Role = 'owner' | 'admin' | 'editor' | 'viewer'

const ROLES = [
  { value: 'admin', label: 'Beheerder' },
  { value: 'editor', label: 'Bewerker' },
  { value: 'viewer', label: 'Lezer' },
] as const

const ROLE_LABEL: Record<Role, string> = {
  owner: 'Eigenaar',
  admin: 'Beheerder',
  editor: 'Bewerker',
  viewer: 'Lezer',
}

interface Member {
  name: string
  email: string
  role: Role
}

const MEMBERS: Member[] = [
  { name: 'Iris Kamphorst', email: 'iris@zilverberg.example', role: 'owner' },
  { name: 'Daan Velthuis', email: 'daan@zilverberg.example', role: 'admin' },
  { name: 'Mila Terhorst', email: 'mila@zilverberg.example', role: 'editor' },
  { name: 'Sem Oudeweg', email: 'sem@zilverberg.example', role: 'editor' },
  { name: 'Fenna Brouwsma', email: 'fenna@zilverberg.example', role: 'editor' },
  { name: 'Joris Lindeboom', email: 'joris@zilverberg.example', role: 'viewer' },
]

const RIGHTS = [
  'Bestellingen bekijken',
  'Inhoud bewerken',
  'Inhoud publiceren',
  'Betalingen terugboeken',
  'Teamleden beheren',
  'Abonnement wijzigen',
]

/** Who may do what by default: a made-up matrix, rows are rights, columns roles. */
const MATRIX: Record<Exclude<Role, 'owner'>, boolean[]> = {
  admin: [true, true, true, true, true, false],
  editor: [true, true, true, false, false, false],
  viewer: [true, false, false, false, false, false],
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** The dialog to invite people: addresses, a role and a note. */
function InviteDialog({
  open,
  onOpenChange,
  onInvite,
}: {
  open: boolean
  onOpenChange(open: boolean): void
  onInvite(emails: readonly string[], role: Role): void
}) {
  const [emails, setEmails] = useState<readonly string[]>(['noa@zilverberg.example'])
  const [role, setRole] = useState<Exclude<Role, 'owner'>>('editor')
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Mensen uitnodigen"
      description="Ze krijgen een e-mail met een link die zeven dagen geldig is."
      closeLabel="Annuleren"
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
            Uitnodigen
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormFieldSketch label="E-mailadressen" hint="Enter na elk adres">
          {(labelId) => (
            <ChipListField
              label="E-mailadressen"
              aria-labelledby={labelId}
              labels={galleryLabels.chipList}
              value={emails}
              onChange={setEmails}
              maxItems={20}
              maxLength={80}
              check={(item) => (EMAIL.test(item) ? undefined : 'Geen geldig e-mailadres')}
            />
          )}
        </FormFieldSketch>
        <FormFieldSketch label="Rol">
          {(labelId) => (
            <Select<Exclude<Role, 'owner'>>
              label="Rol"
              aria-labelledby={labelId}
              value={role}
              options={ROLES}
              onValueChange={setRole}
            />
          )}
        </FormFieldSketch>
        <FormFieldSketch label="Persoonlijk bericht">
          {(labelId) => (
            <Textarea
              label="Persoonlijk bericht"
              aria-labelledby={labelId}
              placeholder="Optioneel"
              minRows={2}
            />
          )}
        </FormFieldSketch>
      </div>
    </Dialog>
  )
}

/** Team and rights: the members with their role, open invitations, and what each role may do. */
function Team(): ReactNode {
  const [members, setMembers] = useState(MEMBERS)
  const [invited, setInvited] = useState<{ email: string; role: Role }[]>([
    { email: 'lotte@zilverberg.example', role: 'viewer' },
  ])
  const [inviting, setInviting] = useState(false)
  const [query, setQuery] = useState('')
  const [matrix, setMatrix] = useState(MATRIX)
  const shown = members.filter((member) =>
    `${member.name} ${member.email}`.toLowerCase().includes(query.trim().toLowerCase()),
  )
  const setRole = (email: string, role: Role) =>
    setMembers((now) =>
      now.map((member) => (member.email === email ? { ...member, role } : member)),
    )

  return (
    <AppFrame current="team">
      <ScrollArea>
        <div className="flex max-w-4xl flex-col gap-8 px-8 py-6">
          <PageHeader
            title="Team"
            meta={`${members.length} leden · ${invited.length} uitnodiging open`}
            actions={
              <>
                <Missing name="AvatarGroup" inline>
                  <span className="flex items-center">
                    {members.slice(0, 4).map((member) => (
                      <Avatar key={member.email} name={member.name} size="sm" />
                    ))}
                    <span className="ps-1 text-[11px] text-muted">+{members.length - 4}</span>
                  </span>
                </Missing>
                <Button variant="primary" size="sm" onClick={() => setInviting(true)}>
                  Uitnodigen
                </Button>
              </>
            }
          />
          <SettingsGroup
            title="Leden"
            action={
              <div className="w-56">
                <Input
                  label="Zoek leden"
                  placeholder="Zoek op naam of e-mail…"
                  icon="search"
                  size="sm"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  clearLabel="Wissen"
                  onClear={() => setQuery('')}
                />
              </div>
            }
          >
            {shown.map((member) => (
              <div key={member.email} className="flex items-center gap-3 px-4 py-2.5">
                <Avatar name={member.name} size="md" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[13px] text-fg">{member.name}</span>
                  <span className="truncate text-[12px] text-muted">{member.email}</span>
                </div>
                {member.role === 'owner' ? (
                  <Tag>Eigenaar</Tag>
                ) : (
                  <Select<Exclude<Role, 'owner'>>
                    label={`Rol van ${member.name}`}
                    size="sm"
                    value={member.role}
                    options={ROLES}
                    onValueChange={(role) => setRole(member.email, role)}
                  />
                )}
                <DropdownMenu
                  trigger={
                    <IconButton
                      icon="more-horizontal"
                      size="sm"
                      label={`Acties voor ${member.name}`}
                    />
                  }
                  label={`Acties voor ${member.name}`}
                  align="end"
                  items={[
                    { id: 'mail', label: 'E-mail sturen', icon: 'message-square' },
                    {
                      id: 'remove',
                      label: 'Uit team verwijderen',
                      tone: 'danger',
                      separated: true,
                      disabled: member.role === 'owner',
                      onSelect: () =>
                        setMembers((now) => now.filter((other) => other.email !== member.email)),
                    },
                  ]}
                />
              </div>
            ))}
          </SettingsGroup>
          {invited.length > 0 ? (
            <SettingsGroup title="Openstaande uitnodigingen">
              {invited.map((invite) => (
                <div key={invite.email} className="flex items-center gap-3 px-4 py-2.5">
                  <Avatar name={null} size="md" />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-secondary">
                    {invite.email}
                  </span>
                  <Tag tone="attention">{ROLE_LABEL[invite.role]}</Tag>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setInvited((now) => now.filter((other) => other !== invite))}
                  >
                    Intrekken
                  </Button>
                </div>
              ))}
            </SettingsGroup>
          ) : null}
          <section className="flex flex-col gap-2">
            <PageHeader title="Rechten per rol" />
            <Missing name="PermissionMatrix" note="Rechten tegen rollen; de eigenaar mag alles">
              <div className="grid grid-cols-[minmax(0,1fr)_96px_96px_96px_96px] items-center gap-y-1 text-[12px]">
                <span />
                {(['owner', 'admin', 'editor', 'viewer'] as const).map((role) => (
                  <span key={role} className="text-center text-muted">
                    {ROLE_LABEL[role]}
                  </span>
                ))}
                {RIGHTS.map((right, index) => (
                  <div key={right} className="contents">
                    <span className="py-1 text-secondary">{right}</span>
                    <span className="flex justify-center">
                      <Checkbox
                        label={`${right}: Eigenaar`}
                        checked
                        disabled
                        onCheckedChange={() => {}}
                      />
                    </span>
                    {(['admin', 'editor', 'viewer'] as const).map((role) => (
                      <span key={role} className="flex justify-center">
                        <Checkbox
                          label={`${right}: ${ROLE_LABEL[role]}`}
                          checked={matrix[role][index] ?? false}
                          onCheckedChange={(on) =>
                            setMatrix((now) => ({
                              ...now,
                              [role]: now[role].map((value, at) => (at === index ? on : value)),
                            }))
                          }
                        />
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </Missing>
          </section>
        </div>
      </ScrollArea>
      <InviteDialog
        open={inviting}
        onOpenChange={setInviting}
        onInvite={(emails, role) =>
          setInvited((now) => [...now, ...emails.map((email) => ({ email, role }))])
        }
      />
    </AppFrame>
  )
}

export default { title: 'Team en rechten', icon: 'users', Screen: Team } satisfies DemoModule
