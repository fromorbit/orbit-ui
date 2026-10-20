import { useRef, useState } from 'react'
import type { Story } from '../gallery/story'
import { Button } from './Button'
import { FileInput } from './FileInput'

/** A visible trigger and the hidden input behind it — the shape `Composer.tsx` actually uses. */
function Demo() {
  const ref = useRef<HTMLInputElement>(null)
  const [names, setNames] = useState<string[]>([])
  return (
    <div className="flex flex-col gap-2">
      <FileInput ref={ref} onFiles={(files) => setNames(files.map((file) => file.name))} />
      <Button onClick={() => ref.current?.click()}>Bestand kiezen</Button>
      <p className="text-fg">{names.length > 0 ? names.join(', ') : 'Nog niets gekozen'}</p>
    </div>
  )
}

export default {
  group: 'primitives',
  title: 'FileInput',
  states: {
    'Behind a visible trigger': () => <Demo />,
  },
} satisfies Story
