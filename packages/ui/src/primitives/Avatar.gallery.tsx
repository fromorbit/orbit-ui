import type { Story } from '../gallery/story'
import { Avatar } from './Avatar'

/** Made-up people, so the story shows several tones. */
const people = [
  'Noor Bakker',
  'Sem de Vries',
  'Lotte Jansen',
  'Daan Smit',
  'Fenna Mulder',
  'Bram Kok',
]

export default {
  group: 'primitives',
  title: 'Avatar',
  states: {
    // As in the foot of the sidebar: the round, then the name in 13px.
    'Small, beside a name': () => (
      <div className="flex flex-col gap-2 text-[13px] text-secondary">
        {people.map((person) => (
          <span key={person} className="flex items-center gap-2">
            <Avatar name={person} size="sm" />
            {person}
          </span>
        ))}
        <span className="flex items-center gap-2">
          <Avatar name={null} size="sm" />
          Niet aangemeld
        </span>
      </div>
    ),
    'Medium, at the head of the account menu': () => (
      <div className="flex gap-3">
        <Avatar name="Robin de Vries" size="md" />
        <Avatar name="Noor Bakker" size="md" />
        <Avatar name={null} size="md" />
      </div>
    ),
    'Large, at the head of the account page': () => (
      <div className="flex gap-3">
        <Avatar name="Noor Bakker" size="lg" />
        <Avatar name="Sem de Vries" size="lg" />
        <Avatar name={null} size="lg" />
      </div>
    ),
  },
} satisfies Story
