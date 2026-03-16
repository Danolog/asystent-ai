# Handover Checklist: Agent 3 → Agent 4A

<!-- Agent 4A reads this file BEFORE starting any work.         -->

## Required Outputs from Agent 3

### Files
- [ ] `ux.md` exists in project root
- [ ] `ux_summary.md` exists (max 500 words)

### UX Content
- [ ] At least 2 user personas created (name, role, goals, frustrations, JTBD)
- [ ] Customer Journey Map created for primary persona
- [ ] Jobs-to-be-Done defined for each persona
- [ ] Sitemap documented (all screens/pages listed hierarchically)
- [ ] User Flows created for ALL Must-Have stories (happy path + error states — both required)
- [ ] Wireframes described for core screens: login, onboarding, dashboard, main feature, settings (minimum)
- [ ] Component inventory created (list of UI components needed)
- [ ] Design System foundations defined: color palette, typography scale, spacing system
- [ ] Usability test plan created (what to test, with whom, success criteria)

### Context Files
- [ ] `assumptions_log.md` updated with UX assumptions
- [ ] `decisions_log.md` updated with design decisions
- [ ] `status_board.md` shows: `[x] Phase 3 — UX & Design (Agent 3) — COMPLETE`

---

## If Quality Gate FAILS

```
⛔ QUALITY GATE FAILED — Agent 3 → Agent 4A

Cannot proceed to Tech Foundation. Missing items from Agent 3:
[List every unchecked item above]

CRITICAL: Error states in User Flows are mandatory.
Tech cannot make architecture decisions without knowing all edge cases.

Action required:
Run: /agent3-ux
Prompt for Agent 3: "UX phase is incomplete. Please complete the following and update ux.md and ux_summary.md:
[paste missing items]"
```
