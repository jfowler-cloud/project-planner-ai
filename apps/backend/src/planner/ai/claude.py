import anthropic
import json
import logging
import boto3
from typing import AsyncIterator
from ..config import settings
from ..models.project import ProjectRequest, ArchitectureOption, ProjectPlan, CostBreakdown
from datetime import datetime, timezone
import uuid
import asyncio
from functools import partial

logger = logging.getLogger(__name__)


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
    
    async def _call_claude(self, prompt: str, model: str, max_tokens: int = None, retry_count: int = 0) -> str:
        """Call Claude via Anthropic or Bedrock with retry logic"""
        max_tokens = max_tokens or settings.max_tokens
        max_retries = 3
        
        try:
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
                text = result["content"][0]["text"]
                if not text:
                    stop_reason = result.get("stop_reason", "unknown")
                    logger.error(f"Bedrock returned empty text. stop_reason={stop_reason}, usage={result.get('usage')}")
                    raise ValueError(f"Bedrock returned empty response (stop_reason={stop_reason})")
                return text
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
        except Exception as e:
            error_str = str(e)
            # Check if it's a retryable error
            if retry_count < max_retries and ("ModelErrorException" in error_str or "unexpected error" in error_str.lower() or "throttl" in error_str.lower()):
                wait_time = (retry_count + 1) * 2  # Exponential backoff: 2s, 4s, 6s
                logger.warning(f"Bedrock API error (attempt {retry_count + 1}/{max_retries}), retrying in {wait_time}s: {error_str}")
                await asyncio.sleep(wait_time)
                return await self._call_claude(prompt, model, max_tokens, retry_count + 1)
            else:
                logger.error(f"Failed to call Claude after {retry_count + 1} attempts: {e}")
                raise
    
    async def generate_architecture_options(
        self, 
        request: ProjectRequest,
        model: str = None
    ) -> list[ArchitectureOption]:
        """Generate 3-5 architecture options based on requirements"""
        model = model or self.models["planning"]
        prompt = self._build_architecture_prompt(request)
        try:
            content = await self._call_claude(prompt, model)
            options = self._parse_architecture_options(content)
        except Exception as e:
            logger.error(f"generate_architecture_options failed: {e}", exc_info=True)
            options = self._get_default_options()
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
3. Technology stack as a DICTIONARY/OBJECT with keys like "backend", "frontend", "database", "hosting" (NOT a list)
4. Pros (3-5 bullet points as array of strings)
5. Cons (3-5 bullet points as array of strings)
6. Cost estimate (monthly range, e.g., "$50-100/month")
7. Complexity - MUST be exactly one of: "Low", "Medium", or "High" (no other values allowed)
8. Best for (who should use this)

CRITICAL: Format as JSON array. Example structure:
[
  {{
    "name": "Serverless Architecture",
    "description": "Fully serverless using AWS Lambda and DynamoDB",
    "stack": {{"backend": "AWS Lambda", "frontend": "React", "database": "DynamoDB"}},
    "pros": ["Low cost", "Auto-scaling"],
    "cons": ["Cold starts", "Vendor lock-in"],
    "cost_estimate": "$50-100/month",
    "complexity": "Medium",
    "best_for": "Small to medium projects"
  }}
]"""
    
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
            f"{r['review_type']}:\n{r['findings']}"
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
3. Detailed technology stack as DICTIONARY/OBJECT (e.g., {{"backend": "FastAPI", "frontend": "React"}})
4. Cost breakdown with ALL fields: compute, storage, database, ai_api, networking, total_monthly, total_yearly
5. Timeline estimate
6. Top 5 risks as ARRAY of strings (NOT a dictionary)
7. Top 10 security checklist items as ARRAY of strings (NOT a dictionary)

Format as JSON with keys: recommended_option, justification, technology_stack, cost_breakdown, timeline_estimate, risk_assessment, security_checklist

IMPORTANT: cost_breakdown MUST include all 7 fields:
- compute: string (e.g., "$50/month")
- storage: string (e.g., "$10/month")
- database: string (e.g., "$25/month")
- ai_api: string (e.g., "$5/month")
- networking: string (e.g., "$10/month")
- total_monthly: string (e.g., "$100/month")
- total_yearly: string (e.g., "$1200/year")

IMPORTANT: risk_assessment and security_checklist MUST be arrays of strings:
- risk_assessment: ["Risk 1", "Risk 2", "Risk 3", "Risk 4", "Risk 5"]
- security_checklist: ["Item 1", "Item 2", ...]"""
    
    def _parse_architecture_options(self, content: str) -> list[ArchitectureOption]:
        """Parse architecture options from Claude response"""
        try:
            # Extract JSON from markdown code blocks if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            data = json.loads(content)
            
            # Validate and fix each option
            options = []
            for opt in data:
                # Fix stack if it's a list instead of dict
                if isinstance(opt.get("stack"), list):
                    stack_list = opt["stack"]
                    opt["stack"] = {f"tech_{i}": tech for i, tech in enumerate(stack_list)}
                
                # Fix stack values if they are lists instead of strings
                if isinstance(opt.get("stack"), dict):
                    for key, value in opt["stack"].items():
                        if isinstance(value, list):
                            # Join list items into a string
                            opt["stack"][key] = ", ".join(value)
                
                # Fix complexity if it's not exactly Low/Medium/High
                complexity = opt.get("complexity", "Medium")
                if complexity not in ["Low", "Medium", "High"]:
                    # Try to extract the main word
                    if "low" in complexity.lower():
                        opt["complexity"] = "Low"
                    elif "high" in complexity.lower():
                        opt["complexity"] = "High"
                    else:
                        opt["complexity"] = "Medium"
                
                options.append(ArchitectureOption(**opt))
            
            return options
        except Exception as e:
            logger.error("Failed to parse architecture options from AI response: %s", e, exc_info=True)
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
            
            # Try to fix common JSON issues
            # Remove trailing commas before closing braces/brackets
            import re
            content = re.sub(r',(\s*[}\]])', r'\1', content)
            
            data = json.loads(content)
            
            # Ensure cost_breakdown has all required fields with defaults
            cost_data = data.get("cost_breakdown", {})
            defaults = {
                "compute": "$0/month",
                "storage": "$0/month",
                "database": "$0/month",
                "ai_api": "$0/month",
                "networking": "$0/month",
                "total_monthly": "$100/month",
                "total_yearly": "$1200/year",
            }
            for field, default in defaults.items():
                if field not in cost_data:
                    cost_data[field] = default
            if "total_monthly" in cost_data and "total_yearly" not in cost_data:
                try:
                    amount = int(''.join(filter(str.isdigit, cost_data["total_monthly"])))
                    cost_data["total_yearly"] = f"${amount * 12}/year"
                except Exception:
                    cost_data["total_yearly"] = defaults["total_yearly"]
            
            # Fix risk_assessment if it's a dict instead of list
            risk_assessment = data.get("risk_assessment", [])
            if isinstance(risk_assessment, dict):
                # Extract values from dict
                risk_assessment = list(risk_assessment.values())
            
            # Fix security_checklist if it's a dict instead of list
            security_checklist = data.get("security_checklist", [])
            if isinstance(security_checklist, dict):
                # Extract values from dict
                security_checklist = list(security_checklist.values())
            
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
                cost_breakdown=CostBreakdown(**cost_data),
                timeline_estimate=data["timeline_estimate"],
                risk_assessment=risk_assessment,
                security_checklist=security_checklist,
                status="completed"
            )
        except Exception as e:
            logger.error("Failed to parse final plan from AI response: %s", e, exc_info=True)
            logger.error("Content was: %s", content[:500])
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
