"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PlanningError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Planning page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Planning Error</h2>
        <p className="text-gray-600 mb-6">
          {error.message || "An error occurred while generating your plan."}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try again
          </button>
          <button
            onClick={() => router.push("/questionnaire")}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
          >
            Start over
          </button>
        </div>
      </div>
    </div>
  );
}
