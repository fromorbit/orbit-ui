import { type ReactNode, useState } from 'react'
import {
  Avatar,
  Banner,
  Button,
  Combobox,
  ConfirmDialog,
  Form,
  FormField,
  Input,
  List,
  ListRow,
  PageHeader,
  PlanCard,
  PlanCards,
  RadioGroup,
  ScrollArea,
  SearchList,
  type SearchListItem,
  type SearchListLabels,
  SecretField,
  Select,
  SettingFoldRow,
  SettingRow,
  SettingsGroup,
  StatusMark,
  Switch,
} from '../../../src'
import { galleryLabels } from '../../../src/gallery'
import type { DemoModule, DemoScreenProps } from '../demo-kit/types'
import { AppFrame, ME, REPO } from './parts/AppFrame'

const labels = galleryLabels.settingRow

const LIST_LABELS: SearchListLabels = {
  empty: 'Niets',
  noResults: (query) => `Geen treffers voor ‘${query}’`,
  loading: 'Laden…',
  error: 'Kon de lijst niet laden',
}

type Section = 'repository' | 'account' | 'meldingen' | 'abonnement'

/** The sections of the page, as the list at the side and the select on a narrow frame name them. */
const SECTIONS: readonly (SearchListItem & { id: Section })[] = [
  { id: 'repository', label: 'Repository', icon: 'folder-git-2' },
  { id: 'account', label: 'Account', icon: 'user' },
  { id: 'meldingen', label: 'Meldingen', icon: 'bell' },
  { id: 'abonnement', label: 'Plan en betaling', icon: 'sliders-horizontal' },
]

/** The intro under the title of every section. */
const INTRO: Record<Section, string> = {
  repository: `Hoe Orbit Review ${REPO} installeert, start en beoordeelt.`,
  account: 'Je profiel, je taal en hoe je inlogt.',
  meldingen: 'Wat je hoort, en wanneer niet.',
  abonnement: 'Het plan van Zilverberg en hoe het betaald wordt.',
}

/**
 * A control at the one width every field of the page shares, so the column lines up: the widest a
 * `Select` grows (`max-w-56`).
 */
function Wide({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="w-56 max-w-full @max-[30rem]:w-full *:w-full *:*:w-full *:text-left">
      {children}
    </div>
  )
}

/** A setting row around a switch that really switches. */
function SwitchSetting({
  label,
  description,
  initial,
}: {
  label: string
  description?: string
  initial: boolean
}): ReactNode {
  const [on, setOn] = useState(initial)
  return (
    <SettingRow labels={labels} label={label} {...(description ? { description } : {})}>
      {({ labelId, describedById }) => (
        <Switch
          label={label}
          aria-labelledby={labelId}
          aria-describedby={describedById}
          checked={on}
          onCheckedChange={setOn}
        />
      )}
    </SettingRow>
  )
}

/** A setting row around a text field of the shared width. */
function TextSetting({
  label,
  description,
  initial,
  mono = false,
}: {
  label: string
  description?: string
  initial: string
  mono?: boolean
}): ReactNode {
  const [value, setValue] = useState(initial)
  return (
    <SettingRow labels={labels} label={label} {...(description ? { description } : {})}>
      {({ labelId, describedById }) => (
        <Wide>
          <span className={mono ? 'font-mono *:w-full' : '*:w-full'}>
            <Input
              label={label}
              aria-labelledby={labelId}
              aria-describedby={describedById}
              size="sm"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </span>
        </Wide>
      )}
    </SettingRow>
  )
}

/** What Orbit Review finds on this machine before it can start the app. */
const TOOLS = [
  { name: 'Bun 1.4.4', kind: 'done', status: 'Gevonden' },
  { name: 'Node 24.11', kind: 'done', status: 'Gevonden' },
  { name: 'Docker', kind: 'attention', status: 'Draait niet' },
] as const

/** Orbit Review's settings for one repository, with the check of the machine on top. */
function Repository(): ReactNode {
  const [verdict, setVerdict] = useState('changes')
  return (
    <>
      {/* One state, said once: the banner carries the words and the action; the Omgeving row below
          only lists the tools when it is opened, so the warning does not stand twice. */}
      <Banner
        tone="attention"
        action={
          <Button variant="secondary" size="sm">
            Opnieuw controleren
          </Button>
        }
      >
        Docker draait niet: start Docker Desktop, OrbStack of Colima.
      </Banner>
      <SettingsGroup title="Koppeling">
        <SettingRow labels={labels} label="Repository" description="Gekoppeld via GitHub">
          {() => (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-mono text-[12px] text-secondary">{REPO}</span>
              <span className="inline-flex items-center gap-1.5 text-[12px] text-secondary">
                <StatusMark kind="running" size="sm" />
                Gekoppeld
              </span>
            </div>
          )}
        </SettingRow>
        <SettingFoldRow label="Omgeving" description="Wat Review op deze machine nodig heeft">
          <List label="Omgeving">
            {TOOLS.map((tool) => (
              <ListRow key={tool.name} title={tool.name} kind={tool.kind} status={tool.status} />
            ))}
          </List>
        </SettingFoldRow>
      </SettingsGroup>
      <SettingsGroup title="De app starten">
        <TextSetting
          label="Installatiecommando"
          description="Eén keer per review, in een schone map"
          initial="bun install"
          mono
        />
        <TextSetting label="Startcommando" initial="bun run dev" mono />
        <TextSetting
          label="URL"
          description="Waar de app opent zodra hij draait"
          initial="http://localhost:5173"
          mono
        />
        <SwitchSetting
          label="Vertrouwd"
          description="Start zonder te vragen; alleen voor je eigen team"
          initial
        />
      </SettingsGroup>
      <SettingsGroup title="Verslag">
        <SwitchSetting
          label="Verslag automatisch op GitHub plaatsen"
          description="Met de schermafbeeldingen van de bevindingen"
          initial={false}
        />
        <SettingRow
          labels={labels}
          label="Bij een blokkerende bevinding"
          description="Een goedkeuring plaatst Review nooit"
        >
          {({ labelId }) => (
            <div className="w-56 max-w-full @max-[30rem]:w-full">
              <Select
                label="Bij een blokkerende bevinding"
                aria-labelledby={labelId}
                size="sm"
                value={verdict}
                options={[
                  { value: 'changes', label: 'Om wijzigingen vragen' },
                  { value: 'comment', label: 'Alleen een opmerking' },
                ]}
                onValueChange={setVerdict}
                block
              />
            </div>
          )}
        </SettingRow>
      </SettingsGroup>
    </>
  )
}

/** Time zones to find by typing: a list too long to scan as a `Select`. */
const ZONES = [
  { value: 'Europe/Amsterdam', label: 'Amsterdam', detail: 'CET', keywords: ['nederland'] },
  { value: 'Europe/Brussels', label: 'Brussel', detail: 'CET', keywords: ['belgie'] },
  { value: 'Europe/Berlin', label: 'Berlijn', detail: 'CET', keywords: ['duitsland'] },
  { value: 'Europe/Lisbon', label: 'Lissabon', detail: 'WET', keywords: ['portugal'] },
  { value: 'Europe/London', label: 'Londen', detail: 'GMT', keywords: ['engeland'] },
  { value: 'Europe/Helsinki', label: 'Helsinki', detail: 'EET', keywords: ['finland'] },
  { value: 'America/New_York', label: 'New York', detail: 'EST' },
  { value: 'America/Curacao', label: 'Willemstad', detail: 'AST', keywords: ['curacao'] },
  { value: 'Asia/Jakarta', label: 'Jakarta', detail: 'WIB', keywords: ['indonesie'] },
  { value: 'UTC', label: 'UTC', detail: '+00:00' },
] as const

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/**
 * The profile as one form: the fields under their labels, checked when it is saved, with the
 * focus on the first field that is wrong.
 */
function ProfileForm(): ReactNode {
  const [name, setName] = useState(ME)
  const [email, setEmail] = useState('iris@zilverberg.example')
  const [language, setLanguage] = useState('nl')
  const [zone, setZone] = useState<string | null>('Europe/Amsterdam')
  const [checked, setChecked] = useState(false)
  const [saved, setSaved] = useState(false)
  const nameError = checked && name.trim() === '' ? 'Vul je naam in.' : undefined
  const emailError = checked && !EMAIL.test(email) ? 'Vul een geldig e-mailadres in.' : undefined
  return (
    <SettingsGroup title="Profiel">
      <div className="p-4">
        <Form
          onSubmit={() => {
            setChecked(true)
            setSaved(name.trim() !== '' && EMAIL.test(email))
          }}
          actions={
            <>
              <Button type="submit" variant="primary">
                Opslaan
              </Button>
              {saved ? <span className="text-[12px] text-muted">Opgeslagen</span> : null}
            </>
          }
        >
          <div className="flex items-center gap-3">
            <Avatar name={ME} size="md" />
            <Button variant="secondary" size="sm">
              Foto wijzigen
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2">
            <FormField label="Naam" required {...(nameError ? { error: nameError } : {})}>
              {(field) => (
                <Input
                  label="Naam"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                    setSaved(false)
                  }}
                  {...field}
                />
              )}
            </FormField>
            <FormField
              label="E-mailadres"
              description="Voor inloggen en facturen."
              required
              {...(emailError ? { error: emailError } : {})}
            >
              {(field) => (
                <Input
                  label="E-mailadres"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setSaved(false)
                  }}
                  {...field}
                />
              )}
            </FormField>
            <FormField label="Taal">
              {(field) => (
                <Select
                  label="Taal"
                  value={language}
                  options={[
                    { value: 'nl', label: 'Nederlands' },
                    { value: 'en', label: 'English' },
                  ]}
                  onValueChange={setLanguage}
                  block
                  {...field}
                />
              )}
            </FormField>
            <FormField label="Tijdzone" description="Voor de tijden in meldingen en verslagen.">
              {(field) => (
                <Combobox
                  label="Tijdzone"
                  placeholder="Kies een tijdzone"
                  labels={galleryLabels.combobox}
                  options={ZONES}
                  value={zone}
                  onValueChange={setZone}
                  block
                  {...field}
                />
              )}
            </FormField>
          </div>
        </Form>
      </div>
    </SettingsGroup>
  )
}

/** Name, address, language and the security of the account. */
function Account(): ReactNode {
  const [keySet, setKeySet] = useState(true)
  const [remove, setRemove] = useState(false)
  return (
    <>
      <ProfileForm />
      <SettingsGroup title="Beveiliging">
        <SwitchSetting
          label="Tweestapsverificatie"
          description="Een code uit je authenticator-app bij elke nieuwe aanmelding"
          initial
        />
        <SettingRow labels={labels} label="API-sleutel" description="Voor de Orbit-CLI en je CI">
          {({ labelId, describedById }) => (
            <Wide>
              <SecretField
                label="API-sleutel"
                aria-labelledby={labelId}
                {...(describedById ? { 'aria-describedby': describedById } : {})}
                labels={galleryLabels.secret}
                isSet={keySet}
                size="sm"
                onSave={() => setKeySet(true)}
                onClear={() => setKeySet(false)}
              />
            </Wide>
          )}
        </SettingRow>
        <SettingFoldRow
          label="Actieve sessies"
          description="Waar je nu bent ingelogd"
          status={{ tone: 'success', label: '2 apparaten' }}
        >
          <List label="Sessies">
            <ListRow title="MacBook · Orbit 0.9 · Utrecht" meta="Nu" />
            <ListRow title="Telefoon · Safari · Utrecht" meta="2 u" />
          </List>
        </SettingFoldRow>
      </SettingsGroup>
      <SettingsGroup title="Account verwijderen">
        <SettingRow
          labels={labels}
          label="Account verwijderen"
          description="Je profiel verdwijnt; de werkruimte blijft bestaan"
        >
          {() => (
            <Button variant="secondary" size="sm" onClick={() => setRemove(true)}>
              Verwijderen…
            </Button>
          )}
        </SettingRow>
      </SettingsGroup>
      <ConfirmDialog
        open={remove}
        onOpenChange={setRemove}
        title="Account verwijderen?"
        body="Je profiel en je instellingen verdwijnen. Dit kun je niet ongedaan maken."
        confirmLabel="Verwijderen"
        cancelLabel="Annuleren"
        tone="danger"
        onConfirm={() => setRemove(false)}
      />
    </>
  )
}

/** Which messages arrive, and how often. */
function Notifications(): ReactNode {
  const [rhythm, setRhythm] = useState('daily')
  return (
    <>
      <SettingsGroup title="Direct">
        <SwitchSetting
          label="Een agent wacht op jou"
          description="Een vraag, een keuze of een goedkeuring"
          initial
        />
        <SwitchSetting label="Review klaar" initial />
        <SwitchSetting
          label="Opname met een fout"
          description="Uit Halo, als een pagina van een space faalt"
          initial
        />
        <SwitchSetting label="Productnieuws" initial={false} />
      </SettingsGroup>
      <SettingsGroup title="Samenvatting">
        <div className="p-4">
          <RadioGroup
            label="Hoe vaak"
            value={rhythm}
            onValueChange={setRhythm}
            options={[
              { id: 'never', label: 'Nooit', description: 'Alleen de directe meldingen' },
              { id: 'daily', label: 'Dagelijks', description: 'Elke ochtend om 8:00' },
              { id: 'weekly', label: 'Wekelijks', description: 'Op maandagochtend' },
            ]}
          />
        </div>
      </SettingsGroup>
      <SettingsGroup title="Stille uren">
        <SwitchSetting
          label="Niet storen tussen 22:00 en 7:00"
          description="Een agent die wacht, wacht tot de ochtend"
          initial
        />
      </SettingsGroup>
    </>
  )
}

/** The one way to pay the open invoice now, named as on Gebruik. */
const PAY_NOW = 'Nu betalen met iDEAL'

/**
 * The failed direct debit first, as on Gebruik, with the one step that settles it; then the plan
 * the workspace is on beside the one above it, and how it is paid: two plans rather than a table of
 * every plan, so the choice stays small, and the whole of the usage on its own page. The plans lie
 * on the tint of the settings groups under them, so the column speaks one region language.
 */
function Subscription(): ReactNode {
  return (
    <>
      <Banner
        tone="danger"
        action={
          <Button variant="primary" size="sm">
            {PAY_NOW}
          </Button>
        }
      >
        Incasso van € 174,24 voor september mislukt: onvoldoende saldo. Nieuwe poging 24{'\u00a0'}
        okt.
      </Banner>
      <PlanCards label="Plannen">
        <PlanCard
          name="Team"
          price="€ 24"
          period="per lid per maand, excl. btw"
          description="Voor een team dat samen bouwt en reviewt."
          features={[
            'Onbeperkt gesprekken en specs',
            '250 agent-uren per maand',
            'Orbit Review op 10 repositories',
            '50 GB opslag voor opnames',
          ]}
          current
          currentLabel="Huidig plan"
          plane="surface"
          summary="6 leden · € 174,24 per maand incl. btw"
        />
        <PlanCard
          name="Bedrijf"
          price="€ 39"
          period="per lid per maand, excl. btw"
          description="Voor meer teams, met inloggen via je eigen provider."
          features={[
            'Alles van Team',
            '1.000 agent-uren per maand',
            'Orbit Review op elke repository',
            '250 GB opslag voor opnames',
            'Inloggen met SSO',
          ]}
          plane="surface"
          summary="6 leden · € 283,14 per maand incl. btw"
          action={
            <Button variant="secondary" size="sm">
              Naar Bedrijf
            </Button>
          }
        />
      </PlanCards>
      <SettingsGroup title="Betaling">
        <SettingRow
          labels={labels}
          label="Betaalwijze"
          description={'SEPA-incasso, NL •••• 4021 · nieuwe poging 24\u00a0okt'}
        >
          {() => (
            <span className="inline-flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-[12px] text-secondary">
                <StatusMark kind="fault" />
                Incasso mislukt
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  location.hash = '#/demo/gebruik'
                }}
              >
                Wijzigen
              </Button>
            </span>
          )}
        </SettingRow>
        <SettingRow
          labels={labels}
          label="Gebruik en facturen"
          description="Het gebruik, de facturen en de betaalwijze"
        >
          {() => (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                location.hash = '#/demo/gebruik'
              }}
            >
              Bekijken
            </Button>
          )}
        </SettingRow>
      </SettingsGroup>
    </>
  )
}

const CONTENT: Record<Section, () => ReactNode> = {
  repository: Repository,
  account: Account,
  meldingen: Notifications,
  abonnement: Subscription,
}

/** The page with a section open; the block's variant picks the first one. */
function SettingsPage({ initial }: { initial: Section }): ReactNode {
  const [section, setSection] = useState<Section>(initial)
  const Content = CONTENT[section]
  const current = SECTIONS.find((entry) => entry.id === section)
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-5 text-[13px] @3xl:px-8 @3xl:py-7">
      <PageHeader
        title="Instellingen"
        meta={section === 'repository' ? `Zilverberg · ${REPO}` : 'Zilverberg'}
      />
      <div className="@4xl:hidden">
        <Select<Section>
          label="Onderdeel"
          value={section}
          options={SECTIONS.map(({ id, label }) => ({ value: id, label }))}
          onValueChange={setSection}
          block
        />
      </div>
      <div className="flex gap-8">
        <div className="hidden w-48 shrink-0 @4xl:block">
          <div className="sticky top-0">
            <SearchList
              items={SECTIONS}
              selectedId={section}
              onSelect={(id) => setSection(id as Section)}
              label="Onderdelen"
              labels={LIST_LABELS}
              searchable={false}
              checkSlot={false}
            />
          </div>
        </div>
        <div className="flex min-w-0 max-w-3xl flex-1 flex-col gap-6">
          <div className="flex flex-col gap-0.5">
            <h2 className="m-0 font-heading text-[15px] text-fg">{current?.label}</h2>
            <p className="m-0 text-[12px] text-muted">{INTRO[section]}</p>
          </div>
          <Content />
        </div>
      </div>
    </div>
  )
}

/** Settings of Orbit: the repository Review works on, the account, messages and the plan. */
function Settings({ variant }: DemoScreenProps): ReactNode {
  const initial = (SECTIONS.find((entry) => entry.id === variant)?.id ?? 'repository') as Section
  return (
    <AppFrame product="orbit" current="instellingen">
      <ScrollArea>
        <SettingsPage key={initial} initial={initial} />
      </ScrollArea>
    </AppFrame>
  )
}

export default {
  title: 'Instellingen',
  description:
    'De instellingen van Orbit, met die van Orbit Review voor één repository: hoe de app installeert en start, wat er met het verslag gebeurt, en wat er op deze machine ontbreekt.',
  icon: 'settings',
  product: 'orbit',
  variants: [
    { value: 'repository', label: 'Repository' },
    { value: 'account', label: 'Account' },
    { value: 'abonnement', label: 'Plan en betaling' },
  ],
  Screen: Settings,
} satisfies DemoModule
