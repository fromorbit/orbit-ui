import { createContext, type ReactNode, useContext } from 'react'

/**
 * Every component the demos lack, with one sentence on why a screen needs it: the wishlist of the
 * library.
 *
 * The names are the type of `Missing`'s `name`, so a demo cannot invent one that the wishlist does
 * not explain; which demos use a name is read from their sources (`registry.ts`), never kept here.
 */
export const MISSING = {
  StatTile:
    'Een KPI-kaart: label, groot getal, vergelijking met de vorige periode. Elk dashboard begint ermee.',
  TrendBadge:
    'Een klein label met stijging of daling (pijl, procent, groen of rood), los te gebruiken in kaarten en tabellen.',
  Chart:
    'Een lijn-, vlak- of staafgrafiek met assen, tooltip en legenda op de tokens; nu is er geen enkele grafiek.',
  DataTable:
    'Een tabel met kolomkoppen die sorteren, rijselectie, rechts uitgelijnde bedragen en een lege en laadtoestand; EditableTable is alleen een invoerveld.',
  Pagination:
    'Bladeren door een lange lijst: vorige, volgende, paginanummers en aantal per pagina.',
  DatePicker: 'Eén datum kiezen met een kalender, voor een deadline of een publicatiedatum.',
  Timeline:
    'Het verloop van gebeurtenissen onder elkaar, met tijd, icoon en lijn: betaling, activiteit, reacties.',
  ChatMessage:
    'Een bericht in een gesprek: afzender, tijd, bubbel voor de gebruiker, platte tekst voor de assistent en acties eronder.',
  Composer:
    'Het invoerkader van een chat: een groeiend tekstvak met werkbalk (model, bijlage, versturen) als één geheel.',
  AvatarGroup: 'Een rij overlappende avatars met “+3”, voor wie er in een team of op een taak zit.',
  PermissionMatrix: 'Rollen tegen rechten in een raster van vinkjes, met kop per rol.',
  PlanCard:
    'Een abonnementskaart: naam, prijs per maand, wat erin zit en een knop; de huidige gemarkeerd.',
  OtpInput: 'Zes losse vakjes voor een verificatiecode, met plakken en automatisch doorschuiven.',
  FormField:
    'Een formulierveld: label boven het invoerveld, hulptekst en foutmelding eronder. Field is een instellingenrij met het label links.',
  CheckboxField:
    'Een vinkje met zichtbaar label ernaast, als geheel aan te klikken; Checkbox draagt zijn label alleen voor de schermlezer.',
  FindingCard:
    'Een bevinding van een review: gewicht als rand en woord, titel, uitleg, pagina en schermafbeelding ernaast.',
  SeverityBar:
    'Hoeveel bevindingen er per gewicht zijn, in woorden en als één gedeelde balk boven de lijst.',
  Scrubber:
    'De tijdlijn van een opname: afspeelpositie, slepen en markeringen per gebeurtenis (klik, navigatie, fout).',
} as const

/** The name of one missing component. */
export type MissingName = keyof typeof MISSING

/**
 * Whether the placeholders show themselves: the page's switch "Markeer ontbrekend". Off, a sketch
 * reads as the finished screen would; on, every one carries a dashed outline and its name.
 */
const MarksContext = createContext(true)

/** The provider of {@link MarksContext}, for the demos page and for a test. */
export const MissingMarks = MarksContext.Provider

/** The props of {@link Missing}. */
export interface MissingProps {
  /** Which component of the wishlist stands here. */
  name: MissingName
  /** What it would do on this spot, when that adds to the general reason; shown on hover. */
  note?: string
  /** `inline` for a small piece in a line of text or a row; a block otherwise. */
  inline?: boolean
  /** The layout of the wrapper in its parent: a grid cell, a width. The sketch styles itself. */
  className?: string
  /** The sketch of the component, drawn from the library's tokens so the screen stays believable. */
  children?: ReactNode
}

/**
 * The marked place of a component the library does not have.
 *
 * The sketch inside is drawn as the finished component would look, so the screen reads as a real
 * product; the mark (a dashed outline in the accent and a small name tag) says that it is not a
 * component of the library yet. The page can switch the marks off to see the screen without
 * them. The `data-missing` attribute stays either way: the test of every demo reads it to check
 * the lists derived from the source.
 */
export function Missing({
  name,
  note,
  inline = false,
  className,
  children,
}: MissingProps): ReactNode {
  const marked = useContext(MarksContext)
  const title = marked ? (note ?? MISSING[name]) : undefined
  if (inline) {
    return (
      // biome-ignore lint/a11y/useSemanticElements: a fieldset is for form controls; this names a placeholder.
      <span
        data-missing={name}
        role="group"
        aria-label={`Ontbreekt: ${name}`}
        title={title}
        className={[
          'inline-flex max-w-full items-center rounded-md align-middle',
          marked ? 'outline-1 outline-accent-border outline-offset-1 outline-dashed' : '',
          className ?? '',
        ].join(' ')}
      >
        {children}
      </span>
    )
  }
  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset is for form controls; this names a placeholder.
    <div
      data-missing={name}
      role="group"
      aria-label={`Ontbreekt: ${name}`}
      title={title}
      className={[
        'relative min-w-0 rounded-xl',
        marked ? 'outline-1 outline-accent-border outline-offset-2 outline-dashed' : '',
        className ?? '',
      ].join(' ')}
    >
      {marked ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-2 right-3 z-10 rounded-full border border-accent-border bg-bg px-1.5 font-mono text-[10px] leading-4 text-accent-text"
        >
          {name}
        </span>
      ) : null}
      {children}
    </div>
  )
}
