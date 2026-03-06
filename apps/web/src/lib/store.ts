import { create } from "zustand";

export interface ProjectBasics {
  description: string;
  target_users: string;
  timeline: string;
  budget: string;
}

export interface TechnicalRequirements {
  user_count: string;
  uptime: string;
  data_sensitivity: string;
  needs_auth: boolean;
  needs_realtime: boolean;
  needs_payments: boolean;
}

export interface TechPreferences {
  backend_lang: string;
  frontend_framework: string;
  infra_preference: string;
}

export interface ArchitectureOption {
  name: string;
  stack: Record<string, string>;
  pros: string[];
  cons: string[];
  monthly_cost_estimate: string;
  complexity: "low" | "medium" | "high";
  best_for: string;
  mermaid_diagram: string;
}

export interface ReviewFinding {
  iteration: number;
  category: string;
  findings: string[];
  recommendations: string[];
  risk_level: "low" | "medium" | "high";
}

export interface PlanOutput {
  plan_id: string;
  recommended: ArchitectureOption;
  alternatives: ArchitectureOption[];
  review_findings: ReviewFinding[];
  cost_estimate_ai: number;
  created_at: string;
}

export interface ProgressEvent {
  step: number;
  total: number;
  message: string;
  partial: Record<string, unknown> | null;
  done: boolean;
  error?: boolean;
}

interface WizardState {
  step: number;
  basics: Partial<ProjectBasics>;
  technical: Partial<TechnicalRequirements>;
  preferences: Partial<TechPreferences>;
  planId: string | null;
  plan: PlanOutput | null;
  progress: ProgressEvent[];
  githubToken: string | null; // session memory only, never persisted
  repoUrl: string | null;

  setStep: (step: number) => void;
  setBasics: (basics: Partial<ProjectBasics>) => void;
  setTechnical: (technical: Partial<TechnicalRequirements>) => void;
  setPreferences: (preferences: Partial<TechPreferences>) => void;
  setPlanId: (id: string) => void;
  setPlan: (plan: PlanOutput) => void;
  addProgress: (event: ProgressEvent) => void;
  clearProgress: () => void;
  setGithubToken: (token: string | null) => void;
  setRepoUrl: (url: string) => void;
  reset: () => void;
}

const defaultState = {
  step: 0,
  basics: {},
  technical: {},
  preferences: {},
  planId: null,
  plan: null,
  progress: [],
  githubToken: null,
  repoUrl: null,
};

export const useWizardStore = create<WizardState>((set) => ({
  ...defaultState,

  setStep: (step) => set({ step }),
  setBasics: (basics) => set((s) => ({ basics: { ...s.basics, ...basics } })),
  setTechnical: (technical) => set((s) => ({ technical: { ...s.technical, ...technical } })),
  setPreferences: (preferences) => set((s) => ({ preferences: { ...s.preferences, ...preferences } })),
  setPlanId: (planId) => set({ planId }),
  setPlan: (plan) => set({ plan }),
  addProgress: (event) => set((s) => ({ progress: [...s.progress, event] })),
  clearProgress: () => set({ progress: [] }),
  setGithubToken: (githubToken) => set({ githubToken }),
  setRepoUrl: (repoUrl) => set({ repoUrl }),
  reset: () => set(defaultState),
}));
