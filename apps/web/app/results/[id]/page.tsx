"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ProjectPlan {
  project_id: string;
  basics: any;
  technical: any;
  preferences: any;
  architecture_options: any[];
  recommended_option: string;
  justification: string;
  technology_stack: Record<string, string>;
  cost_breakdown: {
    compute: string;
    storage: string;
    database: string;
    ai_api: string;
    networking: string;
    total_monthly: string;
    total_yearly: string;
  };
  timeline_estimate: string;
  risk_assessment: string[];
  security_checklist: string[];
}

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [plan, setPlan] = useState<ProjectPlan | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [projectId, setProjectId] = useState<string>("");

  useEffect(() => {
    params.then((p) => setProjectId(p.id));
    
    const storedPlan = sessionStorage.getItem("projectPlan");
    
    if (storedPlan) {
      setPlan(JSON.parse(storedPlan));
    } else {
      router.push("/questionnaire");
    }
  }, [router, params]);

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-blue-600">Project Planner AI</h1>
            <button
              onClick={() => router.push("/questionnaire")}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              New Plan
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">{plan.basics.name}</h1>
          <p className="text-gray-600 mb-4">{plan.basics.description}</p>
          <div className="flex gap-4 text-sm">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
              {plan.basics.timeline}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
              {plan.basics.budget}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b">
            <div className="flex">
              {["overview", "architecture", "costs", "security"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 font-medium capitalize ${
                    activeTab === tab
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-3">Recommended Architecture</h3>
                  <div className="p-4 bg-blue-50 border-l-4 border-blue-600 rounded">
                    <div className="font-semibold text-lg mb-2">{plan.recommended_option}</div>
                    <p className="text-gray-700">{plan.justification}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3">Technology Stack</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(plan.technology_stack).map(([key, value]) => (
                      <div key={key} className="p-3 bg-gray-50 rounded">
                        <div className="text-sm text-gray-600 capitalize">{key}</div>
                        <div className="font-medium">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3">Timeline</h3>
                  <p className="text-lg">{plan.timeline_estimate}</p>
                </div>
              </div>
            )}

            {/* Architecture Tab */}
            {activeTab === "architecture" && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold mb-3">Architecture Options</h3>
                {plan.architecture_options.map((option, idx) => (
                  <div
                    key={idx}
                    className={`p-4 border rounded-lg ${
                      option.name === plan.recommended_option
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-lg font-semibold">{option.name}</h4>
                      {option.name === plan.recommended_option && (
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{option.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Pros</div>
                        <ul className="text-sm space-y-1">
                          {option.pros.map((pro: string, i: number) => (
                            <li key={i} className="text-green-600">✓ {pro}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Cons</div>
                        <ul className="text-sm space-y-1">
                          {option.cons.map((con: string, i: number) => (
                            <li key={i} className="text-red-600">✗ {con}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-600">
                        <strong>Cost:</strong> {option.cost_estimate}
                      </span>
                      <span className="text-gray-600">
                        <strong>Complexity:</strong> {option.complexity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Costs Tab */}
            {activeTab === "costs" && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold mb-3">Cost Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-50 rounded">
                    <span>Compute</span>
                    <span className="font-medium">{plan.cost_breakdown.compute}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded">
                    <span>Storage</span>
                    <span className="font-medium">{plan.cost_breakdown.storage}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded">
                    <span>Database</span>
                    <span className="font-medium">{plan.cost_breakdown.database}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded">
                    <span>AI API</span>
                    <span className="font-medium">{plan.cost_breakdown.ai_api}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded">
                    <span>Networking</span>
                    <span className="font-medium">{plan.cost_breakdown.networking}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-blue-50 border-t-2 border-blue-600 rounded font-bold">
                    <span>Total Monthly</span>
                    <span className="text-blue-600">{plan.cost_breakdown.total_monthly}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-blue-50 rounded font-bold">
                    <span>Total Yearly</span>
                    <span className="text-blue-600">{plan.cost_breakdown.total_yearly}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-3">Security Checklist</h3>
                  <ul className="space-y-2">
                    {plan.security_checklist.map((item, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3">Risk Assessment</h3>
                  <ul className="space-y-2">
                    {plan.risk_assessment.map((risk, idx) => (
                      <li key={idx} className="flex items-start p-3 bg-yellow-50 rounded">
                        <span className="text-yellow-600 mr-2">⚠</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Next Steps</h3>
          <div className="flex gap-4">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Generate GitHub Repository
            </button>
            <button className="px-6 py-3 border rounded-lg hover:bg-gray-50">
              Export as PDF
            </button>
            <button className="px-6 py-3 border rounded-lg hover:bg-gray-50">
              Export as Markdown
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
