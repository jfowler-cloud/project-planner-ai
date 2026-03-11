import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock Amplify
vi.mock('aws-amplify', () => ({ Amplify: { configure: vi.fn() } }));
vi.mock('aws-amplify/auth', () => ({ fetchAuthSession: vi.fn().mockResolvedValue({ credentials: {} }) }));
vi.mock('@aws-amplify/ui-react', () => ({
  Authenticator: ({ children }: { children: (props: { signOut: () => void; user: { signInDetails: { loginId: string } } }) => React.ReactNode }) =>
    children({ signOut: vi.fn(), user: { signInDetails: { loginId: 'test@test.com' } } }),
}));

import App from '../src/App';

describe('App', () => {
  it('renders home page at /', () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);
    expect(document.body).toBeInTheDocument();
  });

  it('renders questionnaire page at /questionnaire', () => {
    render(<MemoryRouter initialEntries={['/questionnaire']}><App /></MemoryRouter>);
    expect(document.body).toBeInTheDocument();
  });
});
