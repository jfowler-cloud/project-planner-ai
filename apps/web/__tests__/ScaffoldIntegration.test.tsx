import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ScaffoldIntegration from '../src/components/ScaffoldIntegration';

vi.mock('../src/lib/config', () => ({
  SCAFFOLD_URL: 'http://scaffold.test',
  scaffold: { url: 'http://scaffold.test' },
  app: { plansTable: 'test-table', handoffTable: 'test-handoff-table', workflowArn: '' },
}));

const mockExportToScaffold = vi.fn();
vi.mock('../src/lib/api', () => ({
  exportToScaffold: (...args: unknown[]) => mockExportToScaffold(...args),
}));

const mockPlan = {
  plan_id: 'plan-1',
  questionnaire: {
    basics: { name: 'My App', description: 'A test app' },
    technical: { user_count: '1000', uptime: '99.9%', data_size: '1GB' },
  },
  recommended: {
    name: 'Serverless',
    stack: { frontend: 'React', backend: 'Lambda' },
    pros: ['cheap'],
    cons: ['cold starts'],
  },
  alternatives: [],
  selectedOptionIndex: 0,
};

describe('ScaffoldIntegration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('open', vi.fn());
    vi.stubGlobal('alert', vi.fn());
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  it('renders the floating button', () => {
    render(<ScaffoldIntegration />);
    expect(screen.getByTitle('Scaffold AI Integration')).toBeInTheDocument();
  });

  it('opens panel when button clicked', () => {
    render(<ScaffoldIntegration />);
    fireEvent.click(screen.getByTitle('Scaffold AI Integration'));
    expect(screen.getAllByText('Scaffold AI').length).toBeGreaterThan(0);
  });

  it('closes panel when X button clicked', () => {
    render(<ScaffoldIntegration />);
    fireEvent.click(screen.getByTitle('Scaffold AI Integration'));
    const closeBtn = screen.getAllByRole('button').find(b => b.className.includes('text-zinc-400'));
    fireEvent.click(closeBtn!);
    expect(screen.getByText(/Open in Scaffold AI/)).toBeInTheDocument();
  });

  it('closes panel when overlay clicked', () => {
    render(<ScaffoldIntegration />);
    fireEvent.click(screen.getByTitle('Scaffold AI Integration'));
    const overlay = document.querySelector('.fixed.inset-0');
    fireEvent.click(overlay!);
    expect(document.querySelector('.fixed.inset-0')).toBeNull();
  });

  it('shows "Complete your plan first" when no projectPlan', () => {
    render(<ScaffoldIntegration />);
    fireEvent.click(screen.getByTitle('Scaffold AI Integration'));
    expect(screen.getByText('Complete your plan first to export to Scaffold AI')).toBeInTheDocument();
  });

  it('shows plan details when projectPlan provided', () => {
    render(<ScaffoldIntegration projectPlan={mockPlan} />);
    fireEvent.click(screen.getByTitle('Scaffold AI Integration'));
    expect(screen.getByText(/My App/)).toBeInTheDocument();
    expect(screen.getByText(/Serverless/)).toBeInTheDocument();
  });

  it('shows Open in Scaffold AI button', () => {
    render(<ScaffoldIntegration />);
    fireEvent.click(screen.getByTitle('Scaffold AI Integration'));
    expect(screen.getByText(/Open in Scaffold AI/)).toBeInTheDocument();
  });

  it('export button is disabled without a plan', () => {
    render(<ScaffoldIntegration />);
    fireEvent.click(screen.getByTitle('Scaffold AI Integration'));
    const exportBtn = screen.getByText(/Open in Scaffold AI/);
    expect(exportBtn).toBeDisabled();
  });

  it('exports plan to Scaffold AI on button click', async () => {
    mockExportToScaffold.mockResolvedValueOnce({ sessionId: 'sess-1' });
    render(<ScaffoldIntegration projectPlan={mockPlan} />);
    fireEvent.click(screen.getByTitle('Scaffold AI Integration'));
    fireEvent.click(screen.getByText(/Open in Scaffold AI/));
    await waitFor(() => expect(mockExportToScaffold).toHaveBeenCalledWith(expect.objectContaining({
      plan_id: 'plan-1',
      project_name: 'My App',
      architecture: 'Serverless',
    })));
    expect(window.open).toHaveBeenCalledWith('http://scaffold.test?from=planner&session=sess-1', '_blank');
  });

  it('falls back to clipboard on export failure', async () => {
    mockExportToScaffold.mockRejectedValueOnce(new Error('Network error'));
    render(<ScaffoldIntegration projectPlan={mockPlan} />);
    fireEvent.click(screen.getByTitle('Scaffold AI Integration'));
    fireEvent.click(screen.getByText(/Open in Scaffold AI/));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled());
    expect(screen.getByText(/Export failed/)).toBeInTheDocument();
  });

  it('copies description to clipboard', async () => {
    render(<ScaffoldIntegration projectPlan={mockPlan} />);
    fireEvent.click(screen.getByTitle('Scaffold AI Integration'));
    fireEvent.click(screen.getByText('📋 Copy Description'));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled());
    expect(window.alert).toHaveBeenCalledWith('Description copied to clipboard!');
  });

  it('shows technology count when stack available', () => {
    render(<ScaffoldIntegration projectPlan={mockPlan} />);
    fireEvent.click(screen.getByTitle('Scaffold AI Integration'));
    expect(screen.getByText('• 2 technologies')).toBeInTheDocument();
  });

  it('shows review findings count when present', () => {
    const planWithFindings = {
      ...mockPlan,
      review_findings: [
        { category: 'security', findings: ['issue'], recommendations: ['fix'], risk_level: 'high' },
      ],
    };
    render(<ScaffoldIntegration projectPlan={planWithFindings} />);
    fireEvent.click(screen.getByTitle('Scaffold AI Integration'));
    expect(screen.getByText('• 1 review findings')).toBeInTheDocument();
  });

  it('includes review findings in export payload', async () => {
    mockExportToScaffold.mockResolvedValueOnce({ sessionId: 'sess-2' });
    const planWithFindings = {
      ...mockPlan,
      review_findings: [
        { category: 'security', findings: ['issue'], recommendations: ['fix'], risk_level: 'high' },
      ],
    };
    render(<ScaffoldIntegration projectPlan={planWithFindings} reviewSummaryMarkdown="# Summary" />);
    fireEvent.click(screen.getByTitle('Scaffold AI Integration'));
    fireEvent.click(screen.getByText(/Open in Scaffold AI/));
    await waitFor(() => expect(mockExportToScaffold).toHaveBeenCalledWith(expect.objectContaining({
      review_findings: planWithFindings.review_findings,
      review_summary: '# Summary',
    })));
  });

  it('handles plan without questionnaire', () => {
    const minimalPlan = {
      plan_id: 'plan-2',
      recommended: { name: 'Minimal', pros: [], cons: [] },
      alternatives: [],
    };
    render(<ScaffoldIntegration projectPlan={minimalPlan} />);
    fireEvent.click(screen.getByTitle('Scaffold AI Integration'));
    expect(screen.getByText(/Untitled/)).toBeInTheDocument();
    expect(screen.getByText(/Minimal/)).toBeInTheDocument();
  });

  it('handles plan without stack in recommended', () => {
    const noStackPlan = {
      plan_id: 'plan-3',
      questionnaire: { basics: { name: 'No Stack', description: 'test' } },
      recommended: { name: 'Simple', pros: [], cons: [] },
      alternatives: [],
    };
    render(<ScaffoldIntegration projectPlan={noStackPlan} />);
    fireEvent.click(screen.getByTitle('Scaffold AI Integration'));
    expect(screen.queryByText(/technologies/)).not.toBeInTheDocument();
  });

  it('copies description with N/A stack for plan without stack', async () => {
    const noStackPlan = {
      plan_id: 'plan-3',
      questionnaire: { basics: { name: 'No Stack', description: 'test' } },
      recommended: { name: 'Simple', pros: [], cons: [] },
      alternatives: [],
    };
    render(<ScaffoldIntegration projectPlan={noStackPlan} />);
    fireEvent.click(screen.getByTitle('Scaffold AI Integration'));
    fireEvent.click(screen.getByText('📋 Copy Description'));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('N/A')));
  });

  it('falls back to recommended when selectedOptionIndex is out of bounds', () => {
    const badIndexPlan = {
      ...mockPlan,
      selectedOptionIndex: 99,
    };
    render(<ScaffoldIntegration projectPlan={badIndexPlan} />);
    fireEvent.click(screen.getByTitle('Scaffold AI Integration'));
    expect(screen.getByText(/Serverless/)).toBeInTheDocument();
  });

  it('defaults selectedOptionIndex to 0 when not set', () => {
    const noIndexPlan = { ...mockPlan };
    delete (noIndexPlan as any).selectedOptionIndex;
    render(<ScaffoldIntegration projectPlan={noIndexPlan} />);
    fireEvent.click(screen.getByTitle('Scaffold AI Integration'));
    expect(screen.getByText(/Serverless/)).toBeInTheDocument();
  });
});
