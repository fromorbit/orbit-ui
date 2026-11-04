import { useState } from 'react'
import type { Story } from '../gallery/story'
import { Button } from './Button'
import { Form } from './Form'
import { FormField } from './FormField'
import { Input } from './Input'

/** An invite form that checks itself on submit: send it empty to see the errors and the focus. */
function Invite({ initialErrors = false }: { initialErrors?: boolean }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [checked, setChecked] = useState(initialErrors)
  const [sent, setSent] = useState(false)
  const nameError = checked && name.trim() === '' ? 'Vul een naam in.' : undefined
  const emailError =
    checked && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
      ? 'Vul een geldig e-mailadres in.'
      : undefined
  return (
    <div className="w-full max-w-80">
      <Form
        label="Iemand uitnodigen"
        onSubmit={() => {
          setChecked(true)
          setSent(name.trim() !== '' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
        }}
        actions={
          <>
            <Button type="submit" variant="primary">
              Uitnodigen
            </Button>
            {sent ? <span className="text-[12px] text-muted">Uitnodiging verstuurd</span> : null}
          </>
        }
      >
        <FormField label="Naam" required {...(nameError ? { error: nameError } : {})}>
          {(field) => (
            <Input
              label="Naam"
              value={name}
              onChange={(event) => setName(event.target.value)}
              {...field}
            />
          )}
        </FormField>
        <FormField
          label="E-mailadres"
          description="We sturen er een link naartoe."
          required
          {...(emailError ? { error: emailError } : {})}
        >
          {(field) => (
            <Input
              label="E-mailadres"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              {...field}
            />
          )}
        </FormField>
      </Form>
    </div>
  )
}

export default {
  group: 'primitives',
  title: 'Form',
  states: {
    Empty: () => <Invite />,
    'After a submit with errors': () => <Invite initialErrors />,
  },
} satisfies Story
