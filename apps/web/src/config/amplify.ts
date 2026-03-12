/** Amplify + AWS SDK configuration from VITE_* environment variables. */

export const awsConfig = {
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  userPoolId: import.meta.env.VITE_USER_POOL_ID || '',
  userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || '',
  identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID || '',
}

export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: awsConfig.userPoolId,
      userPoolClientId: awsConfig.userPoolClientId,
      identityPoolId: awsConfig.identityPoolId,
    },
  },
}

/** Scaffold AI URL for plan handoff. */
export const scaffoldConfig = {
  url: import.meta.env.VITE_SCAFFOLD_URL || 'http://localhost:3001',
}

/** App resource references from CDK outputs. */
export const appConfig = {
  plansTable: import.meta.env.VITE_PLANS_TABLE || 'project-planner-plans',
  handoffTable: import.meta.env.VITE_HANDOFF_TABLE || 'project-planner-handoff',
  workflowArn: import.meta.env.VITE_WORKFLOW_ARN || '',
}
