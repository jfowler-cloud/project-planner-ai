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

global.fetch = vi.fn() as any;

import ResultsPage from "@/pages/Results";

const mockPlan = {
  project_id: "test-123",
  basics: { name: "Test Project", description: "A test", timeline: "1 week", budget: "$100" },
  technical: {},
  preferences: {},
  architecture_options: [
    { name: "Serverless", description: "desc", pros: ["cheap"], cons: ["cold starts"], cost_estimate: "$10/mo", complexity: "Low" },
  ],
  recommended_option: "Serverless",
  justification: "Best for small projects",
  technology_stack: { frontend: "React", backend: "Lambda" },
  cost_breakdown: {
    compute: "$5", storage: "$2", database: "$3", ai_api: "$0",
    networking: "$1", total_monthly: "$11", total_yearly: "$132",
  },
  timeline_estimate: "2 weeks",
  risk_assessment: ["Vendor lock-in"],
  security_checklist: ["Enable encryption"],
};

beforeEach(() => {
  mockNavigate.mockClear();
  (global.fetch as ReturnType<typeof vi.fn>).mockClear();
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

  it("fetches plan from API when sessionStorage is empty", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => mockPlan });
    renderPage();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/v1/plan/test-123"));
    });
  });

  it("redirects to questionnaire when API fetch fails", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });
    renderPage();
    await waitFor(() => { expect(mockNavigate).toHaveBeenCalledWith("/questionnaire"); });
  });

  it("renders the ScaffoldIntegration component", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    renderPage();
    await waitFor(() => { expect(screen.getByTestId("scaffold-integration")).toBeInTheDocument(); });
  });

  it("shows loading spinner before plan loads", () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {})); // never resolves
    renderPage();
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders all tabs", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    renderPage();
    await waitFor(() => { expect(screen.getByText("Test Project")).toBeInTheDocument(); });
    ["overview", "architecture", "costs", "security"].forEach((tab) => {
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

  it("switches to costs tab on click", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    renderPage();
    await waitFor(() => { expect(screen.getByText("Test Project")).toBeInTheDocument(); });
    fireEvent.click(screen.getByRole("button", { name: "costs" }));
    expect(screen.getByText("Cost Breakdown")).toBeInTheDocument();
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

  it("switches to security tab and shows checklist and risk assessment", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    renderPage();
    await waitFor(() => { expect(screen.getByText("Test Project")).toBeInTheDocument(); });
    fireEvent.click(screen.getByRole("button", { name: "security" }));
    expect(screen.getByText("Security Checklist")).toBeInTheDocument();
    expect(screen.getByText("Enable encryption")).toBeInTheDocument();
    expect(screen.getByText("Risk Assessment")).toBeInTheDocument();
    expect(screen.getByText("Vendor lock-in")).toBeInTheDocument();
  });

  it("clicking architecture option selects it", async () => {
    const planWithMultipleOptions = {
      ...mockPlan,
      architecture_options: [
        { name: "Serverless", description: "desc", pros: [], cons: [], cost_estimate: "$10/mo", complexity: "Low" },
        { name: "Containers", description: "ECS", pros: [], cons: [], cost_estimate: "$20/mo", complexity: "Medium" },
      ],
    };
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(planWithMultipleOptions));
    renderPage();
    await waitFor(() => { expect(screen.getByText("Test Project")).toBeInTheDocument(); });
    fireEvent.click(screen.getByRole("button", { name: "architecture" }));
    await waitFor(() => { expect(screen.getByText("Containers")).toBeInTheDocument(); });
    fireEvent.click(screen.getByText("Containers").closest("div[class*='p-4']")!);
    expect(screen.getByText("Selected")).toBeInTheDocument();
  });
});

describe("ResultsPage - additional coverage", () => {
  it("shows token modal when Generate GitHub Repository clicked without token", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    renderPage();
    await waitFor(() => { expect(screen.getByText("Test Project")).toBeInTheDocument(); });
    fireEvent.click(screen.getByText("Generate GitHub Repository"));
    await waitFor(() => { expect(screen.getByText("GitHub Personal Access Token Required")).toBeInTheDocument(); });
  });

  it("closes token modal on Cancel", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    renderPage();
    await waitFor(() => screen.getByText("Test Project"));
    fireEvent.click(screen.getByText("Generate GitHub Repository"));
    await waitFor(() => screen.getByText("GitHub Personal Access Token Required"));
    fireEvent.click(screen.getByText("Cancel"));
    await waitFor(() => { expect(screen.queryByText("GitHub Personal Access Token Required")).not.toBeInTheDocument(); });
  });

  it("shows cost breakdown values on costs tab", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    renderPage();
    await waitFor(() => screen.getByText("Test Project"));
    fireEvent.click(screen.getByRole("button", { name: "costs" }));
    expect(screen.getByText("$11")).toBeInTheDocument();
    expect(screen.getByText("$132")).toBeInTheDocument();
  });

  it("shows timeline and technology stack on overview", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    renderPage();
    await waitFor(() => screen.getByText("Test Project"));
    expect(screen.getByText("2 weeks")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Lambda")).toBeInTheDocument();
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

  it("stores selectedOptionIndex in sessionStorage when option clicked", async () => {
    const planWithMultipleOptions = {
      ...mockPlan,
      architecture_options: [
        { name: "Serverless", description: "desc", pros: [], cons: [], cost_estimate: "$10/mo", complexity: "Low" },
        { name: "Containers", description: "ECS", pros: [], cons: [], cost_estimate: "$20/mo", complexity: "Medium" },
      ],
    };
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(planWithMultipleOptions));
    renderPage();
    await waitFor(() => screen.getByText("Test Project"));
    fireEvent.click(screen.getByRole("button", { name: "architecture" }));
    await waitFor(() => screen.getByText("Containers"));
    fireEvent.click(screen.getByText("Containers").closest("div[class*='p-4']")!);
    expect(window.sessionStorage.setItem).toHaveBeenCalled();
  });

  it("calls generate-repo API with token", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => ({ repo_url: "https://github.com/test/repo" }) });
    window.alert = vi.fn();
    window.open = vi.fn();
    renderPage();
    await waitFor(() => screen.getByText("Test Project"));
    fireEvent.click(screen.getByText("Generate GitHub Repository"));
    await waitFor(() => screen.getByText("GitHub Personal Access Token Required"));
    fireEvent.change(screen.getByPlaceholderText("ghp_xxxxxxxxxxxx"), { target: { value: "ghp_test123" } });
    fireEvent.click(screen.getByText("Continue"));
    await waitFor(() => { expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/v1/generate-repo"), expect.any(Object)); });
  });

  it("shows error when generate-repo fails", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, json: async () => ({ detail: "Repo creation failed" }) });
    window.alert = vi.fn();
    renderPage();
    await waitFor(() => screen.getByText("Test Project"));
    fireEvent.click(screen.getByText("Generate GitHub Repository"));
    await waitFor(() => screen.getByText("GitHub Personal Access Token Required"));
    fireEvent.change(screen.getByPlaceholderText("ghp_xxxxxxxxxxxx"), { target: { value: "ghp_test123" } });
    fireEvent.click(screen.getByText("Continue"));
    await waitFor(() => { expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("Repo creation failed")); });
  });

  it("shows PDF export not implemented alert", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    window.alert = vi.fn();
    renderPage();
    await waitFor(() => screen.getByText("Test Project"));
    fireEvent.click(screen.getByText("Export as PDF"));
    expect(window.alert).toHaveBeenCalledWith("PDF export is not implemented yet.");
  });

  it("shows Markdown export not implemented alert", async () => {
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(mockPlan));
    window.alert = vi.fn();
    renderPage();
    await waitFor(() => screen.getByText("Test Project"));
    fireEvent.click(screen.getByText("Export as Markdown"));
    expect(window.alert).toHaveBeenCalledWith("Markdown export is not implemented yet.");
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
});
