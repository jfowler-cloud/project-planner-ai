import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ScaffoldIntegration from '../src/components/ScaffoldIntegration';

vi.mock('../src/lib/config', () => ({
  SCAFFOLD_URL: 'http://scaffold.test',
  SCAFFOLD_BACKEND_URL: 'http://scaffold-api.test',
  scaffold: { url: 'http://scaffold.test', backendUrl: 'http://scaffold-api.test' },
  app: { plansTable: 'test-table', workflowArn: '' },
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
    expect(screen.queryByText(/Coming Soon/)).toBeInTheDocument();
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

  it('shows Coming Soon button', () => {
    render(<ScaffoldIntegration />);
    fireEvent.click(screen.getByTitle('Scaffold AI Integration'));
    expect(screen.getByText(/Coming Soon/)).toBeInTheDocument();
  });

  it('shows roadmap alert when Coming Soon button clicked', () => {
    render(<ScaffoldIntegration projectPlan={mockPlan} />);
    fireEvent.click(screen.getByTitle('Scaffold AI Integration'));
    fireEvent.click(screen.getByText(/Coming Soon/));
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('roadmap'));
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
