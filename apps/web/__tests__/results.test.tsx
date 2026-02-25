import { render, screen, waitFor } from "@testing-library/react";

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

import ResultsPage from "@/app/results/[id]/page";

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
  mockPush.mockClear();
  (global.fetch as jest.Mock).mockClear();
  Object.defineProperty(window, "sessionStorage", {
    value: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn(), clear: jest.fn() },
    writable: true,
  });
});

describe("ResultsPage", () => {
  it("renders plan from sessionStorage", async () => {
    (window.sessionStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockPlan));
    render(<ResultsPage params={Promise.resolve({ id: "test-123" })} />);
    await waitFor(() => {
      expect(screen.getByText("Test Project")).toBeInTheDocument();
    });
  });

  it("fetches plan from API when sessionStorage is empty", async () => {
    (window.sessionStorage.getItem as jest.Mock).mockReturnValue(null);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockPlan,
    });
    render(<ResultsPage params={Promise.resolve({ id: "test-123" })} />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/v1/plan/test-123"));
    });
  });

  it("redirects to questionnaire when API fetch fails", async () => {
    (window.sessionStorage.getItem as jest.Mock).mockReturnValue(null);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
    render(<ResultsPage params={Promise.resolve({ id: "test-123" })} />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/questionnaire");
    });
  });

  it("renders the ScaffoldIntegration component", async () => {
    (window.sessionStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockPlan));
    render(<ResultsPage params={Promise.resolve({ id: "test-123" })} />);
    await waitFor(() => {
      expect(screen.getByTestId("scaffold-integration")).toBeInTheDocument();
    });
  });
});
