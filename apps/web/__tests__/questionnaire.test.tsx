import { render, screen, fireEvent } from "@testing-library/react";

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

  it("Next button is disabled when required fields are empty", () => {
    render(<QuestionnairePage />);
    const nextButton = screen.getByText("Next");
    expect(nextButton).toBeDisabled();
  });

  it("Next button enables when required fields are filled", () => {
    render(<QuestionnairePage />);

    fireEvent.change(screen.getByPlaceholderText("My Awesome Project"), {
      target: { value: "Test Project" },
    });
    fireEvent.change(screen.getByPlaceholderText("What does your project do?"), {
      target: { value: "A test project description" },
    });
    fireEvent.change(screen.getByPlaceholderText("Who will use this?"), {
      target: { value: "Developers" },
    });

    const nextButton = screen.getByText("Next");
    expect(nextButton).not.toBeDisabled();
  });

  it("navigates to step 2 when Next is clicked with valid data", () => {
    render(<QuestionnairePage />);

    fireEvent.change(screen.getByPlaceholderText("My Awesome Project"), {
      target: { value: "Test Project" },
    });
    fireEvent.change(screen.getByPlaceholderText("What does your project do?"), {
      target: { value: "A test project description" },
    });
    fireEvent.change(screen.getByPlaceholderText("Who will use this?"), {
      target: { value: "Developers" },
    });

    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByText("Technical Requirements")).toBeInTheDocument();
  });

  it("Demo button fills form data and jumps to step 3", () => {
    render(<QuestionnairePage />);
    fireEvent.click(screen.getByText("🚀 Demo"));
    expect(screen.getByText("Technology Preferences")).toBeInTheDocument();
  });

  it("navigating back from step 2 returns to step 1", () => {
    render(<QuestionnairePage />);

    // Fill step 1 and advance
    fireEvent.change(screen.getByPlaceholderText("My Awesome Project"), {
      target: { value: "Test" },
    });
    fireEvent.change(screen.getByPlaceholderText("What does your project do?"), {
      target: { value: "desc" },
    });
    fireEvent.change(screen.getByPlaceholderText("Who will use this?"), {
      target: { value: "users" },
    });
    fireEvent.click(screen.getByText("Next"));

    // Now go back
    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByText("Project Basics")).toBeInTheDocument();
  });
});
