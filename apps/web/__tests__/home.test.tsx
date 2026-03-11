import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/components/ThemeProvider", () => ({
  ThemeToggle: () => <button>Toggle</button>,
}));

import HomePage from "@/pages/Home";

function renderPage(props: { signOut?: () => void; userEmail?: string } = {}) {
  return render(<MemoryRouter><HomePage {...props} /></MemoryRouter>);
}

describe("HomePage", () => {
  it("renders headline", () => {
    renderPage();
    expect(screen.getByText(/Turn Ideas into Production-Ready Plans/i)).toBeInTheDocument();
  });

  it("renders Start Planning link", () => {
    renderPage();
    expect(screen.getAllByRole("link", { name: /start planning/i })[0]).toBeInTheDocument();
  });

  it("renders Get Started Free link pointing to /questionnaire", () => {
    renderPage();
    expect(screen.getByRole("link", { name: /get started free/i })).toHaveAttribute("href", "/questionnaire");
  });

  it("renders all 3 feature cards", () => {
    renderPage();
    expect(screen.getByText("Simple Questions")).toBeInTheDocument();
    expect(screen.getByText("AI Analysis")).toBeInTheDocument();
    expect(screen.getByText("Ready to Build")).toBeInTheDocument();
  });

  it("renders How It Works steps", () => {
    renderPage();
    expect(screen.getByText("Answer Simple Questions")).toBeInTheDocument();
    expect(screen.getByText("Generate Project")).toBeInTheDocument();
  });

  it("renders footer", () => {
    renderPage();
    expect(screen.getByText(/Built with/i)).toBeInTheDocument();
  });

  it("renders sign out button when signOut provided", () => {
    const signOut = vi.fn();
    renderPage({ signOut, userEmail: "test@test.com" });
    const btn = screen.getByText("test@test.com · Sign out");
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(signOut).toHaveBeenCalled();
  });

  it("does not render sign out button when signOut not provided", () => {
    renderPage();
    expect(screen.queryByText(/Sign out/)).not.toBeInTheDocument();
  });
});
