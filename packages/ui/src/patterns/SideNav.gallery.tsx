import type { ReactNode } from 'react'
import type { Story } from '../gallery/story'
import { SideNav, SideNavGroup, SideNavLink } from './SideNav'

/** The side panel as the shell lays it: on its own layer, with the hairline towards the content. */
function Panel({ children }: { children: ReactNode }) {
  return <div className="w-[244px] rounded-lg border-e border-border bg-side-panel">{children}</div>
}

/** The name of an app at the head of its panel: the word and its satellite. */
function Head({ name, product }: { name: string; product: string }) {
  return (
    <span data-product={product} className="flex items-center gap-1 font-heading text-[15px]">
      {name}
      <span aria-hidden="true" className="size-1.5 rounded-full bg-satellite" />
    </span>
  )
}

/** The navigation of Lens and of the settings in the side panel, each with one place open. */
export default {
  group: 'patterns',
  title: 'SideNav',
  states: {
    Lens: () => (
      <Panel>
        <SideNav label="Lens" head={<Head name="Lens" product="lens" />}>
          <SideNavGroup>
            <SideNavLink label="Pull requests" href="#pull-requests" meta="12" current />
            <SideNavLink label="Wacht op jou" href="#wacht-op-jou" meta="3" />
          </SideNavGroup>
          <SideNavGroup label="Repositories van Zilverberg">
            <SideNavLink label="webwinkel" href="#webwinkel" meta="5" mono />
            <SideNavLink label="kassa-api" href="#kassa-api" meta="4" mono />
            <SideNavLink label="voorraad" href="#voorraad" mono />
          </SideNavGroup>
          <SideNavGroup label="Instellen">
            <SideNavLink label="Reviewprofiel" href="#reviewprofiel" meta="Assertief" />
            <SideNavLink label="Padregels" href="#padregels" meta="6" />
          </SideNavGroup>
        </SideNav>
      </Panel>
    ),
    Instellingen: () => (
      <Panel>
        <SideNav
          label="Instellingen"
          head={<span className="font-heading text-[15px]">Instellingen</span>}
        >
          <SideNavGroup>
            <SideNavLink label="Account" href="#account" current />
            <SideNavLink label="Team Zilverberg" href="#team" />
            <SideNavLink label="Apps" href="#apps" meta="5" />
          </SideNavGroup>
        </SideNav>
      </Panel>
    ),
  },
} satisfies Story
