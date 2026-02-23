"use client";

import Link from "next/link";
import { useState } from "react";

interface ScaffoldIntegrationProps {
  projectPlan?: any;
}

export default function ScaffoldIntegration({ projectPlan }: ScaffoldIntegrationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleExportToScaffold = () => {
    if (projectPlan) {
      console.log("ScaffoldIntegration: Preparing data for Scaffold AI");
      
      // Determine which architecture to use
      let selectedArchitecture = projectPlan.recommended_option;
      let selectedStack = projectPlan.technology_stack;
      
      // If user selected a specific option, use that instead
      if (projectPlan.selectedOptionIndex !== null && projectPlan.selectedOptionIndex !== undefined) {
        const selectedOption = projectPlan.architecture_options[projectPlan.selectedOptionIndex];
        if (selectedOption) {
          selectedArchitecture = selectedOption.name;
          selectedStack = selectedOption.stack;
        }
      }
      
      // Create a simple prompt with the essential information
      const prompt = `I have a project plan from Project Planner AI:

Project: ${projectPlan.basics.name}
Description: ${projectPlan.basics.description}
Architecture: ${selectedArchitecture}
Tech Stack: ${Object.entries(selectedStack).map(([k, v]) => `${k}: ${v}`).join(", ")}
Requirements: ${projectPlan.technical.user_count} users, ${projectPlan.technical.uptime} uptime

Please help me build this architecture on AWS.`;
      
      // Encode just the prompt (much shorter)
      const encodedPrompt = encodeURIComponent(prompt);
      
      // Also copy description to clipboard for easy pasting
      navigator.clipboard.writeText(prompt).then(() => {
        alert('Project description copied to clipboard! It will also auto-fill in Scaffold AI.');
      }).catch(() => {
        alert('Data saved for Scaffold AI!');
      });
      
      // Open Scaffold AI (use env var for local testing, fallback to production)
      const scaffoldUrl = process.env.NEXT_PUBLIC_SCAFFOLD_URL || "https://scaffold-ai.com";
      window.open(`${scaffoldUrl}?from=planner&prompt=${encodedPrompt}`, "_blank");
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-6 bottom-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-50 flex items-center justify-center"
        title="Scaffold AI Integration"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 z-40 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Scaffold AI
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="mb-6">
              <div className="text-sm text-gray-600 mb-4">
                Take your plan to the next level with Scaffold AI
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm">Generate starter code</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm">Run security checks</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm">Create infrastructure as code</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm">Iterate on architecture quickly</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm">Deploy to AWS</span>
                </div>
              </div>

              {projectPlan ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="text-sm font-medium text-blue-900 mb-2">
                    Ready to export:
                  </div>
                  <div className="text-xs text-blue-700 mb-3">
                    <div>• {projectPlan.basics.name}</div>
                    <div>• {projectPlan.recommended_option}</div>
                    <div>• {Object.keys(projectPlan.technology_stack).length} technologies</div>
                  </div>
                  <button
                    onClick={() => {
                      const description = `${projectPlan.basics.description}\n\nArchitecture: ${projectPlan.recommended_option}\n\nTech Stack: ${Object.entries(projectPlan.technology_stack).map(([k, v]) => `${k}: ${v}`).join(', ')}`;
                      navigator.clipboard.writeText(description).then(() => {
                        alert('Description copied to clipboard!');
                      });
                    }}
                    className="w-full px-3 py-2 text-sm border border-blue-300 text-blue-700 rounded hover:bg-blue-100 transition-all mb-2"
                  >
                    📋 Copy Description
                  </button>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="text-sm text-gray-600">
                    Complete your plan first to export to Scaffold AI
                  </div>
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

            {/* Workflow */}
            <div className="border-t pt-6">
              <h4 className="font-semibold mb-3 text-sm">Workflow</h4>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3 flex-shrink-0">
                    1
                  </div>
                  <div>
                    <div className="font-medium">Plan</div>
                    <div className="text-xs text-gray-500">Project Planner AI</div>
                  </div>
                </div>
                <div className="ml-4 border-l-2 border-gray-200 h-4"></div>
                <div className="flex items-center text-sm">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold mr-3 flex-shrink-0">
                    2
                  </div>
                  <div>
                    <div className="font-medium">Build</div>
                    <div className="text-xs text-gray-500">Scaffold AI</div>
                  </div>
                </div>
                <div className="ml-4 border-l-2 border-gray-200 h-4"></div>
                <div className="flex items-center text-sm">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold mr-3 flex-shrink-0">
                    3
                  </div>
                  <div>
                    <div className="font-medium">Deploy</div>
                    <div className="text-xs text-gray-500">AWS</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-4 mt-4">
            <a
              href={process.env.NEXT_PUBLIC_SCAFFOLD_URL || "https://scaffold-ai.com"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center"
            >
              Learn more about Scaffold AI
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
