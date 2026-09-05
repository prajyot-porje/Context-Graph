'use client'

import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Pill } from '@/components/ui/Pill'
import type { ProjectStatus, WizardData, WizardProject } from './wizard-types'
import s from './OnboardingWizard.module.css'

const STATUSES: ProjectStatus[] = ['active', 'paused', 'shipped']
const MAX_PROJECTS = 3

function IconTrash({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
    </svg>
  )
}

function IconPlus({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

interface Props {
  data: WizardData
  update: (patch: Partial<WizardData>) => void
}

export default function StepProjects({ data, update }: Props) {
  const setProject = (index: number, patch: Partial<WizardProject>) => {
    const next = data.projects.map((p, i) => (i === index ? { ...p, ...patch } : p))
    update({ projects: next })
  }

  const addProject = () => {
    if (data.projects.length >= MAX_PROJECTS) return
    update({ projects: [...data.projects, { name: '', description: '', status: 'active' }] })
  }

  const removeProject = (index: number) => {
    update({ projects: data.projects.filter((_, i) => i !== index) })
  }

  return (
    <div className={s.fieldStack}>
      <div className={s.projectList}>
        {data.projects.map((project, i) => (
          <div key={i} className={s.projectCard}>
            <div className={s.projectCardHeader}>
              <span className={s.projectCardIndex}>Project {i + 1}</span>
              <button type="button" onClick={() => removeProject(i)} aria-label="Remove project" className={s.projectRemoveBtn}>
                <IconTrash />
              </button>
            </div>
            <Input
              label="Name"
              value={project.name}
              onChange={e => setProject(i, { name: e.target.value })}
              placeholder="ContextGraph"
            />
            <Textarea
              label="One-line description"
              value={project.description}
              onChange={e => setProject(i, { description: e.target.value })}
              placeholder="Cross-AI personal context engine, Next.js + Supabase"
              rows={2}
            />
            <div className={s.statusRow}>
              {STATUSES.map(status => (
                <Pill key={status} selected={project.status === status} onClick={() => setProject(i, { status })}>
                  {status}
                </Pill>
              ))}
            </div>
          </div>
        ))}
      </div>

      {data.projects.length < MAX_PROJECTS && (
        <button type="button" onClick={addProject} className={s.addProjectBtn}>
          <IconPlus /> Add project
        </button>
      )}
      {data.projects.length === 0 && (
        <p className="text-[13px] text-[var(--text-muted)]">Optional — add up to {MAX_PROJECTS} active projects, or skip this step.</p>
      )}
    </div>
  )
}
