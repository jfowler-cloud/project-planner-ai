import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi, beforeEach, describe, it, expect } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

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
  review_findings: [
    { iteration: 1, category: "security", findings: ["Enable encryption"], recommendations: ["Use KMS"], risk_level: "high" },
    { iteration: 1, category: "cost", findings: ["Budget is tight"], recommendations: ["Use reserved instances"], risk_level: "medium" },
  ],
};

beforeEach(() => {
  mockNavigate.mockClear();
  Object.defineProperty(window, "sessionStorage", {
    value: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() },
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
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    renderPage();
    await waitFor(() => { expect(screen.getByText("Test Project")).toBeInTheDocument(); });
  });

  it("redirects to questionnaire when no plan data and no id", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
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
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    renderPage();
    await waitFor(() => { expect(screen.getByTestId("scaffold-integration")).toBeInTheDocument(); });
  });

  it("shows loading spinner before plan loads", () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
    renderPage();
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders all tabs", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    renderPage();
    await waitFor(() => { expect(screen.getByText("Test Project")).toBeInTheDocument(); });
    ["overview", "architecture", "reviews", "security"].forEach((tab) => {
      expect(screen.getByRole("button", { name: tab })).toBeInTheDocument();
    });
  });

  it("switches to architecture tab on click", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    renderPage();
    await waitFor(() => { expect(screen.getByText("Test Project")).toBeInTheDocument(); });
    fireEvent.click(screen.getByRole("button", { name: "architecture" }));
    expect(screen.getByText("Architecture Options")).toBeInTheDocument();
  });

  it("switches to reviews tab on click", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    renderPage();
    await waitFor(() => { expect(screen.getByText("Test Project")).toBeInTheDocument(); });
    fireEvent.click(screen.getByRole("button", { name: "reviews" }));
    expect(screen.getByText("Critical Review Findings")).toBeInTheDocument();
  });

  it("renders recommended option in overview", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    renderPage();
    await waitFor(() => { expect(screen.getByText("Serverless")).toBeInTheDocument(); });
    expect(screen.getByText("Best for small projects")).toBeInTheDocument();
  });

  it("New Plan button navigates to questionnaire", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    renderPage();
    await waitFor(() => { expect(screen.getByText("Test Project")).toBeInTheDocument(); });
    fireEvent.click(screen.getByRole("button", { name: "New Plan" }));
    expect(mockNavigate).toHaveBeenCalledWith("/questionnaire");
  });

  it("switches to security tab and shows security findings", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    renderPage();
    await waitFor(() => { expect(screen.getByText("Test Project")).toBeInTheDocument(); });
    fireEvent.click(screen.getByRole("button", { name: "security" }));
    expect(screen.getByText("Security Review")).toBeInTheDocument();
    expect(screen.getByText("Enable encryption")).toBeInTheDocument();
    expect(screen.getByText(/Use KMS/)).toBeInTheDocument();
  });

  it("shows badges for timeline and budget", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    renderPage();
    await waitFor(() => screen.getByText("Test Project"));
    expect(screen.getByText("1 week")).toBeInTheDocument();
    expect(screen.getByText("$100")).toBeInTheDocument();
  });

  it("shows pros and cons on architecture tab", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    renderPage();
    await waitFor(() => screen.getByText("Test Project"));
    fireEvent.click(screen.getByRole("button", { name: "architecture" }));
    expect(screen.getByText(/cheap/)).toBeInTheDocument();
    expect(screen.getByText(/cold starts/)).toBeInTheDocument();
  });

  it("clicking architecture option selects it", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    renderPage();
    await waitFor(() => { expect(screen.getByText("Test Project")).toBeInTheDocument(); });
    fireEvent.click(screen.getByRole("button", { name: "architecture" }));
    await waitFor(() => { expect(screen.getByText("Containers")).toBeInTheDocument(); });
    fireEvent.click(screen.getByText("Containers").closest("div[class*='p-4']")!);
    expect(screen.getByText("Selected")).toBeInTheDocument();
  });

  it("stores selectedOptionIndex in sessionStorage when option clicked", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    renderPage();
    await waitFor(() => screen.getByText("Test Project"));
    fireEvent.click(screen.getByRole("button", { name: "architecture" }));
    await waitFor(() => screen.getByText("Containers"));
    fireEvent.click(screen.getByText("Containers").closest("div[class*='p-4']")!);
    expect(window.sessionStorage.setItem).toHaveBeenCalled();
  });

  it("selects option via radio button", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    renderPage();
    await waitFor(() => screen.getByText("Test Project"));
    fireEvent.click(screen.getByRole("button", { name: "architecture" }));
    await waitFor(() => screen.getByText("Serverless"));
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[0]);
    expect(radios[0]).toBeChecked();
  });

  it("shows technology stack on overview", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    renderPage();
    await waitFor(() => screen.getByText("Test Project"));
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Lambda")).toBeInTheDocument();
  });

  it("shows review findings with risk levels on reviews tab", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    renderPage();
    await waitFor(() => screen.getByText("Test Project"));
    fireEvent.click(screen.getByRole("button", { name: "reviews" }));
    expect(screen.getByText("high")).toBeInTheDocument();
    expect(screen.getByText("medium")).toBeInTheDocument();
    expect(screen.getByText(/2 categories reviewed/)).toBeInTheDocument();
  });

  it("shows risk level summary on security tab", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    renderPage();
    await waitFor(() => screen.getByText("Test Project"));
    fireEvent.click(screen.getByRole("button", { name: "security" }));
    expect(screen.getByText("All Risk Levels")).toBeInTheDocument();
  });

  it("Start New Plan button navigates to questionnaire", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    renderPage();
    await waitFor(() => screen.getByText("Test Project"));
    fireEvent.click(screen.getByText("Start New Plan"));
    expect(mockNavigate).toHaveBeenCalledWith("/questionnaire");
  });
});
