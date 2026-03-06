import { render, screen, waitFor } from "@testing-library/react";
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
});
