import { describe, it, expect, beforeEach } from 'vitest';
import { useWizardStore } from '../src/lib/store';

describe('useWizardStore', () => {
  beforeEach(() => useWizardStore.getState().reset());

  it('has correct default state', () => {
    const s = useWizardStore.getState();
    expect(s.step).toBe(0);
    expect(s.basics).toEqual({});
    expect(s.technical).toEqual({});
    expect(s.preferences).toEqual({});
    expect(s.planId).toBeNull();
    expect(s.plan).toBeNull();
    expect(s.progress).toEqual([]);
    expect(s.githubToken).toBeNull();
    expect(s.repoUrl).toBeNull();
  });

  it('setStep updates step', () => {
    useWizardStore.getState().setStep(2);
    expect(useWizardStore.getState().step).toBe(2);
  });

  it('setBasics merges basics', () => {
    useWizardStore.getState().setBasics({ description: 'My app' });
    useWizardStore.getState().setBasics({ timeline: '3 months' });
    expect(useWizardStore.getState().basics).toEqual({ description: 'My app', timeline: '3 months' });
  });

  it('setTechnical merges technical', () => {
    useWizardStore.getState().setTechnical({ user_count: '1000', needs_auth: true });
    useWizardStore.getState().setTechnical({ uptime: '99.9%' });
    expect(useWizardStore.getState().technical).toMatchObject({ user_count: '1000', needs_auth: true, uptime: '99.9%' });
  });

  it('setPreferences merges preferences', () => {
    useWizardStore.getState().setPreferences({ backend_lang: 'Python' });
    useWizardStore.getState().setPreferences({ frontend_framework: 'React' });
    expect(useWizardStore.getState().preferences).toEqual({ backend_lang: 'Python', frontend_framework: 'React' });
  });

  it('setPlanId sets planId', () => {
    useWizardStore.getState().setPlanId('plan-123');
    expect(useWizardStore.getState().planId).toBe('plan-123');
  });

  it('setPlan sets plan', () => {
    const plan = { plan_id: 'p1', recommended: {} as any, alternatives: [], review_findings: [], cost_estimate_ai: 10, created_at: '' };
    useWizardStore.getState().setPlan(plan);
    expect(useWizardStore.getState().plan).toEqual(plan);
  });

  it('addProgress appends events', () => {
    const e1 = { step: 1, total: 3, message: 'Step 1', partial: null, done: false };
    const e2 = { step: 2, total: 3, message: 'Step 2', partial: null, done: false };
    useWizardStore.getState().addProgress(e1);
    useWizardStore.getState().addProgress(e2);
    expect(useWizardStore.getState().progress).toHaveLength(2);
    expect(useWizardStore.getState().progress[1].message).toBe('Step 2');
  });

  it('clearProgress empties progress', () => {
    useWizardStore.getState().addProgress({ step: 1, total: 1, message: 'x', partial: null, done: true });
    useWizardStore.getState().clearProgress();
    expect(useWizardStore.getState().progress).toHaveLength(0);
  });

  it('setGithubToken sets token', () => {
    useWizardStore.getState().setGithubToken('ghp_abc');
    expect(useWizardStore.getState().githubToken).toBe('ghp_abc');
    useWizardStore.getState().setGithubToken(null);
    expect(useWizardStore.getState().githubToken).toBeNull();
  });

  it('setRepoUrl sets repoUrl', () => {
    useWizardStore.getState().setRepoUrl('https://github.com/user/repo');
    expect(useWizardStore.getState().repoUrl).toBe('https://github.com/user/repo');
  });

  it('reset restores default state', () => {
    useWizardStore.getState().setStep(3);
    useWizardStore.getState().setBasics({ description: 'test' });
    useWizardStore.getState().reset();
    const s = useWizardStore.getState();
    expect(s.step).toBe(0);
    expect(s.basics).toEqual({});
  });
});
