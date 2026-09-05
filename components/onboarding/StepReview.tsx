'use client'

import type { WizardData, WizardStep } from './wizard-types'
import s from './OnboardingWizard.module.css'

interface Props {
  data: WizardData
  goToStep: (step: WizardStep) => void
}

function Section({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className={s.reviewSection}>
      <div className={s.reviewSectionHeader}>
        <span className={s.reviewSectionTitle}>{title}</span>
        <button type="button" onClick={onEdit} className={s.reviewEditLink}>Edit</button>
      </div>
      <div className={s.reviewCard}>{children}</div>
    </div>
  )
}

export default function StepReview({ data, goToStep }: Props) {
  return (
    <div className={s.fieldStack}>
      <Section title="Identity" onEdit={() => goToStep('identity')}>
        <b>{data.name || 'No name entered'}</b>{data.role ? ` — ${data.role}` : ''}{data.location ? ` · ${data.location}` : ''}
      </Section>

      <Section title="Stack & skills" onEdit={() => goToStep('stack')}>
        {[...data.stack, ...data.skills].length ? [...data.stack, ...data.skills].join(', ') : 'Nothing added'}
      </Section>

      <Section title="Projects" onEdit={() => goToStep('projects')}>
        {data.projects.length
          ? data.projects.map((p, i) => (
              <div key={i} style={{ marginBottom: i < data.projects.length - 1 ? '8px' : 0 }}>
                <b>{p.name || 'Untitled'}</b> ({p.status}){p.description ? ` — ${p.description}` : ''}
              </div>
            ))
          : 'No projects added'}
      </Section>

      <Section title="Goals" onEdit={() => goToStep('goals')}>
        {data.goals || 'No goals entered'}
        {data.hasAgency && data.agencyName ? <><br /><b>Agency:</b> {data.agencyName}</> : null}
      </Section>
    </div>
  )
}
