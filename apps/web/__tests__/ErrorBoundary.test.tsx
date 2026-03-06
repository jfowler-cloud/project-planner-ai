import { render, screen, fireEvent } from "@testing-library/react";
import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";
import ErrorBoundary from "@/components/ErrorBoundary";

function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("Test error message");
  return <div>Normal content</div>;
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ErrorBoundary", () => {
  it("renders children when there is no error", () => {
    render(<ErrorBoundary><ThrowingComponent shouldThrow={false} /></ErrorBoundary>);
    expect(screen.getByText("Normal content")).toBeInTheDocument();
  });

  it("renders fallback UI when a child throws", () => {
    render(<ErrorBoundary><ThrowingComponent shouldThrow={true} /></ErrorBoundary>);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("renders custom fallback when provided", () => {
    render(<ErrorBoundary fallback={<div>Custom fallback</div>}><ThrowingComponent shouldThrow={true} /></ErrorBoundary>);
    expect(screen.getByText("Custom fallback")).toBeInTheDocument();
  });

  it("resets error state when Try again is clicked", () => {
    render(<ErrorBoundary><ThrowingComponent shouldThrow={true} /></ErrorBoundary>);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Try again"));
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });
});
