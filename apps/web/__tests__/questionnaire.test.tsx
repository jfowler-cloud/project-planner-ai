import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, beforeEach, describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/components/ThemeProvider", () => ({
  ThemeToggle: () => <button>Toggle</button>,
}));

const mockNavigate = vi.fn();

import QuestionnairePage from "@/pages/Questionnaire";

beforeEach(() => {
  mockNavigate.mockClear();
  Object.defineProperty(window, "sessionStorage", {
    value: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() },
    writable: true,
  });
});

function renderPage(props: { signOut?: () => void; userEmail?: string } = {}) {
  return render(<MemoryRouter><QuestionnairePage {...props} /></MemoryRouter>);
}

describe("QuestionnairePage", () => {
  it("renders step 1 (Project Basics) by default", () => {
    renderPage();
    expect(screen.getByText("Project Basics")).toBeInTheDocument();
  });

  it("renders the Demo button", () => {
    renderPage();
    expect(screen.getByText("Demo")).toBeInTheDocument();
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
    fireEvent.click(screen.getByText("Demo"));
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

  it("renders sign out button when signOut provided", () => {
    const signOut = vi.fn();
    renderPage({ signOut, userEmail: "user@test.com" });
    expect(screen.getByText("user@test.com")).toBeInTheDocument();
  });
});

describe("QuestionnairePage - Steps 2 & 3", () => {
  it("navigates from step 2 to step 3", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByPlaceholderText("My Awesome Project"), "Test Project");
    await user.type(screen.getByPlaceholderText("What does your project do?"), "A test project description that is long enough");
    await user.type(screen.getByPlaceholderText("Who will use this?"), "Developers");
    await act(async () => { await user.click(screen.getByText("Next")); });
    await waitFor(() => { expect(screen.getByText("Technical Requirements")).toBeInTheDocument(); });
    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByText("Technology Preferences")).toBeInTheDocument();
  });

  it("navigating back from step 3 returns to step 2", () => {
    renderPage();
    fireEvent.click(screen.getByText("Demo"));
    expect(screen.getByText("Technology Preferences")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByText("Technical Requirements")).toBeInTheDocument();
  });

  it("Generate Plan stores payload and navigates", () => {
    renderPage();
    fireEvent.click(screen.getByText("Demo"));
    fireEvent.click(screen.getByText("Generate Plan"));
    expect(window.sessionStorage.setItem).toHaveBeenCalledWith("projectRequest", expect.any(String));
    expect(mockNavigate).toHaveBeenCalledWith("/planning");
  });

  it("renders review count slider on step 3", () => {
    renderPage();
    fireEvent.click(screen.getByText("Demo"));
    expect(screen.getByText("Critical Review Passes")).toBeInTheDocument();
  });

  it("changes review count via slider", () => {
    renderPage();
    fireEvent.click(screen.getByText("Demo"));
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "7" } });
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("renders authentication checkbox on step 2", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByPlaceholderText("My Awesome Project"), "Test Project");
    await user.type(screen.getByPlaceholderText("What does your project do?"), "A test project description that is long enough");
    await user.type(screen.getByPlaceholderText("Who will use this?"), "Developers");
    await act(async () => { await user.click(screen.getByText("Next")); });
    await waitFor(() => { expect(screen.getByText("Authentication Required")).toBeInTheDocument(); });
  });

  it("renders select dropdowns on step 2", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByPlaceholderText("My Awesome Project"), "Test Project");
    await user.type(screen.getByPlaceholderText("What does your project do?"), "A test project description that is long enough");
    await user.type(screen.getByPlaceholderText("Who will use this?"), "Developers");
    await act(async () => { await user.click(screen.getByText("Next")); });
    await waitFor(() => { expect(screen.getByText("Expected Users")).toBeInTheDocument(); });
    expect(screen.getByText("Growth Rate")).toBeInTheDocument();
  });

  it("changes select values on step 2", async () => {
    renderPage();
    fireEvent.click(screen.getByText("Demo"));
    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByText("Technical Requirements")).toBeInTheDocument();
    // Change select values
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "10K-100K" } }); // user count
    fireEvent.change(selects[1], { target: { value: "Fast" } }); // growth rate
    fireEvent.change(selects[2], { target: { value: "99.99%" } }); // uptime
    fireEvent.change(selects[3], { target: { value: "<200ms" } }); // response time
    fireEvent.change(selects[4], { target: { value: "100GB-1TB" } }); // data size
    fireEvent.change(selects[5], { target: { value: "Highly Sensitive" } }); // data sensitivity
    // Toggle authentication
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("changes preference values on step 3", () => {
    renderPage();
    fireEvent.click(screen.getByText("Demo"));
    expect(screen.getByText("Technology Preferences")).toBeInTheDocument();
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "Node.js" } }); // backend language
    fireEvent.change(selects[1], { target: { value: "Vue" } }); // frontend framework
    fireEvent.change(selects[2], { target: { value: "Containers" } }); // infrastructure
    fireEvent.change(selects[3], { target: { value: "GCP" } }); // cloud provider
  });

  it("changes timeline and budget on step 1", () => {
    renderPage();
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "2 weeks" } }); // timeline
    fireEvent.change(selects[1], { target: { value: "$500-$1000" } }); // budget
  });
});
