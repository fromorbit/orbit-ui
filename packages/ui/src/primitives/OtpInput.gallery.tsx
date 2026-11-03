import { useState } from 'react'
import type { Story } from '../gallery/story'
import { FormField } from './FormField'
import { OtpInput } from './OtpInput'

function Code({ initial, error }: { initial: string; error?: string }) {
  const [value, setValue] = useState(initial)
  return (
    <FormField label="Verificatiecode" {...(error ? { error } : {})}>
      {(field) => (
        <OtpInput
          label="Verificatiecode"
          value={value}
          onValueChange={setValue}
          groupAfter={3}
          {...field}
        />
      )}
    </FormField>
  )
}

export default {
  group: 'primitives',
  title: 'OtpInput',
  states: {
    Empty: () => <Code initial="" />,
    'Half typed': () => <Code initial="482" />,
    Refused: () => <Code initial="482913" error="Deze code klopt niet. Probeer het opnieuw." />,
    'Letters and digits': () => (
      <OtpInput
        label="Herstelcode"
        value="K7Q"
        charset="alphanumeric"
        length={8}
        groupAfter={4}
        onValueChange={() => {}}
      />
    ),
  },
} satisfies Story
