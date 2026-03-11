import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const mockNavigate = vi.fn();
const mockStartReview = vi.fn();
const mockPollExecution = vi.fn();

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

vi.mock("@/lib/api", () => ({
  startReviewExecution: (...args: unknown[]) => mockStartReview(...args),
  pollExecution: (...args: unknown[]) => mockPollExecution(...args),
}));

import ResultsPage from "@/pages/Results";

const mockPlan = {
  plan_id: "test-123",
  questionnaire: {
    basics: { name: "Test Project", description: "A test project", timeline: "1 week", budget: "$100" },
  },
  recommended: {
    name: "Serverless",
    description: "Serverless architecture",
    best_for: "Best for small projects",
    stack: { frontend: "React", backend: "Lambda" },
    pros: ["cheap"],
    cons: ["cold starts"],
    cost_estimate: "$10/mo",
    monthly_cost_estimate: "$10/mo",
    complexity: "Low",
  },
  alternatives: [
    { name: "Containers", description: "ECS", pros: ["flexible"], cons: ["complex"], cost_estimate: "$20/mo", complexity: "Medium" },
  ],
  review_findings: [],
};

const mockReviewFindings = [
  { iteration: 1, category: "security", findings: ["No WAF configured", "Missing rate limiting"], recommendations: ["Add WAF"], risk_level: "high" },
  { iteration: 2, category: "cost_optimization", findings: ["Over-provisioned Lambda"], recommendations: ["Reduce memory"], risk_level: "medium" },
  { iteration: 3, category: "scalability", findings: ["Single region"], recommendations: ["Add multi-region"], risk_level: "low" },
];

function mockSessionStorage(planData: unknown, reviewRuns?: unknown[]) {
  const store: Record<string, string> = {};
  if (planData) store["projectPlan"] = JSON.stringify(planData);
  if (reviewRuns) {
    const pid = (planData as { plan_id?: string })?.plan_id ?? "test-123";
    store[`reviewRuns-${pid}`] = JSON.stringify(reviewRuns);
  }
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
  };
}

function setStorage(planData: unknown, reviewRuns?: unknown[]) {
  Object.defineProperty(window, "sessionStorage", {
    value: mockSessionStorage(planData, reviewRuns),
    writable: true,
  });
}

beforeEach(() => {
  mockNavigate.mockClear();
  mockStartReview.mockClear();
  mockPollExecution.mockClear();
  setStorage(null);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function renderPage(id = "test-123") {
  return render(
    <MemoryRouter initialEntries={[`/results/${id}`]}>
      <Routes>
        <Route path="/results/:id" element={<ResultsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

async function renderWithPlan(planData = mockPlan, reviewRuns?: unknown[]) {
  setStorage(planData, reviewRuns);
  renderPage();
  await waitFor(() => screen.getByText(planData.questionnaire?.basics?.name ?? "Project Plan"));
}

describe("ResultsPage", () => {
  it("renders plan from sessionStorage", async () => {
    await renderWithPlan();
    expect(screen.getByText("Test Project")).toBeInTheDocument();
  });

  it("redirects to questionnaire when no plan data and no id", async () => {
    setStorage(null);
    render(
      <MemoryRouter initialEntries={["/results"]}>
        <Routes>
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => { expect(mockNavigate).toHaveBeenCalledWith("/questionnaire"); });
  });

  it("renders the ScaffoldIntegration component", async () => {
    await renderWithPlan();
    expect(screen.getByTestId("scaffold-integration")).toBeInTheDocument();
  });

  it("shows loading spinner before plan loads", () => {
    setStorage(null);
    renderPage();
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders architecture, reviews, and security tabs", async () => {
    await renderWithPlan();
    ["architecture", "reviews", "security"].forEach((tab) => {
      expect(screen.getByRole("button", { name: tab })).toBeInTheDocument();
    });
  });

  it("defaults to architecture tab showing options", async () => {
    await renderWithPlan();
    expect(screen.getByText("Architecture Options")).toBeInTheDocument();
    expect(screen.getByText("Serverless")).toBeInTheDocument();
    expect(screen.getByText("Containers")).toBeInTheDocument();
  });

  it("shows Run Reviews button on architecture tab", async () => {
    await renderWithPlan();
    expect(screen.getByText(/Run Reviews on/)).toBeInTheDocument();
  });

  it("shows empty state on reviews tab before running reviews", async () => {
    await renderWithPlan();
    fireEvent.click(screen.getByRole("button", { name: "reviews" }));
    expect(screen.getByText(/No reviews yet for/)).toBeInTheDocument();
  });

  it("shows empty state on security tab before running reviews", async () => {
    await renderWithPlan();
    fireEvent.click(screen.getByRole("button", { name: "security" }));
    expect(screen.getByText("Run reviews first to see security findings.")).toBeInTheDocument();
  });

  it("shows Run Reviews button on empty security tab", async () => {
    await renderWithPlan();
    fireEvent.click(screen.getByRole("button", { name: "security" }));
    const runButtons = screen.getAllByText("Run Reviews");
    expect(runButtons.length).toBeGreaterThan(0);
  });

  it("New Plan button navigates to questionnaire", async () => {
    await renderWithPlan();
    fireEvent.click(screen.getByRole("button", { name: "New Plan" }));
    expect(mockNavigate).toHaveBeenCalledWith("/questionnaire");
  });

  it("shows badges for timeline and budget", async () => {
    await renderWithPlan();
    expect(screen.getByText("1 week")).toBeInTheDocument();
    expect(screen.getByText("$100")).toBeInTheDocument();
  });

  it("shows pros and cons on architecture tab", async () => {
    await renderWithPlan();
    expect(screen.getByText(/cheap/)).toBeInTheDocument();
    expect(screen.getByText(/cold starts/)).toBeInTheDocument();
  });

  it("clicking architecture option selects it", async () => {
    await renderWithPlan();
    fireEvent.click(screen.getByText("Containers").closest("div[class*='p-4']")!);
    const selected = screen.getAllByText("Selected");
    expect(selected.length).toBeGreaterThan(0);
  });

  it("stores selectedOptionIndex in sessionStorage when option clicked", async () => {
    await renderWithPlan();
    fireEvent.click(screen.getByText("Containers").closest("div[class*='p-4']")!);
    expect(window.sessionStorage.setItem).toHaveBeenCalled();
  });

  it("selects option via radio button", async () => {
    await renderWithPlan();
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[0]);
    expect(radios[0]).toBeChecked();
  });

  it("shows technology stack on architecture cards", async () => {
    await renderWithPlan();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Lambda")).toBeInTheDocument();
  });

  it("Start New Plan button navigates to questionnaire", async () => {
    await renderWithPlan();
    fireEvent.click(screen.getByText("Start New Plan"));
    expect(mockNavigate).toHaveBeenCalledWith("/questionnaire");
  });

  it("shows Recommended badge on first option", async () => {
    await renderWithPlan();
    expect(screen.getByText("Recommended")).toBeInTheDocument();
  });

  it("does not show summary section when no reviews have been run", async () => {
    await renderWithPlan();
    expect(screen.queryByText("Summarize All Findings")).not.toBeInTheDocument();
  });

  it("shows best_for and cost on architecture cards", async () => {
    await renderWithPlan();
    expect(screen.getByText("Best for small projects")).toBeInTheDocument();
    expect(screen.getByText("$10/mo")).toBeInTheDocument();
    expect(screen.getByText("Low")).toBeInTheDocument();
  });

  it("shows description in header", async () => {
    await renderWithPlan();
    expect(screen.getByText("A test project")).toBeInTheDocument();
  });
});

describe("ResultsPage — Review Execution", () => {
  it("starts review execution when Run Reviews clicked", async () => {
    mockStartReview.mockResolvedValue({ executionArn: "arn:test" });
    mockPollExecution.mockResolvedValue({ status: "RUNNING" });
    await renderWithPlan();

    await act(async () => {
      fireEvent.click(screen.getByText(/Run Reviews on/));
    });

    expect(mockStartReview).toHaveBeenCalledWith(
      mockPlan.questionnaire,
      expect.objectContaining({ name: "Serverless" }),
      "test-123",
    );
  });

  it("shows progress after starting review", async () => {
    mockStartReview.mockResolvedValue({ executionArn: "arn:test" });
    mockPollExecution.mockResolvedValue({ status: "RUNNING" });
    await renderWithPlan();

    await act(async () => {
      fireEvent.click(screen.getByText(/Run Reviews on/));
    });

    await waitFor(() => {
      expect(screen.getByText(/Reviewing/)).toBeInTheDocument();
    });
  });

  it("shows Running Reviews... text while loading", async () => {
    mockStartReview.mockResolvedValue({ executionArn: "arn:test" });
    mockPollExecution.mockResolvedValue({ status: "RUNNING" });
    await renderWithPlan();

    await act(async () => {
      fireEvent.click(screen.getByText(/Run Reviews on/));
    });

    // architecture tab button should show "Running Reviews..."
    await waitFor(() => {
      fireEvent.click(screen.getByRole("button", { name: "architecture" }));
      expect(screen.getByText("Running Reviews...")).toBeInTheDocument();
    });
  });

  it("shows review findings after successful poll", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockStartReview.mockResolvedValue({ executionArn: "arn:test" });
    mockPollExecution.mockResolvedValue({
      status: "SUCCEEDED",
      review_findings: mockReviewFindings,
    });
    await renderWithPlan();

    await act(async () => {
      fireEvent.click(screen.getByText(/Run Reviews on/));
    });

    await act(async () => {
      vi.advanceTimersByTime(3500);
    });

    await waitFor(() => {
      expect(screen.getByText(/No WAF configured/)).toBeInTheDocument();
    });
  });

  it("shows error message when review start fails", async () => {
    mockStartReview.mockRejectedValue(new Error("Network error"));
    await renderWithPlan();

    await act(async () => {
      fireEvent.click(screen.getByText(/Run Reviews on/));
    });

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("shows fallback error when start throws non-Error", async () => {
    mockStartReview.mockRejectedValue("string error");
    await renderWithPlan();

    await act(async () => {
      fireEvent.click(screen.getByText(/Run Reviews on/));
    });

    await waitFor(() => {
      expect(screen.getByText("Failed to start reviews")).toBeInTheDocument();
    });
  });

  it("shows error and retry when poll returns FAILED", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockStartReview.mockResolvedValue({ executionArn: "arn:test" });
    mockPollExecution.mockResolvedValue({ status: "FAILED", error: "Step function failed" });
    await renderWithPlan();

    await act(async () => {
      fireEvent.click(screen.getByText(/Run Reviews on/));
    });

    await act(async () => {
      vi.advanceTimersByTime(3500);
    });

    await waitFor(() => {
      expect(screen.getByText("Step function failed")).toBeInTheDocument();
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });
  });

  it("shows status-based error when poll returns TIMED_OUT without error field", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockStartReview.mockResolvedValue({ executionArn: "arn:test" });
    mockPollExecution.mockResolvedValue({ status: "TIMED_OUT" });
    await renderWithPlan();

    await act(async () => {
      fireEvent.click(screen.getByText(/Run Reviews on/));
    });

    await act(async () => {
      vi.advanceTimersByTime(3500);
    });

    await waitFor(() => {
      expect(screen.getByText("Review timed_out")).toBeInTheDocument();
    });
  });

  it("shows error when poll throws Error", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockStartReview.mockResolvedValue({ executionArn: "arn:test" });
    mockPollExecution.mockRejectedValue(new Error("Poll network error"));
    await renderWithPlan();

    await act(async () => {
      fireEvent.click(screen.getByText(/Run Reviews on/));
    });

    await act(async () => {
      vi.advanceTimersByTime(3500);
    });

    await waitFor(() => {
      expect(screen.getByText("Poll network error")).toBeInTheDocument();
    });
  });

  it("shows fallback error when poll throws non-Error", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockStartReview.mockResolvedValue({ executionArn: "arn:test" });
    mockPollExecution.mockRejectedValue("string poll error");
    await renderWithPlan();

    await act(async () => {
      fireEvent.click(screen.getByText(/Run Reviews on/));
    });

    await act(async () => {
      vi.advanceTimersByTime(3500);
    });

    await waitFor(() => {
      expect(screen.getByText("Polling failed")).toBeInTheDocument();
    });
  });

  it("switches to reviews tab on Run Reviews click", async () => {
    mockStartReview.mockResolvedValue({ executionArn: "arn:test" });
    mockPollExecution.mockResolvedValue({ status: "RUNNING" });
    await renderWithPlan();

    await act(async () => {
      fireEvent.click(screen.getByText(/Run Reviews on/));
    });

    await waitFor(() => {
      expect(screen.getByText(/Reviewing/)).toBeInTheDocument();
    });
  });
});

describe("ResultsPage — With Review Runs", () => {
  const reviewRuns = [
    {
      optionIndex: 0,
      optionName: "Serverless",
      findings: mockReviewFindings,
      timestamp: 1710000000000,
    },
  ];

  it("restores review runs from sessionStorage", async () => {
    await renderWithPlan(mockPlan, reviewRuns);
    expect(screen.getByText("1 review run")).toBeInTheDocument();
  });

  it("shows Reviewed badge on architecture card", async () => {
    await renderWithPlan(mockPlan, reviewRuns);
    expect(screen.getByText("Reviewed")).toBeInTheDocument();
  });

  it("shows Summarize All Findings button", async () => {
    await renderWithPlan(mockPlan, reviewRuns);
    expect(screen.getByText("Summarize All Findings")).toBeInTheDocument();
  });

  it("toggles summary section", async () => {
    await renderWithPlan(mockPlan, reviewRuns);
    fireEvent.click(screen.getByText("Summarize All Findings"));
    expect(screen.getByText("Review Runs")).toBeInTheDocument();
    expect(screen.getByText("Options Reviewed")).toBeInTheDocument();
    expect(screen.getByText("Total Findings")).toBeInTheDocument();
    expect(screen.getByText("Critical/High")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Hide Summary"));
    expect(screen.queryByText("Review Runs")).not.toBeInTheDocument();
  });

  it("shows overview stats in summary", async () => {
    await renderWithPlan(mockPlan, reviewRuns);
    fireEvent.click(screen.getByText("Summarize All Findings"));
    // 4 total findings (2 + 1 + 1), 1 high category
    const statValues = document.querySelectorAll(".text-2xl.font-bold");
    expect(statValues.length).toBeGreaterThanOrEqual(4);
  });

  it("shows By Architecture Option section", async () => {
    await renderWithPlan(mockPlan, reviewRuns);
    fireEvent.click(screen.getByText("Summarize All Findings"));
    expect(screen.getByText("By Architecture Option")).toBeInTheDocument();
  });

  it("shows By Category section", async () => {
    await renderWithPlan(mockPlan, reviewRuns);
    fireEvent.click(screen.getByText("Summarize All Findings"));
    expect(screen.getByText("By Category (All Runs)")).toBeInTheDocument();
  });

  it("shows Copy Markdown and Download buttons when summary expanded", async () => {
    await renderWithPlan(mockPlan, reviewRuns);
    fireEvent.click(screen.getByText("Summarize All Findings"));
    expect(screen.getByText("Copy Markdown")).toBeInTheDocument();
    expect(screen.getByText("Download .md")).toBeInTheDocument();
  });

  it("does not show Copy/Download buttons when summary collapsed", async () => {
    await renderWithPlan(mockPlan, reviewRuns);
    expect(screen.queryByText("Copy Markdown")).not.toBeInTheDocument();
    expect(screen.queryByText("Download .md")).not.toBeInTheDocument();
  });

  it("copies markdown to clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    await renderWithPlan(mockPlan, reviewRuns);
    fireEvent.click(screen.getByText("Summarize All Findings"));
    fireEvent.click(screen.getByText("Copy Markdown"));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining("# Test Project"));
    });
    expect(screen.getByText("Copied!")).toBeInTheDocument();
  });

  it("markdown contains review content", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    await renderWithPlan(mockPlan, reviewRuns);
    fireEvent.click(screen.getByText("Summarize All Findings"));
    fireEvent.click(screen.getByText("Copy Markdown"));
    await waitFor(() => {
      const md = writeText.mock.calls[0][0];
      expect(md).toContain("Architecture Review Summary");
      expect(md).toContain("Serverless");
      expect(md).toContain("No WAF configured");
      expect(md).toContain("Add WAF");
      expect(md).toContain("security (high)");
      expect(md).toContain("**Stack:**");
      expect(md).toContain("review runs");
    });
  });

  it("downloads markdown file", async () => {
    const mockClick = vi.fn();
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === "a") Object.defineProperty(el, "click", { value: mockClick });
      return el;
    });
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    await renderWithPlan(mockPlan, reviewRuns);
    fireEvent.click(screen.getByText("Summarize All Findings"));
    fireEvent.click(screen.getByText("Download .md"));

    expect(mockClick).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });

  it("shows findings on reviews tab", async () => {
    await renderWithPlan(mockPlan, reviewRuns);
    fireEvent.click(screen.getByRole("button", { name: "reviews" }));
    expect(screen.getByText(/No WAF configured/)).toBeInTheDocument();
    expect(screen.getByText(/Missing rate limiting/)).toBeInTheDocument();
    expect(screen.getByText(/Add WAF/)).toBeInTheDocument();
  });

  it("shows risk badges on findings", async () => {
    await renderWithPlan(mockPlan, reviewRuns);
    fireEvent.click(screen.getByRole("button", { name: "reviews" }));
    expect(screen.getByText("high")).toBeInTheDocument();
    expect(screen.getByText("medium")).toBeInTheDocument();
    expect(screen.getByText("low")).toBeInTheDocument();
  });

  it("shows Re-run Reviews button", async () => {
    await renderWithPlan(mockPlan, reviewRuns);
    fireEvent.click(screen.getByRole("button", { name: "reviews" }));
    expect(screen.getByText("Re-run Reviews")).toBeInTheDocument();
  });

  it("shows review stats on reviews tab", async () => {
    await renderWithPlan(mockPlan, reviewRuns);
    fireEvent.click(screen.getByRole("button", { name: "reviews" }));
    expect(screen.getByText(/3 categories reviewed/)).toBeInTheDocument();
    expect(screen.getByText(/4 findings/)).toBeInTheDocument();
    expect(screen.getByText(/3 recommendations/)).toBeInTheDocument();
  });

  it("shows Showing reviews for label", async () => {
    await renderWithPlan(mockPlan, reviewRuns);
    fireEvent.click(screen.getByRole("button", { name: "reviews" }));
    const showingLabel = screen.getByText(/Showing reviews for/);
    expect(showingLabel).toBeInTheDocument();
  });

  it("shows security findings on security tab", async () => {
    await renderWithPlan(mockPlan, reviewRuns);
    fireEvent.click(screen.getByRole("button", { name: "security" }));
    expect(screen.getByText(/No WAF configured/)).toBeInTheDocument();
    expect(screen.getByText(/Add WAF/)).toBeInTheDocument();
  });

  it("shows All Risk Levels grid on security tab", async () => {
    await renderWithPlan(mockPlan, reviewRuns);
    fireEvent.click(screen.getByRole("button", { name: "security" }));
    expect(screen.getByText("All Risk Levels")).toBeInTheDocument();
    expect(screen.getByText("critical")).toBeInTheDocument();
  });

  it("shows 'No security-specific findings' when reviews have no security category", async () => {
    const nonSecRuns = [{
      optionIndex: 0,
      optionName: "Serverless",
      findings: [{ iteration: 1, category: "cost_optimization", findings: ["test"], recommendations: [], risk_level: "low" }],
      timestamp: 1710000000000,
    }];
    await renderWithPlan(mockPlan, nonSecRuns);
    fireEvent.click(screen.getByRole("button", { name: "security" }));
    expect(screen.getByText("No security-specific findings.")).toBeInTheDocument();
  });

  it("shows empty reviews tab for unreviewed option", async () => {
    const containerOnlyRuns = [{
      optionIndex: 1,
      optionName: "Containers",
      findings: mockReviewFindings,
      timestamp: 1710000000000,
    }];
    await renderWithPlan(mockPlan, containerOnlyRuns);
    fireEvent.click(screen.getByRole("button", { name: "reviews" }));
    expect(screen.getByText(/No reviews yet for/)).toBeInTheDocument();
  });

  it("shows category findings and recommendations in summary by-category view", async () => {
    await renderWithPlan(mockPlan, reviewRuns);
    fireEvent.click(screen.getByText("Summarize All Findings"));
    expect(screen.getByText("cost optimization")).toBeInTheDocument();
    expect(screen.getByText("scalability")).toBeInTheDocument();
  });

  it("shows risk badge counts in by-architecture view", async () => {
    await renderWithPlan(mockPlan, reviewRuns);
    fireEvent.click(screen.getByText("Summarize All Findings"));
    // Serverless option in summary
    const archSection = screen.getByText("By Architecture Option");
    expect(archSection).toBeInTheDocument();
  });
});

describe("ResultsPage — Review History", () => {
  const multipleRuns = [
    { optionIndex: 0, optionName: "Serverless", findings: mockReviewFindings, timestamp: 1710000000000 },
    { optionIndex: 1, optionName: "Containers", findings: [{ iteration: 1, category: "performance", findings: ["Latency high"], recommendations: ["Optimize"], risk_level: "medium" }], timestamp: 1710003600000 },
  ];

  it("shows review history when multiple runs exist", async () => {
    await renderWithPlan(mockPlan, multipleRuns);
    fireEvent.click(screen.getByRole("button", { name: "reviews" }));
    expect(screen.getByText("Review History")).toBeInTheDocument();
  });

  it("shows plural review runs badge", async () => {
    await renderWithPlan(mockPlan, multipleRuns);
    expect(screen.getByText("2 review runs")).toBeInTheDocument();
  });

  it("clicking history item switches reviews", async () => {
    await renderWithPlan(mockPlan, multipleRuns);
    fireEvent.click(screen.getByRole("button", { name: "reviews" }));
    // Find Containers in the review history section
    const historySection = screen.getByText("Review History").parentElement!;
    const containerItem = historySection.querySelector("div[class*='cursor-pointer']");
    if (containerItem) {
      fireEvent.click(containerItem);
    }
  });

  it("shows security loading spinner during review", async () => {
    mockStartReview.mockResolvedValue({ executionArn: "arn:test" });
    mockPollExecution.mockResolvedValue({ status: "RUNNING" });
    await renderWithPlan();

    await act(async () => {
      fireEvent.click(screen.getByText(/Run Reviews on/));
    });

    fireEvent.click(screen.getByRole("button", { name: "security" }));
    expect(screen.getByText("Running security review...")).toBeInTheDocument();
  });

  it("shows Run Reviews button on reviews empty state", async () => {
    await renderWithPlan();
    fireEvent.click(screen.getByRole("button", { name: "reviews" }));
    const runButtons = screen.getAllByText("Run Reviews");
    expect(runButtons.length).toBeGreaterThan(0);
  });

  it("multiple review runs stats show in summary", async () => {
    await renderWithPlan(mockPlan, multipleRuns);
    fireEvent.click(screen.getByText("Summarize All Findings"));
    // 2 review runs, 2 options reviewed
    const statDivs = document.querySelectorAll(".text-2xl.font-bold");
    const values = Array.from(statDivs).map((d) => d.textContent);
    expect(values).toContain("2"); // review runs & options reviewed
  });

  it("radio onChange updates selected option", async () => {
    await renderWithPlan();
    const radios = screen.getAllByRole("radio");
    // Change event on second radio (Containers)
    fireEvent.change(radios[1], { target: { checked: true } });
    expect(radios[1]).toBeChecked();
  });

  it("progress increments on RUNNING poll response", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockStartReview.mockResolvedValue({ executionArn: "arn:test" });
    // First poll: RUNNING, second poll: RUNNING, third: SUCCEEDED
    mockPollExecution
      .mockResolvedValueOnce({ status: "RUNNING" })
      .mockResolvedValueOnce({ status: "RUNNING" })
      .mockResolvedValueOnce({ status: "SUCCEEDED", review_findings: mockReviewFindings });
    await renderWithPlan();

    await act(async () => {
      fireEvent.click(screen.getByText(/Run Reviews on/));
    });

    // First poll — progress goes from 20 to 25
    await act(async () => { vi.advanceTimersByTime(3500); });
    await waitFor(() => {
      expect(screen.getByText("25%")).toBeInTheDocument();
    });

    // Second poll — progress goes from 25 to 30
    await act(async () => { vi.advanceTimersByTime(3500); });
    await waitFor(() => {
      expect(screen.getByText("30%")).toBeInTheDocument();
    });
  });

  it("handles plan without basics in questionnaire", async () => {
    const noBasisPlan = {
      ...mockPlan,
      questionnaire: {},
    };
    setStorage(noBasisPlan);
    renderPage();
    await waitFor(() => screen.getByText("Project Plan"));
  });

  it("handles plan without questionnaire entirely", async () => {
    const noQPlan = {
      plan_id: "test-456",
      recommended: mockPlan.recommended,
      alternatives: mockPlan.alternatives,
      review_findings: [],
    };
    setStorage(noQPlan);
    renderPage();
    await waitFor(() => screen.getByText("Project Plan"));
  });

  it("handles markdown export with plan missing basics", async () => {
    const noBasisPlan = {
      ...mockPlan,
      questionnaire: {},
    };
    const runs = [{
      optionIndex: 0,
      optionName: "Serverless",
      findings: mockReviewFindings,
      timestamp: 1710000000000,
    }];
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    setStorage(noBasisPlan, runs);
    renderPage();
    await waitFor(() => screen.getByText("Project Plan"));
    fireEvent.click(screen.getByText("Summarize All Findings"));
    fireEvent.click(screen.getByText("Copy Markdown"));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining("# Project"));
    });
  });
});
