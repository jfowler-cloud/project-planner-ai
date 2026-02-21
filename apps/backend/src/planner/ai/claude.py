import anthropic
import json
from typing import AsyncIterator
from ..config import settings
from ..models.project import ProjectRequest, ArchitectureOption, ProjectPlan, CostBreakdown
from datetime import datetime
import uuid


class ClaudeClient:
    """Client for Claude AI API"""
    
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    
    async def generate_architecture_options(
        self, 
        request: ProjectRequest,
        model: str = "claude-opus-4-20250514"
    ) -> list[ArchitectureOption]:
        """Generate 3-5 architecture options based on requirements"""
        
        prompt = self._build_architecture_prompt(request)
        
        response = self.client.messages.create(
            model=model,
            max_tokens=settings.max_tokens,
            temperature=settings.temperature,
            messages=[{"role": "user", "content": prompt}]
        )
        
        content = response.content[0].text
        options = self._parse_architecture_options(content)
        return options
    
    async def perform_critical_review(
        self,
        request: ProjectRequest,
        options: list[ArchitectureOption],
        iteration: int
    ) -> dict:
        """Perform one iteration of critical review"""
        
        review_types = [
            "Security Review",
            "Cost Analysis",
            "Scalability Review",
            "Reliability Assessment",
            "Maintainability Check",
            "Performance Review",
            "Developer Experience",
            "Operational Complexity",
            "Compliance & Legal",
            "Future-Proofing"
        ]
        
        review_type = review_types[iteration - 1] if iteration <= 10 else "General Review"
        
        prompt = self._build_review_prompt(request, options, review_type)
        
        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            temperature=0.7,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return {
            "iteration": iteration,
            "review_type": review_type,
            "findings": response.content[0].text
        }
    
    async def generate_final_recommendation(
        self,
        request: ProjectRequest,
        options: list[ArchitectureOption],
        reviews: list[dict]
    ) -> ProjectPlan:
        """Generate final recommendation after all reviews"""
        
        prompt = self._build_recommendation_prompt(request, options, reviews)
        
        response = self.client.messages.create(
            model="claude-opus-4-20250514",
            max_tokens=4096,
            temperature=0.5,
            messages=[{"role": "user", "content": prompt}]
        )
        
        content = response.content[0].text
        plan = self._parse_final_plan(request, options, content)
        return plan
    
    def _build_architecture_prompt(self, request: ProjectRequest) -> str:
        """Build prompt for architecture generation"""
        return f"""You are an expert cloud architect. Generate 3-5 architecture options for this project.

Project Details:
- Name: {request.basics.name}
- Description: {request.basics.description}
- Users: {request.basics.target_users}
- Timeline: {request.basics.timeline}
- Budget: {request.basics.budget}

Technical Requirements:
- User Count: {request.technical.user_count}
- Uptime: {request.technical.uptime}
- Data Size: {request.technical.data_size}
- Data Sensitivity: {request.technical.data_sensitivity}
- Response Time: {request.technical.response_time}
- Authentication: {request.technical.authentication}
- Compliance: {', '.join(request.technical.compliance)}

Preferences:
- Backend: {request.preferences.backend_language}
- Frontend: {request.preferences.frontend_framework}
- Infrastructure: {request.preferences.infrastructure}
- Cloud: {request.preferences.cloud_provider}

Generate 3-5 architecture options. For each option, provide:
1. Name (e.g., "Full Serverless", "Containerized")
2. Description (2-3 sentences)
3. Technology stack (specific technologies)
4. Pros (3-5 bullet points)
5. Cons (3-5 bullet points)
6. Cost estimate (monthly range)
7. Complexity (Low/Medium/High)
8. Best for (who should use this)

Format as JSON array of objects with keys: name, description, stack, pros, cons, cost_estimate, complexity, best_for"""
    
    def _build_review_prompt(
        self, 
        request: ProjectRequest, 
        options: list[ArchitectureOption],
        review_type: str
    ) -> str:
        """Build prompt for critical review"""
        options_text = "\n\n".join([
            f"Option {i+1}: {opt.name}\n{opt.description}\nStack: {opt.stack}"
            for i, opt in enumerate(options)
        ])
        
        return f"""Perform a {review_type} for these architecture options.

Project: {request.basics.name}
Requirements: {request.technical.user_count} users, {request.technical.uptime} uptime

Architecture Options:
{options_text}

Provide specific findings for {review_type}:
- Key concerns or risks
- Recommendations for each option
- Critical issues that must be addressed
- Best practices to follow

Be concise but thorough."""
    
    def _build_recommendation_prompt(
        self,
        request: ProjectRequest,
        options: list[ArchitectureOption],
        reviews: list[dict]
    ) -> str:
        """Build prompt for final recommendation"""
        options_text = "\n\n".join([
            f"Option {i+1}: {opt.name}\nCost: {opt.cost_estimate}\nComplexity: {opt.complexity}"
            for i, opt in enumerate(options)
        ])
        
        reviews_text = "\n\n".join([
            f"{r['review_type']}:\n{r['findings'][:200]}..."
            for r in reviews
        ])
        
        return f"""Based on all reviews, recommend the best architecture option.

Project: {request.basics.name}
Budget: {request.basics.budget}
Timeline: {request.basics.timeline}

Options:
{options_text}

Review Summary:
{reviews_text}

Provide:
1. Recommended option name
2. Justification (why this option is best)
3. Detailed technology stack
4. Cost breakdown (compute, storage, database, networking, total)
5. Timeline estimate
6. Top 5 risks
7. Top 10 security checklist items

Format as JSON with keys: recommended_option, justification, technology_stack, cost_breakdown, timeline_estimate, risk_assessment, security_checklist"""
    
    def _parse_architecture_options(self, content: str) -> list[ArchitectureOption]:
        """Parse architecture options from Claude response"""
        try:
            # Extract JSON from markdown code blocks if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            data = json.loads(content)
            return [ArchitectureOption(**opt) for opt in data]
        except Exception as e:
            # Fallback to default options if parsing fails
            return self._get_default_options()
    
    def _parse_final_plan(
        self,
        request: ProjectRequest,
        options: list[ArchitectureOption],
        content: str
    ) -> ProjectPlan:
        """Parse final plan from Claude response"""
        try:
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            data = json.loads(content)
            
            return ProjectPlan(
                project_id=str(uuid.uuid4()),
                created_at=datetime.utcnow(),
                basics=request.basics,
                technical=request.technical,
                preferences=request.preferences,
                architecture_options=options,
                recommended_option=data["recommended_option"],
                justification=data["justification"],
                technology_stack=data["technology_stack"],
                cost_breakdown=CostBreakdown(**data["cost_breakdown"]),
                timeline_estimate=data["timeline_estimate"],
                risk_assessment=data["risk_assessment"],
                security_checklist=data["security_checklist"],
                status="completed"
            )
        except Exception:
            # Fallback plan
            return self._get_default_plan(request, options)
    
    def _get_default_options(self) -> list[ArchitectureOption]:
        """Default architecture options as fallback"""
        return [
            ArchitectureOption(
                name="Full Serverless",
                description="Zero-ops architecture using AWS Lambda, API Gateway, and DynamoDB",
                stack={"frontend": "Next.js on Vercel", "backend": "Lambda + API Gateway", "database": "DynamoDB"},
                pros=["Auto-scaling", "Pay-per-use", "Zero ops"],
                cons=["Cold starts", "Vendor lock-in"],
                cost_estimate="$50-200/month",
                complexity="Low",
                best_for="MVPs and variable traffic"
            )
        ]
    
    def _get_default_plan(
        self,
        request: ProjectRequest,
        options: list[ArchitectureOption]
    ) -> ProjectPlan:
        """Default plan as fallback"""
        return ProjectPlan(
            project_id=str(uuid.uuid4()),
            created_at=datetime.utcnow(),
            basics=request.basics,
            technical=request.technical,
            preferences=request.preferences,
            architecture_options=options,
            recommended_option=options[0].name if options else "Full Serverless",
            justification="Recommended based on requirements",
            technology_stack={"frontend": "Next.js", "backend": "FastAPI", "database": "PostgreSQL"},
            cost_breakdown=CostBreakdown(
                compute="$50/month",
                storage="$10/month",
                database="$30/month",
                ai_api="$5/month",
                networking="$5/month",
                total_monthly="$100/month",
                total_yearly="$1200/year"
            ),
            timeline_estimate=request.basics.timeline,
            risk_assessment=["Budget constraints", "Timeline pressure"],
            security_checklist=["Enable HTTPS", "Implement authentication", "Use environment variables"],
            status="completed"
        )
