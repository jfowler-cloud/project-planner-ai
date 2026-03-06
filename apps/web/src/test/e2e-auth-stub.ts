/**
 * E2E stub for aws-amplify/auth — returns fake credentials so the AWS SDK
 * can construct signed requests without a real Cognito session.
 * Aliased in vite.config.ts when mode === 'e2e'.
 */
export async function fetchAuthSession() {
  return {
    credentials: {
      accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      sessionToken: 'mock-session-token',
      expiration: new Date(Date.now() + 3600_000),
    },
    tokens: undefined,
    identityId: 'us-east-1:mock-identity',
  }
}

export function getCurrentUser() {
  return Promise.resolve({ userId: 'e2e-user-1', username: 'e2e@test.com' })
}

export function signOut() {
  return Promise.resolve()
}
