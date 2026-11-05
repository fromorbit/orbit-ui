import { type ReactNode, useState } from 'react'
import {
  Banner,
  BrandIcon,
  Button,
  CheckboxField,
  Form,
  FormField,
  Icon,
  Input,
  OrbitWordmark,
  OtpInput,
  ProjectMark,
  StatusMark,
  Tag,
} from '../../../src'
import type { DemoModule, DemoScreenProps } from '../demo-kit/types'
import { WORKSPACE } from './parts/AppFrame'

/** The address the made-up person signs in with. */
const EMAIL = 'iris@zilverberg.example'

/** The code that was sent, as far as it has been typed. */
const CODE = '481'

/** The workspaces the made-up person belongs to, to pick one after signing in. */
const WORKSPACES = [
  { name: WORKSPACE, detail: '6 leden · 4 repositories', role: 'Eigenaar', last: true },
  { name: 'Studio Noord', detail: '3 leden · 1 repository', role: 'Lid', last: false },
  { name: 'Moestuin Vereniging', detail: '12 leden · 2 repositories', role: 'Gast', last: false },
] as const

/** The small print under the form. */
const FOOTER = ['Voorwaarden', 'Privacy', 'Status'] as const

/** The classes of a quiet link in the accent text colour. */
/** A link in running text: underlined at rest, so colour is never its only mark (WCAG 1.4.1). */
const LINK =
  'rounded-sm text-accent-text underline decoration-1 underline-offset-2 outline-focus hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2'

/** A line with a word in the middle, between the buttons of a provider and the form. */
function Divider({ children }: { children: string }): ReactNode {
  return (
    <div className="flex items-center gap-3 text-[12px] text-muted">
      <span aria-hidden="true" className="h-px flex-1 bg-border" />
      {children}
      <span aria-hidden="true" className="h-px flex-1 bg-border" />
    </div>
  )
}

/** A button that fills the width of the form, its words centred. */
function Wide({ children }: { children: ReactNode }): ReactNode {
  return <div className="grid">{children}</div>
}

/** The heading of a step: a title and one sentence. */
function Heading({ title, children }: { title: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="m-0 font-heading text-[20px] text-fg leading-tight tracking-[-0.01em]">
        {title}
      </h1>
      <p className="m-0 text-[13px] text-secondary leading-relaxed">{children}</p>
    </div>
  )
}

/** The first step: a provider, or the address and password; `failed` after a wrong password. */
function SignIn({ failed }: { failed: boolean }): ReactNode {
  const [email, setEmail] = useState(EMAIL)
  const [password, setPassword] = useState(failed ? '' : 'zomer-collectie-26')
  const [remember, setRemember] = useState(true)
  // After a wrong password the field is empty and says so; a submit checks both fields again.
  const [checked, setChecked] = useState(failed)
  const emailError =
    checked && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
      ? 'Vul een geldig e-mailadres in.'
      : undefined
  const passwordError =
    checked && password === ''
      ? failed
        ? 'Typ je wachtwoord opnieuw.'
        : 'Vul je wachtwoord in.'
      : undefined
  return (
    <>
      <Heading title="Welkom terug">{`Log in om verder te werken in ${WORKSPACE}.`}</Heading>
      {failed ? <Banner tone="danger">E-mailadres of wachtwoord klopt niet.</Banner> : null}
      <div className="flex flex-col gap-2.5">
        <Wide>
          <Button variant="secondary" size="lg">
            <Icon name="lock" size="sm" />
            Inloggen met je organisatie (SSO)
          </Button>
        </Wide>
        <Wide>
          <Button variant="secondary" size="lg">
            <BrandIcon brand="github" />
            Inloggen met GitHub
          </Button>
        </Wide>
      </div>
      <Divider>of met e-mail</Divider>
      <Form label="Inloggen met e-mail" onSubmit={() => setChecked(true)}>
        <FormField label="E-mailadres" {...(emailError ? { error: emailError } : {})}>
          {(field) => (
            <Input
              label="E-mailadres"
              {...field}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          )}
        </FormField>
        <FormField label="Wachtwoord" {...(passwordError ? { error: passwordError } : {})}>
          {(field) => (
            <Input
              label="Wachtwoord"
              {...field}
              type="password"
              autoComplete="current-password"
              placeholder="Je wachtwoord"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          )}
        </FormField>
        <div className="flex items-center justify-between gap-3">
          <CheckboxField
            label="Ingelogd blijven"
            checked={remember}
            onCheckedChange={setRemember}
          />
          <a href="#/demo/inloggen" className={`text-[12px] ${LINK}`}>
            Wachtwoord vergeten?
          </a>
        </div>
        <Wide>
          <Button variant="primary" size="lg" type="submit">
            Inloggen
          </Button>
        </Wide>
      </Form>
    </>
  )
}

/** The code field, three digits typed. */
function CodeField(): ReactNode {
  const [code, setCode] = useState(CODE)
  return (
    <FormField label="Verificatiecode">
      {(field) => (
        <OtpInput
          label="Verificatiecode"
          value={code}
          onValueChange={setCode}
          groupAfter={3}
          {...field}
        />
      )}
    </FormField>
  )
}

/** The second step: the code of six digits that was mailed, three of them typed. */
function Code(): ReactNode {
  return (
    <>
      <Heading title="Controleer je e-mail">
        We stuurden een code van zes cijfers naar{' '}
        <span className="font-medium text-fg">{EMAIL}</span>. Hij blijft tien minuten geldig.
      </Heading>
      <CodeField />
      <Wide>
        <Button variant="idle" size="lg" aria-disabled="true">
          Verifiëren
        </Button>
      </Wide>
      <p className="m-0 flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted">
        <span>
          Niets ontvangen? Opnieuw sturen over <span className="text-fg tabular-nums">0:42</span>
        </span>
        <a href="#/demo/inloggen" className={LINK}>
          Ander e-mailadres
        </a>
      </p>
    </>
  )
}

/** After signing in: which workspace to open, the last one on top. */
function Workspaces(): ReactNode {
  return (
    <>
      <Heading title="Kies een werkruimte">
        Je bent ingelogd als <span className="font-medium text-fg">{EMAIL}</span>.
      </Heading>
      <ul className="m-0 flex list-none flex-col overflow-hidden rounded-lg border border-border bg-overlay p-0">
        {WORKSPACES.map((space) => (
          <li key={space.name} className="border-border not-first:border-t">
            <a
              href="#/demo/chat"
              className="flex items-center gap-3 px-4 py-3 text-fg no-underline outline-focus hover:bg-row-hover focus-visible:-outline-offset-2 focus-visible:outline-2"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-mark font-heading text-[13px] text-fg">
                {space.name.charAt(0)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-2 font-medium text-[13px]">
                  <span className="truncate">{space.name}</span>
                  {space.last ? (
                    <span className="hidden shrink-0 font-normal text-[11px] text-muted @md:inline">
                      laatst geopend
                    </span>
                  ) : null}
                </span>
                <span className="truncate text-[12px] text-muted">{space.detail}</span>
              </span>
              <Tag>{space.role}</Tag>
              <Icon name="chevron-right" size="sm" tone="faint" />
            </a>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" size="md">
          <Icon name="plus" size="sm" />
          Nieuwe werkruimte
        </Button>
        <a href="#/demo/inloggen" className={`flex items-center gap-1.5 text-[12px] ${LINK}`}>
          <ProjectMark name="Studio Zuid" />
          Uitnodiging van Studio Zuid bekijken
        </a>
      </div>
    </>
  )
}

/** The brand's side of the screen: the galaxy, the wordmark, one promise and the satellite. */
function Galaxy(): ReactNode {
  return (
    <aside className="relative hidden w-[46%] max-w-[600px] shrink-0 flex-col justify-between overflow-hidden bg-(image:--nt-brand-gradient) p-10 text-(--nt-brand-paper) @4xl:flex">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-48 -bottom-64 size-[38rem] rounded-full border border-(--nt-brand-mist)/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -bottom-40 size-[24rem] rounded-full border border-(--nt-brand-mist)/15"
      >
        <span className="absolute top-[14.6%] left-[14.6%] size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-satellite shadow-[0_0_14px_3px_var(--nt-satellite)]" />
      </div>
      <OrbitWordmark className="relative h-5 w-fit" />
      <div className="relative flex max-w-sm flex-col gap-3">
        <p className="m-0 font-heading text-[20px] leading-snug tracking-[-0.01em]">
          Werk samen met je agents, op je eigen repository.
        </p>
        <p className="m-0 text-(--nt-brand-mist) text-[15px] leading-relaxed opacity-80">
          Gesprekken, specs en reviews naast elkaar, op je eigen machine. Er gaat niets naar buiten
          zonder dat je het ziet.
        </p>
      </div>
      <p className="relative m-0 flex items-center gap-2 text-(--nt-brand-mist) text-[12px] opacity-80">
        <StatusMark kind="running" size="sm" />
        Alle diensten werken · versie 0.42
      </p>
    </aside>
  )
}

/**
 * Signing in to Orbit: the brand's galaxy beside the form on a wide window, the form alone on a
 * narrow one. The variants walk the flow: the form, a wrong password, the mailed code, and the
 * choice of a workspace.
 *
 * The form's side is one column that scrolls as a whole: a top row, the form centred in the space
 * that is left (both ways), and the small print at the foot. The middle row grows (`flex-1`), so
 * the foot stays at the bottom of a tall window and moves down with the form on a short one; a
 * native scroller, because Radix's viewport wraps its content in a box without a height, where a
 * column cannot fill the panel. In light the side is the white card plane, not Paper.
 */
function Login({ variant = 'standaard' }: DemoScreenProps): ReactNode {
  return (
    <div className="flex h-full min-h-0 w-full">
      <Galaxy />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-overlay">
        <div className="flex shrink-0 items-center justify-between min-h-5 gap-3 px-6 pt-6 text-[12px] @xl:px-10 @xl:pt-10">
          <OrbitWordmark className="h-4 text-fg @4xl:invisible" />
          {/* Once logged in, the way out fits the step, not the way in. */}
          {variant === 'werkruimte' ? (
            <span className="text-muted">
              Niet jij?{' '}
              <a href="#/demo/inloggen" className={LINK}>
                Uitloggen
              </a>
            </span>
          ) : (
            <span className="text-muted">
              Nog geen account?{' '}
              <a href="#/demo/inloggen" className={LINK}>
                Aanmelden
              </a>
            </span>
          )}
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-10 @xl:px-10">
          <div className="flex w-full max-w-[420px] flex-col gap-6">
            {variant === 'code' ? (
              <Code />
            ) : variant === 'werkruimte' ? (
              <Workspaces />
            ) : (
              <SignIn key={variant} failed={variant === 'fout'} />
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 pb-6 text-[12px] text-muted @xl:px-10 @xl:pb-10">
          <span>© 2026 Orbit</span>
          <span className="flex gap-4">
            {FOOTER.map((item) => (
              <a
                key={item}
                href="#/demo/inloggen"
                className="rounded-sm text-muted no-underline outline-focus hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {item}
              </a>
            ))}
          </span>
        </div>
      </div>
    </div>
  )
}

export default {
  title: 'Inloggen',
  description:
    'Inloggen bij Orbit: de sterrenhemel van het merk naast het formulier, en op een smal scherm alleen het formulier. De toestanden lopen de stappen door, van een fout wachtwoord tot de keuze van een werkruimte.',
  icon: 'log-in',
  product: 'orbit',
  variants: [
    { value: 'standaard', label: 'Standaard' },
    { value: 'fout', label: 'Fout' },
    { value: 'code', label: 'Verificatie' },
    { value: 'werkruimte', label: 'Werkruimte' },
  ],
  Screen: Login,
} satisfies DemoModule
