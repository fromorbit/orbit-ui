import { type ReactNode, useState } from 'react'
import packageJson from '../../package.json'
import {
  AvatarGroup,
  Button,
  CopyButton,
  Icon,
  type IconName,
  Input,
  OtpInput,
  ProgressMeter,
  SegmentedControl,
  StatTile,
  StatusLine,
  StatusMark,
  Switch,
  Tag,
  TrendBadge,
} from '../../src'
import { type Story, storyId } from '../../src/gallery'
import { DEMO_PREFIX, DemoThumbnail } from './demo-kit/DemoViews'
import { DEMOS } from './demo-kit/registry'

/** The version of the library this site was built from. */
export const VERSION: string = packageJson.version

/** The line that installs the package, once the registry is set (see {@link NPMRC}). */
export const INSTALL = 'bun add @fromorbit/ui'

/** The two lines of `.npmrc` that send `@fromorbit` to GitHub Packages, as the README gives them. */
const NPMRC = [
  '@fromorbit:registry=https://npm.pkg.github.com',
  // biome-ignore lint/suspicious/noTemplateCurlyInString: npm expands it from the environment, not JavaScript.
  '//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}',
].join('\n')

/** The family style in the repository: the site has no page of its own for it. */
const FAMILY_STYLE = 'https://github.com/fromorbit/orbit-ui/blob/main/docs/family-style.md'

/** The repository itself. */
const REPOSITORY = 'https://github.com/fromorbit/orbit-ui'

/** The demos the mosaic draws small, with the state each opens in. */
const THUMBNAILS = [
  { slug: 'dashboard', variant: undefined },
  { slug: 'inloggen', variant: undefined },
  { slug: 'review', variant: undefined },
] as const

/** The classes of a quiet link in the accent text colour. */
const LINK =
  'rounded-sm text-accent-text no-underline outline-focus hover:underline focus-visible:outline-2 focus-visible:outline-offset-2'

/** The hash of a story by its title, or the components tab when the title names none. */
function storyHash(stories: readonly Story[], title: string): string {
  const story = stories.find((entry) => entry.title === title)
  return story ? `#/${storyId(story)}` : '#/'
}

/** A line of code with a button that copies it, in a framed plane rather than floating. */
function CodeLine({ code, label }: { code: string; label: string }): ReactNode {
  return (
    <div className="flex min-w-0 items-start gap-2 rounded-lg border border-border bg-overlay py-1.5 pr-1.5 pl-3.5">
      <pre className="m-0 min-w-0 flex-1 overflow-x-auto py-1.5 font-mono text-[13px] text-fg leading-relaxed">
        <code>{code}</code>
      </pre>
      <CopyButton
        text={code}
        label={`Kopieer ${label.toLowerCase()}`}
        copiedLabel="Gekopieerd"
        failedLabel="Kopiëren mislukt"
      />
    </div>
  )
}

/**
 * One tile of the mosaic: a white card with a hairline, the component itself, and its name as a
 * link to its page on the components tab.
 */
function Tile({
  name,
  href,
  className,
  children,
}: {
  name: string
  href: string
  className?: string
  children: ReactNode
}): ReactNode {
  return (
    <figure
      className={`m-0 flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-overlay p-4 ${className ?? ''}`}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-3">{children}</div>
      <figcaption className="text-[12px]">
        <a
          href={href}
          className="inline-flex items-center gap-1 rounded-sm text-muted no-underline outline-focus hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {name}
          <Icon name="arrow-right" size="sm" tone="faint" />
        </a>
      </figcaption>
    </figure>
  )
}

/** A demo as a tile: the screen drawn small, and its title as a link that covers the whole card. */
function DemoTile({
  slug,
  variant,
  className,
}: {
  slug: string
  variant: string | undefined
  className?: string
}): ReactNode {
  const demo = DEMOS.find((entry) => entry.slug === slug)
  if (!demo) return null
  return (
    <figure
      className={`group relative m-0 flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-overlay ${className ?? ''}`}
    >
      <div className="border-border border-b">
        <DemoThumbnail demo={demo} variant={variant} />
      </div>
      <figcaption className="flex items-center gap-2 px-4 py-3 text-[13px]">
        <Icon name={demo.icon} size="sm" tone="faint" />
        {/* The link stretches over the whole card (`after:inset-0`), so the picture is clickable. */}
        <a
          href={`${DEMO_PREFIX}${demo.slug}`}
          className="flex items-center gap-2 rounded-sm text-fg no-underline outline-focus after:absolute after:inset-0 after:rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <span className="font-medium">{demo.title}</span>
          <span className="text-[12px] text-muted">Demo</span>
          <Icon name="arrow-right" size="sm" tone="faint" />
        </a>
      </figcaption>
    </figure>
  )
}

/** The mosaic: real components and demos, drawn by the library itself. */
function Mosaic({ stories }: { stories: readonly Story[] }): ReactNode {
  const [period, setPeriod] = useState('week')
  const [notify, setNotify] = useState(true)
  const [code, setCode] = useState('481')
  const [email, setEmail] = useState('iris@zilverberg.example')
  return (
    <section
      aria-label="Voorbeelden"
      className="grid grid-cols-1 gap-3 md:grid-cols-6 lg:grid-cols-12"
    >
      <DemoTile
        slug={THUMBNAILS[0].slug}
        variant={THUMBNAILS[0].variant}
        className="md:col-span-6 lg:col-span-7 lg:row-span-2"
      />
      <Tile
        name="StatTile"
        href={storyHash(stories, 'StatTile')}
        className="md:col-span-3 lg:col-span-5"
      >
        <StatTile
          label="Actieve spaces"
          value="1.284"
          trend={<TrendBadge value="12%" direction="up" tone="good" description="12% gestegen" />}
          comparison="t.o.v. vorige week"
        />
      </Tile>
      <Tile
        name="SegmentedControl"
        href={storyHash(stories, 'SegmentedControl')}
        className="md:col-span-3 lg:col-span-5"
      >
        <SegmentedControl
          label="Periode"
          value={period}
          options={[
            { value: 'dag', label: 'Dag' },
            { value: 'week', label: 'Week' },
            { value: 'maand', label: 'Maand' },
          ]}
          onValueChange={setPeriod}
        />
        <div className="flex items-center justify-between gap-3 text-[13px] text-fg">
          <span>Meldingen bij een mislukte build</span>
          <Switch
            label="Meldingen bij een mislukte build"
            checked={notify}
            onCheckedChange={setNotify}
          />
        </div>
      </Tile>
      <Tile
        name="StatusMark"
        href={storyHash(stories, 'StatusMark')}
        className="md:col-span-3 lg:col-span-3"
      >
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[13px] text-fg">
          <li className="flex items-center gap-2.5">
            <StatusMark kind="running" />
            web
            <span className="ml-auto text-[12px] text-muted">Draait</span>
          </li>
          <li className="flex items-center gap-2.5">
            <StatusMark kind="fault" />
            worker
            <span className="ml-auto text-[12px] text-muted">Fout</span>
          </li>
          <li className="flex items-center gap-2.5">
            <StatusMark kind="blocked" />
            mail
            <span className="ml-auto text-[12px] text-muted">Wacht</span>
          </li>
          <li className="flex items-center gap-2.5">
            <StatusMark kind="stopped" />
            cron
            <span className="ml-auto text-[12px] text-muted">Gestopt</span>
          </li>
        </ul>
      </Tile>
      <Tile
        name="OtpInput"
        href={storyHash(stories, 'OtpInput')}
        className="md:col-span-3 lg:col-span-3"
      >
        <p className="m-0 text-[13px] text-secondary">Code uit je e-mail</p>
        <OtpInput label="Verificatiecode" value={code} onValueChange={setCode} groupAfter={3} />
      </Tile>
      <Tile
        name="ProgressMeter"
        href={storyHash(stories, 'ProgressMeter')}
        className="md:col-span-3 lg:col-span-3"
      >
        <div className="flex items-center justify-between gap-3 text-[13px] text-fg">
          <span>Plan voor de release</span>
          <Tag tone="attention">Bezig</Tag>
        </div>
        <ProgressMeter
          label="Plan voor de release"
          value={3}
          max={5}
          width="fill"
          valueText={(value, max) => `${value} van ${max} stappen`}
          count
        />
        <AvatarGroup
          names={['Iris de Wit', 'Jonas Bakker', 'Mila Haas']}
          label="Drie mensen werken mee"
        />
      </Tile>
      <Tile name="Input" href={storyHash(stories, 'Input')} className="md:col-span-3 lg:col-span-3">
        <div className="flex flex-wrap gap-2">
          <div className="min-w-40 flex-1">
            <Input
              label="E-mailadres"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <Button variant="primary">Uitnodigen</Button>
        </div>
        <StatusLine tone="success">Uitnodiging verstuurd naar Studio Noord</StatusLine>
      </Tile>
      <DemoTile
        slug={THUMBNAILS[1].slug}
        variant={THUMBNAILS[1].variant}
        className="md:col-span-3 lg:col-span-6"
      />
      <DemoTile
        slug={THUMBNAILS[2].slug}
        variant={THUMBNAILS[2].variant}
        className="md:col-span-3 lg:col-span-6"
      />
    </section>
  )
}

/** One of the quick links under the mosaic: a glyph, a title, a sentence and where it goes. */
function QuickLink({
  href,
  icon,
  title,
  meta,
  children,
}: {
  href: string
  icon: IconName
  title: string
  meta: string
  children: string
}): ReactNode {
  return (
    <li className="flex">
      <a
        href={href}
        className="flex w-full flex-col gap-2 rounded-xl border border-border bg-overlay p-4 no-underline outline-focus transition-colors duration-(--nt-duration-fast) hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <span className="flex items-center gap-2">
          <Icon name={icon} size="sm" tone="faint" />
          <span className="font-medium text-[13px] text-fg">{title}</span>
          <span className="ml-auto text-[12px] text-muted">{meta}</span>
        </span>
        <span className="text-[13px] text-secondary leading-relaxed">{children}</span>
      </a>
    </li>
  )
}

/**
 * The home page of the site: what Orbit UI is, how to install it, a mosaic of the library's own
 * components and demos, and the ways in.
 *
 * Built like the start page of a component library (shadcn/ui's, as a reference for structure):
 * a short hero with the install line and two actions, then the components themselves rather than
 * pictures of them. Every tile is live; the demo tiles draw the real screens, scaled down.
 */
export function Home({ stories }: { stories: readonly Story[] }): ReactNode {
  const firstStory = stories[0]
  const componentsHref = firstStory ? `#/${storyId(firstStory)}` : '#/'
  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-14 px-4 pt-10 pb-16 sm:px-8 sm:pt-16">
      <header className="flex max-w-2xl flex-col items-start gap-5">
        <a
          href="#/demo"
          className="flex h-7 items-center gap-2 rounded-full border border-border bg-overlay pr-3 pl-1 text-[12px] text-secondary no-underline outline-focus hover:border-border-strong hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <span className="rounded-full bg-surface-active px-2 py-0.5 font-medium text-fg">
            {VERSION}
          </span>
          {`${DEMOS.length} demo's van hele schermen`}
          <Icon name="arrow-right" size="sm" tone="faint" />
        </a>
        <div className="flex flex-col gap-3">
          <h1 className="m-0 flex items-center gap-2.5 font-heading text-[36px] text-fg leading-tight tracking-[-0.02em] sm:text-[44px]">
            Orbit UI
            <span aria-hidden="true" className="size-2.5 rounded-full bg-satellite" />
          </h1>
          <p className="m-0 text-[15px] text-secondary leading-relaxed sm:text-[17px]">
            De bouwstenen van de Orbit-familie: componenten voor React met de tokens, het thema en
            de lettertypen van het merk, in donker en licht. Halo en Orbit bouwen er hun schermen
            mee.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="lg" onClick={() => (location.hash = componentsHref)}>
            Componenten
            <Icon name="arrow-right" size="sm" />
          </Button>
          <Button variant="secondary" size="lg" onClick={() => (location.hash = '#/demo')}>
            Demo&apos;s
          </Button>
        </div>
        <div className="flex w-full max-w-md flex-col gap-2">
          <CodeLine code={INSTALL} label="Installatieregel" />
          <p className="m-0 text-[12px] text-muted leading-relaxed">
            Uit GitHub Packages, met een token met <code className="font-mono">read:packages</code>{' '}
            in <code className="font-mono">NODE_AUTH_TOKEN</code>.{' '}
            <a href="#installeren" className={LINK}>
              Het register instellen
            </a>
          </p>
        </div>
      </header>

      <Mosaic stories={stories} />

      <section aria-labelledby="home-ways" className="flex flex-col gap-4">
        <h2 id="home-ways" className="m-0 font-heading text-[20px] text-fg tracking-[-0.01em]">
          Verder lezen
        </h2>
        <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-3">
          <QuickLink
            href={FAMILY_STYLE}
            icon="palette"
            title="Familiestijl"
            meta="Midnight en Paper"
          >
            Het palet, de satelliet per product, het ritme van maten en de regels achter de
            componenten.
          </QuickLink>
          <QuickLink
            href={componentsHref}
            icon="book-open"
            title="Componenten"
            meta={`${stories.length} verhalen`}
          >
            Elke component met zijn toestanden, doorzoekbaar, op macOS of Windows en in elk thema.
          </QuickLink>
          <QuickLink href="#/demo" icon="columns" title="Demo's" meta={`${DEMOS.length} schermen`}>
            Hele schermen uit Orbit en Halo, op drie breedtes, met de code ernaast en wat nog
            ontbreekt.
          </QuickLink>
        </ul>
      </section>

      <section
        id="installeren"
        aria-labelledby="home-install"
        className="flex scroll-mt-6 flex-col gap-4"
      >
        <h2 id="home-install" className="m-0 font-heading text-[20px] text-fg tracking-[-0.01em]">
          Installeren
        </h2>
        <ol className="m-0 grid list-none grid-cols-1 gap-3 p-0 lg:grid-cols-2">
          <li className="flex min-w-0 flex-col gap-2.5 rounded-xl border border-border bg-overlay p-4">
            <p className="m-0 text-[13px] text-fg">
              <span className="text-muted">1</span> Zet het register in een{' '}
              <code className="font-mono">.npmrc</code> naast je{' '}
              <code className="font-mono">package.json</code>
            </p>
            <CodeLine code={NPMRC} label=".npmrc" />
          </li>
          <li className="flex min-w-0 flex-col gap-2.5 rounded-xl border border-border bg-overlay p-4">
            <p className="m-0 text-[13px] text-fg">
              <span className="text-muted">2</span> Installeer het pakket en laad de stijlen
            </p>
            <CodeLine code={INSTALL} label="Installeren" />
            <CodeLine
              code={
                "import '@fromorbit/ui/fonts.css'\nimport '@fromorbit/ui/tokens.css'\nimport '@fromorbit/ui/theme.css'"
              }
              label="Stijlen"
            />
          </li>
        </ol>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-border border-t pt-6 text-[12px] text-muted">
        <span>{`@fromorbit/ui ${VERSION}`}</span>
        <a
          href={REPOSITORY}
          className="rounded-sm text-muted no-underline outline-focus hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Broncode op GitHub
        </a>
      </footer>
    </div>
  )
}
