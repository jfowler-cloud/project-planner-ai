import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

import QuestionnairePage from "@/app/questionnaire/page";

beforeEach(() => {
  mockPush.mockClear();
  // Mock sessionStorage
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

describe("QuestionnairePage", () => {
  it("renders step 1 (Project Basics) by default", () => {
    render(<QuestionnairePage />);
    expect(screen.getByText("Project Basics")).toBeInTheDocument();
  });

  it("renders the Demo button", () => {
    render(<QuestionnairePage />);
    expect(screen.getByText("🚀 Demo")).toBeInTheDocument();
  });

  it("Next button is present and is a submit button", () => {
    render(<QuestionnairePage />);
    const nextButton = screen.getByText("Next");
    expect(nextButton).toBeInTheDocument();
    expect(nextButton).toHaveAttribute("type", "submit");
  });

  it("shows validation errors when Next is clicked with empty fields", async () => {
    render(<QuestionnairePage />);
    await act(async () => {
      fireEvent.click(screen.getByText("Next"));
    });
    await waitFor(() => {
      expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it("navigates to step 2 when Next is clicked with valid data", async () => {
    const user = userEvent.setup();
    render(<QuestionnairePage />);

    await user.type(screen.getByPlaceholderText("My Awesome Project"), "Test Project");
    await user.type(screen.getByPlaceholderText("What does your project do?"), "A test project description that is long enough");
    await user.type(screen.getByPlaceholderText("Who will use this?"), "Developers");

    await act(async () => {
      await user.click(screen.getByText("Next"));
    });

    await waitFor(() => {
      expect(screen.getByText("Technical Requirements")).toBeInTheDocument();
    });
  });

  it("Demo button fills form data and jumps to step 3", () => {
    render(<QuestionnairePage />);
    fireEvent.click(screen.getByText("🚀 Demo"));
    expect(screen.getByText("Technology Preferences")).toBeInTheDocument();
  });

  it("navigating back from step 2 returns to step 1", async () => {
    const user = userEvent.setup();
    render(<QuestionnairePage />);

    // Fill step 1 and advance
    await user.type(screen.getByPlaceholderText("My Awesome Project"), "Test Project");
    await user.type(screen.getByPlaceholderText("What does your project do?"), "A test project description that is long enough");
    await user.type(screen.getByPlaceholderText("Who will use this?"), "Developers");

    await act(async () => {
      await user.click(screen.getByText("Next"));
    });

    await waitFor(() => {
      expect(screen.getByText("Technical Requirements")).toBeInTheDocument();
    });

    // Now go back
    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByText("Project Basics")).toBeInTheDocument();
  });
});
