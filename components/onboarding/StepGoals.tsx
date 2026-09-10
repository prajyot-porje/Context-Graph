'use client'

import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import type { WizardData } from './wizard-types'
import s from './OnboardingWizard.module.css'

interface Props {
  data: WizardData
  update: (patch: Partial<WizardData>) => void
}

export default function StepGoals({ data, update }: Props) {
  return (
    <div className={s.fieldStack}>
      <Textarea
        label="Current goals"
        value={data.goals}
        onChange={e => update({ goals: e.target.value })}
        placeholder="Ship v1, land a senior role, learn distributed systems…"
        rows={3}
        autoFocus
      />
      <Textarea
        label="Working style (optional)"
        value={data.workingStyle}
        onChange={e => update({ workingStyle: e.target.value })}
        placeholder="Prefers terse answers, wants root-cause fixes, dislikes over-engineering…"
        rows={2}
      />

      <div className={s.toggleRow}>
        <button
          type="button"
          role="switch"
          aria-checked={data.hasAgency}
          onClick={() => update({ hasAgency: !data.hasAgency, agencyName: data.hasAgency ? '' : data.agencyName })}
          className={`${s.toggleSwitch} ${data.hasAgency ? s.toggleSwitchOn : ''}`}
        />
        <span>I run an agency or freelance practice</span>
      </div>

      {data.hasAgency && (
        <Input
          label="Agency / practice name"
          value={data.agencyName}
          onChange={e => update({ agencyName: e.target.value })}
          placeholder="Dev Studio"
        />
      )}
    </div>
  )
}
