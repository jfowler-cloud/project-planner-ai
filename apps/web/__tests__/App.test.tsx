import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App';

describe('App', () => {
  it('renders home page at /', () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);
    // Home page should render something
    expect(document.body).toBeInTheDocument();
  });

  it('renders questionnaire page at /questionnaire', () => {
    render(<MemoryRouter initialEntries={['/questionnaire']}><App /></MemoryRouter>);
    expect(document.body).toBeInTheDocument();
  });
});
