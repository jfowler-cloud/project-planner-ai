import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ScaffoldIntegration from "@/components/ScaffoldIntegration";
import { ThemeToggle } from "@/components/ThemeProvider";
import { startReviewExecution, pollExecution } from "@/lib/api";
import type { PollResult } from "@/lib/api";

const POLL_INTERVAL = 3000;

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

interface ReviewFinding {
  iteration: number;
  category: string;
  findings: string[];
  recommendations: string[];
  risk_level: string;
}

interface ReviewRun {
  optionIndex: number;
  optionName: string;
  findings: ReviewFinding[];
  timestamp: number;
}

interface ProjectPlan {
  plan_id: string;
  questionnaire?: {
    basics?: { name?: string; description?: string; timeline?: string; budget?: string };
    [key: string]: unknown;
  };
  recommended: ArchitectureOption;
  alternatives: ArchitectureOption[];
  review_findings: ReviewFinding[];
  selectedOptionIndex?: number;
}

function RiskBadge({ level }: { level: string }) {
  const colors =
    level === "critical" ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" :
    level === "high" ? "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300" :
    level === "medium" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" :
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
  return <span className={`px-2 py-1 text-xs rounded font-medium ${colors}`}>{level}</span>;
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [plan, setPlan] = useState<ProjectPlan | null>(null);
  const [activeTab, setActiveTab] = useState("architecture");
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(0);

  // Review execution state
  const [reviewRuns, setReviewRuns] = useState<ReviewRun[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewProgress, setReviewProgress] = useState(0);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load plan from sessionStorage
  useEffect(() => {
    const storedPlan = sessionStorage.getItem("projectPlan");
    if (storedPlan) {
      const parsed = JSON.parse(storedPlan) as ProjectPlan;
      setPlan(parsed);
      setSelectedOptionIndex(parsed.selectedOptionIndex ?? 0);

      // Restore previous review runs
      const storedRuns = sessionStorage.getItem(`reviewRuns-${parsed.plan_id}`);
      if (storedRuns) setReviewRuns(JSON.parse(storedRuns));
      return;
    }
    if (!id) navigate("/questionnaire");
  }, [id, navigate]);

  // Persist selection
  useEffect(() => {
    if (plan) {
      sessionStorage.setItem("projectPlan", JSON.stringify({ ...plan, selectedOptionIndex }));
    }
  }, [selectedOptionIndex, plan]);

  // Persist review runs
  useEffect(() => {
    if (plan && reviewRuns.length > 0) {
      sessionStorage.setItem(`reviewRuns-${plan.plan_id}`, JSON.stringify(reviewRuns));
    }
  }, [reviewRuns, plan]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollTimerRef.current) clearInterval(pollTimerRef.current); };
  }, []);

  const allOptions = plan ? [plan.recommended, ...plan.alternatives] : [];
  const selectedOption = allOptions[selectedOptionIndex];

  const handleRunReviews = useCallback(async () => {
    if (!plan || !selectedOption) return;

    setReviewLoading(true);
    setReviewProgress(10);
    setReviewError(null);
    setActiveTab("reviews");

    try {
      const { executionArn } = await startReviewExecution(
        plan.questionnaire ?? {},
        selectedOption as unknown as Record<string, unknown>,
        plan.plan_id,
      );
      setReviewProgress(20);

      pollTimerRef.current = setInterval(async () => {
        try {
          const result: PollResult = await pollExecution(executionArn);

          if (result.status === "RUNNING") {
            setReviewProgress((prev) => Math.min(prev + 5, 90));
          } else if (result.status === "SUCCEEDED") {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            const findings = (result.review_findings ?? []) as unknown as ReviewFinding[];
            const newRun: ReviewRun = {
              optionIndex: selectedOptionIndex,
              optionName: selectedOption.name,
              findings,
              timestamp: Date.now(),
            };
            setReviewRuns((prev) => [...prev, newRun]);
            setReviewProgress(100);
            setReviewLoading(false);
          } else {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setReviewError(result.error || `Review ${result.status.toLowerCase()}`);
            setReviewLoading(false);
          }
        } catch (e: unknown) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setReviewError(e instanceof Error ? e.message : "Polling failed");
          setReviewLoading(false);
        }
      }, POLL_INTERVAL);
    } catch (e: unknown) {
      setReviewError(e instanceof Error ? e.message : "Failed to start reviews");
      setReviewLoading(false);
    }
  }, [plan, selectedOption, selectedOptionIndex]);

  // Get reviews for the currently selected option
  const currentOptionReviews = reviewRuns.filter((r) => r.optionIndex === selectedOptionIndex);
  const latestReview = currentOptionReviews[currentOptionReviews.length - 1];
  const currentFindings = latestReview?.findings ?? [];
  const securityFindings = currentFindings.filter((f) => f.category === "security");

  // Summary: all findings across all review runs
  const allReviewFindings = reviewRuns.flatMap((r) => r.findings);
  const summaryByCategory = allReviewFindings.reduce<Record<string, { findings: string[]; recommendations: string[]; risk_levels: string[] }>>((acc, f) => {
    if (!acc[f.category]) acc[f.category] = { findings: [], recommendations: [], risk_levels: [] };
    acc[f.category].findings.push(...f.findings);
    acc[f.category].recommendations.push(...f.recommendations);
    acc[f.category].risk_levels.push(f.risk_level);
    return acc;
  }, {});

  const buildSummaryMarkdown = useCallback(() => {
    if (!plan || reviewRuns.length === 0) return "";
    const b = plan.questionnaire?.basics;
    const lines: string[] = [];

    lines.push(`# ${b?.name ?? "Project"} — Architecture Review Summary`);
    lines.push("");
    if (b?.description) lines.push(`> ${b.description}`);
    if (b?.timeline || b?.budget) lines.push(`> Timeline: ${b?.timeline ?? "N/A"} | Budget: ${b?.budget ?? "N/A"}`);
    lines.push("");

    // Reviewed architectures
    const reviewedIndices = [...new Set(reviewRuns.map((r) => r.optionIndex))];
    for (const optIdx of reviewedIndices) {
      const runs = reviewRuns.filter((r) => r.optionIndex === optIdx);
      const latest = runs[runs.length - 1];
      const opt = allOptions[optIdx];
      lines.push(`## ${optIdx === selectedOptionIndex ? "[Selected] " : ""}${latest.optionName}`);
      lines.push("");
      if (opt?.best_for) lines.push(`**Best for:** ${opt.best_for}`);
      if (opt?.monthly_cost_estimate || opt?.cost_estimate) {
        lines.push(`**Est. cost:** ${opt.monthly_cost_estimate ?? opt.cost_estimate}`);
      }
      if (opt?.stack) {
        lines.push("");
        lines.push("**Stack:**");
        for (const [k, v] of Object.entries(opt.stack)) {
          lines.push(`- ${k}: ${v}`);
        }
      }
      lines.push("");

      // Findings by category, sorted by risk
      const riskOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      const sorted = [...latest.findings].sort(
        (a, b) => (riskOrder[a.risk_level] ?? 3) - (riskOrder[b.risk_level] ?? 3),
      );
      for (const f of sorted) {
        lines.push(`### ${f.category.replace(/_/g, " ")} (${f.risk_level})`);
        if (f.findings.length > 0) {
          for (const item of f.findings) lines.push(`- ${item}`);
        }
        if (f.recommendations.length > 0) {
          lines.push("");
          lines.push("**Recommendations:**");
          for (const rec of f.recommendations) lines.push(`- ${rec}`);
        }
        lines.push("");
      }
    }

    // Quick stats
    const totalFindings = allReviewFindings.flatMap((f) => f.findings).length;
    const totalRecs = allReviewFindings.flatMap((f) => f.recommendations).length;
    const critHigh = allReviewFindings.filter(
      (f) => f.risk_level === "critical" || f.risk_level === "high",
    ).length;
    lines.push("---");
    lines.push(`**${reviewRuns.length}** review runs | **${totalFindings}** findings | **${totalRecs}** recommendations | **${critHigh}** critical/high categories`);

    return lines.join("\n");
  }, [plan, reviewRuns, allOptions, allReviewFindings, selectedOptionIndex]);

  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const md = buildSummaryMarkdown();
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [buildSummaryMarkdown]);

  const handleDownload = useCallback(() => {
    const md = buildSummaryMarkdown();
    const name = plan?.questionnaire?.basics?.name?.toLowerCase().replace(/\s+/g, "-") ?? "project";
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}-review-summary.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [buildSummaryMarkdown, plan]);

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
      </div>
    );
  }

  const basics = plan.questionnaire?.basics;
  const tabs = ["architecture", "reviews", "security"];

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
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{basics?.name ?? "Project Plan"}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{basics?.description ?? plan.recommended.description ?? ""}</p>
          {basics && (
            <div className="flex gap-4 text-sm">
              {basics.timeline && <span className="px-3 py-1 bg-accent-100 dark:bg-accent-900/40 text-accent-800 dark:text-accent-300 rounded-full">{basics.timeline}</span>}
              {basics.budget && <span className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 rounded-full">{basics.budget}</span>}
              {reviewRuns.length > 0 && (
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-full">
                  {reviewRuns.length} review run{reviewRuns.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex">
              {tabs.map((tab) => (
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
            {/* ── Architecture Tab ─────────────────────────────────────────── */}
            {activeTab === "architecture" && (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold mb-1 text-gray-900 dark:text-white">Architecture Options</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Select an option, then run reviews to analyze it
                    </p>
                  </div>
                  <button
                    onClick={handleRunReviews}
                    disabled={reviewLoading}
                    className="px-5 py-2.5 bg-accent-600 text-white rounded-lg hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {reviewLoading ? "Running Reviews..." : `Run Reviews on "${selectedOption?.name ?? "Selected"}"`}
                  </button>
                </div>

                {allOptions.map((option, idx) => {
                  const hasReviews = reviewRuns.some((r) => r.optionIndex === idx);
                  return (
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
                          {hasReviews && <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">Reviewed</span>}
                          {selectedOptionIndex === idx && <span className="px-2 py-1 bg-accent-600 text-white text-xs rounded">Selected</span>}
                          {idx === 0 && <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">Recommended</span>}
                        </div>
                      </div>
                      {option.best_for && <p className="text-gray-600 dark:text-gray-400 mb-3 ml-8">{option.best_for}</p>}
                      {option.stack && (
                        <div className="grid grid-cols-3 gap-2 mb-3 ml-8">
                          {Object.entries(option.stack).map(([key, value]) => (
                            <div key={key} className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                              <span className="text-gray-500 dark:text-gray-400 capitalize">{key}: </span>
                              <span className="text-gray-900 dark:text-white">{value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 mb-3 ml-8">
                        <div>
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pros</div>
                          <ul className="text-sm space-y-1">
                            {option.pros.map((pro, i) => <li key={i} className="text-green-600 dark:text-green-400">+ {pro}</li>)}
                          </ul>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cons</div>
                          <ul className="text-sm space-y-1">
                            {option.cons.map((con, i) => <li key={i} className="text-red-600 dark:text-red-400">- {con}</li>)}
                          </ul>
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm ml-8 text-gray-600 dark:text-gray-400">
                        {(option.cost_estimate || option.monthly_cost_estimate) && <span><strong>Cost:</strong> {option.cost_estimate ?? option.monthly_cost_estimate}</span>}
                        {option.complexity && <span><strong>Complexity:</strong> {option.complexity}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Reviews Tab ─────────────────────────────────────────────── */}
            {activeTab === "reviews" && (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Review Findings</h3>
                  {!reviewLoading && currentFindings.length > 0 && (
                    <button
                      onClick={handleRunReviews}
                      className="px-4 py-2 border border-accent-600 text-accent-600 dark:text-accent-400 rounded-lg hover:bg-accent-50 dark:hover:bg-accent-900/20 text-sm"
                    >
                      Re-run Reviews
                    </button>
                  )}
                </div>

                {/* Review progress */}
                {reviewLoading && (
                  <div className="p-4 bg-accent-50 dark:bg-accent-900/20 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Reviewing "{selectedOption?.name}"...
                      </span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{reviewProgress}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-accent-600 transition-all duration-500 ease-out" style={{ width: `${reviewProgress}%` }} />
                    </div>
                  </div>
                )}

                {reviewError && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-600 dark:text-red-400">{reviewError}</p>
                    <button onClick={handleRunReviews} className="mt-2 text-sm text-accent-600 dark:text-accent-400 hover:underline">
                      Retry
                    </button>
                  </div>
                )}

                {/* No reviews yet */}
                {!reviewLoading && currentFindings.length === 0 && !reviewError && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      No reviews yet for "{selectedOption?.name}".
                    </p>
                    <button
                      onClick={handleRunReviews}
                      className="px-6 py-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 font-medium"
                    >
                      Run Reviews
                    </button>
                  </div>
                )}

                {/* Findings list */}
                {currentFindings.length > 0 && (
                  <>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Showing reviews for: <strong className="text-gray-900 dark:text-white">{latestReview.optionName}</strong>
                    </div>
                    <div className="space-y-4">
                      {currentFindings.map((f, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white capitalize">{f.category.replace("_", " ")}</h4>
                            <RiskBadge level={f.risk_level} />
                          </div>
                          {f.findings.length > 0 && (
                            <ul className="text-sm space-y-1 mb-2">
                              {f.findings.map((item, i) => <li key={i} className="text-gray-700 dark:text-gray-300">&#8226; {item}</li>)}
                            </ul>
                          )}
                          {f.recommendations.length > 0 && (
                            <ul className="text-sm space-y-1">
                              {f.recommendations.map((rec, i) => <li key={i} className="text-accent-600 dark:text-accent-400">&rarr; {rec}</li>)}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="p-4 bg-accent-50 dark:bg-accent-900/20 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {currentFindings.length} categories reviewed &middot;{" "}
                        {currentFindings.flatMap((f) => f.findings).length} findings &middot;{" "}
                        {currentFindings.flatMap((f) => f.recommendations).length} recommendations
                      </div>
                    </div>
                  </>
                )}

                {/* Review run history */}
                {reviewRuns.length > 1 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Review History</h4>
                    <div className="space-y-2">
                      {reviewRuns.map((run, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                          onClick={() => { setSelectedOptionIndex(run.optionIndex); setActiveTab("reviews"); }}
                        >
                          <span className="text-gray-900 dark:text-white">{run.optionName}</span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {run.findings.length} categories &middot; {new Date(run.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Security Tab ────────────────────────────────────────────── */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Security Review</h3>

                {reviewLoading && (
                  <div className="p-4 bg-accent-50 dark:bg-accent-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent-600"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Running security review...</span>
                    </div>
                  </div>
                )}

                {!reviewLoading && securityFindings.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      {currentFindings.length === 0
                        ? "Run reviews first to see security findings."
                        : "No security-specific findings."}
                    </p>
                    {currentFindings.length === 0 && (
                      <button onClick={handleRunReviews} className="px-6 py-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 font-medium">
                        Run Reviews
                      </button>
                    )}
                  </div>
                )}

                {securityFindings.length > 0 && securityFindings.map((f, idx) => (
                  <div key={idx} className="space-y-3">
                    {f.findings.map((item, i) => (
                      <div key={`f-${i}`} className="flex items-start p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                        <span className="text-yellow-600 dark:text-yellow-400 mr-2 flex-shrink-0">!</span>
                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                      </div>
                    ))}
                    {f.recommendations.map((rec, i) => (
                      <div key={`r-${i}`} className="flex items-start p-3 bg-green-50 dark:bg-green-900/20 rounded">
                        <span className="text-green-600 dark:text-green-400 mr-2 flex-shrink-0">+</span>
                        <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                      </div>
                    ))}
                  </div>
                ))}

                {currentFindings.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">All Risk Levels</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {["critical", "high", "medium", "low"].map((level) => {
                        const count = currentFindings.filter((f) => f.risk_level === level).length;
                        return (
                          <div key={level} className="p-3 bg-gray-50 dark:bg-gray-700 rounded flex justify-between">
                            <span className="capitalize text-gray-700 dark:text-gray-300">{level}</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Summarize All Findings */}
        {reviewRuns.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Findings Summary</h3>
              <div className="flex gap-2">
                {showSummary && (
                  <>
                    <button
                      onClick={handleCopy}
                      className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium"
                    >
                      {copied ? "Copied!" : "Copy Markdown"}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium"
                    >
                      Download .md
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowSummary((prev) => !prev)}
                  className="px-5 py-2.5 bg-accent-600 text-white rounded-lg hover:bg-accent-700 font-medium"
                >
                  {showSummary ? "Hide Summary" : "Summarize All Findings"}
                </button>
              </div>
            </div>

            {showSummary && (
              <div className="space-y-6">
                {/* Overview stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{reviewRuns.length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Review Runs</div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {new Set(reviewRuns.map((r) => r.optionIndex)).size}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Options Reviewed</div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {allReviewFindings.flatMap((f) => f.findings).length}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Findings</div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {allReviewFindings.filter((f) => f.risk_level === "critical" || f.risk_level === "high").length}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Critical/High</div>
                  </div>
                </div>

                {/* By architecture option */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">By Architecture Option</h4>
                  {[...new Set(reviewRuns.map((r) => r.optionIndex))].map((optIdx) => {
                    const runs = reviewRuns.filter((r) => r.optionIndex === optIdx);
                    const latest = runs[runs.length - 1];
                    const riskCounts = { critical: 0, high: 0, medium: 0, low: 0 };
                    latest.findings.forEach((f) => {
                      const level = f.risk_level as keyof typeof riskCounts;
                      if (level in riskCounts) riskCounts[level]++;
                    });
                    return (
                      <div key={optIdx} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-3">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-medium text-gray-900 dark:text-white">{latest.optionName}</h5>
                          <div className="flex gap-2">
                            {riskCounts.critical > 0 && <RiskBadge level="critical" />}
                            {riskCounts.high > 0 && <RiskBadge level="high" />}
                            {riskCounts.medium > 0 && <span className="text-xs text-gray-500 dark:text-gray-400">{riskCounts.medium} medium</span>}
                            {riskCounts.low > 0 && <span className="text-xs text-gray-500 dark:text-gray-400">{riskCounts.low} low</span>}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {latest.findings.flatMap((f) => f.findings).length} findings &middot;{" "}
                          {latest.findings.flatMap((f) => f.recommendations).length} recommendations &middot;{" "}
                          {runs.length} run{runs.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* By category (all runs combined) */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">By Category (All Runs)</h4>
                  <div className="space-y-3">
                    {Object.entries(summaryByCategory)
                      .sort(([, a], [, b]) => {
                        const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                        const aMax = Math.min(...a.risk_levels.map((r) => riskOrder[r as keyof typeof riskOrder] ?? 3));
                        const bMax = Math.min(...b.risk_levels.map((r) => riskOrder[r as keyof typeof riskOrder] ?? 3));
                        return aMax - bMax;
                      })
                      .map(([category, data]) => {
                        const worstRisk = data.risk_levels.reduce((worst, r) => {
                          const order = { critical: 0, high: 1, medium: 2, low: 3 };
                          return (order[r as keyof typeof order] ?? 3) < (order[worst as keyof typeof order] ?? 3) ? r : worst;
                        }, "low");
                        const uniqueFindings = [...new Set(data.findings)];
                        const uniqueRecs = [...new Set(data.recommendations)];
                        return (
                          <div key={category} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-gray-900 dark:text-white capitalize">{category.replace("_", " ")}</h5>
                              <RiskBadge level={worstRisk} />
                            </div>
                            {uniqueFindings.length > 0 && (
                              <ul className="text-sm space-y-1 mb-2">
                                {uniqueFindings.map((f, i) => <li key={i} className="text-gray-700 dark:text-gray-300">&#8226; {f}</li>)}
                              </ul>
                            )}
                            {uniqueRecs.length > 0 && (
                              <ul className="text-sm space-y-1">
                                {uniqueRecs.map((r, i) => <li key={i} className="text-accent-600 dark:text-accent-400">&rarr; {r}</li>)}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Next Steps */}
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
