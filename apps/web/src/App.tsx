import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeProvider'
import ErrorBoundary from './components/ErrorBoundary'
import HomePage from './pages/Home'
import QuestionnairePage from './pages/Questionnaire'
import PlanningPage from './pages/Planning'
import ResultsPage from './pages/Results'

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/questionnaire" element={<QuestionnairePage />} />
          <Route path="/planning" element={<PlanningPage />} />
          <Route path="/results/:id" element={<ResultsPage />} />
        </Routes>
      </ErrorBoundary>
    </ThemeProvider>
  )
}
