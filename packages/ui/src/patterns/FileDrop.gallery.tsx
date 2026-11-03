import { useState } from 'react'
import type { Story } from '../gallery/story'
import { ProgressBar } from '../primitives/ProgressBar'
import { FileDrop } from './FileDrop'

const LABELS = {
  title: 'Sleep bestanden hierheen',
  browse: 'of kies bestanden',
  hint: 'PDF of afbeelding, tot 10 MB',
  dropping: 'Laat los om toe te voegen',
}

/** A drop zone with what came in below it, each with a bar that stands still at its share. */
function Uploads() {
  const [files, setFiles] = useState<{ name: string; share: number }[]>([
    { name: 'jaarverslag-2026.pdf', share: 100 },
    { name: 'schermafbeelding.png', share: 45 },
  ])
  const [error, setError] = useState<string | undefined>()
  return (
    <div className="flex w-96 flex-col gap-3">
      <FileDrop
        labels={LABELS}
        accept="image/*,.pdf"
        {...(error ? { error } : {})}
        onFiles={(added) => {
          setError(undefined)
          setFiles((list) => [...list, ...added.map((file) => ({ name: file.name, share: 0 }))])
        }}
        onReject={(rejected) =>
          setError(
            `${rejected.map((file) => file.name).join(', ')} past niet: kies een PDF of afbeelding.`,
          )
        }
      />
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {files.map((file) => (
          <li key={file.name} className="flex flex-col gap-1">
            <span className="flex justify-between text-[12px]">
              <span className="text-fg">{file.name}</span>
              <span className="text-muted tabular-nums">{file.share}%</span>
            </span>
            <ProgressBar label={`Uploaden van ${file.name}`} value={file.share} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default {
  group: 'patterns',
  title: 'FileDrop',
  states: {
    Empty: () => (
      <div className="w-96">
        <FileDrop labels={LABELS} onFiles={() => {}} />
      </div>
    ),
    'With uploads': () => <Uploads />,
    'With an error': () => (
      <div className="w-96">
        <FileDrop
          labels={LABELS}
          onFiles={() => {}}
          error="bron.zip past niet: kies een PDF of afbeelding."
        />
      </div>
    ),
    Disabled: () => (
      <div className="w-96">
        <FileDrop labels={LABELS} onFiles={() => {}} disabled />
      </div>
    ),
  },
} satisfies Story
