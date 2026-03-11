import { useState } from "react";
import { SCAFFOLD_URL } from "@/lib/config";

interface ArchitectureOption {
  name: string;
  description?: string;
  stack?: Record<string, string>;
  pros: string[];
  cons: string[];
}

interface ProjectPlan {
  plan_id: string;
  questionnaire?: {
    basics?: { name?: string; description?: string };
    technical?: { user_count?: string; uptime?: string; data_size?: string };
  };
  recommended: ArchitectureOption;
  alternatives: ArchitectureOption[];
  selectedOptionIndex?: number;
}

interface ScaffoldIntegrationProps {
  projectPlan?: ProjectPlan;
}

export default function ScaffoldIntegration({ projectPlan }: ScaffoldIntegrationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getSelectedOption = (): ArchitectureOption | undefined => {
    if (!projectPlan) return undefined;
    const allOptions = [projectPlan.recommended, ...projectPlan.alternatives];
    const idx = projectPlan.selectedOptionIndex ?? 0;
    return allOptions[idx] ?? projectPlan.recommended;
  };

  const selected = getSelectedOption();
  const basics = projectPlan?.questionnaire?.basics;
  const stackCount = selected?.stack ? Object.keys(selected.stack).length : 0;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-6 bottom-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-50 flex items-center justify-center"
        title="Scaffold AI Integration"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </button>

      <div className={`fixed right-0 top-0 h-full w-80 bg-zinc-900 shadow-2xl transform transition-transform duration-300 z-40 ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Scaffold AI
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="mb-6">
              <p className="text-sm text-zinc-400 mb-4">Take your plan to the next level with Scaffold AI</p>
              <div className="space-y-3 mb-6">
                {["Generate starter code", "Run security checks", "Create infrastructure as code", "Iterate on architecture quickly", "Deploy to AWS"].map((item) => (
                  <div key={item} className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span className="text-sm text-zinc-200">{item}</span>
                  </div>
                ))}
              </div>

              {projectPlan ? (
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 mb-4">
                  <div className="text-sm font-medium text-zinc-200 mb-2">Ready to export:</div>
                  <div className="text-xs text-zinc-400 mb-3">
                    <div>• {basics?.name ?? "Untitled"}</div>
                    <div>• {selected?.name ?? "No architecture selected"}</div>
                    {stackCount > 0 && <div>• {stackCount} technologies</div>}
                  </div>
                  <button
                    onClick={() => {
                      const desc = `${basics?.description ?? ""}\n\nArchitecture: ${selected?.name ?? "N/A"}\n\nTech Stack: ${selected?.stack ? Object.entries(selected.stack).map(([k, v]) => `${k}: ${v}`).join(", ") : "N/A"}`;
                      navigator.clipboard.writeText(desc).then(() => alert("Description copied to clipboard!"));
                    }}
                    className="w-full px-3 py-2 text-sm border border-zinc-600 text-zinc-300 rounded hover:bg-zinc-700 transition-all mb-2"
                  >
                    📋 Copy Description
                  </button>
                </div>
              ) : (
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 mb-4">
                  <p className="text-sm text-zinc-400">Complete your plan first to export to Scaffold AI</p>
                </div>
              )}

              <button
                onClick={() => alert("Scaffold AI integration is on the roadmap. For now, use Copy Description or export your review summary from the Findings Summary section.")}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg opacity-60 cursor-default font-medium"
              >
                Open in Scaffold AI — Coming Soon
              </button>
            </div>

            <div className="border-t pt-6">
              <h4 className="font-semibold mb-3 text-sm text-zinc-200">Workflow</h4>
              <div className="space-y-3">
                {[
                  { n: 1, label: "Plan", sub: "Project Planner AI", color: "blue" },
                  { n: 2, label: "Build", sub: "Scaffold AI", color: "purple" },
                  { n: 3, label: "Deploy", sub: "AWS", color: "green" },
                ].map(({ n, label, sub, color }, i) => (
                  <div key={n}>
                    {i > 0 && <div className="ml-4 border-l-2 border-zinc-700 h-4 mb-3" />}
                    <div className="flex items-center text-sm">
                      <div className={`w-8 h-8 rounded-full bg-${color}-900 text-${color}-400 flex items-center justify-center font-bold mr-3 flex-shrink-0`}>{n}</div>
                      <div>
                        <div className="font-medium text-zinc-200">{label}</div>
                        <div className="text-xs text-zinc-500">{sub}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-700 pt-4 mt-4">
            <a href={SCAFFOLD_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 hover:text-zinc-300 flex items-center justify-center">
              Learn more about Scaffold AI
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-30 z-30" onClick={() => setIsOpen(false)} />}
    </>
  );
}
