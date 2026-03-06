import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeProvider";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <nav className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Project Planner AI</h1>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link to="/questionnaire" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Start Planning
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Turn Ideas into Production-Ready Plans
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            AI-assisted project planning using proven methodologies.
            Get comprehensive architecture plans, cost estimates, and ready-to-use GitHub repositories in minutes.
          </p>
          <Link to="/questionnaire" className="inline-block px-8 py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 transition shadow-lg">
            Get Started Free
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {[
            { icon: "🎯", title: "Simple Questions", desc: "Answer plain-English questions about your project. No technical jargon required." },
            { icon: "🤖", title: "AI Analysis", desc: "Claude analyzes your needs and generates 3-5 architecture options with critical reviews." },
            { icon: "🚀", title: "Ready to Build", desc: "Get a comprehensive plan with architecture diagrams, cost estimates, and GitHub repository." },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">{icon}</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">How It Works</h3>
          <div className="space-y-4">
            {[
              { n: 1, title: "Answer Simple Questions", desc: "Tell us about your project, users, timeline, and budget" },
              { n: 2, title: "AI Planning Process", desc: "AI generates architecture options and performs critical reviews" },
              { n: 3, title: "Review & Customize", desc: "See recommendations, compare options, and adjust as needed" },
              { n: 4, title: "Generate Project", desc: "Create GitHub repository with comprehensive documentation and setup" },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">{n}</div>
                <div>
                  <h4 className="font-semibold mb-1 text-gray-900 dark:text-white">{title}</h4>
                  <p className="text-gray-600 dark:text-gray-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-700 mt-16 py-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600 dark:text-gray-400">
          <p>Built with ❤️ using the AI Development SOP</p>
          <p className="mt-2 text-sm">
            <a href="https://github.com/jfowler-cloud" className="text-blue-600 dark:text-blue-400 hover:underline">GitHub</a>
            {" · "}
            <a href="https://www.linkedin.com/in/james-fowler-aws-cloud-architect-dev-ops-professional/" className="text-blue-600 dark:text-blue-400 hover:underline">LinkedIn</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
