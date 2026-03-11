import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeProvider";
import { startPlanExecution, pollExecution } from "@/lib/api";
import type { PollResult } from "@/lib/api";

const POLL_INTERVAL = 3000;

interface ArchOption {
  name: string;
  description?: string;
}

export default function PlanningPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Initializing...");
  const [options, setOptions] = useState<ArchOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewCount, setReviewCount] = useState(3);
  const executionArnRef = useRef<string | null>(null);

  const handleResult = useCallback((result: PollResult) => {
    if (result.status === "RUNNING") {
      setProgress((prev) => Math.min(prev + 5, 85));
      setStatus("AI is generating your plan...");
    } else if (result.status === "SUCCEEDED") {
      setProgress(100);
      setStatus("Plan completed!");
      const projectRequest = sessionStorage.getItem("projectRequest");
      const questionnaire = projectRequest ? JSON.parse(projectRequest) : undefined;
      const planData = {
        plan_id: result.plan_id,
        questionnaire,
        recommended: result.recommended,
        alternatives: result.alternatives,
        review_findings: result.review_findings,
        selectedOptionIndex: selectedOption ?? 0,
      };
      sessionStorage.setItem("projectPlan", JSON.stringify(planData));
      setTimeout(() => navigate(`/results/${result.plan_id}`), 1000);
    } else if (result.status === "FAILED" || result.status === "TIMED_OUT" || result.status === "ABORTED") {
      setError(result.error || `Execution ${result.status.toLowerCase()}`);
      setStatus("Error");
    }
  }, [navigate, selectedOption]);

  useEffect(() => {
    const projectRequest = sessionStorage.getItem("projectRequest");
    if (!projectRequest) { navigate("/questionnaire"); return; }

    const request = JSON.parse(projectRequest);
    setReviewCount(request.review_count || 3);

    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval>;

    (async () => {
      try {
        const planId = crypto.randomUUID();
        setProgress(10);
        setStatus("Starting plan generation...");

        const { executionArn } = await startPlanExecution(request, planId);
        executionArnRef.current = executionArn;
        setProgress(20);
        setStatus("Analyzing requirements...");

        pollTimer = setInterval(async () => {
          if (cancelled) return;
          try {
            const result = await pollExecution(executionArn);
            if (!cancelled) handleResult(result);
            if (result.status !== "RUNNING") clearInterval(pollTimer);
          } catch (e: unknown) {
            if (!cancelled) {
              setError(e instanceof Error ? e.message : "Polling failed");
              setStatus("Error");
              clearInterval(pollTimer);
            }
          }
        }, POLL_INTERVAL);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to start plan generation");
          setStatus("Error");
        }
      }
    })();

    return () => { cancelled = true; if (pollTimer) clearInterval(pollTimer); };
  }, [navigate, handleResult]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-2xl w-full mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            {error ? "Error" : "AI Planning in Progress"}
          </h1>

          {error ? (
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button onClick={() => navigate("/questionnaire")} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{status}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{progress}%</span>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {[
                  { threshold: 10, label: "Starting execution" },
                  { threshold: 20, label: "Analyzing requirements" },
                  { threshold: 40, label: "Generating architecture options" },
                  { threshold: 70, label: `Performing critical reviews (${reviewCount} categories)` },
                  { threshold: 100, label: "Complete!" },
                ].map(({ threshold, label }) => (
                  <div key={label} className={`flex items-center ${progress >= threshold ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"}`}>
                    <span className="mr-2">{progress >= threshold ? "✓" : "○"}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-center mt-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
