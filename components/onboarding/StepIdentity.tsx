'use client'

import { Input } from '@/components/ui/Input'
import type { WizardData } from './wizard-types'
import s from './OnboardingWizard.module.css'

interface Props {
  data: WizardData
  update: (patch: Partial<WizardData>) => void
}

export default function StepIdentity({ data, update }: Props) {
  return (
    <div className={s.fieldStack}>
      <Input
        label="Your name"
        value={data.name}
        onChange={e => update({ name: e.target.value })}
        placeholder="Prajyot Porje"
        autoFocus
      />
      <div className={s.fieldRow}>
        <Input
          label="Current role"
          value={data.role}
          onChange={e => update({ role: e.target.value })}
          placeholder="Full-stack developer"
        />
        <Input
          label="Location (optional)"
          value={data.location}
          onChange={e => update({ location: e.target.value })}
          placeholder="Pune, India"
        />
      </div>
    </div>
  )
}
