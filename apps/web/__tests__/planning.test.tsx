import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
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

  it("SSE: shows Try Again button on fetch error", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hour_remaining: 5 }) })
      .mockRejectedValueOnce(new Error("Connection error. Please try again."));
    await act(async () => { renderPage(); });
    await waitFor(() => { expect(screen.getByText("Try Again")).toBeInTheDocument(); });
  });

  it("SSE: clicking option selects it", async () => {
    const opts = [
      { name: "Serverless", description: "Lambda-based" },
      { name: "Containers", description: "ECS-based" },
    ];
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hour_remaining: 5 }) })
      .mockResolvedValueOnce(mockSSEStream([{ status: "options_generated", progress: 40, options: opts }]));
    await act(async () => { renderPage(); });
    await waitFor(() => { expect(screen.getByText("Containers")).toBeInTheDocument(); });
    act(() => { screen.getByText("Containers").closest("div[class*='p-3']")?.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
  });
});

describe("PlanningPage - additional coverage", () => {
  it("SSE: shows rate limit stats", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hour_remaining: 3 }) })
      .mockReturnValueOnce(new Promise(() => {}));
    await act(async () => { renderPage(); });
    await waitFor(() => { expect(screen.getByText(/3 plans remaining this hour/)).toBeInTheDocument(); });
  });

  it("SSE: shows generating_options status", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hour_remaining: 5 }) })
      .mockResolvedValueOnce(mockSSEStream([{ status: "generating_options", progress: 25 }]));
    await act(async () => { renderPage(); });
    await waitFor(() => { expect(screen.getByText("Generating architecture options...")).toBeInTheDocument(); });
  });

  it("SSE: shows reviewing status with iteration", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hour_remaining: 5 }) })
      .mockResolvedValueOnce(mockSSEStream([{ status: "reviewing", progress: 60, iteration: 2, total: 3 }]));
    await act(async () => { renderPage(); });
    await waitFor(() => { expect(screen.getByText(/Performing critical review 2\/3/)).toBeInTheDocument(); });
  });

  it("SSE: shows finalizing status", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hour_remaining: 5 }) })
      .mockResolvedValueOnce(mockSSEStream([{ status: "finalizing", progress: 90 }]));
    await act(async () => { renderPage(); });
    await waitFor(() => { expect(screen.getByText("Finalizing recommendation...")).toBeInTheDocument(); });
  });

  it("SSE: handles cached plan", async () => {
    const plan = { project_id: "cached-123" };
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hour_remaining: 5 }) })
      .mockResolvedValueOnce(mockSSEStream([{ status: "cached", progress: 100, plan }]));
    await act(async () => { renderPage(); });
    await waitFor(() => { expect(screen.getByText("Found cached plan!")).toBeInTheDocument(); });
    await waitFor(() => { expect(window.sessionStorage.setItem).toHaveBeenCalled(); }, { timeout: 2000 });
  });

  it("SSE: handles HTTP error response", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hour_remaining: 5 }) })
      .mockResolvedValueOnce({ ok: false, status: 429 });
    await act(async () => { renderPage(); });
    await waitFor(() => { expect(screen.getByText("Try Again")).toBeInTheDocument(); });
  });

  it("shows progress checkmarks for completed steps", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hour_remaining: 5 }) })
      .mockResolvedValueOnce(mockSSEStream([{ status: "analyzing", progress: 50 }]));
    await act(async () => { renderPage(); });
    await waitFor(() => { expect(screen.getByText("50%")).toBeInTheDocument(); });
  });

  it("Try Again navigates to questionnaire", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hour_remaining: 5 }) })
      .mockRejectedValueOnce(new Error("fail"));
    await act(async () => { renderPage(); });
    await waitFor(() => screen.getByText("Try Again"));
    fireEvent.click(screen.getByText("Try Again"));
    expect(mockNavigate).toHaveBeenCalledWith("/questionnaire");
  });

  it("SSE: clicking option radio selects it", async () => {
    const opts = [
      { name: "Serverless", description: "Lambda-based" },
      { name: "Containers", description: "ECS-based" },
    ];
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hour_remaining: 5 }) })
      .mockResolvedValueOnce(mockSSEStream([{ status: "options_generated", progress: 40, options: opts }]));
    await act(async () => { renderPage(); });
    await waitFor(() => { expect(screen.getByText("Containers")).toBeInTheDocument(); });
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[1]);
    expect(screen.getByText("✓ Selection saved")).toBeInTheDocument();
  });

  it("SSE: clicking option div selects it", async () => {
    const opts = [{ name: "Monolith", description: "EC2-based" }];
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hour_remaining: 5 }) })
      .mockResolvedValueOnce(mockSSEStream([{ status: "options_generated", progress: 40, options: opts }]));
    await act(async () => { renderPage(); });
    await waitFor(() => { expect(screen.getByText("Monolith")).toBeInTheDocument(); });
    fireEvent.click(screen.getByText("Monolith").closest("div[class*='p-3']")!);
    expect(screen.getByText("✓ Selection saved")).toBeInTheDocument();
  });

  it("SSE: finalizing with no options does not auto-select", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hour_remaining: 5 }) })
      .mockResolvedValueOnce(mockSSEStream([{ status: "finalizing", progress: 90 }]));
    await act(async () => { renderPage(); });
    await waitFor(() => { expect(screen.getByText("Finalizing recommendation...")).toBeInTheDocument(); });
    // No options rendered, so no "Selection saved" text
    expect(screen.queryByText("✓ Selection saved")).not.toBeInTheDocument();
  });

  it("SSE: rate limit stats fetch failure is silent", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error("rate limit fetch fail"))
      .mockReturnValueOnce(new Promise(() => {}));
    await act(async () => { renderPage(); });
    expect(screen.getByText(/AI Planning in Progress/)).toBeInTheDocument();
  });

  it("SSE: shows singular 'plan' for 1 remaining", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hour_remaining: 1 }) })
      .mockReturnValueOnce(new Promise(() => {}));
    await act(async () => { renderPage(); });
    await waitFor(() => { expect(screen.getByText(/1 plan remaining this hour/)).toBeInTheDocument(); });
  });
});
