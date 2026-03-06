import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, beforeEach, describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockNavigate = vi.fn();

import QuestionnairePage from "@/pages/Questionnaire";

beforeEach(() => {
  mockNavigate.mockClear();
  Object.defineProperty(window, "sessionStorage", {
    value: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() },
    writable: true,
  });
});

function renderPage() {
  return render(<MemoryRouter><QuestionnairePage /></MemoryRouter>);
}

describe("QuestionnairePage", () => {
  it("renders step 1 (Project Basics) by default", () => {
    renderPage();
    expect(screen.getByText("Project Basics")).toBeInTheDocument();
  });

  it("renders the Demo button", () => {
    renderPage();
    expect(screen.getByText("🚀 Demo")).toBeInTheDocument();
  });

  it("Next button is present and is a submit button", () => {
    renderPage();
    const nextButton = screen.getByText("Next");
    expect(nextButton).toBeInTheDocument();
    expect(nextButton).toHaveAttribute("type", "submit");
  });

  it("shows validation errors when Next is clicked with empty fields", async () => {
    renderPage();
    await act(async () => { fireEvent.click(screen.getByText("Next")); });
    await waitFor(() => {
      expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it("navigates to step 2 when Next is clicked with valid data", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByPlaceholderText("My Awesome Project"), "Test Project");
    await user.type(screen.getByPlaceholderText("What does your project do?"), "A test project description that is long enough");
    await user.type(screen.getByPlaceholderText("Who will use this?"), "Developers");
    await act(async () => { await user.click(screen.getByText("Next")); });
    await waitFor(() => {
      expect(screen.getByText("Technical Requirements")).toBeInTheDocument();
    });
  });

  it("Demo button fills form data and jumps to step 3", () => {
    renderPage();
    fireEvent.click(screen.getByText("🚀 Demo"));
    expect(screen.getByText("Technology Preferences")).toBeInTheDocument();
  });

  it("navigating back from step 2 returns to step 1", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByPlaceholderText("My Awesome Project"), "Test Project");
    await user.type(screen.getByPlaceholderText("What does your project do?"), "A test project description that is long enough");
    await user.type(screen.getByPlaceholderText("Who will use this?"), "Developers");
    await act(async () => { await user.click(screen.getByText("Next")); });
    await waitFor(() => { expect(screen.getByText("Technical Requirements")).toBeInTheDocument(); });
    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByText("Project Basics")).toBeInTheDocument();
  });
});
