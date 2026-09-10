'use client'

import { useState } from 'react'
import type { WizardData } from './wizard-types'
import s from './OnboardingWizard.module.css'

function IconX({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function TagField({ label, placeholder, values, onChange }: {
  label: string
  placeholder: string
  values: string[]
  onChange: (next: string[]) => void
}) {
  const [draft, setDraft] = useState('')

  const commit = () => {
    const value = draft.trim()
    if (value && !values.includes(value)) onChange([...values, value])
    setDraft('')
  }

  return (
    <div className={s.tagField}>
      <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">{label}</label>
      <div className="flex min-h-[44px] flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 focus-within:border-[var(--accent)] focus-within:[box-shadow:var(--shadow-accent)]">
        {values.map(v => (
          <span
            key={v}
            className="inline-flex items-center whitespace-nowrap rounded-[var(--radius-full)] border border-[var(--accent)] bg-[var(--accent-muted)] py-[6px] pl-[14px] pr-[8px] text-[13px] font-medium text-[var(--accent)]"
          >
            {v}
            <button type="button" onClick={() => onChange(values.filter(x => x !== v))} aria-label={`Remove ${v}`} className={s.tagRemove}>
              <IconX />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit() }
            if (e.key === 'Backspace' && !draft && values.length) onChange(values.slice(0, -1))
          }}
          onBlur={commit}
          placeholder={values.length ? '' : placeholder}
          className={s.tagInput}
        />
      </div>
    </div>
  )
}

interface Props {
  data: WizardData
  update: (patch: Partial<WizardData>) => void
}

export default function StepStack({ data, update }: Props) {
  return (
    <div className={s.fieldStack}>
      <TagField
        label="Primary stack"
        placeholder="Next.js, TypeScript, Postgres… press Enter"
        values={data.stack}
        onChange={stack => update({ stack })}
      />
      <TagField
        label="Other skills"
        placeholder="System design, DevOps, UI design… press Enter"
        values={data.skills}
        onChange={skills => update({ skills })}
      />
    </div>
  )
}
