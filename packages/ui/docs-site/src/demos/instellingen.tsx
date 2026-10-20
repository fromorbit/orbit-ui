import { type ReactNode, useState } from 'react'
import {
  Avatar,
  Button,
  ConfirmDialog,
  Input,
  List,
  ListRow,
  PageHeader,
  ProgressMeter,
  RadioGroup,
  ScrollArea,
  SecretField,
  Select,
  SettingFoldRow,
  SettingRow,
  SettingsGroup,
  Switch,
  Tabs,
  Tag,
} from '../../../src'
import { galleryLabels } from '../../../src/gallery'
import { Missing } from '../demo-kit/Missing'
import type { DemoModule } from '../demo-kit/types'
import { AppFrame, ME } from './parts/AppFrame'

const labels = galleryLabels.settingRow

/** A setting row around a switch that really switches. */
function SwitchSetting({
  label,
  description,
  initial,
}: {
  label: string
  description?: string
  initial: boolean
}) {
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

/** Name, address, language and the security of the account. */
function Account() {
  const [name, setName] = useState(ME)
  const [language, setLanguage] = useState('nl')
  const [zone, setZone] = useState('ams')
  const [keySet, setKeySet] = useState(true)
  const [remove, setRemove] = useState(false)
  return (
    <div className="flex flex-col gap-8">
      <SettingsGroup title="Profiel">
        <SettingRow labels={labels} label="Foto" description="Zichtbaar voor je team">
          {() => (
            <div className="flex items-center gap-3">
              <Avatar name={name} size="lg" />
              <Button variant="secondary" size="sm">
                Wijzigen
              </Button>
            </div>
          )}
        </SettingRow>
        <SettingRow labels={labels} label="Naam">
          {({ labelId }) => (
            <div className="w-64">
              <Input
                label="Naam"
                aria-labelledby={labelId}
                size="sm"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
          )}
        </SettingRow>
        <SettingRow labels={labels} label="E-mailadres" description="Voor inloggen en facturen">
          {({ labelId, describedById }) => (
            <div className="w-64">
              <Input
                label="E-mailadres"
                aria-labelledby={labelId}
                aria-describedby={describedById}
                size="sm"
                type="email"
                defaultValue="iris@zilverberg.example"
              />
            </div>
          )}
        </SettingRow>
        <SettingRow labels={labels} label="Taal">
          {({ labelId }) => (
            <Select
              label="Taal"
              aria-labelledby={labelId}
              size="sm"
              value={language}
              options={[
                { value: 'nl', label: 'Nederlands' },
                { value: 'en', label: 'English' },
                { value: 'de', label: 'Deutsch' },
              ]}
              onValueChange={setLanguage}
            />
          )}
        </SettingRow>
        <SettingRow labels={labels} label="Tijdzone">
          {({ labelId }) => (
            <Select
              label="Tijdzone"
              aria-labelledby={labelId}
              size="sm"
              value={zone}
              options={[
                { value: 'ams', label: 'Amsterdam (CEST)' },
                { value: 'lon', label: 'Londen (BST)' },
                { value: 'utc', label: 'UTC' },
              ]}
              onValueChange={setZone}
            />
          )}
        </SettingRow>
      </SettingsGroup>
      <SettingsGroup title="Beveiliging">
        <SwitchSetting
          label="Tweestapsverificatie"
          description="Een code uit je app bij elke nieuwe inlog"
          initial
        />
        <SettingRow
          labels={labels}
          label="API-sleutel"
          description="Voor koppelingen met je webwinkel"
        >
          {({ labelId, describedById }) => (
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
          )}
        </SettingRow>
        <SettingFoldRow
          label="Actieve sessies"
          description="Waar je nu bent ingelogd"
          status={{ tone: 'success', label: '2 apparaten' }}
        >
          <List label="Sessies">
            <ListRow title="Laptop · Firefox · Utrecht" meta="Nu" />
            <ListRow title="Telefoon · App · Utrecht" meta="2 u" />
          </List>
        </SettingFoldRow>
      </SettingsGroup>
      <SettingsGroup title="Account opheffen">
        <SettingRow
          labels={labels}
          label="Account verwijderen"
          description="Verwijdert je profiel; de werkruimte blijft bestaan"
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
    </div>
  )
}

/** Which messages arrive, and how often. */
function Notifications() {
  const [rhythm, setRhythm] = useState('daily')
  return (
    <div className="flex flex-col gap-8">
      <SettingsGroup title="E-mail">
        <SwitchSetting label="Nieuwe bestelling" initial />
        <SwitchSetting
          label="Mislukte betaling"
          description="Altijd direct, ook in stille uren"
          initial
        />
        <SwitchSetting label="Reacties op je taken" initial={false} />
        <SwitchSetting label="Productnieuws" initial={false} />
      </SettingsGroup>
      <SettingsGroup title="Samenvatting">
        <div className="p-4">
          <RadioGroup
            label="Hoe vaak"
            value={rhythm}
            onValueChange={setRhythm}
            options={[
              { id: 'direct', label: 'Direct', description: 'Een melding per gebeurtenis' },
              { id: 'daily', label: 'Dagelijks', description: 'Elke ochtend om 8:00' },
              { id: 'weekly', label: 'Wekelijks', description: 'Op maandagochtend' },
            ]}
          />
        </div>
      </SettingsGroup>
      <SettingsGroup title="Stille uren">
        <SwitchSetting label="Niet storen tussen 22:00 en 7:00" initial />
      </SettingsGroup>
    </div>
  )
}

const PLANS = [
  {
    id: 'start',
    name: 'Start',
    price: '€ 0',
    lines: ['1 webwinkel', '2 teamleden', '1 GB opslag'],
  },
  {
    id: 'groei',
    name: 'Groei',
    price: '€ 29',
    lines: ['3 webwinkels', '10 teamleden', '10 GB opslag'],
  },
  {
    id: 'zakelijk',
    name: 'Zakelijk',
    price: '€ 79',
    lines: ['Onbeperkt winkels', '50 teamleden', '100 GB opslag'],
  },
]

/** The plan, what of it is used, and the invoices. */
function Subscription() {
  const [plan, setPlan] = useState('groei')
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <div className="grid grid-cols-3 gap-3">
          {PLANS.map((entry) => (
            <Missing key={entry.id} name="PlanCard">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium text-fg">{entry.name}</span>
                {entry.id === plan ? <Tag tone="success">Huidig</Tag> : null}
              </div>
              <p className="m-0 text-[20px] font-medium text-fg tabular-nums">
                {entry.price}
                <span className="text-[12px] font-normal text-muted"> per maand</span>
              </p>
              <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[12px] text-secondary">
                {entry.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <Button
                variant={entry.id === plan ? 'secondary' : 'primary'}
                size="sm"
                disabled={entry.id === plan}
                onClick={() => setPlan(entry.id)}
              >
                {entry.id === plan ? 'Je huidige plan' : `Kies ${entry.name}`}
              </Button>
            </Missing>
          ))}
        </div>
      </section>
      <SettingsGroup title="Gebruik deze maand">
        {[
          { label: 'Opslag', value: 6.2, max: 10, text: '6,2 van 10 GB' },
          { label: 'Teamleden', value: 8, max: 10, text: '8 van 10' },
          { label: 'AI-tegoed', value: 7400, max: 10000, text: '7.400 van 10.000' },
        ].map((use) => (
          <SettingRow key={use.label} labels={labels} label={use.label}>
            {() => (
              <div className="flex w-64 items-center gap-3">
                <ProgressMeter
                  value={use.value}
                  max={use.max}
                  label={use.label}
                  valueText={() => use.text}
                  width="fill"
                  count={false}
                />
                <span className="w-32 shrink-0 whitespace-nowrap text-right text-[12px] text-muted tabular-nums">
                  {use.text}
                </span>
              </div>
            )}
          </SettingRow>
        ))}
      </SettingsGroup>
      <SettingsGroup title="Facturen">
        <div className="p-2">
          <List label="Facturen">
            {['oktober', 'september', 'augustus', 'juli'].map((month) => (
              <ListRow
                key={month}
                title={`Factuur ${month} 2026`}
                kind="done"
                status="Betaald"
                meta="€ 29,00"
              />
            ))}
          </List>
        </div>
      </SettingsGroup>
    </div>
  )
}

/** Settings: account, notifications and subscription, as tabs down the side. */
function Settings(): ReactNode {
  const page = (content: ReactNode) => <div className="max-w-2xl px-8 pb-8">{content}</div>
  return (
    <AppFrame current="instellingen">
      <ScrollArea>
        <div className="px-8 pt-6 pb-4">
          <PageHeader title="Instellingen" />
        </div>
        <div className="px-6">
          <Tabs
            label="Instellingen"
            orientation="vertical"
            tabs={[
              { id: 'account', label: 'Account', content: page(<Account />) },
              { id: 'notifications', label: 'Meldingen', content: page(<Notifications />) },
              { id: 'subscription', label: 'Abonnement', content: page(<Subscription />) },
            ]}
          />
        </div>
      </ScrollArea>
    </AppFrame>
  )
}

export default { title: 'Instellingen', icon: 'settings', Screen: Settings } satisfies DemoModule
