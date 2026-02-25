"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ScaffoldIntegration from "@/components/ScaffoldIntegration";
import { ThemeToggle } from "@/components/ThemeProvider";

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [githubToken, setGithubToken] = useState("");
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);

  useEffect(() => {
    params.then((p) => setProjectId(p.id));
    const storedPlan = sessionStorage.getItem("projectPlan");
    if (storedPlan) {
      const parsedPlan = JSON.parse(storedPlan);
      setPlan(parsedPlan);
      if (parsedPlan.selectedOptionIndex !== null && parsedPlan.selectedOptionIndex !== undefined) {
        setSelectedOptionIndex(parsedPlan.selectedOptionIndex);
      } else {
        const idx = parsedPlan.architecture_options?.findIndex((opt: any) => opt.name === parsedPlan.recommended_option);
        setSelectedOptionIndex(idx >= 0 ? idx : 0);
      }
    } else {
      router.push("/questionnaire");
    }
  }, [router, params]);

  useEffect(() => {
    if (plan && selectedOptionIndex !== null) {
      sessionStorage.setItem("projectPlan", JSON.stringify({ ...plan, selectedOptionIndex }));
    }
  }, [selectedOptionIndex, plan]);

  const handleGenerateRepo = async () => {
    if (!plan) return;
    if (!githubToken) { setShowTokenModal(true); return; }
    setIsGenerating(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/generate-repo`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-GitHub-Token": githubToken },
        body: JSON.stringify({ plan }),
      });
      if (!response.ok) { const e = await response.json(); throw new Error(e.detail || "Failed to generate repository"); }
      const data = await response.json();
      alert(`Repository created successfully! ${data.repo_url}`);
      window.open(data.repo_url, "_blank");
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">Project Planner AI</h1>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button onClick={() => router.push("/questionnaire")} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                New Plan
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{plan.basics.name}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{plan.basics.description}</p>
          <div className="flex gap-4 text-sm">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-full">{plan.basics.timeline}</span>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 rounded-full">{plan.basics.budget}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex">
              {["overview", "architecture", "costs", "security"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
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
                  <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Recommended Architecture</h3>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 rounded">
                    <div className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">{plan.recommended_option}</div>
                    <p className="text-gray-700 dark:text-gray-300">{plan.justification}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Technology Stack</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(plan.technology_stack).map(([key, value]) => (
                      <div key={key} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">{key}</div>
                        <div className="font-medium text-gray-900 dark:text-white">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Timeline</h3>
                  <p className="text-lg text-gray-700 dark:text-gray-300">{plan.timeline_estimate}</p>
                </div>
              </div>
            )}

            {/* Architecture Tab */}
            {activeTab === "architecture" && (
              <div className="space-y-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Architecture Options</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click on an option to select it for Scaffold AI deployment
                    {selectedOptionIndex !== null && ` • Currently selected: ${plan.architecture_options[selectedOptionIndex]?.name}`}
                  </p>
                </div>
                {plan.architecture_options.map((option, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedOptionIndex(idx)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedOptionIndex === idx
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-md"
                        : option.name === plan.recommended_option
                        ? "border-blue-300 dark:border-blue-700"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <input type="radio" checked={selectedOptionIndex === idx} onChange={() => setSelectedOptionIndex(idx)} className="w-5 h-5 text-blue-600" />
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{option.name}</h4>
                      </div>
                      <div className="flex gap-2">
                        {selectedOptionIndex === idx && <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">Selected</span>}
                        {option.name === plan.recommended_option && <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">AI Recommended</span>}
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-3 ml-8">{option.description}</p>
                    <div className="grid grid-cols-2 gap-4 mb-3 ml-8">
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pros</div>
                        <ul className="text-sm space-y-1">
                          {option.pros.map((pro: string, i: number) => <li key={i} className="text-green-600 dark:text-green-400">✓ {pro}</li>)}
                        </ul>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cons</div>
                        <ul className="text-sm space-y-1">
                          {option.cons.map((con: string, i: number) => <li key={i} className="text-red-600 dark:text-red-400">✗ {con}</li>)}
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm ml-8 text-gray-600 dark:text-gray-400">
                      <span><strong>Cost:</strong> {option.cost_estimate}</span>
                      <span><strong>Complexity:</strong> {option.complexity}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Costs Tab */}
            {activeTab === "costs" && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Cost Breakdown</h3>
                <div className="space-y-3">
                  {[
                    ["Compute", plan.cost_breakdown.compute],
                    ["Storage", plan.cost_breakdown.storage],
                    ["Database", plan.cost_breakdown.database],
                    ["AI API", plan.cost_breakdown.ai_api],
                    ["Networking", plan.cost_breakdown.networking],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-gray-700 dark:text-gray-300">{label}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border-t-2 border-blue-600 rounded font-bold">
                    <span className="text-gray-900 dark:text-white">Total Monthly</span>
                    <span className="text-blue-600 dark:text-blue-400">{plan.cost_breakdown.total_monthly}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded font-bold">
                    <span className="text-gray-900 dark:text-white">Total Yearly</span>
                    <span className="text-blue-600 dark:text-blue-400">{plan.cost_breakdown.total_yearly}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Security Checklist</h3>
                  <ul className="space-y-2">
                    {plan.security_checklist.map((item, idx) => (
                      <li key={idx} className="flex items-start text-gray-700 dark:text-gray-300">
                        <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Risk Assessment</h3>
                  <ul className="space-y-2">
                    {plan.risk_assessment.map((risk, idx) => (
                      <li key={idx} className="flex items-start p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                        <span className="text-yellow-600 dark:text-yellow-400 mr-2">⚠</span>
                        <span className="text-gray-700 dark:text-gray-300">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Next Steps</h3>
          <div className="flex gap-4 flex-wrap">
            <button onClick={handleGenerateRepo} disabled={isGenerating} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
              {isGenerating ? "Generating..." : "Generate GitHub Repository"}
            </button>
            <button onClick={() => alert("PDF export is not implemented yet.")} className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
              Export as PDF
            </button>
            <button onClick={() => alert("Markdown export is not implemented yet.")} className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
              Export as Markdown
            </button>
          </div>
        </div>
      </div>

      <ScaffoldIntegration projectPlan={plan} />

      {/* GitHub Token Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">GitHub Personal Access Token Required</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Enter a GitHub Personal Access Token with <strong>repo</strong> scope to create the repository. The token is used once and never stored.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Personal Access Token</label>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                <a href="https://github.com/settings/tokens/new?scopes=repo&description=Project%20Planner%20AI" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Create a token here
                </a>
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowTokenModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Cancel</button>
              <button onClick={() => { setShowTokenModal(false); handleGenerateRepo(); }} disabled={!githubToken} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
