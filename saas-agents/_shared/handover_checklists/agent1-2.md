# Handover Checklist: Agent 1 → Agent 2

<!-- Agent 2 reads this file BEFORE starting any work.          -->
<!-- If any item is unchecked, do NOT proceed.                  -->
<!-- Return to Agent 1 with the failure prompt below.           -->

## Required Outputs from Agent 1

### Files
- [ ] `discovery.md` exists in project root
- [ ] `discovery_summary.md` exists (max 500 words)

### Discovery Content
- [ ] Lean Canvas completed (all 9 blocks filled — no empty fields)
- [ ] Problem statement is specific (not "people need X" but "persona Y struggles with Z when doing W")
- [ ] Target user defined with demographic + psychographic profile
- [ ] At least 3 direct competitors identified
- [ ] Competitive positioning map created (2x2 matrix or table)
- [ ] TAM / SAM / SOM estimated with source references
- [ ] Pricing model selected with rationale (freemium / subscription / usage-based / tier)
- [ ] LTV : CAC ratio estimated (even rough)
- [ ] Business Model Canvas completed (all 9 blocks)
- [ ] Validation method chosen and plan documented (smoke test / solution interviews / pre-selling)

### Context Files
- [ ] `core.md` updated: target user, problem, value proposition, success definition
- [ ] `assumptions_log.md` has ≥ 3 active assumptions with rationale
- [ ] `decisions_log.md` has ≥ 1 entry (pricing model decision minimum)
- [ ] `status_board.md` shows: `[x] Phase 1 — Discovery (Agent 1) — COMPLETE`

---

## If Quality Gate FAILS

Stop immediately. Output this message to the user:

```
⛔ QUALITY GATE FAILED — Agent 1 → Agent 2

Cannot proceed to Product Definition. Missing items from Agent 1:
[List every unchecked item above]

Action required:
Run: /agent1-discovery
Prompt for Agent 1: "Discovery phase is incomplete. Please complete the following items and update discovery.md, discovery_summary.md, and core.md:
[paste missing items]"
```
