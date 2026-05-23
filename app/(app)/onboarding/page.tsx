'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { prefersReducedMotion } from '@/lib/gsap'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Pill } from '@/components/ui/Pill'
import { ArrowLeft, ArrowRight, Copy, Check } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { Toast } from '@/components/ui/Toast'

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

  const router = useRouter()
  const { toast, showToast, hideToast } = useToast()

  const [currentStep, setCurrentStep] = useState(1)
  const [renderedStep, setRenderedStep] = useState(1)
  const [isAnimating, setIsAnimating] = useState(false)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [isBuilding, setIsBuilding] = useState(false)
  const [activeProjectIdx, setActiveProjectIdx] = useState(0)

  // API Key modal states
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [timerExpired, setTimerExpired] = useState(false)

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

  const handleBuildGraph = async () => {
    setIsBuilding(true)
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setIsBuilding(false)
        showToast({ message: result.error ?? 'Something went wrong', type: 'error' })
        return
      }

      setGeneratedApiKey(result.apiKey)
      setShowApiKeyModal(true)

      // Start 10-second timer to enable continue button even if they don't copy
      setTimeout(() => {
        setTimerExpired(true)
      }, 10000)
    } catch (err) {
      console.error(err)
      setIsBuilding(false)
      showToast({ message: 'Failed to build context graph. Please try again.', type: 'error' })
    }
  }

  const handleNext = () => {
    if (isAnimating) return
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setDirection('forward')
        setCurrentStep(s => s + 1)
      } else {
        handleBuildGraph()
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
    <div className="flex h-screen w-full flex-col bg-[var(--bg)] text-[var(--text-primary)]">
      {/* Onboarding header — minimal, no dashboard chrome */}
      <header className="flex h-[60px] w-full shrink-0 items-center justify-between border-b border-[var(--border)] px-6 sm:px-8">
        <span className="font-display text-[18px] font-bold tracking-tight text-[var(--text-primary)]">
          Context<span className="text-[var(--accent)]">Graph</span>
        </span>
        <span className="text-[13px] font-medium text-[var(--text-secondary)]">Step {currentStep} of 4</span>
      </header>

      {/* Step Indicator Bar */}
      <div className="flex h-[2px] w-full shrink-0 gap-[2px]" ref={indicatorRef}>
        {[1, 2, 3, 4].map(step => (
          <div key={step} className="relative h-full flex-1 bg-[var(--border)]">
            <div
              className="indicator-fill absolute left-0 top-0 h-full w-0 bg-[var(--accent)]"
              style={{ width: step <= currentStep && prefersReducedMotion() ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>

      {/* Scrollable form area */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[560px] px-6 py-12 pb-[120px] sm:py-16 sm:pb-[140px]">
          <div ref={contentRef} className="w-full">
            {renderedStep === 1 && renderStep1()}
            {renderedStep === 2 && renderStep2()}
            {renderedStep === 3 && renderStep3()}
            {renderedStep === 4 && renderStep4()}
          </div>
        </div>
      </main>

      {/* Fixed bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto flex w-full max-w-[560px] items-center justify-between px-6 py-4">
          <div className="min-w-[100px]">
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

      {/* ONE-TIME API KEY VIEW MODAL */}
      {showApiKeyModal && generatedApiKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-[500px] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl relative flex flex-col gap-5">
            <div>
              <h3 className="font-['rb-freigeist-neue','Bricolage_Grotesque',sans-serif] text-[28px] font-bold leading-none tracking-tight text-[var(--text-primary)]">
                Your context graph is ready!
              </h3>
              <p className="mt-2 text-[14px] text-[var(--warning)] font-sans font-medium leading-relaxed">
                Copy your API key — it will not be shown again.
              </p>
            </div>

            <div className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3.5 py-3 font-mono text-[13px] text-[var(--text-primary)]">
              <span className="flex-1 break-all select-all font-mono">
                {generatedApiKey}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-full p-0 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.05)]"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(generatedApiKey)
                    setCopied(true)
                    showToast({ message: 'API key copied to clipboard!', type: 'success' })
                  } catch (err) {
                    console.error('Failed to copy', err)
                  }
                }}
              >
                {copied ? <Check className="h-4 w-4 text-[var(--success)]" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <Button
                variant="primary"
                onClick={() => {
                  router.push('/dashboard')
                }}
                disabled={!copied && !timerExpired}
                className="h-10 px-5 font-medium flex items-center gap-1.5"
              >
                Go to Dashboard →
              </Button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  )
}
