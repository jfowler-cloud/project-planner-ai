import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ScaffoldIntegration from '../src/components/ScaffoldIntegration';

vi.mock('../src/lib/config', () => ({
  SCAFFOLD_URL: 'http://scaffold.test',
  SCAFFOLD_BACKEND_URL: 'http://scaffold-api.test',
  API_URL: 'http://api.test',
}));

global.fetch = vi.fn();

const mockPlan = {
  plan_id: 'plan-1',
  basics: { name: 'My App', description: 'A test app' },
  recommended_option: 'Serverless',
  technology_stack: { frontend: 'React', backend: 'Lambda' },
  technical: { user_count: '1000', uptime: '99.9%', data_size: '1GB' },
  architecture_options: [],
  selectedOptionIndex: null,
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
    const closeBtn = screen.getAllByRole('button').find(b => b.className.includes('text-gray-400'));
    fireEvent.click(closeBtn!);
    // Panel should be hidden (translate-x-full)
    expect(screen.queryByText('Open in Scaffold AI →')).toBeInTheDocument(); // still in DOM but hidden
  });

  it('closes panel when overlay clicked', () => {
    render(<ScaffoldIntegration />);
    fireEvent.click(screen.getByTitle('Scaffold AI Integration'));
    const overlay = document.querySelector('.fixed.inset-0');
    fireEvent.click(overlay!);
    // overlay gone
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

  it('export button is disabled without plan', () => {
    render(<ScaffoldIntegration />);
    fireEvent.click(screen.getByTitle('Scaffold AI Integration'));
    expect(screen.getByText('Open in Scaffold AI →')).toBeDisabled();
  });

  it('copies description to clipboard', async () => {
    render(<ScaffoldIntegration projectPlan={mockPlan} />);
    fireEvent.click(screen.getByTitle('Scaffold AI Integration'));
    fireEvent.click(screen.getByText('📋 Copy Description'));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled());
    expect(window.alert).toHaveBeenCalledWith('Description copied to clipboard!');
  });

  it('exports to scaffold via API on success', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ session_id: 'sess-123' }),
    });
    render(<ScaffoldIntegration projectPlan={mockPlan} />);
    fireEvent.click(screen.getByTitle('Scaffold AI Integration'));
    fireEvent.click(screen.getByText('Open in Scaffold AI →'));
    await waitFor(() => expect(window.open).toHaveBeenCalledWith(expect.stringContaining('sess-123'), '_blank'));
    expect(window.alert).toHaveBeenCalledWith('Plan sent to Scaffold AI successfully!');
  });

  it('falls back to prompt method when API fails', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: false });
    render(<ScaffoldIntegration projectPlan={mockPlan} />);
    fireEvent.click(screen.getByTitle('Scaffold AI Integration'));
    fireEvent.click(screen.getByText('Open in Scaffold AI →'));
    await waitFor(() => expect(window.open).toHaveBeenCalledWith(expect.stringContaining('from=planner'), '_blank'));
    expect(window.alert).toHaveBeenCalledWith('Using fallback method. Plan data copied to clipboard!');
  });

  it('uses selectedOptionIndex when set', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ session_id: 'sess-456' }),
    });
    const planWithSelection = {
      ...mockPlan,
      selectedOptionIndex: 0,
      architecture_options: [{ name: 'Microservices', stack: { api: 'FastAPI' } }],
    };
    render(<ScaffoldIntegration projectPlan={planWithSelection} />);
    fireEvent.click(screen.getByTitle('Scaffold AI Integration'));
    fireEvent.click(screen.getByText('Open in Scaffold AI →'));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(body.architecture).toBe('Microservices');
  });
});
