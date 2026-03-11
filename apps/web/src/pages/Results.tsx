import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ScaffoldIntegration from "@/components/ScaffoldIntegration";
import { ThemeToggle } from "@/components/ThemeProvider";

interface ArchitectureOption {
  name: string;
  description?: string;
  stack?: Record<string, string>;
  pros: string[];
  cons: string[];
  cost_estimate?: string;
  monthly_cost_estimate?: string;
  complexity?: string;
  best_for?: string;
  mermaid_diagram?: string;
}

interface CostBreakdown {
  compute: string;
  storage: string;
  database: string;
  ai_api: string;
  networking: string;
  total_monthly: string;
  total_yearly: string;
}

interface ReviewFinding {
  iteration: number;
  category: string;
  findings: string[];
  recommendations: string[];
  risk_level: string;
}

interface ProjectPlan {
  plan_id: string;
  questionnaire?: {
    basics?: { name?: string; description?: string; timeline?: string; budget?: string };
  };
  recommended: ArchitectureOption;
  alternatives: ArchitectureOption[];
  review_findings: ReviewFinding[];
  cost_breakdown?: CostBreakdown;
  selectedOptionIndex?: number;
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [plan, setPlan] = useState<ProjectPlan | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(0);

  useEffect(() => {
    const storedPlan = sessionStorage.getItem("projectPlan");
    if (storedPlan) {
      const parsed = JSON.parse(storedPlan) as ProjectPlan;
      setPlan(parsed);
      setSelectedOptionIndex(parsed.selectedOptionIndex ?? 0);
      return;
    }
    if (!id) navigate("/questionnaire");
  }, [id, navigate]);

  useEffect(() => {
    if (plan && selectedOptionIndex !== null) {
      sessionStorage.setItem("projectPlan", JSON.stringify({ ...plan, selectedOptionIndex }));
    }
  }, [selectedOptionIndex, plan]);

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
      </div>
    );
  }

  const allOptions = [plan.recommended, ...plan.alternatives];
  const basics = plan.questionnaire?.basics;
  const findings = plan.review_findings ?? [];
  const securityFindings = findings.filter(f => f.category === "security");
  const allFindings = findings.flatMap(f => f.findings);
  const allRecommendations = findings.flatMap(f => f.recommendations);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-accent-600 dark:text-accent-400">Project Planner AI</h1>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button onClick={() => navigate("/questionnaire")} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                New Plan
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{basics?.name ?? "Project Plan"}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{basics?.description ?? plan.recommended.description ?? ""}</p>
          {basics && (
            <div className="flex gap-4 text-sm">
              {basics.timeline && <span className="px-3 py-1 bg-accent-100 dark:bg-accent-900/40 text-accent-800 dark:text-accent-300 rounded-full">{basics.timeline}</span>}
              {basics.budget && <span className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 rounded-full">{basics.budget}</span>}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex">
              {["overview", "architecture", "reviews", "security"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? "border-b-2 border-accent-600 text-accent-600 dark:text-accent-400"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Recommended Architecture</h3>
                  <div className="p-4 bg-accent-50 dark:bg-accent-900/20 border-l-4 border-accent-600 rounded">
                    <div className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">{plan.recommended.name}</div>
                    {plan.recommended.best_for && <p className="text-gray-700 dark:text-gray-300">{plan.recommended.best_for}</p>}
                  </div>
                </div>
                {plan.recommended.stack && (
                  <div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Technology Stack</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(plan.recommended.stack).map(([key, value]) => (
                        <div key={key} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                          <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">{key}</div>
                          <div className="font-medium text-gray-900 dark:text-white">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {plan.recommended.monthly_cost_estimate && (
                  <div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Estimated Cost</h3>
                    <p className="text-lg text-gray-700 dark:text-gray-300">{plan.recommended.monthly_cost_estimate}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "architecture" && (
              <div className="space-y-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Architecture Options</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click on an option to select it for Scaffold AI deployment
                  </p>
                </div>
                {allOptions.map((option, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedOptionIndex(idx)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedOptionIndex === idx
                        ? "border-accent-600 bg-accent-50 dark:bg-accent-900/20 shadow-md"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <input type="radio" checked={selectedOptionIndex === idx} onChange={() => setSelectedOptionIndex(idx)} className="w-5 h-5 text-accent-600" />
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{option.name}</h4>
                      </div>
                      <div className="flex gap-2">
                        {selectedOptionIndex === idx && <span className="px-2 py-1 bg-accent-600 text-white text-xs rounded">Selected</span>}
                        {idx === 0 && <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">Recommended</span>}
                      </div>
                    </div>
                    {option.description && <p className="text-gray-600 dark:text-gray-400 mb-3 ml-8">{option.description}</p>}
                    <div className="grid grid-cols-2 gap-4 mb-3 ml-8">
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pros</div>
                        <ul className="text-sm space-y-1">
                          {option.pros.map((pro, i) => <li key={i} className="text-green-600 dark:text-green-400">✓ {pro}</li>)}
                        </ul>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cons</div>
                        <ul className="text-sm space-y-1">
                          {option.cons.map((con, i) => <li key={i} className="text-red-600 dark:text-red-400">✗ {con}</li>)}
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm ml-8 text-gray-600 dark:text-gray-400">
                      {(option.cost_estimate || option.monthly_cost_estimate) && <span><strong>Cost:</strong> {option.cost_estimate ?? option.monthly_cost_estimate}</span>}
                      {option.complexity && <span><strong>Complexity:</strong> {option.complexity}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Critical Review Findings</h3>
                {findings.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No review findings yet.</p>
                ) : (
                  <>
                    <div className="space-y-4">
                      {findings.map((f, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white capitalize">{f.category.replace("_", " ")}</h4>
                            <span className={`px-2 py-1 text-xs rounded font-medium ${
                              f.risk_level === "critical" ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" :
                              f.risk_level === "high" ? "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300" :
                              f.risk_level === "medium" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" :
                              "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                            }`}>
                              {f.risk_level}
                            </span>
                          </div>
                          {f.findings.length > 0 && (
                            <ul className="text-sm space-y-1 mb-2">
                              {f.findings.map((item, i) => <li key={i} className="text-gray-700 dark:text-gray-300">• {item}</li>)}
                            </ul>
                          )}
                          {f.recommendations.length > 0 && (
                            <ul className="text-sm space-y-1">
                              {f.recommendations.map((rec, i) => <li key={i} className="text-accent-600 dark:text-accent-400">→ {rec}</li>)}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="p-4 bg-accent-50 dark:bg-accent-900/20 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {findings.length} categories reviewed · {allFindings.length} findings · {allRecommendations.length} recommendations
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Security Review</h3>
                {securityFindings.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No security-specific findings.</p>
                ) : (
                  securityFindings.map((f, idx) => (
                    <div key={idx} className="space-y-3">
                      {f.findings.map((item, i) => (
                        <div key={i} className="flex items-start p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                          <span className="text-yellow-600 dark:text-yellow-400 mr-2">⚠</span>
                          <span className="text-gray-700 dark:text-gray-300">{item}</span>
                        </div>
                      ))}
                      {f.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start p-3 bg-green-50 dark:bg-green-900/20 rounded">
                          <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                          <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                        </div>
                      ))}
                    </div>
                  ))
                )}
                <div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">All Risk Levels</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {["critical", "high", "medium", "low"].map(level => {
                      const count = findings.filter(f => f.risk_level === level).length;
                      return (
                        <div key={level} className="p-3 bg-gray-50 dark:bg-gray-700 rounded flex justify-between">
                          <span className="capitalize text-gray-700 dark:text-gray-300">{level}</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Next Steps</h3>
          <div className="flex gap-4 flex-wrap">
            <button onClick={() => navigate("/questionnaire")} className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
              Start New Plan
            </button>
          </div>
        </div>
      </div>

      <ScaffoldIntegration projectPlan={plan} />
    </div>
  );
}
