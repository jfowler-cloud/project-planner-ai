import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">Project Planner AI</h1>
            <Link 
              href="/questionnaire"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Start Planning
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Turn Ideas into Production-Ready Plans
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            AI-assisted project planning using proven methodologies. 
            Get comprehensive architecture plans, cost estimates, and ready-to-use GitHub repositories in minutes.
          </p>
          <Link 
            href="/questionnaire"
            className="inline-block px-8 py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 transition shadow-lg"
          >
            Get Started Free
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Simple Questions</h3>
            <p className="text-gray-600">
              Answer plain-English questions about your project. No technical jargon required.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
            <p className="text-gray-600">
              Claude Opus analyzes your needs and generates 3-5 architecture options with 10 critical reviews.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold mb-2">Ready to Build</h3>
            <p className="text-gray-600">
              Get a comprehensive plan with architecture diagrams, cost estimates, and GitHub repository.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h3 className="text-2xl font-bold mb-6">How It Works</h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">1</div>
              <div>
                <h4 className="font-semibold mb-1">Answer Simple Questions</h4>
                <p className="text-gray-600">Tell us about your project, users, timeline, and budget</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">2</div>
              <div>
                <h4 className="font-semibold mb-1">AI Planning Process</h4>
                <p className="text-gray-600">AI generates architecture options and performs 10 critical reviews</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">3</div>
              <div>
                <h4 className="font-semibold mb-1">Review & Customize</h4>
                <p className="text-gray-600">See recommendations, compare options, and adjust as needed</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">4</div>
              <div>
                <h4 className="font-semibold mb-1">Generate Project</h4>
                <p className="text-gray-600">Create GitHub repository with comprehensive documentation and setup</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-4">Cost Estimates</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="font-semibold text-lg mb-2">Small Project</h4>
              <p className="text-3xl font-bold text-blue-600 mb-2">~$5</p>
              <p className="text-gray-600 text-sm">1-2 days timeline</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="font-semibold text-lg mb-2">Medium Project</h4>
              <p className="text-3xl font-bold text-blue-600 mb-2">~$12</p>
              <p className="text-gray-600 text-sm">1 week timeline</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="font-semibold text-lg mb-2">Large Project</h4>
              <p className="text-3xl font-bold text-blue-600 mb-2">~$30</p>
              <p className="text-gray-600 text-sm">2 weeks timeline</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t mt-16 py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>Built with ❤️ using the AI Development SOP</p>
          <p className="mt-2 text-sm">
            <a href="https://github.com/jfowler-cloud" className="text-blue-600 hover:underline">
              GitHub
            </a>
            {" · "}
            <a href="https://www.linkedin.com/in/james-fowler-aws-cloud-architect-dev-ops-professional/" className="text-blue-600 hover:underline">
              LinkedIn
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
