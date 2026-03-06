import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ThemeToggle } from "@/components/ThemeProvider";

const basicsSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters").max(100, "Project name too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description too long (max 500 chars)"),
  target_users: z.string().min(3, "Target users must be at least 3 characters").max(200, "Too long (max 200 chars)"),
});

const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300";

export default function QuestionnairePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [reviewCount, setReviewCount] = useState(3);

  const { register, handleSubmit: handleBasicsSubmit, formState: { errors: basicsErrors } } = useForm({
    resolver: zodResolver(basicsSchema),
    mode: "onTouched",
  });

  const [basics, setBasics] = useState({
    name: "", description: "", target_users: "", timeline: "1 week", budget: "$100-$500",
  });

  const [technical, setTechnical] = useState({
    user_count: "1K-10K", growth_rate: "Moderate", uptime: "99%", multi_region: false,
    regions: [] as string[], data_size: "1-10GB", data_sensitivity: "Internal",
    backup_frequency: "Daily", response_time: "<500ms", heavy_computation: false,
    realtime_features: false, authentication: true, auth_type: "Email/Password" as string | null,
    compliance: ["None"], rate_limiting: true, external_apis: false, api_list: null as string | null,
    payment_processing: false, email_sms: false,
  });

  const [preferences, setPreferences] = useState({
    backend_language: "No preference", backend_framework: "No preference",
    frontend_framework: "No preference", mobile_app: false, database_type: "No preference",
    infrastructure: "No preference", cloud_provider: "No preference",
  });

  const fillDemoData = () => {
    setBasics({
      name: "Flow Log Analyzer",
      description: "A serverless application that analyzes VPC flow logs, detects anomalies, and provides visual dashboards for network traffic patterns and security insights.",
      target_users: "DevOps engineers, security analysts, and network administrators",
      timeline: "1 week", budget: "$100-$500",
    });
    setTechnical({
      user_count: "1K-10K", growth_rate: "Moderate", uptime: "99.9%", multi_region: false,
      regions: [], data_size: "10-100GB", data_sensitivity: "Confidential",
      backup_frequency: "Daily", response_time: "<500ms", heavy_computation: true,
      realtime_features: true, authentication: true, auth_type: "OAuth",
      compliance: ["None"], rate_limiting: true, external_apis: false, api_list: null,
      payment_processing: false, email_sms: true,
    });
    setPreferences({
      backend_language: "Python", backend_framework: "FastAPI", frontend_framework: "React",
      mobile_app: false, database_type: "NoSQL", infrastructure: "Serverless", cloud_provider: "AWS",
    });
    setStep(3);
  };

  const handleSubmit = () => {
    const payload = { basics, technical, preferences, review_count: reviewCount };
    sessionStorage.setItem("projectRequest", JSON.stringify(payload));
    navigate("/planning");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">Project Planner AI</h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button onClick={fillDemoData} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm">
                🚀 Demo
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {["1. Basics", "2. Technical", "3. Preferences"].map((label, i) => (
              <span key={label} className={`text-sm ${step >= i + 1 ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-gray-400 dark:text-gray-500"}`}>
                {label}
              </span>
            ))}
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
            <div className="h-2 bg-blue-600 rounded-full transition-all" style={{ width: `${(step / 3) * 100}%` }} />
          </div>
        </div>

        {/* Step 1: Basics */}
        {step === 1 && (
          <form onSubmit={handleBasicsSubmit((data) => { setBasics((prev) => ({ ...prev, ...data })); setStep(2); })}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Project Basics</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Project Name *</label>
                  <input {...register("name", { value: basics.name })} className={inputCls} placeholder="My Awesome Project" />
                  {basicsErrors.name && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{basicsErrors.name.message as string}</p>}
                </div>
                <div>
                  <label className={labelCls}>Description *</label>
                  <textarea {...register("description", { value: basics.description })} className={inputCls} rows={3} placeholder="What does your project do?" />
                  {basicsErrors.description && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{basicsErrors.description.message as string}</p>}
                </div>
                <div>
                  <label className={labelCls}>Target Users *</label>
                  <input {...register("target_users", { value: basics.target_users })} className={inputCls} placeholder="Who will use this?" />
                  {basicsErrors.target_users && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{basicsErrors.target_users.message as string}</p>}
                </div>
                <div>
                  <label className={labelCls}>Timeline</label>
                  <select value={basics.timeline} onChange={(e) => setBasics({ ...basics, timeline: e.target.value })} className={inputCls}>
                    <option>1-2 days</option><option>1 week</option><option>2 weeks</option><option>1 month</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Budget</label>
                  <select value={basics.budget} onChange={(e) => setBasics({ ...basics, budget: e.target.value })} className={inputCls}>
                    <option>&lt;$100</option><option>$100-$500</option><option>$500-$1000</option><option>$1000+</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Next</button>
              </div>
            </div>
          </form>
        )}

        {/* Step 2: Technical */}
        {step === 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Technical Requirements</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Expected Users</label>
                  <select value={technical.user_count} onChange={(e) => setTechnical({ ...technical, user_count: e.target.value })} className={inputCls}>
                    <option>&lt;100</option><option>100-1K</option><option>1K-10K</option><option>10K-100K</option><option>100K+</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Growth Rate</label>
                  <select value={technical.growth_rate} onChange={(e) => setTechnical({ ...technical, growth_rate: e.target.value })} className={inputCls}>
                    <option>Slow</option><option>Moderate</option><option>Fast</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Uptime Needs</label>
                  <select value={technical.uptime} onChange={(e) => setTechnical({ ...technical, uptime: e.target.value })} className={inputCls}>
                    <option>Best effort</option><option>99%</option><option>99.9%</option><option>99.99%</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Response Time</label>
                  <select value={technical.response_time} onChange={(e) => setTechnical({ ...technical, response_time: e.target.value })} className={inputCls}>
                    <option>&lt;1s</option><option>&lt;500ms</option><option>&lt;200ms</option><option>&lt;100ms</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Data Size</label>
                  <select value={technical.data_size} onChange={(e) => setTechnical({ ...technical, data_size: e.target.value })} className={inputCls}>
                    <option>&lt;1GB</option><option>1-10GB</option><option>10-100GB</option><option>100GB-1TB</option><option>1TB+</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Data Sensitivity</label>
                  <select value={technical.data_sensitivity} onChange={(e) => setTechnical({ ...technical, data_sensitivity: e.target.value })} className={inputCls}>
                    <option>Public</option><option>Internal</option><option>Confidential</option><option>Highly Sensitive</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={technical.authentication} onChange={(e) => setTechnical({ ...technical, authentication: e.target.checked })} className="w-4 h-4" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Authentication Required</span>
              </label>
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(1)} className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Back</button>
              <button onClick={() => setStep(3)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Next</button>
            </div>
          </div>
        )}

        {/* Step 3: Preferences */}
        {step === 3 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Technology Preferences</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Optional — AI will suggest if skipped</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Backend Language</label>
                  <select value={preferences.backend_language} onChange={(e) => setPreferences({ ...preferences, backend_language: e.target.value })} className={inputCls}>
                    <option>No preference</option><option>Python</option><option>Node.js</option><option>Go</option><option>Java</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Frontend Framework</label>
                  <select value={preferences.frontend_framework} onChange={(e) => setPreferences({ ...preferences, frontend_framework: e.target.value })} className={inputCls}>
                    <option>No preference</option><option>React</option><option>Vue</option><option>Angular</option><option>Svelte</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Infrastructure</label>
                  <select value={preferences.infrastructure} onChange={(e) => setPreferences({ ...preferences, infrastructure: e.target.value })} className={inputCls}>
                    <option>No preference</option><option>Serverless</option><option>Containers</option><option>VMs</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Cloud Provider</label>
                  <select value={preferences.cloud_provider} onChange={(e) => setPreferences({ ...preferences, cloud_provider: e.target.value })} className={inputCls}>
                    <option>No preference</option><option>AWS</option><option>Azure</option><option>GCP</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Critical Review Passes</label>
                <div className="flex items-center gap-4">
                  <input type="range" min="1" max="10" value={reviewCount} onChange={(e) => setReviewCount(Number(e.target.value))} className="flex-1 accent-blue-600" />
                  <span className="text-lg font-semibold w-8 text-center text-gray-900 dark:text-white">{reviewCount}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">More reviews = better quality but slower (default: 3)</p>
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(2)} className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Back</button>
              <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Generate Plan</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
