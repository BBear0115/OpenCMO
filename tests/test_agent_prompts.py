"""Tests for shared marketing prompt structure across core agents."""


def test_shared_marketing_prompt_contract_contains_core_rules():
    from opencmo.agents.marketing_style import (
        MARKETING_DECISION_FRAMEWORK,
        MARKETING_WRITING_RULES,
    )

    assert "Audience" in MARKETING_DECISION_FRAMEWORK
    assert "Pain" in MARKETING_DECISION_FRAMEWORK
    assert "Promise" in MARKETING_DECISION_FRAMEWORK
    assert "Proof" in MARKETING_DECISION_FRAMEWORK
    assert "Priority" in MARKETING_DECISION_FRAMEWORK
    assert "Next move" in MARKETING_DECISION_FRAMEWORK

    assert "Clarity over cleverness" in MARKETING_WRITING_RULES
    assert "Benefits over features" in MARKETING_WRITING_RULES
    assert "Specificity over vagueness" in MARKETING_WRITING_RULES
    assert "customer language" in MARKETING_WRITING_RULES


def test_core_marketing_agents_include_shared_marketing_rules():
    from opencmo.agents.blog import blog_expert
    from opencmo.agents.cmo import cmo_agent
    from opencmo.agents.community import community_agent
    from opencmo.agents.geo import geo_agent
    from opencmo.agents.seo import seo_agent
    from opencmo.agents.trend import trend_agent

    for agent in [cmo_agent, community_agent, seo_agent, trend_agent, blog_expert, geo_agent]:
        assert "Clarity over cleverness" in agent.instructions
        assert "customer language" in agent.instructions
        assert "Why this matters" in agent.instructions
        assert "Next move" in agent.instructions
