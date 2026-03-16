# Handover Checklist: Agent 5B → Agent 6

<!-- Agent 6 reads this file BEFORE starting DevOps work.       -->

## Required Outputs from Agent 5B

### Files
- [ ] `quality.md` exists in project root
- [ ] `quality_summary.md` exists (max 500 words)

### Testing
- [ ] E2E tests written and passing (Playwright or equivalent)
- [ ] All critical user paths covered by E2E (login, main feature, payment/subscription if applicable)
- [ ] E2E test run documented in quality.md (pass rate, total tests)
- [ ] Visual regression tests set up (optional but noted if skipped)

### Security Audit
- [ ] OWASP Top 10 audit completed (all 10 items reviewed)
- [ ] Security findings documented by severity: Critical / High / Medium / Low
- [ ] ALL Critical findings resolved
- [ ] ALL High findings resolved (or explicitly accepted with rationale in decisions_log.md)
- [ ] Medium findings documented with resolution plan
- [ ] Authentication and authorization logic reviewed
- [ ] Input validation reviewed (SQL injection, XSS, CSRF)
- [ ] GDPR compliance checked: data storage, deletion, consent

### Static Analysis
- [ ] Linter configured (ESLint / Pylint) and passing with 0 errors
- [ ] No unused dependencies in package.json / requirements.txt
- [ ] Code complexity checked — no functions exceeding threshold

### Observability Plan
- [ ] SLI metrics defined (what to measure)
- [ ] SLO targets defined (e.g., 99.9% uptime, p95 < 500ms)
- [ ] Logging strategy documented (what to log, log levels)
- [ ] Metrics strategy documented (what to instrument)
- [ ] Distributed tracing plan documented

### Context Files
- [ ] `decisions_log.md` updated with security decisions / accepted risks
- [ ] `status_board.md` shows: `[x] Phase 5B — Code Audit (Agent 5B) — COMPLETE`

---

## If Quality Gate FAILS

```
⛔ QUALITY GATE FAILED — Agent 5B → Agent 6

Cannot proceed to infrastructure setup with unresolved security issues.
Missing items from Agent 5B:
[List every unchecked item]

CRITICAL: Unresolved Critical/High security findings block deployment.

Action required:
Run: /agent5b-code-audit
Prompt for Agent 5B: "Quality audit is incomplete. Please complete the following:
[paste missing items]"
```
