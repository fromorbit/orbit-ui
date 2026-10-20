import { useState } from 'react'
import type { Story } from '../gallery/story'
import { SecretField } from './SecretField'

/** The words of the app, in Dutch as the gallery runs. */
const LABELS = {
  set: 'Ingesteld',
  unset: 'Niet ingesteld',
  show: 'Toon wat je typt',
  clear: 'Wissen',
}

/** A field that remembers only whether something was saved, as core does. */
function Live({ initial }: { initial: boolean }) {
  const [isSet, setIsSet] = useState(initial)
  return (
    <SecretField
      label="API key"
      labels={LABELS}
      isSet={isSet}
      maxLength={200}
      onSave={() => setIsSet(true)}
      onClear={() => setIsSet(false)}
    />
  )
}

export default {
  group: 'primitives',
  title: 'SecretField',
  states: {
    'Not set': () => <Live initial={false} />,
    Set: () => <Live initial />,
    Disabled: () => (
      <SecretField
        label="API key"
        labels={LABELS}
        isSet
        disabled
        onSave={() => undefined}
        onClear={() => undefined}
      />
    ),
  },
} satisfies Story
