import { Routes, Route } from 'react-router-dom'
import { Amplify } from 'aws-amplify'
import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import { amplifyConfig } from './config/amplify'
import { ThemeProvider } from './components/ThemeProvider'
import ErrorBoundary from './components/ErrorBoundary'
import HomePage from './pages/Home'
import QuestionnairePage from './pages/Questionnaire'
import PlanningPage from './pages/Planning'
import ResultsPage from './pages/Results'

Amplify.configure(amplifyConfig)

export default function App() {
  return (
    <ThemeProvider>
      <Authenticator hideSignUp>
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
