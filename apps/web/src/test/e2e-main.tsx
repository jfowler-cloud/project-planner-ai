/**
 * E2E entry point — pre-seeds sessionStorage so pages render without a real backend.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from '../App'
import '../index.css'

const MOCK_PLAN = {
  project_id: 'e2e-plan-001',
  basics: { name: 'Flow Log Analyzer', description: 'Serverless VPC flow log analysis with anomaly detection and dashboards.', target_users: 'DevOps engineers and security analysts', timeline: '1 week', budget: '$100-$500' },
  technical: { user_count: '1K-10K', uptime: '99.9%', data_size: '10-100GB', data_sensitivity: 'Confidential', response_time: '<500ms', heavy_computation: true, realtime_features: true, authentication: true, auth_type: 'OAuth' },
  preferences: { backend_language: 'Python', backend_framework: 'FastAPI', frontend_framework: 'React', database_type: 'DynamoDB', infrastructure: 'Serverless', cloud_provider: 'AWS' },
  architecture_options: [
    { name: 'Full Serverless', description: 'Lambda + API Gateway + DynamoDB + S3', pros: ['Low cost', 'Auto-scaling', 'No servers to manage'], cons: ['Cold starts', 'Vendor lock-in'] },
    { name: 'Container-based', description: 'ECS Fargate + ALB + RDS Aurora', pros: ['Consistent performance', 'Flexible'], cons: ['Higher baseline cost', 'More ops overhead'] },
  ],
  recommended_option: 'Full Serverless',
  justification: 'Given the bursty workload and cost constraints, a fully serverless approach provides the best balance of scalability and cost efficiency.',
  technology_stack: { frontend: 'React + TypeScript', backend: 'Python + Lambda', database: 'DynamoDB', auth: 'Cognito', storage: 'S3', monitoring: 'CloudWatch' },
  cost_breakdown: { compute: '$12/mo', storage: '$5/mo', database: '$8/mo', ai_api: '$15/mo', networking: '$3/mo', total_monthly: '$43/mo', total_yearly: '$516/yr' },
  timeline_estimate: '5–7 days',
  risk_assessment: ['Cold start latency on first invocation', 'DynamoDB hot partition risk at scale', 'Bedrock API rate limits during peak analysis'],
  security_checklist: ['Enable VPC endpoints for DynamoDB and S3', 'Use least-privilege IAM roles per Lambda', 'Enable CloudTrail and GuardDuty', 'Encrypt data at rest with KMS'],
  selectedOptionIndex: 0,
}

sessionStorage.setItem('projectPlan', JSON.stringify(MOCK_PLAN))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
