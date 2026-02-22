import anthropic
import json
import boto3
from typing import AsyncIterator
from ..config import settings
from ..models.project import ProjectRequest, ArchitectureOption, ProjectPlan, CostBreakdown
from datetime import datetime, timezone
import uuid
import asyncio
from functools import partial


class ClaudeClient:
    """Client for Claude AI API (Anthropic or Bedrock)"""
    
    def __init__(self):
        if settings.ai_provider == "bedrock":
            session = boto3.Session(
                profile_name=settings.aws_profile if settings.aws_profile else None,
                region_name=settings.aws_region
            )
            self.client = session.client("bedrock-runtime")
            self.use_bedrock = True
        else:
            self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
            self.use_bedrock = False
        
        # Model selection based on deployment tier
        self.model_config = {
            "testing": {
                "planning": "claude-3-haiku-20240307",
                "review": "claude-3-haiku-20240307",
                "recommendation": "claude-3-haiku-20240307"
            },
            "optimized": {
                "planning": "claude-sonnet-4-20250514",
                "review": "claude-haiku-4-20250514",
                "recommendation": "claude-sonnet-4-20250514"
            },
            "premium": {
                "planning": "claude-opus-4-20250514",
                "review": "claude-opus-4-20250514",
                "recommendation": "claude-opus-4-20250514"
            }
        }
        self.models = self.model_config[settings.deployment_tier]
    
    async def _call_claude(self, prompt: str, model: str, max_tokens: int = None) -> str:
        """Call Claude via Anthropic or Bedrock"""
        max_tokens = max_tokens or settings.max_tokens
        
        if self.use_bedrock:
            # Map model names to Bedrock IDs
            model_map = {
                "claude-opus-4-20250514": "anthropic.claude-opus-4-20250514-v1:0",
                "claude-sonnet-4-20250514": "anthropic.claude-sonnet-4-20250514-v1:0",
                "claude-haiku-4-20250514": "anthropic.claude-haiku-4-20250514-v1:0",
                "claude-3-haiku-20240307": "anthropic.claude-3-haiku-20240307-v1:0",
            }
            bedrock_model = model_map.get(model, model)
            
            # Run blocking call in thread pool
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                partial(
                    self.client.invoke_model,
                    modelId=bedrock_model,
                    body=json.dumps({
                        "anthropic_version": "bedrock-2023-05-31",
                        "max_tokens": max_tokens,
                        "temperature": settings.temperature,
                        "messages": [{"role": "user", "content": prompt}]
                    })
                )
            )
            
            result = json.loads(response["body"].read())
            return result["content"][0]["text"]
        else:
            # Run blocking call in thread pool
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                partial(
                    self.client.messages.create,
                    model=model,
                    max_tokens=max_tokens,
                    temperature=settings.temperature,
                    messages=[{"role": "user", "content": prompt}]
                )
            )
            return response.content[0].text
    
    async def generate_architecture_options(
        self, 
        request: ProjectRequest,
        model: str = None
    ) -> list[ArchitectureOption]:
        """Generate 3-5 architecture options based on requirements"""
        
        model = model or self.models["planning"]
        prompt = self._build_architecture_prompt(request)
        content = await self._call_claude(prompt, model)
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
        content = await self._call_claude(prompt, self.models["review"], 2048)
        
        return {
            "iteration": iteration,
            "review_type": review_type,
            "findings": content
        }
    
    async def generate_final_recommendation(
        self,
        request: ProjectRequest,
        options: list[ArchitectureOption],
        reviews: list[dict]
    ) -> ProjectPlan:
        """Generate final recommendation after all reviews"""
        
        prompt = self._build_recommendation_prompt(request, options, reviews)
        content = await self._call_claude(prompt, self.models["recommendation"])
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
                created_at=datetime.now(timezone.utc),
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
            created_at=datetime.now(timezone.utc),
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
