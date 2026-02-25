import { render, screen, waitFor, act } from "@testing-library/react";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/components/ScaffoldIntegration", () => ({
  __esModule: true,
  default: () => <div data-testid="scaffold-integration" />,
}));

jest.mock("@/components/ThemeProvider", () => ({
  ThemeToggle: () => <button>Toggle</button>,
}));

global.fetch = jest.fn();

// Polyfill TextDecoder/TextEncoder for jsdom
const { TextDecoder, TextEncoder } = require("util");
global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

import PlanningPage from "@/app/planning/page";

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
      read: jest.fn()
        .mockResolvedValueOnce({ done: false, value: encoder.encode(lines) })
        .mockResolvedValueOnce({ done: true, value: undefined }),
      releaseLock: jest.fn(),
    }),
  };
  return { ok: true, body };
}

beforeEach(() => {
  mockPush.mockClear();
  (global.fetch as jest.Mock).mockClear();
  Object.defineProperty(window, "sessionStorage", {
    value: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn(), clear: jest.fn() },
    writable: true,
  });
});

describe("PlanningPage", () => {
  it("redirects to questionnaire when no project request in sessionStorage", () => {
    (window.sessionStorage.getItem as jest.Mock).mockReturnValue(null);
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<PlanningPage />);
    expect(mockPush).toHaveBeenCalledWith("/questionnaire");
  });

  it("renders the planning UI when project request exists", () => {
    (window.sessionStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<PlanningPage />);
    expect(screen.getByText(/AI Planning in Progress/)).toBeInTheDocument();
  });

  it("renders the progress bar", () => {
    (window.sessionStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<PlanningPage />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("renders the ScaffoldIntegration component", () => {
    (window.sessionStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<PlanningPage />);
    expect(screen.getByTestId("scaffold-integration")).toBeInTheDocument();
  });

  it("SSE: updates status to Analyzing on analyzing event", async () => {
    (window.sessionStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hour_remaining: 5 }) })
      .mockResolvedValueOnce(mockSSEStream([{ status: "analyzing", progress: 10 }]));

    await act(async () => { render(<PlanningPage />); });
    await waitFor(() => {
      expect(screen.getByText("Analyzing requirements...")).toBeInTheDocument();
    });
  });

  it("SSE: shows architecture options on options_generated event", async () => {
    const opts = [{ name: "Serverless", description: "Lambda-based" }];
    (window.sessionStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hour_remaining: 5 }) })
      .mockResolvedValueOnce(mockSSEStream([{ status: "options_generated", progress: 40, options: opts }]));

    await act(async () => { render(<PlanningPage />); });
    await waitFor(() => {
      expect(screen.getByText("Serverless")).toBeInTheDocument();
    });
  });

  it("SSE: shows error message when error field is present", async () => {
    (window.sessionStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hour_remaining: 5 }) })
      .mockResolvedValueOnce(mockSSEStream([{ status: "error", progress: 0, error: "Rate limit exceeded" }]));

    await act(async () => { render(<PlanningPage />); });
    await waitFor(() => {
      expect(screen.getByText("Rate limit exceeded")).toBeInTheDocument();
    });
  });

  it("SSE: navigates to results on completed event", async () => {
    const plan = { project_id: "abc-123" };
    (window.sessionStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ hour_remaining: 5 }) })
      .mockResolvedValueOnce(mockSSEStream([{ status: "completed", progress: 100, plan }]));

    jest.useFakeTimers();
    await act(async () => { render(<PlanningPage />); });
    await waitFor(() => {
      expect(window.sessionStorage.setItem).toHaveBeenCalled();
    });
    act(() => { jest.runAllTimers(); });
    expect(mockPush).toHaveBeenCalledWith("/results/abc-123");
    jest.useRealTimers();
  });
});
