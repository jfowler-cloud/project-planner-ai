import { render, screen, waitFor, act } from "@testing-library/react";
import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/components/ScaffoldIntegration", () => ({
  default: () => <div data-testid="scaffold-integration" />,
}));

vi.mock("@/components/ThemeProvider", () => ({
  ThemeToggle: () => <button>Toggle</button>,
}));

global.fetch = vi.fn() as any;

const { TextDecoder, TextEncoder } = await import("util");
global.TextDecoder = TextDecoder as any;
global.TextEncoder = TextEncoder as any;

import PlanningPage from "@/pages/Planning";

const mockRequest = {
  basics: { name: "Test", description: "desc", target_users: "users", timeline: "1 week", budget: "$100" },
  technical: { user_count: "100", uptime: "99%", data_sensitivity: "Internal", authentication: true, compliance: [] },
  preferences: {},
  review_count: 3,
};

function mockSSEStream(events: object[]) {
  const lines = events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("");
  const encoder = new TextEncoder();
  const body = {
    getReader: () => ({
      read: vi.fn()
        .mockResolvedValueOnce({ done: false, value: encoder.encode(lines) })
        .mockResolvedValueOnce({ done: true, value: undefined }),
      releaseLock: vi.fn(),
    }),
  };
  return { ok: true, body };
}

beforeEach(() => {
  mockNavigate.mockClear();
  (global.fetch as ReturnType<typeof vi.fn>).mockClear();
  Object.defineProperty(window, "sessionStorage", {
    value: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() },
    writable: true,
  });
});

afterEach(() => { vi.useRealTimers(); });

function renderPage() {
  return render(<MemoryRouter><PlanningPage /></MemoryRouter>);
}

describe("PlanningPage", () => {
  it("redirects to questionnaire when no project request in sessionStorage", () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(mockNavigate).toHaveBeenCalledWith("/questionnaire");
  });

  it("renders the planning UI when project request exists", () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText(/AI Planning in Progress/)).toBeInTheDocument();
  });

  it("renders the progress bar", () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("renders the ScaffoldIntegration component", () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByTestId("scaffold-integration")).toBeInTheDocument();
  });

  it("SSE: updates status to Analyzing on analyzing event", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hour_remaining: 5 }) })
      .mockResolvedValueOnce(mockSSEStream([{ status: "analyzing", progress: 10 }]));
    await act(async () => { renderPage(); });
    await waitFor(() => { expect(screen.getByText("Analyzing requirements...")).toBeInTheDocument(); });
  });

  it("SSE: shows architecture options on options_generated event", async () => {
    const opts = [{ name: "Serverless", description: "Lambda-based" }];
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hour_remaining: 5 }) })
      .mockResolvedValueOnce(mockSSEStream([{ status: "options_generated", progress: 40, options: opts }]));
    await act(async () => { renderPage(); });
    await waitFor(() => { expect(screen.getByText("Serverless")).toBeInTheDocument(); });
  });

  it("SSE: shows error message when error field is present", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hour_remaining: 5 }) })
      .mockResolvedValueOnce(mockSSEStream([{ status: "error", progress: 0, error: "Rate limit exceeded" }]));
    await act(async () => { renderPage(); });
    await waitFor(() => { expect(screen.getByText("Rate limit exceeded")).toBeInTheDocument(); });
  });

  it("SSE: stores plan in sessionStorage on completed event", async () => {
    const plan = { project_id: "abc-123" };
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hour_remaining: 5 }) })
      .mockResolvedValueOnce(mockSSEStream([{ status: "completed", progress: 100, plan }]));
    await act(async () => { renderPage(); });
    await waitFor(() => { expect(window.sessionStorage.setItem).toHaveBeenCalled(); });
  });
});
