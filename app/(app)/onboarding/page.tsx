'use client'

import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { prefersReducedMotion } from '@/lib/gsap'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Pill } from '@/components/ui/Pill'
import { ArrowLeft, ArrowRight } from 'lucide-react'

type Project = { name: string; type: string; description: string; status: string; tech: string }

type OnboardingData = {
  name: string
  role: string[]
  location: string
  description: string
  skills: string[]
  stack: string[]
  projects: Project[]
  goals: string
  constraints: string
}

const FRONTEND_SKILLS = ['Next.js', 'React', 'TypeScript', 'Tailwind', 'Vue', 'Svelte', 'GSAP', 'Framer Motion', 'WordPress']
const BACKEND_SKILLS = ['Node.js', 'Python', 'PostgreSQL', 'MongoDB', 'Supabase', 'Prisma', 'Docker', 'AWS', 'Vercel', 'Railway']
const ROLES = ['Student', 'Developer', 'Freelancer', 'Founder']
const PROJECT_TYPES = ['Client work', 'Personal', 'Startup', 'OSS']
const PROJECT_STATUSES = ['Planning', 'Building', 'Launched']

export default function OnboardingPage() {
  const [data, setData] = useState<OnboardingData>({
    name: '',
    role: [],
    location: '',
    description: '',
    skills: [],
    stack: [],
    projects: [{ name: '', type: '', description: '', status: '', tech: '' }],
    goals: '',
    constraints: '',
  })

  const [currentStep, setCurrentStep] = useState(1)
  const [renderedStep, setRenderedStep] = useState(1)
  const [isAnimating, setIsAnimating] = useState(false)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [isBuilding, setIsBuilding] = useState(false)
  const [activeProjectIdx, setActiveProjectIdx] = useState(0)

  const contentRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)

  // Validate step before advancing
  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {}
    if (step === 1) {
      if (!data.name.trim()) newErrors.name = 'Name is required'
      if (data.role.length === 0) newErrors.role = 'Select at least one role'
    } else if (step === 2) {
      if (data.skills.length + data.stack.length < 3) {
        newErrors.skills = 'Select at least 3 skills across both groups'
      }
    } else if (step === 3) {
      const p = data.projects[0]
      if (!p.name.trim()) newErrors.projectName = 'First project requires a name'
      if (!p.type) newErrors.projectType = 'First project requires a type'
    } else if (step === 4) {
      if (!data.goals.trim()) newErrors.goals = 'Goals are required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (isAnimating) return
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setDirection('forward')
        setCurrentStep(s => s + 1)
      } else {
        // Build graph
        setIsBuilding(true)
      }
    }
  }

  const handleBack = () => {
    if (isAnimating) return
    if (currentStep > 1) {
      setErrors({})
      setDirection('backward')
      setCurrentStep(s => s - 1)
    }
  }

  // Animation effect for step transitions
  useEffect(() => {
    if (currentStep !== renderedStep && !isAnimating && contentRef.current) {
      setIsAnimating(true)
      const el = contentRef.current
      
      const exitX = direction === 'forward' ? -24 : 24
      const enterX = direction === 'forward' ? 24 : -24

      if (prefersReducedMotion()) {
        setRenderedStep(currentStep)
        setIsAnimating(false)
      } else {
        gsap.to(el, {
          opacity: 0,
          x: exitX,
          duration: 0.2,
          ease: 'cg-in',
          onComplete: () => {
            setRenderedStep(currentStep)
            gsap.fromTo(
              el,
              { opacity: 0, x: enterX },
              { opacity: 1, x: 0, duration: 0.3, ease: 'cg-out', onComplete: () => setIsAnimating(false) }
            )
          }
        })
      }
    }
  }, [currentStep, renderedStep, isAnimating, direction])

  // Animation for step indicators
  useEffect(() => {
    if (indicatorRef.current && !prefersReducedMotion()) {
      const segments = indicatorRef.current.querySelectorAll('.indicator-fill')
      segments.forEach((segment, idx) => {
        if (idx < currentStep) {
          gsap.to(segment, { width: '100%', duration: 0.4, ease: 'cg-out' })
        } else {
          gsap.to(segment, { width: '0%', duration: 0.4, ease: 'cg-out' })
        }
      })
    }
  }, [currentStep])

  const toggleArrayItem = (key: 'role' | 'skills' | 'stack', item: string) => {
    setData(prev => {
      const arr = prev[key]
      if (arr.includes(item)) {
        return { ...prev, [key]: arr.filter(i => i !== item) }
      } else {
        return { ...prev, [key]: [...arr, item] }
      }
    })
  }

  const updateProject = (field: keyof Project, value: string) => {
    setData(prev => {
      const newProjects = [...prev.projects]
      newProjects[activeProjectIdx] = { ...newProjects[activeProjectIdx], [field]: value }
      return { ...prev, projects: newProjects }
    })
  }

  const addProject = () => {
    if (data.projects.length < 3) {
      setData(prev => ({
        ...prev,
        projects: [...prev.projects, { name: '', type: '', description: '', status: '', tech: '' }]
      }))
      setActiveProjectIdx(data.projects.length)
    }
  }

  // --- Render Steps ---
  const renderStep1 = () => (
    <div className="flex flex-col">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">ABOUT YOU</p>
      <h1 className="mb-2 font-display text-[36px] font-bold leading-[1.1] tracking-[-1px] text-[var(--text-primary)]">
        Tell us who you are
      </h1>
      <p className="mb-8 text-[15px] text-[var(--text-secondary)]">
        This becomes the root of your context graph.
      </p>

      <div className="flex flex-col gap-6">
        <Input
          label="Full name"
          placeholder="Prajyot Porje"
          value={data.name}
          onChange={e => setData({ ...data, name: e.target.value })}
          error={errors.name}
        />
        <Input
          label="Location"
          placeholder="Pune, India"
          value={data.location}
          onChange={e => setData({ ...data, location: e.target.value })}
        />
        
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Role</label>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {ROLES.map(role => (
              <Pill
                key={role}
                selected={data.role.includes(role)}
                onClick={() => toggleArrayItem('role', role)}
              >
                {role}
              </Pill>
            ))}
          </div>
          {errors.role && <p className="mt-1 text-[13px] text-[var(--error)]">{errors.role}</p>}
        </div>

        <Input
          label="What do you do in one line"
          placeholder="Full-stack developer building AI tools"
          value={data.description}
          onChange={e => setData({ ...data, description: e.target.value })}
        />
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="flex flex-col">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">YOUR STACK</p>
      <h1 className="mb-2 font-display text-[36px] font-bold leading-[1.1] tracking-[-1px] text-[var(--text-primary)]">
        What do you work with?
      </h1>
      <p className="mb-8 text-[15px] text-[var(--text-secondary)]">
        Select all that apply. You can always edit later.
      </p>

      {errors.skills && <p className="mb-4 text-[13px] text-[var(--error)]">{errors.skills}</p>}

      <div className="mb-7 flex flex-col gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Frontend & Frameworks</p>
        <div className="flex flex-wrap gap-2">
          {FRONTEND_SKILLS.map(skill => (
            <Pill
              key={skill}
              selected={data.skills.includes(skill)}
              onClick={() => toggleArrayItem('skills', skill)}
            >
              {skill}
            </Pill>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Backend & Infrastructure</p>
        <div className="flex flex-wrap gap-2">
          {BACKEND_SKILLS.map(skill => (
            <Pill
              key={skill}
              selected={data.stack.includes(skill)}
              onClick={() => toggleArrayItem('stack', skill)}
            >
              {skill}
            </Pill>
          ))}
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="flex flex-col">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">YOUR WORK</p>
      <h1 className="mb-2 font-display text-[36px] font-bold leading-[1.1] tracking-[-1px] text-[var(--text-primary)]">
        What are you building?
      </h1>
      <p className="mb-8 text-[15px] text-[var(--text-secondary)]">
        Add up to 3 current projects.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {data.projects.map((p, idx) => (
          <Pill
            key={idx}
            selected={activeProjectIdx === idx}
            onClick={() => setActiveProjectIdx(idx)}
          >
            {p.name || `Project ${idx + 1}`}
          </Pill>
        ))}
        {data.projects.length < 3 && data.projects[0].name.length > 0 && (
          <Button variant="ghost" size="sm" onClick={addProject} className="ml-2 h-10 px-3">
            + Add project
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <Input
          label="Project name"
          placeholder="ContextGraph"
          value={data.projects[activeProjectIdx].name}
          onChange={e => updateProject('name', e.target.value)}
          error={activeProjectIdx === 0 ? errors.projectName : undefined}
        />

        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Type</label>
          <div className="flex flex-wrap gap-2">
            {PROJECT_TYPES.map(type => (
              <Pill
                key={type}
                selected={data.projects[activeProjectIdx].type === type}
                onClick={() => updateProject('type', type)}
              >
                {type}
              </Pill>
            ))}
          </div>
          {activeProjectIdx === 0 && errors.projectType && <p className="mt-1 text-[13px] text-[var(--error)]">{errors.projectType}</p>}
        </div>

        <Textarea
          label="Short description"
          placeholder="A context engine for AI tools"
          rows={3}
          style={{ resize: 'none' }}
          value={data.projects[activeProjectIdx].description}
          onChange={e => updateProject('description', e.target.value)}
        />

        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Status</label>
          <div className="flex flex-wrap gap-2">
            {PROJECT_STATUSES.map(status => (
              <Pill
                key={status}
                selected={data.projects[activeProjectIdx].status === status}
                onClick={() => updateProject('status', status)}
              >
                {status}
              </Pill>
            ))}
          </div>
        </div>

        <Input
          label="Tech stack"
          placeholder="Next.js, Supabase, Railway"
          value={data.projects[activeProjectIdx].tech}
          onChange={e => updateProject('tech', e.target.value)}
        />
      </div>
    </div>
  )

  const renderStep4 = () => {
    const projCount = data.projects.filter(p => p.name.trim() !== '').length || 1

    return (
      <div className="flex flex-col">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">YOUR GOALS</p>
        <h1 className="mb-2 font-display text-[36px] font-bold leading-[1.1] tracking-[-1px] text-[var(--text-primary)]">
          What are you working toward?
        </h1>
        <p className="mb-8 text-[15px] text-[var(--text-secondary)]">
          This helps AI understand your priorities.
        </p>

        <div className="flex flex-col gap-6">
          <Textarea
            label="Goals for the next 6 months"
            placeholder="Land a senior SDE role, grow Dev Studio to 3 retainer clients, ship ContextGraph v1"
            rows={5}
            value={data.goals}
            onChange={e => setData({ ...data, goals: e.target.value })}
            error={errors.goals}
          />

          <Textarea
            label="How should AI help you? (optional)"
            placeholder="Be direct, flag scope creep, prefer TypeScript examples"
            rows={3}
            value={data.constraints}
            onChange={e => setData({ ...data, constraints: e.target.value })}
          />

          <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-5">
            <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
              Your context graph will include
            </h3>
            <ul className="flex flex-col gap-2">
              <li className="flex items-center gap-3 text-[14px] leading-[1.6] text-[var(--text-secondary)]">
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                1 identity node — who you are and how you work
              </li>
              <li className="flex items-center gap-3 text-[14px] leading-[1.6] text-[var(--text-secondary)]">
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                {projCount} project node(s) — current builds and status
              </li>
              <li className="flex items-center gap-3 text-[14px] leading-[1.6] text-[var(--text-secondary)]">
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                Skills and stack — your technical foundation
              </li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--bg)]">
      {/* Top bar */}
      <header className="flex h-[60px] w-full items-center justify-between border-b border-[var(--border)] px-8">
        <span className="font-display text-[16px] font-bold text-[var(--text-primary)]">ContextGraph</span>
        <span className="text-[13px] text-[var(--text-secondary)]">Step {currentStep} of 4</span>
      </header>

      {/* Step Indicator Bar */}
      <div className="flex h-[2px] w-full gap-1" ref={indicatorRef}>
        {[1, 2, 3, 4].map(step => (
          <div key={step} className="relative h-full flex-1 bg-[var(--border)]">
            {/* The animated fill element */}
            <div
              className="indicator-fill absolute left-0 top-0 h-full w-0 bg-[var(--accent)]"
              style={{ width: step <= currentStep && prefersReducedMotion() ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>

      {/* Main content */}
      <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col px-6 py-16 pb-32">
        <div ref={contentRef} className="w-full">
          {renderedStep === 1 && renderStep1()}
          {renderedStep === 2 && renderStep2()}
          {renderedStep === 3 && renderStep3()}
          {renderedStep === 4 && renderStep4()}
        </div>
      </main>

      {/* Navigation bottom bar */}
      <div className="fixed bottom-0 left-0 flex w-full items-center justify-center border-t border-[var(--border)] bg-[var(--bg)] p-4">
        <div className="flex w-full max-w-[560px] items-center justify-between">
          <div className="w-[100px]">
            {currentStep > 1 && (
              <Button variant="ghost" onClick={handleBack} disabled={isAnimating || isBuilding}>
                <ArrowLeft size={16} /> Back
              </Button>
            )}
          </div>
          <div>
            {currentStep < 4 ? (
              <Button variant="primary" onClick={handleNext} disabled={isAnimating}>
                Continue <ArrowRight size={16} />
              </Button>
            ) : (
              <Button variant="accent" onClick={handleNext} disabled={isAnimating || isBuilding} className="h-11">
                Build my graph
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Building Overlay */}
      {isBuilding && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg)]/95 backdrop-blur-sm">
          <div className="mb-6 flex gap-2">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="h-3 w-3 animate-pulse rounded-full bg-[var(--accent)]"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          <h2 className="font-display text-[28px] font-bold text-[var(--text-primary)]">
            Building your context graph...
          </h2>
          <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
            This takes about 10 seconds
          </p>
        </div>
      )}
    </div>
  )
}
