import type { Story } from '../gallery/story'
import { QuickAction, QuickActions } from './QuickActions'

export default {
  group: 'patterns',
  title: 'QuickActions',
  states: {
    'Twee voorstellen': () => (
      <QuickActions label="Voorstellen van Orb">
        <QuickAction>Open run 1284</QuickAction>
        <QuickAction>Start een chat</QuickAction>
      </QuickActions>
    ),
    'Drie, die doorlopen op een tweede regel': () => (
      <div className="w-[300px]">
        <QuickActions label="Voorstellen van Orb">
          <QuickAction>Vat #479 samen</QuickAction>
          <QuickAction>Open in Lens</QuickAction>
          <QuickAction>Later</QuickAction>
        </QuickActions>
      </div>
    ),
  },
} satisfies Story
