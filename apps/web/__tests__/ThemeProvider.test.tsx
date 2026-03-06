import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, ThemeToggle } from '../src/components/ThemeProvider';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('ThemeProvider + ThemeToggle', () => {
  beforeEach(() => localStorageMock.clear());

  it('renders children', () => {
    render(<ThemeProvider><span>child</span></ThemeProvider>);
    expect(screen.getByText('child')).toBeInTheDocument();
  });

  it('defaults to dark theme', () => {
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
    expect(screen.getByRole('button')).toHaveTextContent('☀️');
  });

  it('reads saved theme from localStorage', () => {
    localStorageMock.setItem('theme', 'light');
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
    expect(screen.getByRole('button')).toHaveTextContent('🌙');
  });

  it('toggles theme on button click', () => {
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(localStorageMock.getItem('theme')).toBe('light');
    fireEvent.click(btn);
    expect(localStorageMock.getItem('theme')).toBe('dark');
  });

  it('toggle button has aria-label', () => {
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Toggle dark mode');
  });
});
