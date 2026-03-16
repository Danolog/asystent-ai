# Handover Checklist: Agent 2 → Agent 3

<!-- Agent 3 reads this file BEFORE starting any work.          -->

## Required Outputs from Agent 2

### Files
- [ ] `product.md` exists in project root
- [ ] `product_summary.md` exists (max 500 words)
- [ ] `product_backlog.md` exists with all User Stories

### Product Content
- [ ] Project Charter written (vision, scope, constraints, success metrics, risks)
- [ ] Vision Document written (what the product is, for whom, why it matters)
- [ ] Stakeholder map created (internal + external stakeholders identified)
- [ ] At least 10 User Stories written in INVEST format ("As a [persona], I want [goal] so that [benefit]")
- [ ] User Stories organized into Epics
- [ ] Acceptance Criteria defined for all Must-Have stories
- [ ] MoSCoW prioritization applied to full backlog
- [ ] Story Points estimated for Must-Have stories (Fibonacci)
- [ ] NFR documented: performance targets, security requirements, scalability expectations, GDPR/compliance notes
- [ ] SRS structure outlined (even if partial)

### Context Files
- [ ] `assumptions_log.md` updated with product assumptions
- [ ] `decisions_log.md` updated with key product decisions
- [ ] `status_board.md` shows: `[x] Phase 2 — Product Definition (Agent 2) — COMPLETE`

---

## If Quality Gate FAILS

```
⛔ QUALITY GATE FAILED — Agent 2 → Agent 3

Cannot proceed to UX & Design. Missing items from Agent 2:
[List every unchecked item above]

Action required:
Run: /agent2-product
Prompt for Agent 2: "Product Definition phase is incomplete. Please complete the following and update product.md, product_summary.md, and product_backlog.md:
[paste missing items]"
```
