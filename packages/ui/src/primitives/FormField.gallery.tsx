import type { Story } from '../gallery/story'
import { FormField } from './FormField'
import { Input } from './Input'
import { Select } from './Select'
import { Textarea } from './Textarea'

/** A column as wide as a sign-in form, so the stories show the field at the width it lives at. */
function Column({ children }: { children: React.ReactNode }) {
  return <div className="flex w-80 flex-col gap-4">{children}</div>
}

export default {
  group: 'primitives',
  title: 'FormField',
  states: {
    'With a description': () => (
      <Column>
        <FormField label="Naam" description="Zoals je collega's je kennen.">
          {(field) => <Input label="Naam" placeholder="Noor de Vries" {...field} />}
        </FormField>
      </Column>
    ),
    'With an error': () => (
      <Column>
        <FormField
          label="E-mailadres"
          description="Je werkadres."
          error="Vul een geldig e-mailadres in."
          required
        >
          {(field) => <Input label="E-mailadres" defaultValue="noor@" {...field} />}
        </FormField>
      </Column>
    ),
    'Optional, with a link beside the label': () => (
      <Column>
        <FormField
          label="Wachtwoord"
          aside={
            <a href="#/primitives-formfield" className="text-[12px] text-accent-text">
              Vergeten?
            </a>
          }
          required
        >
          {(field) => <Input label="Wachtwoord" type="password" defaultValue="geheim" {...field} />}
        </FormField>
        <FormField label="Telefoon" optionalLabel="optioneel">
          {(field) => <Input label="Telefoon" type="tel" placeholder="06 12345678" {...field} />}
        </FormField>
      </Column>
    ),
    'Other controls': () => (
      <Column>
        <FormField label="Rol" description="Wat iemand in de werkruimte mag.">
          {(field) => (
            <Select
              label="Rol"
              value="lid"
              options={[
                { value: 'lid', label: 'Lid' },
                { value: 'beheerder', label: 'Beheerder' },
              ]}
              onValueChange={() => {}}
              {...field}
            />
          )}
        </FormField>
        <FormField label="Toelichting" error="Schrijf minstens tien tekens.">
          {(field) => <Textarea label="Toelichting" minRows={3} defaultValue="Kort" {...field} />}
        </FormField>
      </Column>
    ),
  },
} satisfies Story
