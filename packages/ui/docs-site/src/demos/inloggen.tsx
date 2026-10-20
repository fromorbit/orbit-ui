import { type ReactNode, useState } from 'react'
import {
  Button,
  Checkbox,
  ChipListField,
  EmptyState,
  IconButton,
  Input,
  ProgressMeter,
  ProjectMark,
  RadioGroup,
  ScrollArea,
  Select,
  StepChips,
} from '../../../src'
import { galleryLabels } from '../../../src/gallery'
import { Missing } from '../demo-kit/Missing'
import type { DemoModule } from '../demo-kit/types'
import { WORKSPACE } from './parts/AppFrame'
import { FormFieldSketch } from './parts/FormFieldSketch'

const STEPS = [
  { id: 'login', label: 'Inloggen' },
  { id: 'verify', label: 'Code' },
  { id: 'workspace', label: 'Werkruimte' },
  { id: 'team', label: 'Team' },
  { id: 'done', label: 'Klaar' },
] as const

type Step = (typeof STEPS)[number]['id']

/** The title and one line under it, the same on every step. */
function Heading({ title, lead }: { title: string; lead: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="m-0 text-[20px] font-medium text-fg">{title}</h1>
      <p className="m-0 text-[13px] text-muted">{lead}</p>
    </div>
  )
}

/** Signing in with address and password. */
function Login({ onNext }: { onNext(): void }) {
  const [shown, setShown] = useState(false)
  const [stay, setStay] = useState(true)
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        onNext()
      }}
    >
      <Heading title="Welkom terug" lead={`Log in op ${WORKSPACE}`} />
      <FormFieldSketch label="E-mailadres">
        {(labelId) => (
          <Input
            label="E-mailadres"
            aria-labelledby={labelId}
            type="email"
            defaultValue="iris@zilverberg.example"
          />
        )}
      </FormFieldSketch>
      <FormFieldSketch label="Wachtwoord">
        {(labelId) => (
          <Input
            label="Wachtwoord"
            aria-labelledby={labelId}
            type={shown ? 'text' : 'password'}
            defaultValue="geheim-voorbeeld"
            trailing={
              <IconButton
                icon={shown ? 'eye-off' : 'eye'}
                size="sm"
                variant="plain"
                label={shown ? 'Verberg wachtwoord' : 'Toon wachtwoord'}
                onClick={() => setShown(!shown)}
              />
            }
          />
        )}
      </FormFieldSketch>
      <div className="flex items-center justify-between">
        <Missing name="CheckboxField" inline>
          <Checkbox label="Ingelogd blijven" checked={stay} onCheckedChange={setStay} />
          <span className="whitespace-nowrap text-[13px] text-fg">Ingelogd blijven</span>
        </Missing>
        <Button variant="ghost" size="sm" type="button">
          Wachtwoord vergeten?
        </Button>
      </div>
      <Button variant="primary" block type="submit">
        Inloggen
      </Button>
      <Button variant="secondary" block type="button" onClick={onNext}>
        Inloggen met SSO
      </Button>
    </form>
  )
}

/** The code from the mail. */
function Verify({ onNext }: { onNext(): void }) {
  return (
    <div className="flex flex-col gap-4">
      <Heading
        title="Vul je code in"
        lead="We stuurden een code van zes cijfers naar iris@zilverberg.example."
      />
      <Missing name="OtpInput">
        <div className="flex gap-2">
          {['4', '1', '7', '', '', ''].map((digit, index) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: six fixed boxes of a sketch
              key={index}
              className="flex size-10 items-center justify-center rounded-md border border-border bg-bg font-mono text-[16px] text-fg"
            >
              {digit}
            </span>
          ))}
        </div>
      </Missing>
      <Button variant="primary" block onClick={onNext}>
        Bevestigen
      </Button>
      <Button variant="ghost" size="sm">
        Stuur de code opnieuw
      </Button>
    </div>
  )
}

/** Name and purpose of the new workspace. */
function Workspace({ onNext }: { onNext(): void }) {
  const [use, setUse] = useState('shop')
  const [region, setRegion] = useState('eu')
  return (
    <div className="flex flex-col gap-4">
      <Heading title="Je werkruimte" lead="Dit kun je later altijd nog wijzigen." />
      <FormFieldSketch label="Naam">
        {(labelId) => <Input label="Naam" aria-labelledby={labelId} defaultValue={WORKSPACE} />}
      </FormFieldSketch>
      <RadioGroup
        label="Waarvoor gebruik je het?"
        value={use}
        onValueChange={setUse}
        options={[
          { id: 'shop', label: 'Webwinkel', description: 'Producten, bestellingen en betalingen' },
          { id: 'blog', label: 'Blog of tijdschrift', description: 'Artikelen en een nieuwsbrief' },
          { id: 'team', label: 'Intern team', description: 'Taken en een gedeelde assistent' },
        ]}
      />
      <FormFieldSketch label="Regio van de gegevens">
        {(labelId) => (
          <Select
            label="Regio van de gegevens"
            aria-labelledby={labelId}
            value={region}
            options={[
              { value: 'eu', label: 'Europa (Frankfurt)' },
              { value: 'nl', label: 'Nederland (Amsterdam)' },
            ]}
            onValueChange={setRegion}
          />
        )}
      </FormFieldSketch>
      <Button variant="primary" block onClick={onNext}>
        Verder
      </Button>
    </div>
  )
}

/** Invite the first colleagues, or skip it. */
function Invite({ onNext }: { onNext(): void }) {
  const [emails, setEmails] = useState<readonly string[]>(['daan@zilverberg.example'])
  return (
    <div className="flex flex-col gap-4">
      <Heading title="Nodig je team uit" lead="Ze krijgen een e-mail met een link." />
      <FormFieldSketch label="E-mailadressen">
        {(labelId) => (
          <ChipListField
            label="E-mailadressen"
            aria-labelledby={labelId}
            labels={galleryLabels.chipList}
            value={emails}
            onChange={setEmails}
            maxItems={20}
            maxLength={80}
          />
        )}
      </FormFieldSketch>
      <Button variant="primary" block onClick={onNext}>
        Uitnodigen
      </Button>
      <Button variant="ghost" block onClick={onNext}>
        Overslaan
      </Button>
    </div>
  )
}

/** Signing in, then the first steps of a new workspace: one column, the steps above it. */
function Onboarding(): ReactNode {
  const [step, setStep] = useState<Step>('login')
  const index = STEPS.findIndex((entry) => entry.id === step)
  const next = () => setStep(STEPS[Math.min(index + 1, STEPS.length - 1)]?.id ?? 'done')
  return (
    <div className="flex h-full w-full flex-col bg-frame">
      <div className="flex h-12 shrink-0 items-center gap-2 px-5">
        <ProjectMark name={WORKSPACE} />
        <span className="text-[13px] font-medium text-fg">{WORKSPACE}</span>
        <div className="flex-1" />
        <ProgressMeter
          value={index + 1}
          max={STEPS.length}
          label="Voortgang"
          valueText={galleryLabels.progress}
          count
        />
      </div>
      <div className="min-h-0 flex-1">
        <ScrollArea>
          <div className="mx-auto flex w-[400px] flex-col gap-6 py-10">
            <StepChips
              label="Stappen"
              steps={STEPS.map((entry, at) =>
                at < index ? { ...entry, state: 'done' as const, stateLabel: 'klaar' } : entry,
              )}
              selected={step}
              onSelect={(id) => setStep(id as Step)}
            />
            <div className="rounded-lg border border-border bg-bg p-6">
              {step === 'login' ? <Login onNext={next} /> : null}
              {step === 'verify' ? <Verify onNext={next} /> : null}
              {step === 'workspace' ? <Workspace onNext={next} /> : null}
              {step === 'team' ? <Invite onNext={next} /> : null}
              {step === 'done' ? (
                <EmptyState
                  icon="check-circle"
                  title="Je werkruimte staat klaar"
                  description="Je team krijgt de uitnodigingen binnen een minuut."
                  action={
                    <Button variant="primary" onClick={() => (location.hash = '#/demo/dashboard')}>
                      Naar het overzicht
                    </Button>
                  }
                />
              ) : null}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

export default {
  title: 'Inloggen en onboarding',
  icon: 'log-in',
  Screen: Onboarding,
} satisfies DemoModule
