import { render, screen } from "@testing-library/react";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock ScaffoldIntegration
jest.mock("@/components/ScaffoldIntegration", () => ({
  __esModule: true,
  default: () => <div data-testid="scaffold-integration" />,
}));

// Mock global fetch
global.fetch = jest.fn();

import PlanningPage from "@/app/planning/page";

beforeEach(() => {
  mockPush.mockClear();
  (global.fetch as jest.Mock).mockClear();

  Object.defineProperty(window, "sessionStorage", {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
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
    const mockRequest = {
      basics: { name: "Test", description: "desc", target_users: "users", timeline: "1 week", budget: "$100" },
      technical: { user_count: "100", uptime: "99%", data_sensitivity: "Internal", authentication: true, compliance: [] },
      preferences: {},
      review_count: 3,
    };
    (window.sessionStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockRequest));

    // Mock a pending fetch (never resolves during test)
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<PlanningPage />);
    expect(screen.getByText(/AI Planning in Progress/)).toBeInTheDocument();
  });

  it("renders the progress bar", () => {
    const mockRequest = { basics: {}, technical: { compliance: [] }, preferences: {}, review_count: 3 };
    (window.sessionStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<PlanningPage />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("renders the ScaffoldIntegration component", () => {
    const mockRequest = { basics: {}, technical: { compliance: [] }, preferences: {}, review_count: 3 };
    (window.sessionStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockRequest));
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<PlanningPage />);
    expect(screen.getByTestId("scaffold-integration")).toBeInTheDocument();
  });
});
