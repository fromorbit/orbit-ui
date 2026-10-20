import type { ChipListFieldLabels } from '../patterns/ChipListField'
import type { CopyButtonLabels } from '../patterns/CopyButton'
import type { EditableTableLabels } from '../patterns/EditableTable'
import type { PierreTreeMarkLabels } from '../patterns/PierreTree'
import type { ProseLabels } from '../patterns/Prose'
import type { RelativeTimeLabels } from '../patterns/RelativeTime'
import type { SearchListLabels } from '../patterns/SearchList'
import type { SettingRowLabels } from '../patterns/SettingRow'
import type { SummaryBarLabels } from '../patterns/SummaryBar'
import type { SecretFieldLabels } from '../primitives/SecretField'

/**
 * Dutch words for the library's own tests and gallery stories: the components hold no text of
 * their own, so a story or a test hands them these.
 *
 * Word for word what Orbit's `nl.ts` gives, because the gallery runs in Dutch and its pixel
 * references must not shift; a test in Orbit holds the two together. A
 * fixture of the gallery: public only as `galleryLabels` of `./gallery`, never from `./testing`,
 * whose `renderWithUi` is for a host's own catalogue.
 */
export const nl = {
  clear: 'Wissen',
  loading: 'Laden…',
  progress: (value: number, max: number) => `${value} van ${max}`,
  shelf: (title: string, count: number) => `${title} ${count}`,
  copy: {
    label: 'Kopiëren',
    copiedLabel: 'Gekopieerd',
    failedLabel: 'Kopiëren mislukt',
  } satisfies CopyButtonLabels,
  secret: {
    set: 'Ingesteld',
    unset: 'Niet ingesteld',
    show: 'Toon wat je typt',
    clear: 'Wissen',
  } satisfies SecretFieldLabels,
  path: { none: 'Niet gekozen', choose: 'Kies…' },
  time: {
    now: 'nu',
    minutes: (count) => `${count} min`,
    hours: (count) => `${count} u`,
    days: (count) => `${count} d`,
    weeks: (count) => `${count} w`,
  } satisfies RelativeTimeLabels,
  list: {
    empty: 'Niets om te kiezen',
    noResults: (query) => `Geen treffers voor ‘${query}’`,
    loading: 'Laden…',
    error: 'Kon de lijst niet laden',
  } satisfies SearchListLabels,
  chipList: {
    add: 'Toevoegen…',
    remove: (item) => `Haal ${item} weg`,
    duplicate: (item) => `${item} staat er al`,
  } satisfies ChipListFieldLabels,
  editableTable: {
    add: 'Toevoegen',
    removeColumn: 'Verwijderen',
    remove: (row) => `Verwijder rij ${row}`,
    cell: (column, row) => `${column}, rij ${row}`,
  } satisfies EditableTableLabels,
  summary: {
    files: (count) => (count === 1 ? `${count} bestand gewijzigd` : `${count} bestanden gewijzigd`),
    lines: (added, removed) => `${added} regels erbij, ${removed} eraf`,
    open: 'Bekijk',
  } satisfies SummaryBarLabels,
  treeMarks: {
    letters: { modified: 'M', added: 'A', new: 'U' },
    words: { modified: 'Gewijzigd', added: 'Toegevoegd', new: 'Nieuw' },
    folder: 'Bevat wijzigingen',
  } satisfies PierreTreeMarkLabels,
  settingRow: {
    restart: 'Na herstart',
    project: 'Eigen waarde voor dit project',
    reset: 'Terug naar standaard',
    followApp: 'Volg app',
    scope: {
      project: { text: 'per project', name: 'Per project te wijzigen' },
      chat: { text: 'per chat', name: 'Per chat te wijzigen' },
      both: { text: 'per project en chat', name: 'Per project en per chat te wijzigen' },
    },
  } satisfies SettingRowLabels,
  prose: {
    codeBlock: 'Codeblok',
    codeWrap: 'Regels afbreken',
    codeWrapOff: 'Regels niet afbreken',
    table: 'Tabel',
    frontmatter: 'Frontmatter',
    footnotes: 'Voetnoten',
    taskDone: 'Gedaan',
    taskOpen: 'Niet gedaan',
    technical: 'Technisch',
    alerts: {
      note: 'Opmerking',
      tip: 'Tip',
      important: 'Belangrijk',
      warning: 'Waarschuwing',
      caution: 'Let op',
    },
    copy: { label: 'Kopiëren', copiedLabel: 'Gekopieerd', failedLabel: 'Kopiëren mislukt' },
  } satisfies ProseLabels,
}
