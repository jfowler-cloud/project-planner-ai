"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ScaffoldIntegration from "@/components/ScaffoldIntegration";

interface ProgressUpdate {
  status: string;
  progress: number;
  iteration?: number;
  options?: any[];
  plan?: any;
  error?: string;
}

export default function PlanningPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Initializing...");
  const [options, setOptions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const projectRequest = sessionStorage.getItem("projectRequest");
    
    if (!projectRequest) {
      router.push("/questionnaire");
      return;
    }

    const request = JSON.parse(projectRequest);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // Use fetch with streaming instead of EventSource for POST
    const fetchStream = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/v1/plan/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No reader available");
        }

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.error) {
                  setError(data.error);
                  setStatus("Error occurred");
                  return;
                }

                setProgress(data.progress);

                switch (data.status) {
                  case "cached":
                    setStatus("Found cached plan!");
                    if (data.plan) {
                      sessionStorage.setItem("projectPlan", JSON.stringify(data.plan));
                      setTimeout(() => router.push(`/results/${data.plan.project_id}`), 1000);
                    }
                    break;
                  
                  case "analyzing":
                    setStatus("Analyzing requirements...");
                    break;
                  
                  case "generating_options":
                    setStatus("Generating architecture options...");
                    break;
                  
                  case "options_generated":
                    setStatus("Architecture options generated!");
                    if (data.options) {
                      setOptions(data.options);
                    }
                    break;
                  
                  case "reviewing":
                    setStatus(`Performing critical review ${data.iteration}/10...`);
                    break;
                  
                  case "finalizing":
                    setStatus("Finalizing recommendation...");
                    break;
                  
                  case "completed":
                    setStatus("Plan completed!");
                    if (data.plan) {
                      sessionStorage.setItem("projectPlan", JSON.stringify(data.plan));
                      setTimeout(() => router.push(`/results/${data.plan.project_id}`), 1000);
                    }
                    break;
                }
              } catch (err) {
                console.error("Error parsing line:", err);
              }
            }
          }
        }
      } catch (err: any) {
        setError(err.message || "Connection error. Please try again.");
        setStatus("Error");
      }
    };

    fetchStream();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-8">
            {error ? "⚠️ Error" : "🤖 AI Planning in Progress"}
          </h1>

          {error ? (
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => router.push("/questionnaire")}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{status}</span>
                  <span className="text-sm font-medium text-gray-700">{progress}%</span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Status Messages */}
              <div className="space-y-3 mb-8">
                <div className={`flex items-center ${progress >= 10 ? "text-green-600" : "text-gray-400"}`}>
                  <span className="mr-2">{progress >= 10 ? "✓" : "○"}</span>
                  <span>Analyzing requirements</span>
                </div>
                <div className={`flex items-center ${progress >= 30 ? "text-green-600" : "text-gray-400"}`}>
                  <span className="mr-2">{progress >= 30 ? "✓" : "○"}</span>
                  <span>Generating architecture options</span>
                </div>
                <div className={`flex items-center ${progress >= 80 ? "text-green-600" : "text-gray-400"}`}>
                  <span className="mr-2">{progress >= 80 ? "✓" : "○"}</span>
                  <span>Performing critical reviews (10 iterations)</span>
                </div>
                <div className={`flex items-center ${progress >= 90 ? "text-green-600" : "text-gray-400"}`}>
                  <span className="mr-2">{progress >= 90 ? "✓" : "○"}</span>
                  <span>Finalizing recommendation</span>
                </div>
                <div className={`flex items-center ${progress === 100 ? "text-green-600" : "text-gray-400"}`}>
                  <span className="mr-2">{progress === 100 ? "✓" : "○"}</span>
                  <span>Complete!</span>
                </div>
              </div>

              {/* Architecture Options Preview */}
              {options.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-3">Architecture Options Generated:</h3>
                  <div className="space-y-2">
                    {options.map((option, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded">
                        <div className="font-medium">{option.name}</div>
                        <div className="text-sm text-gray-600">{option.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading Animation */}
              <div className="flex justify-center mt-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Scaffold AI Integration */}
      <ScaffoldIntegration />
    </div>
  );
}
