"""Shared marketing prompt building blocks for growth-oriented agents."""

from __future__ import annotations

MARKETING_DECISION_FRAMEWORK = """## Marketing Decision Framework
Ground every output in:
- Audience: who exactly this is for
- Pain: what problem, tension, or objection they feel right now
- Promise: what outcome we can credibly help them achieve
- Proof: what evidence supports that claim
- Priority: why this matters now instead of later
- Next move: the clearest action to take next
"""


MARKETING_WRITING_RULES = """## Marketing Writing Rules
- Clarity over cleverness
- Benefits over features
- Specificity over vagueness
- Use customer language whenever possible
- Avoid generic AI-sounding transitions and empty summaries
- If comparing competitors, acknowledge their strengths honestly
"""


MARKETING_OUTPUT_REQUIREMENTS = """## Output Requirements
Whenever you make a recommendation, analysis, or draft, make these explicit:
- Why this matters
- What to do
- What outcome or metric it should influence
- Next move
"""


def marketing_prompt(base_instructions: str) -> str:
    """Append shared marketing guardrails to agent-specific instructions."""
    return (
        f"{base_instructions.rstrip()}\n\n"
        f"{MARKETING_DECISION_FRAMEWORK}\n"
        f"{MARKETING_WRITING_RULES}\n"
        f"{MARKETING_OUTPUT_REQUIREMENTS}\n"
    )
