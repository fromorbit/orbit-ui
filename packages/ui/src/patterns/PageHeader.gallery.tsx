import type { Story } from '../gallery/story'
import { Input } from '../primitives/Input'
import { PageCrumbs, PageHeader } from './PageHeader'

export default {
  group: 'patterns',
  title: 'PageHeader',
  states: {
    'Alleen een titel': () => <PageHeader title="Bestanden" />,
    // The meta line of Wacht op jou: two counts, one separator.
    'Met een metaregel': () => <PageHeader title="Wacht op jou" meta="3 beslissen · 2 nakijken" />,
    // Gearchiveerd: the count under the title, the search field in the strip.
    'Met acties': () => (
      <PageHeader
        title="Gearchiveerd"
        meta="12"
        actions={
          <div className="w-60">
            <Input label="Zoek" placeholder="Zoek" icon="search" size="sm" clearLabel="Wissen" />
          </div>
        }
      />
    ),
    // The trail a page within a page sets in the title strip.
    Kruimelpad: () => (
      <PageCrumbs
        label="Kruimelpad"
        trail={[
          { label: 'Specs', onSelect: () => {} },
          { label: 'SPEC-1', onSelect: () => {}, mono: true },
          { label: 'PLAN-3', mono: true },
        ]}
      />
    ),
  },
} satisfies Story
