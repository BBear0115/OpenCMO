# CMO Prompt Hardening Implementation Plan

> **For agentic workers:** Follow this plan in order. Prefer small reversible commits. Write failing tests before implementation changes where behavior is not already protected.

**Goal:** Upgrade OpenCMO's prompt system so the CMO path, platform experts, autopilot, and reports all operate with stronger factual discipline, less AI marketing tone, and more native channel voice.

**Architecture:** Introduce a shared prompt-building layer composed of truth rules, anti-slop rules, task contracts, channel-native contracts, and structured brand overlays. Migrate the CMO path, experts, autopilot, reports, and review pass onto the shared contracts. Add regression tests for fabrication, platform voice, and prompt reuse.

**Tech Stack:** Python, openai-agents, pytest

---

## File Structure

### New files

- `src/opencmo/agents/prompt_contracts.py`
  - Shared truth contract, anti-slop rules, task contracts, and brand overlay helpers.
- `tests/test_prompt_contracts.py`
  - Regression tests for shared contract composition and guardrail precedence.
- `tests/test_autopilot_prompts.py`
  - Regression tests that verify autopilot reuses expert-grade prompt quality.

### Modified files

- `src/opencmo/agents/marketing_style.py`
  - Convert current shared marketing guidance into reusable contract fragments or wrappers.
- `src/opencmo/agents/cmo.py`
  - Rebuild CMO instructions around the stronger shared prompt builder.
- `src/opencmo/agents/blog.py`
  - Migrate blog expert to builder-backed contracts.
- `src/opencmo/agents/reddit.py`
  - Migrate Reddit expert to builder-backed contracts.
- `src/opencmo/agents/zhihu.py`
  - Migrate Zhihu expert to builder-backed contracts.
- `src/opencmo/agents/xiaohongshu.py`
  - Migrate Xiaohongshu expert to builder-backed contracts.
- `src/opencmo/agents/hackernews.py`
  - Tighten HN-native contract.
- `src/opencmo/agents/linkedin.py`
  - Tighten professional-social contract.
- `src/opencmo/agents/twitter.py`
  - Tighten community-social contract.
- `src/opencmo/autopilot.py`
  - Replace weak temporary agent instructions with expert-grade prompt reuse.
- `src/opencmo/storage/brand_kit.py`
  - Refactor freeform brand prompt assembly into structured overlay text with bounded priority.
- `src/opencmo/reports.py`
  - Extract shared report prompt fragments and tighten fact-vs-recommendation rules.
- `src/opencmo/marketing_review.py`
  - Reduce review-pass scope to light editorial cleanup and preserve primary prompt authority.
- `tests/test_agent_prompts.py`
  - Upgrade tests from string-existence checks to contract-level assertions.
- `tests/test_blog_writer.py`
  - Extend prompt-level expectations where needed.
- `tests/test_reports.py`
  - Extend report prompt guardrail tests.
- `tests/test_report_pipeline.py`
  - Keep anti-ungrounded-quantification constraints intact.

---

## Task 1: Add Shared Prompt Contract Layer

**Files:**
- Create: `src/opencmo/agents/prompt_contracts.py`
- Modify: `src/opencmo/agents/marketing_style.py`
- Test: `tests/test_prompt_contracts.py`

- [ ] **Step 1: Write failing tests for shared prompt layers**

Add tests that assert the new builder output includes:
- a truth/factual-discipline contract
- anti-slop and anti-marketing-tone guardrails
- support for task-specific contracts
- support for channel-specific contracts
- support for brand overlays without overriding truth rules

Suggested cases:

```python
def test_build_prompt_includes_truth_contract_before_brand_overlay():
    ...


def test_channel_contract_adds_native_rules_without_dropping_shared_guardrails():
    ...
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest tests/test_prompt_contracts.py -q`
Expected: FAIL because the shared prompt contract layer does not exist yet.

- [ ] **Step 3: Add minimal shared builder implementation**

Design the builder around small explicit fragments:
- truth contract
- anti-slop rules
- marketing decision frame
- task contract
- channel contract
- brand overlay

Implementation constraints:
- keep it Python-native
- no new dependency
- keep output deterministic and readable for tests

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest tests/test_prompt_contracts.py -q`
Expected: PASS

---

## Task 2: Migrate CMO And Core Experts To Shared Contracts

**Files:**
- Modify: `src/opencmo/agents/cmo.py`
- Modify: `src/opencmo/agents/blog.py`
- Modify: `src/opencmo/agents/reddit.py`
- Modify: `src/opencmo/agents/zhihu.py`
- Modify: `src/opencmo/agents/xiaohongshu.py`
- Modify: `src/opencmo/agents/hackernews.py`
- Modify: `src/opencmo/agents/linkedin.py`
- Modify: `src/opencmo/agents/twitter.py`
- Modify: `tests/test_agent_prompts.py`

- [ ] **Step 1: Write failing regression tests for upgraded contract behavior**

Extend existing prompt tests to assert:
- CMO includes stronger judgment/evidence framing
- Reddit includes anti-marketing and native-maker framing
- Zhihu includes useful/experience-based low-hard-sell framing
- Blog includes evidence-aware longform expectations
- all key agents still include shared marketing decision outputs

Suggested cases:

```python
def test_cmo_prompt_requires_evidence_and_explicit_uncertainty():
    ...


def test_reddit_prompt_prioritizes_native_community_voice():
    ...


def test_zhihu_prompt_prioritizes_useful_low_hardsell_voice():
    ...
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest tests/test_agent_prompts.py -q`
Expected: FAIL on new contract expectations.

- [ ] **Step 3: Migrate agent instructions to the shared builder**

Implementation notes:
- keep channel-native specifics in the expert files or close to them
- keep shared truth and anti-slop rules centralized
- avoid making channel experts generic again through over-centralization

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest tests/test_agent_prompts.py -q`
Expected: PASS

---

## Task 3: Make Autopilot Reuse Expert-Grade Prompt Quality

**Files:**
- Modify: `src/opencmo/autopilot.py`
- Test: `tests/test_autopilot_prompts.py`

- [ ] **Step 1: Write failing tests for autopilot prompt reuse**

Add tests that prove autopilot no longer creates weak generic prompt text.

Suggested cases:

```python
@pytest.mark.asyncio
async def test_autopilot_uses_expert_grade_prompt_contract_for_blog():
    ...


@pytest.mark.asyncio
async def test_autopilot_applies_brand_overlay_without_losing_truth_rules():
    ...
```

Assertions should focus on:
- expert-grade contract reuse
- preservation of truth rules
- preservation of channel-native constraints

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest tests/test_autopilot_prompts.py -q`
Expected: FAIL because autopilot still constructs generic temporary instructions.

- [ ] **Step 3: Refactor autopilot generation path**

Implementation options:
- reuse actual expert objects when feasible
- or call a shared builder that assembles the same instruction quality tier for autopilot tasks

Key rule:
- do not keep the current generic `You are {agent_name}` fallback as the main path

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest tests/test_autopilot_prompts.py -q`
Expected: PASS

---

## Task 4: Restructure Brand Kit Overlay Precedence

**Files:**
- Modify: `src/opencmo/storage/brand_kit.py`
- Modify: `src/opencmo/agents/prompt_contracts.py`
- Test: `tests/test_prompt_contracts.py`

- [ ] **Step 1: Write failing tests for brand overlay boundaries**

Add cases that verify:
- brand overlay is structured
- forbidden words and tone survive
- custom instructions cannot erase truth or channel rules

Suggested cases:

```python
def test_brand_overlay_is_structured_and_low_priority_relative_to_truth_rules():
    ...


def test_brand_overlay_keeps_channel_native_constraints_intact():
    ...
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest tests/test_prompt_contracts.py -q`
Expected: FAIL on the new precedence expectations.

- [ ] **Step 3: Refactor brand prompt assembly**

Implementation notes:
- preserve current brand-kit data model unless a schema change is strictly necessary
- structure the emitted overlay text into categories
- explicitly state precedence in the overlay wrapper

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest tests/test_prompt_contracts.py -q`
Expected: PASS

---

## Task 5: Modularize Report Prompt Fragments Without Losing Guardrails

**Files:**
- Modify: `src/opencmo/reports.py`
- Modify: `tests/test_reports.py`
- Modify: `tests/test_report_pipeline.py`

- [ ] **Step 1: Write failing tests for extracted report fragments**

Add tests that assert:
- shared factual-discipline fragments remain present
- human and agent prompts differ by audience but keep the same truth rules
- report prompts explicitly avoid invented CLI or unsupported quantification
- strategic and periodic prompt assembly stays modular

Suggested cases:

```python
def test_report_prompt_fragments_preserve_truth_rules_across_audiences():
    ...


def test_report_prompt_distinguishes_facts_from_recommendations_when_data_is_sparse():
    ...
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest tests/test_reports.py tests/test_report_pipeline.py -q`
Expected: FAIL on new modularization expectations.

- [ ] **Step 3: Extract report fragments and rebuild `_prompts()`**

Implementation notes:
- keep external behavior compatible
- reduce duplication
- keep all existing anti-fabrication and anti-ungrounded-quantification guardrails

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest tests/test_reports.py tests/test_report_pipeline.py -q`
Expected: PASS

---

## Task 6: Tighten Marketing Review Pass Scope

**Files:**
- Modify: `src/opencmo/marketing_review.py`
- Test: `tests/test_prompt_contracts.py` or dedicated review tests if needed

- [ ] **Step 1: Add failing tests for review-pass boundaries**

Verify:
- review remains language-preserving
- review does not introduce fabricated proof
- review behaves like polish rather than a full second writer

Suggested case:

```python
@pytest.mark.asyncio
async def test_review_pass_preserves_facts_and_operates_as_light_editor():
    ...
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest tests/test_prompt_contracts.py -q`
Expected: FAIL on new review-boundary expectations.

- [ ] **Step 3: Narrow review prompt scope**

Implementation notes:
- keep existing profile-awareness
- bias toward light-touch edits
- preserve platform constraints and explicit output structure

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest tests/test_prompt_contracts.py -q`
Expected: PASS

---

## Task 7: End-to-End Verification

**Files:**
- No new production files required

- [ ] **Step 1: Run focused prompt regression suite**

Run:

```bash
pytest tests/test_prompt_contracts.py tests/test_agent_prompts.py tests/test_autopilot_prompts.py tests/test_reports.py tests/test_report_pipeline.py -q
```

Expected: PASS

- [ ] **Step 2: Run adjacent existing tests**

Run:

```bash
pytest tests/test_blog_writer.py -q
```

Expected: PASS

- [ ] **Step 3: Run static verification**

Run:

```bash
ruff check src tests
```

Expected: PASS

- [ ] **Step 4: Optional broader verification if time allows**

Run:

```bash
pytest tests -q
```

Expected: PASS or known unrelated failures clearly identified.

---

## Commit Strategy

Prefer small commits by task group:

1. shared prompt contract layer
2. agent migrations
3. autopilot reuse
4. brand overlay restructuring
5. report modularization
6. review-pass boundary tightening
7. final regression and cleanup

Every commit must use the repo's Lore trailer protocol.

## Risks And Watchouts

1. Over-centralization may flatten platform-specific voice.
   Mitigation: keep channel-native rules local and explicit.

2. Prompt hardening may make outputs too stiff.
   Mitigation: keep anti-slop guidance strong and avoid over-specifying format where not needed.

3. Review-pass changes may expose weak primary prompts.
   Mitigation: fix primary prompt quality first, then narrow review scope.

4. Existing tests may encode older weaker prompt shapes.
   Mitigation: update tests toward behavior-level expectations rather than brittle exact phrasing.
