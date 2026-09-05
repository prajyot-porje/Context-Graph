'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'
import { authClient } from '@/lib/auth-client'
import { EMPTY_WIZARD_DATA, STEP_ORDER, type MainStep, type WizardData, type WizardStep } from './wizard-types'
import StepIdentity from './StepIdentity'
import StepStack from './StepStack'
import StepProjects from './StepProjects'
import StepGoals from './StepGoals'
import StepReview from './StepReview'
import MemoryImportStep from './MemoryImportStep'
import s from './OnboardingWizard.module.css'

const GraphPreview = dynamic(() => import('./GraphPreview'), { ssr: false })

const STEP_META: Record<MainStep, { title: string; subtitle: string; label: string }> = {
  identity: { title: 'Who are you?', subtitle: 'This becomes the root of your context graph.', label: 'Identity' },
  stack: { title: 'What do you work with?', subtitle: 'Your primary stack and skills, for scope-aware context.', label: 'Stack' },
  projects: { title: 'What are you building?', subtitle: 'Up to 3 active projects. You can skip this and add them later.', label: 'Projects' },
  goals: { title: 'What are you working toward?', subtitle: 'Goals and working style help AI clients tailor their responses.', label: 'Goals' },
  review: { title: 'Review your graph', subtitle: 'Everything below gets written to your context graph.', label: 'Review' },
}

function IconImport({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v13M12 16l-4-4M12 16l4-4" /><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" /></svg>
}
function IconEdit({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
}
function IconArrowLeft({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
}
function IconSpinner({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className={s.spinner}><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
}

function StepProgress({ step }: { step: MainStep }) {
  const currentIndex = STEP_ORDER.indexOf(step)
  return (
    <nav className={s.steps} aria-label="Onboarding progress">
      {STEP_ORDER.map((id, i) => {
        const isDone = currentIndex > i
        const isActive = currentIndex === i
        return (
          <div key={id} className={s.step}>
            <div className={`${s.stepDot} ${isDone ? s.stepDotDone : ''} ${isActive ? s.stepDotActive : ''}`} aria-current={isActive ? 'step' : undefined}>
              {i + 1}
            </div>
            <span className={`${s.stepLabel} ${isActive ? s.stepLabelActive : ''}`}>{STEP_META[id].label}</span>
            {i < STEP_ORDER.length - 1 && <div className={s.stepConnector} aria-hidden="true" />}
          </div>
        )
      })}
    </nav>
  )
}

export default function OnboardingWizard() {
  const { data: session } = authClient.useSession()
  const [step, setStep] = useState<WizardStep>('start')
  const [data, setData] = useState<WizardData>(EMPTY_WIZARD_DATA)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [finalizeError, setFinalizeError] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const stepBodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (session?.user?.name && !data.name) {
      setData(prev => ({ ...prev, name: session.user.name }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const update = useCallback((patch: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...patch }))
  }, [])

  // Entrance
  useGSAP(() => {
    const targets = ['.ob-logo', '.ob-steps', '.ob-heading']
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { gsap.set(targets, { opacity: 1, y: 0 }); return }
    gsap.set(targets, { opacity: 0, y: 20 })
    gsap.to(targets, { opacity: 1, y: 0, duration: 0.7, ease: 'cubic-bezier(0.16,1,0.3,1)', stagger: 0.08, delay: 0.05 })
  }, { scope: containerRef })

  // Step transition
  useGSAP(() => {
    if (!stepBodyRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo(stepBodyRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'cubic-bezier(0.25,0.46,0.45,0.94)' })
  }, [step])

  const isMainStep = (STEP_ORDER as readonly string[]).includes(step)
  const stepIndex = isMainStep ? STEP_ORDER.indexOf(step as MainStep) : -1

  const canContinue = (() => {
    if (step === 'identity') return data.name.trim().length > 0 && data.role.trim().length > 0
    return true
  })()

  const goNext = () => {
    if (step === 'start') return
    const next = STEP_ORDER[stepIndex + 1]
    if (next) setStep(next)
    else handleFinalize()
  }

  const goBack = () => {
    if (stepIndex <= 0) { setStep('start'); return }
    setStep(STEP_ORDER[stepIndex - 1])
  }

  async function handleFinalize() {
    setIsFinalizing(true)
    setFinalizeError(null)
    try {
      const payload = {
        name: data.name,
        role: data.role,
        location: data.location || undefined,
        skills: data.skills,
        stack: data.stack,
        projects: data.projects.filter(p => p.name.trim()),
        goals: data.goals,
        workingStyle: data.workingStyle || undefined,
        agencyName: data.hasAgency ? data.agencyName : undefined,
      }
      const res = await fetch('/api/onboarding/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Graph generation failed. Please try again.')
      }
      const result = await res.json()
      if (result.apiKey) sessionStorage.setItem('cg-new-api-key', result.apiKey)
      await authClient.getSession({ query: { disableCookieCache: true } })
      window.location.href = '/connect'
    } catch (err: unknown) {
      const error = err as Error
      setFinalizeError(error.message || 'Something went wrong. Please try again.')
      setIsFinalizing(false)
    }
  }

  return (
    <div className={s.root} ref={containerRef}>
      <section className={s.chat} aria-label="Onboarding">
        <div className={`${s.logo} ob-logo`}>Context<span className={s.logoAccent}>Graph</span></div>

        {isMainStep && (
          <div className="ob-steps">
            <StepProgress step={step as MainStep} />
          </div>
        )}

        <div className={`${s.heading} ob-heading`}>
          {step === 'start' && (
            <>
              <h1>Build your context graph</h1>
              <p>Answer a few questions, or import what an AI already knows about you. Takes about 3 minutes.</p>
            </>
          )}
          {step === 'import' && (
            <>
              <h1>Import your AI memory</h1>
              <p>We&apos;ll read what you&apos;ve already told ChatGPT or Claude and prefill the rest of this form.</p>
            </>
          )}
          {isMainStep && (
            <>
              <h1>{STEP_META[step as MainStep].title}</h1>
              <p>{STEP_META[step as MainStep].subtitle}</p>
            </>
          )}
        </div>

        <div className={s.stepBody} ref={stepBodyRef} data-lenis-prevent="true">
          {step === 'start' && (
            <div className={s.pathCards}>
              <button onClick={() => setStep('import')} type="button" className={s.pathCard}>
                <div className={s.pathCardIcon}><IconImport /></div>
                <p className={s.pathCardTitle}>Import AI memory</p>
                <p className={s.pathCardDesc}>Paste your ChatGPT or Claude memory to prefill your graph instantly.</p>
              </button>
              <button onClick={() => setStep('identity')} type="button" className={s.pathCard}>
                <div className={s.pathCardIcon}><IconEdit /></div>
                <p className={s.pathCardTitle}>Start fresh</p>
                <p className={s.pathCardDesc}>Answer a few quick questions step-by-step.</p>
              </button>
            </div>
          )}

          {step === 'import' && (
            <MemoryImportStep onBack={() => setStep('start')} onParsed={patch => { update(patch); setStep('identity') }} />
          )}

          {step === 'identity' && <StepIdentity data={data} update={update} />}
          {step === 'stack' && <StepStack data={data} update={update} />}
          {step === 'projects' && <StepProjects data={data} update={update} />}
          {step === 'goals' && <StepGoals data={data} update={update} />}
          {step === 'review' && <StepReview data={data} goToStep={setStep} />}
        </div>

        {finalizeError && <p role="alert" style={{ fontSize: '13px', color: 'var(--error)', marginBottom: '12px' }}>{finalizeError}</p>}

        {isMainStep && (
          <div className={`${s.wizardNav} ob-input`}>
            <button type="button" onClick={goBack} className="flex items-center gap-1 text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              <IconArrowLeft size={14} /> Back
            </button>
            <div className={s.wizardNavSpacer} />
            <button
              type="button"
              onClick={goNext}
              disabled={!canContinue || isFinalizing}
              className={`${s.buildBtn} ${canContinue && !isFinalizing ? s.buildBtnReady : s.buildBtnLoading}`}
              style={{ width: 'auto', padding: '0 24px' }}
            >
              {step === 'review' ? 'Generate my graph →' : 'Continue'}
            </button>
          </div>
        )}
      </section>

      <aside className={s.graph} aria-label="Context graph preview">
        <div className={s.graphContent}>
          <GraphPreview data={data} />
        </div>
      </aside>

      {isFinalizing && (
        <div className={s.finalizeOverlay} role="dialog" aria-modal="true" aria-label="Building your graph">
          <div className={s.finalizeCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: 'var(--accent)' }}><IconSpinner /></span>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px', fontFamily: 'var(--font-display-fallback), "Bricolage Grotesque", sans-serif' }}>
                Building your graph
              </h2>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
              Structuring your answers into a personal context graph and generating your API key. Usually takes about 10 seconds.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
