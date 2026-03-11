import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";

const mockNavigate = vi.fn();
const mockStartPlan = vi.fn();
const mockPollExecution = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/lib/api", () => ({
  startPlanExecution: (...args: unknown[]) => mockStartPlan(...args),
  pollExecution: (...args: unknown[]) => mockPollExecution(...args),
}));

vi.mock("@/components/ThemeProvider", () => ({
  ThemeToggle: () => <button>Toggle</button>,
}));

import PlanningPage from "@/pages/Planning";

const mockRequest = {
  basics: { name: "Test", description: "desc", target_users: "users", timeline: "1 week", budget: "$100" },
  technical: { user_count: "100" },
  preferences: {},
  review_count: 3,
};

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  mockNavigate.mockClear();
  mockStartPlan.mockClear();
  mockPollExecution.mockClear();
  Object.defineProperty(window, "sessionStorage", {
    value: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() },
    writable: true,
  });
  // Mock crypto.randomUUID
  vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid-1234' });
});

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

function renderPage() {
  return render(<MemoryRouter><PlanningPage /></MemoryRouter>);
}

describe("PlanningPage", () => {
  it("redirects to questionnaire when no project request in sessionStorage", () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
    renderPage();
    expect(mockNavigate).toHaveBeenCalledWith("/questionnaire");
  });

  it("renders the planning UI when project request exists", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    mockStartPlan.mockResolvedValueOnce({ executionArn: "arn:test" });
    mockPollExecution.mockResolvedValue({ status: "RUNNING" });
    await act(async () => { renderPage(); });
    expect(screen.getByText(/Generating Architecture Options/)).toBeInTheDocument();
  });

  it("starts SFN execution with generateOnly flag on mount", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    mockStartPlan.mockResolvedValueOnce({ executionArn: "arn:test" });
    mockPollExecution.mockResolvedValue({ status: "RUNNING" });
    await act(async () => { renderPage(); });
    expect(mockStartPlan).toHaveBeenCalledWith(mockRequest, "test-uuid-1234", { generateOnly: true });
  });

  it("shows error when SFN start fails", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    mockStartPlan.mockRejectedValueOnce(new Error("Access denied"));
    await act(async () => { renderPage(); });
    await waitFor(() => { expect(screen.getByText("Access denied")).toBeInTheDocument(); });
    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });

  it("navigates to results on SUCCEEDED poll", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    mockStartPlan.mockResolvedValueOnce({ executionArn: "arn:test" });
    mockPollExecution.mockResolvedValueOnce({
      status: "SUCCEEDED",
      plan_id: "p1",
      recommended: { name: "Stack A" },
      alternatives: [],
      review_findings: [],
    });
    await act(async () => { renderPage(); });
    // Advance past poll interval
    await act(async () => { vi.advanceTimersByTime(4000); });
    await waitFor(() => { expect(screen.getByText("Options ready!")).toBeInTheDocument(); });
  });

  it("shows error on FAILED poll", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    mockStartPlan.mockResolvedValueOnce({ executionArn: "arn:test" });
    mockPollExecution.mockResolvedValueOnce({ status: "FAILED", error: "Lambda timeout" });
    await act(async () => { renderPage(); });
    await act(async () => { vi.advanceTimersByTime(4000); });
    await waitFor(() => { expect(screen.getByText("Lambda timeout")).toBeInTheDocument(); });
  });

  it("Try Again navigates to questionnaire", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    mockStartPlan.mockRejectedValueOnce(new Error("fail"));
    await act(async () => { renderPage(); });
    await waitFor(() => screen.getByText("Try Again"));
    fireEvent.click(screen.getByText("Try Again"));
    expect(mockNavigate).toHaveBeenCalledWith("/questionnaire");
  });

  it("shows progress milestones", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    mockStartPlan.mockResolvedValueOnce({ executionArn: "arn:test" });
    mockPollExecution.mockResolvedValue({ status: "RUNNING" });
    await act(async () => { renderPage(); });
    expect(screen.getByText("Starting execution")).toBeInTheDocument();
    expect(screen.getByText("Analyzing requirements")).toBeInTheDocument();
    expect(screen.getByText("Generating architecture options")).toBeInTheDocument();
  });

  it("increments progress on RUNNING poll", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    mockStartPlan.mockResolvedValueOnce({ executionArn: "arn:test" });
    mockPollExecution.mockResolvedValue({ status: "RUNNING" });
    await act(async () => { renderPage(); });
    await act(async () => { vi.advanceTimersByTime(4000); });
    expect(screen.getByText(/AI is generating architecture options/)).toBeInTheDocument();
  });

  it("shows error when polling fails", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    mockStartPlan.mockResolvedValueOnce({ executionArn: "arn:test" });
    mockPollExecution.mockRejectedValueOnce(new Error("Network error"));
    await act(async () => { renderPage(); });
    await act(async () => { vi.advanceTimersByTime(4000); });
    await waitFor(() => { expect(screen.getByText("Network error")).toBeInTheDocument(); });
  });

  it("stores plan data with empty review_findings in sessionStorage on SUCCEEDED", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    mockStartPlan.mockResolvedValueOnce({ executionArn: "arn:test" });
    mockPollExecution.mockResolvedValueOnce({
      status: "SUCCEEDED",
      plan_id: "p1",
      recommended: { name: "Stack A" },
      alternatives: [],
      review_findings: [],
    });
    await act(async () => { renderPage(); });
    await act(async () => { vi.advanceTimersByTime(4000); });
    await waitFor(() => { expect(window.sessionStorage.setItem).toHaveBeenCalledWith("projectPlan", expect.any(String)); });
    const storedCall = (window.sessionStorage.setItem as ReturnType<typeof vi.fn>).mock.calls.find(
      (c: string[]) => c[0] === "projectPlan"
    );
    const stored = JSON.parse(storedCall[1]);
    expect(stored.review_findings).toEqual([]);
  });

  it("handles ABORTED status", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    mockStartPlan.mockResolvedValueOnce({ executionArn: "arn:test" });
    mockPollExecution.mockResolvedValueOnce({ status: "ABORTED" });
    await act(async () => { renderPage(); });
    await act(async () => { vi.advanceTimersByTime(4000); });
    await waitFor(() => { expect(screen.getByText("Execution aborted")).toBeInTheDocument(); });
  });

  it("handles TIMED_OUT status", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    mockStartPlan.mockResolvedValueOnce({ executionArn: "arn:test" });
    mockPollExecution.mockResolvedValueOnce({ status: "TIMED_OUT" });
    await act(async () => { renderPage(); });
    await act(async () => { vi.advanceTimersByTime(4000); });
    await waitFor(() => { expect(screen.getByText("Execution timed_out")).toBeInTheDocument(); });
  });

  it("includes questionnaire in plan data on SUCCEEDED", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    mockStartPlan.mockResolvedValueOnce({ executionArn: "arn:test" });
    mockPollExecution.mockResolvedValueOnce({
      status: "SUCCEEDED",
      plan_id: "p2",
      recommended: { name: "Stack B" },
      alternatives: [{ name: "Stack C" }],
      review_findings: [],
    });
    await act(async () => { renderPage(); });
    await act(async () => { vi.advanceTimersByTime(4000); });
    await waitFor(() => { expect(window.sessionStorage.setItem).toHaveBeenCalledWith("projectPlan", expect.any(String)); });
    const storedCall = (window.sessionStorage.setItem as ReturnType<typeof vi.fn>).mock.calls.find(
      (c: string[]) => c[0] === "projectPlan"
    );
    const stored = JSON.parse(storedCall[1]);
    expect(stored.questionnaire).toBeDefined();
    expect(stored.questionnaire.basics.name).toBe("Test");
  });

  it("handles non-Error exception in start", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    mockStartPlan.mockRejectedValueOnce("string error");
    await act(async () => { renderPage(); });
    await waitFor(() => { expect(screen.getByText("Failed to start plan generation")).toBeInTheDocument(); });
  });

  it("handles non-Error exception in polling", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    mockStartPlan.mockResolvedValueOnce({ executionArn: "arn:test" });
    mockPollExecution.mockRejectedValueOnce("string poll error");
    await act(async () => { renderPage(); });
    await act(async () => { vi.advanceTimersByTime(4000); });
    await waitFor(() => { expect(screen.getByText("Polling failed")).toBeInTheDocument(); });
  });

  it("handles FAILED with custom error message", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockRequest));
    mockStartPlan.mockResolvedValueOnce({ executionArn: "arn:test" });
    mockPollExecution.mockResolvedValueOnce({ status: "FAILED", error: "Custom error" });
    await act(async () => { renderPage(); });
    await act(async () => { vi.advanceTimersByTime(4000); });
    await waitFor(() => { expect(screen.getByText("Custom error")).toBeInTheDocument(); });
  });
});
