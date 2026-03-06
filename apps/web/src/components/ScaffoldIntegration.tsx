import { useState } from "react";
import { SCAFFOLD_URL, SCAFFOLD_BACKEND_URL } from "@/lib/config";

interface ScaffoldIntegrationProps {
  projectPlan?: any;
}

export default function ScaffoldIntegration({ projectPlan }: ScaffoldIntegrationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleExportToScaffold = async () => {
    if (!projectPlan) return;

    let selectedArchitecture = projectPlan.recommended_option;
    let selectedStack = projectPlan.technology_stack;

    if (projectPlan.selectedOptionIndex != null) {
      const selectedOption = projectPlan.architecture_options[projectPlan.selectedOptionIndex];
      if (selectedOption) {
        selectedArchitecture = selectedOption.name;
        selectedStack = selectedOption.stack;
      }
    }

    const planData = {
      plan_id: projectPlan.plan_id || `plan-${Date.now()}`,
      project_name: projectPlan.basics.name,
      description: projectPlan.basics.description,
      architecture: selectedArchitecture,
      tech_stack: selectedStack,
      requirements: {
        users: projectPlan.technical.user_count,
        uptime: projectPlan.technical.uptime,
        data_size: projectPlan.technical.data_size,
      },
      full_plan: projectPlan,
    };

    try {
      const response = await fetch(`${SCAFFOLD_BACKEND_URL}/api/import/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planData),
      });
      if (!response.ok) throw new Error("Failed to send plan to Scaffold AI");
      const result = await response.json();
      window.open(`${SCAFFOLD_URL}?from=planner&session=${result.session_id}`, "_blank");
      alert("Plan sent to Scaffold AI successfully!");
    } catch (error) {
      console.error("Error sending plan to Scaffold AI:", error);
      const prompt = `I have a project plan from Project Planner AI:\n\nProject: ${projectPlan.basics.name}\nDescription: ${projectPlan.basics.description}\nArchitecture: ${selectedArchitecture}\nTech Stack: ${Object.entries(selectedStack).map(([k, v]) => `${k}: ${v}`).join(", ")}\n\nPlease help me build this architecture on AWS.`;
      window.open(`${SCAFFOLD_URL}?from=planner&prompt=${encodeURIComponent(prompt)}`, "_blank");
      navigator.clipboard.writeText(prompt).catch(() => {});
      alert("Using fallback method. Plan data copied to clipboard!");
    }
  };

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

      <div className={`fixed right-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 z-40 ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Scaffold AI
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">Take your plan to the next level with Scaffold AI</p>
              <div className="space-y-3 mb-6">
                {["Generate starter code", "Run security checks", "Create infrastructure as code", "Iterate on architecture quickly", "Deploy to AWS"].map((item) => (
                  <div key={item} className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>

              {projectPlan ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="text-sm font-medium text-blue-900 mb-2">Ready to export:</div>
                  <div className="text-xs text-blue-700 mb-3">
                    <div>• {projectPlan.basics.name}</div>
                    <div>• {projectPlan.recommended_option}</div>
                    <div>• {Object.keys(projectPlan.technology_stack).length} technologies</div>
                  </div>
                  <button
                    onClick={() => {
                      const desc = `${projectPlan.basics.description}\n\nArchitecture: ${projectPlan.recommended_option}\n\nTech Stack: ${Object.entries(projectPlan.technology_stack).map(([k, v]) => `${k}: ${v}`).join(", ")}`;
                      navigator.clipboard.writeText(desc).then(() => alert("Description copied to clipboard!"));
                    }}
                    className="w-full px-3 py-2 text-sm border border-blue-300 text-blue-700 rounded hover:bg-blue-100 transition-all mb-2"
                  >
                    📋 Copy Description
                  </button>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600">Complete your plan first to export to Scaffold AI</p>
                </div>
              )}

              <button
                onClick={handleExportToScaffold}
                disabled={!projectPlan}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Open in Scaffold AI →
              </button>
            </div>

            <div className="border-t pt-6">
              <h4 className="font-semibold mb-3 text-sm">Workflow</h4>
              <div className="space-y-3">
                {[
                  { n: 1, label: "Plan", sub: "Project Planner AI", color: "blue" },
                  { n: 2, label: "Build", sub: "Scaffold AI", color: "purple" },
                  { n: 3, label: "Deploy", sub: "AWS", color: "green" },
                ].map(({ n, label, sub, color }, i) => (
                  <div key={n}>
                    {i > 0 && <div className="ml-4 border-l-2 border-gray-200 h-4 mb-3" />}
                    <div className="flex items-center text-sm">
                      <div className={`w-8 h-8 rounded-full bg-${color}-100 text-${color}-600 flex items-center justify-center font-bold mr-3 flex-shrink-0`}>{n}</div>
                      <div>
                        <div className="font-medium">{label}</div>
                        <div className="text-xs text-gray-500">{sub}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <a href={SCAFFOLD_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center">
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
