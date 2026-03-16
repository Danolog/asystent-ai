# Handover Checklist: Agent 4B → Agent 5B

<!-- Agent 5B reads this file BEFORE starting audit.            -->

## Required Outputs from Agent 4B

### Files
- [ ] `dev.md` exists in project root
- [ ] `dev_summary.md` exists (max 500 words)

### Story Completion (check status_board.md)
- [ ] ALL Must-Have User Stories are marked `GREEN BUILD ✓` in status_board.md
- [ ] No story is marked as "skipped", "partial", or "TODO"
- [ ] Every story has passing unit tests (verified in terminal)
- [ ] Every story has passing integration tests (verified in terminal)

### Code Quality
- [ ] Interface contracts respected — no endpoint names or types deviated without ADR entry
- [ ] All database tables match db_schema.sql (no undocumented columns)
- [ ] TypeScript: zero `any` types in production code (test files exempt)
- [ ] No hardcoded secrets or API keys in code (use env vars)
- [ ] `.env.example` file created with all required variables (without real values)
- [ ] README.md updated with setup instructions (clone → install → run)

### Git
- [ ] All commits follow Conventional Commits format
- [ ] Feature branches merged to main/develop via PR
- [ ] No merge conflicts outstanding

### Context Files
- [ ] `decisions_log.md` updated with significant development decisions
- [ ] `status_board.md` shows: `[x] Phase 4B — Development (Agent 4B) — COMPLETE`

---

## If Quality Gate FAILS

```
⛔ QUALITY GATE FAILED — Agent 4B → Agent 5B

Cannot begin security and quality audit on incomplete code.
Missing items from Agent 4B:
[List every unchecked item above]

Action required:
Run: /agent4b-dev
Prompt for Agent 4B: "Development phase is incomplete. Please complete the following before handing off to Agent 5B:
[paste missing items]

Resume from Story #[check status_board.md for last GREEN BUILD]"
```
