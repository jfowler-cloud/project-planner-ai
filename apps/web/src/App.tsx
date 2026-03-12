import { Routes, Route } from 'react-router-dom'
import { Amplify } from 'aws-amplify'
import { Authenticator, useTheme, View, Text, Heading } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import { amplifyConfig } from './config/amplify'
import { ThemeProvider } from './components/ThemeProvider'
import ErrorBoundary from './components/ErrorBoundary'
import HomePage from './pages/Home'
import QuestionnairePage from './pages/Questionnaire'
import PlanningPage from './pages/Planning'
import ResultsPage from './pages/Results'

Amplify.configure(amplifyConfig)

function AuthHeader() {
  const { tokens } = useTheme()
  return (
    <View textAlign="center" padding={tokens.space.large}>
      <Text fontSize="4xl">📋</Text>
      <Heading level={3} marginTop={tokens.space.small}>Project Planner AI</Heading>
      <Text fontSize="small" color={tokens.colors.font.secondary}>
        AI-powered project planning and architecture design
      </Text>
    </View>
  )
}

function AuthFooter() {
  const { tokens } = useTheme()
  return (
    <View textAlign="center" padding={tokens.space.large}>
      <Text fontSize="small" color={tokens.colors.font.secondary}>
        Secure authentication powered by AWS Cognito
      </Text>
    </View>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <Authenticator
        hideSignUp
        components={{ Header: AuthHeader, Footer: AuthFooter }}
        formFields={{
          signIn: {
            username: { placeholder: 'Enter your email', label: 'Email' },
            password: { placeholder: 'Enter your password', label: 'Password' },
          },
        }}
      >
        {({ signOut, user }) => (
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<HomePage signOut={signOut} userEmail={user?.signInDetails?.loginId} />} />
              <Route path="/questionnaire" element={<QuestionnairePage signOut={signOut} userEmail={user?.signInDetails?.loginId} />} />
              <Route path="/planning" element={<PlanningPage />} />
              <Route path="/results/:id" element={<ResultsPage />} />
            </Routes>
          </ErrorBoundary>
        )}
      </Authenticator>
    </ThemeProvider>
  )
}
