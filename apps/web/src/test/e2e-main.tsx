/**
 * E2E entry point — pre-seeds sessionStorage so pages render without a real backend.
 * Renders routes directly (no Authenticator) so screenshots capture app content.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '../components/ThemeProvider'
import ErrorBoundary from '../components/ErrorBoundary'
import HomePage from '../pages/Home'
import QuestionnairePage from '../pages/Questionnaire'
import PlanningPage from '../pages/Planning'
import ResultsPage from '../pages/Results'
import '../index.css'

const MOCK_PLAN = {
  plan_id: 'e2e-plan-001',
  questionnaire: {
    basics: { name: 'Flow Log Analyzer', description: 'Serverless VPC flow log analysis with anomaly detection and dashboards.', timeline: '1 week', budget: '$100-$500' },
  },
  recommended: {
    name: 'Full Serverless',
    description: 'Lambda + API Gateway + DynamoDB + S3',
    pros: ['Low cost', 'Auto-scaling', 'No servers to manage'],
    cons: ['Cold starts', 'Vendor lock-in'],
    best_for: 'Cost-sensitive workloads with bursty traffic',
    complexity: 'Medium',
    monthly_cost_estimate: '$43/mo',
    stack: { compute: 'Lambda', api: 'API Gateway', database: 'DynamoDB', storage: 'S3', auth: 'Cognito', monitoring: 'CloudWatch' },
  },
  alternatives: [
    {
      name: 'Container-based',
      description: 'ECS Fargate + ALB + RDS Aurora',
      pros: ['Consistent performance', 'Flexible runtime'],
      cons: ['Higher baseline cost', 'More ops overhead'],
      best_for: 'Steady-state workloads needing full control',
      complexity: 'High',
      monthly_cost_estimate: '$120/mo',
      stack: { compute: 'ECS Fargate', api: 'ALB', database: 'Aurora PostgreSQL', storage: 'S3', auth: 'Cognito', monitoring: 'CloudWatch' },
    },
  ],
  review_findings: [],
  selectedOptionIndex: 0,
}

sessionStorage.setItem('projectPlan', JSON.stringify(MOCK_PLAN))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/e2e.html" element={<HomePage />} />
            <Route path="/questionnaire" element={<QuestionnairePage />} />
            <Route path="/planning" element={<PlanningPage />} />
            <Route path="/results/:id" element={<ResultsPage />} />
          </Routes>
        </ErrorBoundary>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
