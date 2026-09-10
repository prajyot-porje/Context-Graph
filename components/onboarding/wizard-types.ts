export type ProjectStatus = 'active' | 'paused' | 'shipped'

export interface WizardProject {
  name: string
  description: string
  status: ProjectStatus
}

export interface WizardData {
  name: string
  role: string
  location: string
  skills: string[]
  stack: string[]
  projects: WizardProject[]
  goals: string
  workingStyle: string
  hasAgency: boolean
  agencyName: string
}

export const EMPTY_WIZARD_DATA: WizardData = {
  name: '',
  role: '',
  location: '',
  skills: [],
  stack: [],
  projects: [],
  goals: '',
  workingStyle: '',
  hasAgency: false,
  agencyName: '',
}

export type MainStep = 'identity' | 'stack' | 'projects' | 'goals' | 'review'
export type WizardStep = 'start' | 'import' | MainStep

export const STEP_ORDER: MainStep[] = ['identity', 'stack', 'projects', 'goals', 'review']
