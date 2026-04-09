# CMO Prompt Hardening Redesign

Date: 2026-04-09
Status: Approved in conversation, pending spec review
Scope: CMO chat flow, platform experts, autopilot generation, report prompts, brand-kit prompt injection, marketing review pass, prompt regression tests

## Summary

OpenCMO already has useful prompt assets, especially in the main CMO chat flow and several platform experts. The current weakness is not lack of prompt text. The weakness is uneven prompt quality across execution paths, weak prompt reuse, and insufficient guardrails against fabricated claims, off-platform tone, and generic AI marketing language.

This redesign hardens the whole prompt system around one priority: better CMO-quality judgment with stronger factual discipline and more native channel voice, across both interactive and automated flows.

The design chooses quality over cost and latency. It intentionally favors stronger constraints, deeper reasoning, and explicit evidence handling over prompt brevity.

## Problems To Solve

### Current problems

1. Main chat flow is stronger than automated generation.
   `autopilot` creates weak temporary agents instead of reusing expert-grade prompt contracts, so output quality drops outside the main conversation path.

2. Brand guidance is injected as freeform prompt text.
   This makes it possible for custom instructions to blur priority between brand preferences, factual constraints, and platform-native constraints.

3. Report prompts are effective but oversized and tightly coupled.
   Strategic and periodic prompt logic mixes role definition, scoring rules, output structure, anti-hallucination guidance, and audience behavior into one large block, making iteration brittle.

4. Prompt tests protect strings more than behavior.
   Existing tests verify that some phrases exist, but do not adequately defend against regressions in factual discipline, anti-hype behavior, or platform-native voice.

### Failures the redesign must minimize

- Fabricated facts, invented numbers, unsupported competitive claims, or invented evidence
- Channel outputs that sound technically correct but not native to the target platform
- Oily, over-marketed, AI-sounding language

## Goals

1. Unify the whole CMO system around one shared prompt contract.
2. Make factual discipline the highest-priority rule in every generation path.
3. Increase platform-native writing quality for channel experts.
4. Ensure autopilot and chat produce content at the same quality tier.
5. Keep reports sharp, evidence-based, and easier to maintain.
6. Add regression tests that protect behavior, not just phrasing.

## Non-Goals

1. This redesign does not change the product's business logic or data model outside prompt-related structures.
2. This redesign does not attempt to solve model quality limits with provider changes.
3. This redesign does not introduce new external dependencies.
4. This redesign does not redesign the frontend UX beyond prompt-related behavior already exposed by current flows.

## Chosen Approach

Three approaches were considered during brainstorming:

1. Rewrite prompt text only
2. Restructure prompt templates and contracts
3. Restructure prompt templates and contracts, then add regression verification

The chosen approach is option 3.

Reason:
- Text-only edits would improve the best path but leave the weakest path weak
- The system needs reusable prompt layers, not more isolated long strings
- Regression tests are required so future edits do not quietly reintroduce fabrication, hype, or off-platform tone

## Design Principles

1. Facts before flourish
   The system should rather say "evidence is missing" than produce a persuasive invention.

2. Judgment before draft
   The CMO layer should default to: what is happening, why it matters, what to do next.

3. Native over generic
   Each platform expert must sound like someone who understands the local norms, not like a marketing assistant wearing a costume.

4. Shared rules, local specialization
   Common rules should live once. Platform-specific behavior should only describe what is unique to that platform.

5. Review as polish, not rescue
   The final review pass should lightly tighten wording and remove AI tone. It must not compensate for weak core prompts.

## Prompt Contract Architecture

The redesigned prompt system will be organized into composable layers.

### 1. Core Truth Contract

Applied to all major generation paths.

Responsibilities:
- Require explicit separation between facts, inference, and recommendations where relevant
- Disallow fabricated metrics, invented testimonials, invented user reactions, or invented competitor strengths and weaknesses
- Force the model to acknowledge missing evidence instead of filling gaps
- Require claims to be grounded in provided context, tool results, or known project context

This layer is the highest-priority contract and must not be overridden by brand or channel preferences.

### 2. Anti-Slop and Voice Guardrails

Applied to all major generation paths.

Responsibilities:
- Ban generic AI transitions and empty summaries
- Reduce marketing-speak and announcement-speak
- Prefer concrete language, customer language, and direct judgment
- Make "why this matters" and "next move" explicit where the task is analytical or strategic

This layer creates the "senior operator" quality bar across the system.

### 3. Channel-Native Contracts

Applied only to platform or content experts.

Responsibilities:
- Define local audience expectations
- Define what language patterns feel inauthentic or promotional
- Define preferred structures and tone
- Define platform-specific hard bans and default output shape

Examples:
- Reddit: first person, humble, helpful, low-promo, explicit feedback-seeking
- Zhihu: useful, experience-driven, high signal, low hard-sell, can include "利益相关" framing when appropriate
- Xiaohongshu: concrete scenario framing, personal angle, low corporate tone
- Hacker News: technical credibility, high signal, no product-launch hype

### 4. Task Contracts

Applied based on user intent or execution mode.

Responsibilities:
- Distinguish strategy, content writing, audits, reports, and autopilot briefs
- Define expected output structure and decision depth
- Control when the system should prioritize diagnosis, recommendation, or direct drafting

Examples:
- CMO strategy task: judgment -> evidence -> recommendation -> next move
- Platform content task: native draft first, optional explanation second
- Report task: findings -> implications -> priority -> action plan

### 5. Brand Overlay Contract

Applied after truth and voice guardrails, before final output shaping.

Responsibilities:
- Inject tone, audience, values, preferred framing, forbidden words, and custom brand notes
- Constrain brand guidance so it cannot override truth, evidence, or platform safety rules

This must be structured, not freeform concatenation.

## Surface-by-Surface Redesign

### A. CMO Chat Flow

Current role:
- Router with useful context and broad marketing framing

New role:
- Evidence-driven marketing lead and orchestrator

Behavior changes:
- Default to giving a clear judgment before offering options
- When evidence is incomplete, say exactly what is known, what is inferred, and what remains uncertain
- Route platform-specific tasks to experts while preserving shared truth and anti-slop constraints
- Keep multi-channel orchestration but ensure all channel outputs inherit the same hard factual contract

Expected outcome:
- The CMO feels more decisive and less like a generalized assistant

### B. Platform Experts

Current role:
- Strong but unevenly structured platform specialists

New role:
- Specialists built from shared contracts plus explicit local-native behavior

Behavior changes:
- Move repeated generic marketing rules into shared builders
- Keep only local-native rules in each expert file
- Strengthen each expert's "what users dislike here" guidance
- Tighten output shape so the first output is directly usable

Expected outcome:
- Better channel voice with less drift and less duplicated prompt text

### C. Autopilot

Current role:
- Rule-based trigger system with weak temporary content agents

New role:
- Automated content generator that reuses expert-grade contracts

Behavior changes:
- Stop creating low-context generic agents for content generation
- Reuse the existing expert prompt path, or a shared builder that produces the same contract quality as the expert path
- Ensure brand overlays and truth constraints are applied consistently in autopilot

Expected outcome:
- Automated content quality becomes materially closer to the interactive path

### D. Report Generation

Current role:
- Strong but oversized prompt blocks

New role:
- Modular report prompts with reusable evidence and anti-hallucination layers

Behavior changes:
- Extract shared scoring, factual discipline, and anti-fabrication rules
- Separate human-audience narrative structure from agent-audience execution structure
- Separate strategic vs periodic task logic into task contract fragments

Expected outcome:
- Easier maintenance, lower regression risk, stronger factual consistency

### E. Brand Kit Injection

Current role:
- Freeform prompt fragment

New role:
- Structured prompt overlay with bounded scope

Behavior changes:
- Normalize brand kit data into explicit categories such as tone, audience, must-avoid, proof preferences, and custom notes
- Apply brand kit after truth rules so it cannot weaken factual discipline
- Treat custom instructions as low-priority notes, not as absolute system overrides

Expected outcome:
- Better brand consistency without corrupting platform or truth rules

### F. Marketing Review Pass

Current role:
- Powerful final rewrite layer

New role:
- Light editorial pass

Behavior changes:
- Keep anti-AI-tone cleanup and profile-aware phrasing guidance
- Avoid using review as a substitute for weak core prompts
- Favor light correction over large rewrites

Expected outcome:
- Final outputs feel cleaner without introducing a second competing content generator

## Proposed Internal Structure

The implementation should converge toward a small prompt-building surface, for example:

- shared truth rules
- shared anti-slop rules
- shared marketing decision frame
- task-level builders
- channel-level builders
- brand overlay builder

The exact file layout can be decided during implementation planning, but the important point is that prompt assembly becomes centralized and explicit.

The design intentionally avoids prescribing a large framework or DSL. The repo should keep a lightweight Python-native composition model.

## Data Flow

### Interactive CMO flow

1. User message enters chat router
2. Project context and locale are injected
3. CMO prompt is built from:
   - core truth contract
   - shared anti-slop rules
   - CMO task contract
   - optional brand overlay
4. CMO decides:
   - answer directly
   - hand off to a platform expert
   - orchestrate multiple tool-based expert outputs
5. Optional final review lightly edits output

### Autopilot flow

1. Insight rule chooses channel and task
2. Autopilot builds or reuses expert-grade prompt contract for that channel
3. Brand overlay is injected within bounded priority
4. Output is generated with the same factual and anti-slop constraints as the main path
5. Content enters approval flow

### Report flow

1. Facts and metadata are collected
2. Shared report evidence contract is applied
3. Audience and task contract are selected
4. Human report uses pipeline, agent brief uses single-call generation
5. Each prompt path remains bound by anti-fabrication and anti-ungrounded-quantification rules

## Error Handling And Safety

### Missing evidence

When the model lacks enough evidence:
- it should not invent support
- it should explicitly mark uncertainty
- it should suggest the next evidence to gather if the task is strategic or diagnostic

### Brand conflicts

If brand guidance conflicts with truth or platform-native constraints:
- truth wins over brand
- platform-native safety wins over brand
- brand tone is preserved only where it does not weaken those higher-priority rules

### Review failures

If the review pass fails:
- return the original output
- do not block the user flow
- do not silently replace with malformed review text unless there is clearly valid content

## Testing Strategy

This redesign requires prompt regression tests that verify behavior-level contracts.

### 1. Shared contract tests

Verify the shared builders include:
- factual discipline
- anti-fabrication constraints
- anti-AI-tone guidance
- explicit next-move framing where required

### 2. Platform contract tests

Verify each key platform contract includes its native hard rules.

Examples:
- Reddit forbids marketing-speak and requires first-person maker voice
- Zhihu requires useful, experience-based, low-hard-sell framing
- Blog requires evidence-aware longform structure and explicit research expectations

### 3. Autopilot reuse tests

Verify autopilot uses expert-grade or builder-equivalent prompt contracts rather than weak temporary generic instructions.

### 4. Brand overlay tests

Verify brand kit overlays:
- are present
- remain structured
- do not override truth rules
- do not erase platform-native constraints

### 5. Report prompt tests

Preserve and extend current guardrails:
- no fake CLI contracts
- no forced unsupported metrics
- no invented quantification
- explicit distinction between evidence-backed facts and recommendations where relevant

### 6. Review pass tests

Verify review is a light editorial pass:
- preserves language
- preserves platform constraints
- does not introduce fabricated claims

## Acceptance Criteria

The redesign is successful when:

1. Chat and autopilot share the same prompt quality tier.
2. Platform experts are more native and less generic without becoming hype-heavy.
3. The system is materially less likely to invent numbers, proof, or competitive claims.
4. Report prompts become easier to maintain and still preserve current anti-fabrication protections.
5. Regression tests defend the contracts above.

## Risks

### Risk: prompts become too rigid

If constraints are too hard, outputs may become dry or repetitive.

Mitigation:
- keep anti-slop guidance strong
- reserve flexibility inside channel-native sections
- use review pass only for polish, not for major rewrites

### Risk: builder abstraction hides important local nuance

If too much is centralized, platform prompts may lose personality.

Mitigation:
- centralize only shared rules
- keep local-native behavior explicit in each channel profile

### Risk: increased latency and token usage

Quality-first prompt composition will increase prompt size.

Mitigation:
- accept this as a chosen tradeoff
- keep reusable sections concise and information-dense

## Implementation Boundary

This spec defines the design only. It does not lock exact function names or exact file names for the eventual implementation.

Those choices should be finalized in the implementation plan, but the plan must preserve these architectural decisions:

- one shared truth contract
- one shared anti-slop contract
- task-based prompt composition
- platform-native channel contracts
- structured brand overlay
- autopilot reuse of expert-grade prompt quality
- regression tests for factual discipline and platform tone

## Open Questions

None blocking for planning. The user approved:
- quality over cost and latency
- combined strategic plus content-director personality
- priority on preventing fabrication, off-platform voice, and over-marketed tone
- willingness to change prompt structure and code paths where needed
