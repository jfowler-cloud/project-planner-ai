"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProjectBasics {
  name: string;
  description: string;
  target_users: string;
  timeline: string;
  budget: string;
}

interface TechnicalRequirements {
  user_count: string;
  growth_rate: string;
  uptime: string;
  multi_region: boolean;
  regions: string[];
  data_size: string;
  data_sensitivity: string;
  backup_frequency: string;
  response_time: string;
  heavy_computation: boolean;
  realtime_features: boolean;
  authentication: boolean;
  auth_type: string | null;
  compliance: string[];
  rate_limiting: boolean;
  external_apis: boolean;
  api_list: string | null;
  payment_processing: boolean;
  email_sms: boolean;
}

interface TechnologyPreferences {
  backend_language: string;
  backend_framework: string;
  frontend_framework: string;
  mobile_app: boolean;
  database_type: string;
  infrastructure: string;
  cloud_provider: string;
}

export default function QuestionnairePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  
  const [basics, setBasics] = useState<ProjectBasics>({
    name: "",
    description: "",
    target_users: "",
    timeline: "1 week",
    budget: "$100-$500"
  });

  const [technical, setTechnical] = useState<TechnicalRequirements>({
    user_count: "1K-10K",
    growth_rate: "Moderate",
    uptime: "99%",
    multi_region: false,
    regions: [],
    data_size: "1-10GB",
    data_sensitivity: "Internal",
    backup_frequency: "Daily",
    response_time: "<500ms",
    heavy_computation: false,
    realtime_features: false,
    authentication: true,
    auth_type: "Email/Password",
    compliance: ["None"],
    rate_limiting: true,
    external_apis: false,
    api_list: null,
    payment_processing: false,
    email_sms: false
  });

  const [preferences, setPreferences] = useState<TechnologyPreferences>({
    backend_language: "No preference",
    backend_framework: "No preference",
    frontend_framework: "No preference",
    mobile_app: false,
    database_type: "No preference",
    infrastructure: "No preference",
    cloud_provider: "No preference"
  });

  const fillDemoData = () => {
    setBasics({
      name: "Flow Log Analyzer",
      description: "A serverless application that analyzes VPC flow logs, detects anomalies, and provides visual dashboards for network traffic patterns and security insights.",
      target_users: "DevOps engineers, security analysts, and network administrators",
      timeline: "1 week",
      budget: "$100-$500"
    });
    
    setTechnical({
      user_count: "1K-10K",
      growth_rate: "Moderate",
      uptime: "99.9%",
      multi_region: false,
      regions: [],
      data_size: "10-100GB",
      data_sensitivity: "Confidential",
      backup_frequency: "Daily",
      response_time: "<500ms",
      heavy_computation: true,
      realtime_features: true,
      authentication: true,
      auth_type: "OAuth",
      compliance: ["None"],
      rate_limiting: true,
      external_apis: false,
      api_list: null,
      payment_processing: false,
      email_sms: true
    });
    
    setPreferences({
      backend_language: "Python",
      backend_framework: "FastAPI",
      frontend_framework: "React",
      mobile_app: false,
      database_type: "NoSQL",
      infrastructure: "Serverless",
      cloud_provider: "AWS"
    });
    
    setStep(3); // Jump to final step
  };

  const handleSubmit = async () => {
    const payload = { basics, technical, preferences };
    
    // Store in session storage for planning page
    sessionStorage.setItem("projectRequest", JSON.stringify(payload));
    
    // Navigate to planning page
    router.push("/planning");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-blue-600">Project Planner AI</h1>
            <button
              onClick={fillDemoData}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
            >
              🚀 Demo
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className={`text-sm ${step >= 1 ? "text-blue-600 font-semibold" : "text-gray-400"}`}>
              1. Basics
            </span>
            <span className={`text-sm ${step >= 2 ? "text-blue-600 font-semibold" : "text-gray-400"}`}>
              2. Technical
            </span>
            <span className={`text-sm ${step >= 3 ? "text-blue-600 font-semibold" : "text-gray-400"}`}>
              3. Preferences
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div 
              className="h-2 bg-blue-600 rounded-full transition-all"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Basics */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Project Basics</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Project Name *</label>
                <input
                  type="text"
                  value={basics.name}
                  onChange={(e) => setBasics({ ...basics, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="My Awesome Project"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea
                  value={basics.description}
                  onChange={(e) => setBasics({ ...basics, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="What does your project do?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Target Users *</label>
                <input
                  type="text"
                  value={basics.target_users}
                  onChange={(e) => setBasics({ ...basics, target_users: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Who will use this?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Timeline</label>
                <select
                  value={basics.timeline}
                  onChange={(e) => setBasics({ ...basics, timeline: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option>1-2 days</option>
                  <option>1 week</option>
                  <option>2 weeks</option>
                  <option>1 month</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Budget</label>
                <select
                  value={basics.budget}
                  onChange={(e) => setBasics({ ...basics, budget: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option>&lt;$100</option>
                  <option>$100-$500</option>
                  <option>$500-$1000</option>
                  <option>$1000+</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setStep(2)}
                disabled={!basics.name || !basics.description || !basics.target_users}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Technical */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Technical Requirements</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Expected Users</label>
                  <select
                    value={technical.user_count}
                    onChange={(e) => setTechnical({ ...technical, user_count: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option>&lt;100</option>
                    <option>100-1K</option>
                    <option>1K-10K</option>
                    <option>10K-100K</option>
                    <option>100K+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Growth Rate</label>
                  <select
                    value={technical.growth_rate}
                    onChange={(e) => setTechnical({ ...technical, growth_rate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option>Slow</option>
                    <option>Moderate</option>
                    <option>Fast</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Uptime Needs</label>
                  <select
                    value={technical.uptime}
                    onChange={(e) => setTechnical({ ...technical, uptime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option>Best effort</option>
                    <option>99%</option>
                    <option>99.9%</option>
                    <option>99.99%</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Response Time</label>
                  <select
                    value={technical.response_time}
                    onChange={(e) => setTechnical({ ...technical, response_time: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option>&lt;1s</option>
                    <option>&lt;500ms</option>
                    <option>&lt;200ms</option>
                    <option>&lt;100ms</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Data Size</label>
                  <select
                    value={technical.data_size}
                    onChange={(e) => setTechnical({ ...technical, data_size: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option>&lt;1GB</option>
                    <option>1-10GB</option>
                    <option>10-100GB</option>
                    <option>100GB-1TB</option>
                    <option>1TB+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Data Sensitivity</label>
                  <select
                    value={technical.data_sensitivity}
                    onChange={(e) => setTechnical({ ...technical, data_sensitivity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option>Public</option>
                    <option>Internal</option>
                    <option>Confidential</option>
                    <option>Highly Sensitive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={technical.authentication}
                    onChange={(e) => setTechnical({ ...technical, authentication: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Authentication Required</span>
                </label>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preferences */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Technology Preferences</h2>
            <p className="text-gray-600 mb-6">Optional - AI will suggest if skipped</p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Backend Language</label>
                  <select
                    value={preferences.backend_language}
                    onChange={(e) => setPreferences({ ...preferences, backend_language: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option>No preference</option>
                    <option>Python</option>
                    <option>Node.js</option>
                    <option>Go</option>
                    <option>Java</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Frontend Framework</label>
                  <select
                    value={preferences.frontend_framework}
                    onChange={(e) => setPreferences({ ...preferences, frontend_framework: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option>No preference</option>
                    <option>React</option>
                    <option>Vue</option>
                    <option>Angular</option>
                    <option>Svelte</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Infrastructure</label>
                  <select
                    value={preferences.infrastructure}
                    onChange={(e) => setPreferences({ ...preferences, infrastructure: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option>No preference</option>
                    <option>Serverless</option>
                    <option>Containers</option>
                    <option>VMs</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Cloud Provider</label>
                  <select
                    value={preferences.cloud_provider}
                    onChange={(e) => setPreferences({ ...preferences, cloud_provider: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option>No preference</option>
                    <option>AWS</option>
                    <option>Azure</option>
                    <option>GCP</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Generate Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
