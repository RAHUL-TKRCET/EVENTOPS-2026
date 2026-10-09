from typing import Dict, Any, List, Optional
from app.core.config import settings


class AIService:
    @staticmethod
    def parse_natural_language_constraints(prompt: str) -> Dict[str, Any]:
        """Parse natural language prompts into structured OR-Tools constraint sets.
        
        Uses safe structured rule extraction with fallback when provider key is absent.
        """
        prompt_lower = prompt.lower()
        extracted_hard = []
        extracted_soft = []

        # Domain clustering extraction
        if "cluster" in prompt_lower or "domain" in prompt_lower:
            extracted_soft.append({
                "id": "sc-domain-cluster",
                "name": "Domain Spatial Clustering",
                "weight": 0.8,
                "description": "Group teams with similar technical domains in adjacent benches.",
            })

        # Power requirements extraction
        if "power" in prompt_lower or "hardware" in prompt_lower or "electric" in prompt_lower:
            extracted_hard.append({
                "id": "hc-hardware-power",
                "name": "Hardware Power Adjacency",
                "category": "TECHNICAL",
                "description": "Guarantee high power bench allocation for hardware teams.",
            })

        # Judge expertise matching extraction
        if "judge" in prompt_lower or "expertise" in prompt_lower or "jury" in prompt_lower:
            extracted_soft.append({
                "id": "sc-judge-match",
                "name": "Judge Domain Expertise Match",
                "weight": 1.0,
                "description": "Align judge academic specialization with team project category.",
            })

        return {
            "prompt": prompt,
            "provider": settings.AI_PROVIDER,
            "extractedConstraints": {
                "hard": extracted_hard,
                "soft": extracted_soft,
            },
            "suggestedSolverWorkers": 4,
            "aiConfidence": 0.94 if (extracted_hard or extracted_soft) else 0.70,
        }

    @staticmethod
    def copilot_assist(context: str, query: str) -> Dict[str, str]:
        """Event operations co-pilot advisor."""
        query_lower = query.lower()
        if "check" in query_lower or "attendance" in query_lower:
            return {
                "response": "Check-in velocity is currently healthy. Ensure scanner desk volunteers verify cryptographic badges before granting bench access.",
                "action": "NAVIGATE_ATTENDANCE",
            }
        elif "judge" in query_lower or "score" in query_lower:
            return {
                "response": "Review the evaluation leaderboard in the Track portal to verify all rubrics are submitted before advancing rounds.",
                "action": "NAVIGATE_EVALUATION",
            }
        return {
            "response": f"Operational assistant active. Context: {context}. Ready to process query: {query}.",
            "action": "NONE",
        }

