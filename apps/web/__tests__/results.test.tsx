import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi, beforeEach, describe, it, expect } from "vitest";
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

function mockSessionStorage(planData: unknown) {
  const store: Record<string, string> = {};
  if (planData) store["projectPlan"] = JSON.stringify(planData);
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
  };
}

beforeEach(() => {
  mockNavigate.mockClear();
  mockStartReview.mockClear();
  mockPollExecution.mockClear();
  Object.defineProperty(window, "sessionStorage", {
    value: mockSessionStorage(null),
    writable: true,
  });
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

describe("ResultsPage", () => {
  it("renders plan from sessionStorage", async () => {
    Object.defineProperty(window, "sessionStorage", { value: mockSessionStorage(mockPlan), writable: true });
    renderPage();
    await waitFor(() => { expect(screen.getByText("Test Project")).toBeInTheDocument(); });
  });

  it("redirects to questionnaire when no plan data and no id", async () => {
    Object.defineProperty(window, "sessionStorage", { value: mockSessionStorage(null), writable: true });
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
    Object.defineProperty(window, "sessionStorage", { value: mockSessionStorage(mockPlan), writable: true });
    renderPage();
    await waitFor(() => { expect(screen.getByTestId("scaffold-integration")).toBeInTheDocument(); });
  });

  it("shows loading spinner before plan loads", () => {
    Object.defineProperty(window, "sessionStorage", { value: mockSessionStorage(null), writable: true });
    renderPage();
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders architecture, reviews, and security tabs", async () => {
    Object.defineProperty(window, "sessionStorage", { value: mockSessionStorage(mockPlan), writable: true });
    renderPage();
    await waitFor(() => { expect(screen.getByText("Test Project")).toBeInTheDocument(); });
    ["architecture", "reviews", "security"].forEach((tab) => {
      expect(screen.getByRole("button", { name: tab })).toBeInTheDocument();
    });
  });

  it("defaults to architecture tab showing options", async () => {
    Object.defineProperty(window, "sessionStorage", { value: mockSessionStorage(mockPlan), writable: true });
    renderPage();
    await waitFor(() => { expect(screen.getByText("Architecture Options")).toBeInTheDocument(); });
    expect(screen.getByText("Serverless")).toBeInTheDocument();
    expect(screen.getByText("Containers")).toBeInTheDocument();
  });

  it("shows Run Reviews button on architecture tab", async () => {
    Object.defineProperty(window, "sessionStorage", { value: mockSessionStorage(mockPlan), writable: true });
    renderPage();
    await waitFor(() => { expect(screen.getByText("Test Project")).toBeInTheDocument(); });
    expect(screen.getByText(/Run Reviews on/)).toBeInTheDocument();
  });

  it("shows empty state on reviews tab before running reviews", async () => {
    Object.defineProperty(window, "sessionStorage", { value: mockSessionStorage(mockPlan), writable: true });
    renderPage();
    await waitFor(() => { expect(screen.getByText("Test Project")).toBeInTheDocument(); });
    fireEvent.click(screen.getByRole("button", { name: "reviews" }));
    expect(screen.getByText(/No reviews yet for/)).toBeInTheDocument();
  });

  it("shows empty state on security tab before running reviews", async () => {
    Object.defineProperty(window, "sessionStorage", { value: mockSessionStorage(mockPlan), writable: true });
    renderPage();
    await waitFor(() => { expect(screen.getByText("Test Project")).toBeInTheDocument(); });
    fireEvent.click(screen.getByRole("button", { name: "security" }));
    expect(screen.getByText("Run reviews first to see security findings.")).toBeInTheDocument();
  });

  it("New Plan button navigates to questionnaire", async () => {
    Object.defineProperty(window, "sessionStorage", { value: mockSessionStorage(mockPlan), writable: true });
    renderPage();
    await waitFor(() => { expect(screen.getByText("Test Project")).toBeInTheDocument(); });
    fireEvent.click(screen.getByRole("button", { name: "New Plan" }));
    expect(mockNavigate).toHaveBeenCalledWith("/questionnaire");
  });

  it("shows badges for timeline and budget", async () => {
    Object.defineProperty(window, "sessionStorage", { value: mockSessionStorage(mockPlan), writable: true });
    renderPage();
    await waitFor(() => screen.getByText("Test Project"));
    expect(screen.getByText("1 week")).toBeInTheDocument();
    expect(screen.getByText("$100")).toBeInTheDocument();
  });

  it("shows pros and cons on architecture tab", async () => {
    Object.defineProperty(window, "sessionStorage", { value: mockSessionStorage(mockPlan), writable: true });
    renderPage();
    await waitFor(() => screen.getByText("Test Project"));
    expect(screen.getByText(/cheap/)).toBeInTheDocument();
    expect(screen.getByText(/cold starts/)).toBeInTheDocument();
  });

  it("clicking architecture option selects it", async () => {
    Object.defineProperty(window, "sessionStorage", { value: mockSessionStorage(mockPlan), writable: true });
    renderPage();
    await waitFor(() => { expect(screen.getByText("Containers")).toBeInTheDocument(); });
    fireEvent.click(screen.getByText("Containers").closest("div[class*='p-4']")!);
    // "Selected" badge should move to Containers
    const selected = screen.getAllByText("Selected");
    expect(selected.length).toBeGreaterThan(0);
  });

  it("stores selectedOptionIndex in sessionStorage when option clicked", async () => {
    Object.defineProperty(window, "sessionStorage", { value: mockSessionStorage(mockPlan), writable: true });
    renderPage();
    await waitFor(() => screen.getByText("Test Project"));
    await waitFor(() => screen.getByText("Containers"));
    fireEvent.click(screen.getByText("Containers").closest("div[class*='p-4']")!);
    expect(window.sessionStorage.setItem).toHaveBeenCalled();
  });

  it("selects option via radio button", async () => {
    Object.defineProperty(window, "sessionStorage", { value: mockSessionStorage(mockPlan), writable: true });
    renderPage();
    await waitFor(() => screen.getByText("Test Project"));
    await waitFor(() => screen.getByText("Serverless"));
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[0]);
    expect(radios[0]).toBeChecked();
  });

  it("shows technology stack on architecture cards", async () => {
    Object.defineProperty(window, "sessionStorage", { value: mockSessionStorage(mockPlan), writable: true });
    renderPage();
    await waitFor(() => screen.getByText("Test Project"));
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Lambda")).toBeInTheDocument();
  });

  it("Start New Plan button navigates to questionnaire", async () => {
    Object.defineProperty(window, "sessionStorage", { value: mockSessionStorage(mockPlan), writable: true });
    renderPage();
    await waitFor(() => screen.getByText("Test Project"));
    fireEvent.click(screen.getByText("Start New Plan"));
    expect(mockNavigate).toHaveBeenCalledWith("/questionnaire");
  });

  it("shows Recommended badge on first option", async () => {
    Object.defineProperty(window, "sessionStorage", { value: mockSessionStorage(mockPlan), writable: true });
    renderPage();
    await waitFor(() => screen.getByText("Test Project"));
    expect(screen.getByText("Recommended")).toBeInTheDocument();
  });

  it("does not show summary section when no reviews have been run", async () => {
    Object.defineProperty(window, "sessionStorage", { value: mockSessionStorage(mockPlan), writable: true });
    renderPage();
    await waitFor(() => screen.getByText("Test Project"));
    expect(screen.queryByText("Summarize All Findings")).not.toBeInTheDocument();
  });
});
