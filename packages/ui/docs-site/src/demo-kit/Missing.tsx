import type { ReactNode } from 'react'

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
  DateRangePicker:
    'Een periode kiezen met een kalender en voorkeuzes (deze maand, vorig kwartaal); filteren op tijd kan nu niet.',
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
} as const

/** The name of one missing component. */
export type MissingName = keyof typeof MISSING

/** The props of {@link Missing}. */
export interface MissingProps {
  /** Which component of the wishlist stands here. */
  name: MissingName
  /** What it would do on this spot, when that adds to the general reason. */
  note?: string
  /** `inline` for a small piece in a line of text or a row; a block otherwise. */
  inline?: boolean
  /** A rough sketch or the real components it would hold, so the screen stays believable. */
  children?: ReactNode
}

/**
 * The marked place of a component the library does not have: a dashed accent frame with its name.
 *
 * A demo never builds a missing piece nicely itself; a sketch, if any, stands inside this frame, so
 * nobody mistakes it for a finished component. The `data-missing` attribute is what the test of
 * every demo reads to check the lists derived from the source.
 */
export function Missing({ name, note, inline = false, children }: MissingProps): ReactNode {
  if (inline) {
    return (
      // biome-ignore lint/a11y/useSemanticElements: a fieldset is for form controls; this names a placeholder.
      <span
        data-missing={name}
        role="group"
        aria-label={`Ontbreekt: ${name}`}
        title={note ?? MISSING[name]}
        className="inline-flex items-center gap-1.5 rounded-md border border-accent-border border-dashed px-1.5 py-0.5 align-middle"
      >
        <span className="font-mono text-[10px] text-accent-text">{name}</span>
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
      className="flex min-w-0 flex-col gap-2 rounded-lg border border-accent-border border-dashed bg-accent-subtle/30 p-3"
    >
      <p className="m-0 flex min-w-0 items-baseline gap-2 text-[11px]">
        <span className="shrink-0 font-mono text-accent-text">{name}</span>
        {note === undefined ? null : <span className="truncate text-muted">{note}</span>}
      </p>
      {children}
    </div>
  )
}
