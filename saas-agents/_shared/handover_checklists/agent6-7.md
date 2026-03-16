# Handover Checklist: Agent 6 → Agent 7

<!-- Agent 7 reads this file BEFORE starting launch work.       -->

## Required Outputs from Agent 6

### Files
- [ ] `devops.md` exists in project root
- [ ] `devops_summary.md` exists (max 500 words)

### Infrastructure & Deployment
- [ ] Cloud infrastructure provisioned or documented (IaC files written)
- [ ] Deployment strategy decided and documented: Blue-Green / Canary / Rolling
- [ ] CI/CD pipeline configured and at least one successful deploy to staging
- [ ] All 3 environments operational: dev / staging / production
- [ ] Environment variables / secrets managed (not in code — use Vault/AWS Secrets Manager/env service)
- [ ] Database migration strategy documented and tested on staging
- [ ] Rollback procedure documented and tested

### Monitoring & Alerting
- [ ] Monitoring dashboards configured (Grafana / Datadog / CloudWatch)
- [ ] Alerting rules defined for: error rate spike, latency spike, availability drop
- [ ] On-call rotation defined (even if it's just you for now)
- [ ] Health check endpoints implemented and monitored

### Reliability
- [ ] Disaster Recovery Plan written
- [ ] Backup strategy defined and tested
- [ ] SLO monitoring active (dashboards match SLOs defined in Agent 5B)

### Context Files
- [ ] `decisions_log.md` updated with infrastructure decisions
- [ ] `status_board.md` shows: `[x] Phase 6 — DevOps & Deploy (Agent 6) — COMPLETE`

---

## If Quality Gate FAILS

```
⛔ QUALITY GATE FAILED — Agent 6 → Agent 7

Cannot launch without production-ready infrastructure.
Missing items from Agent 6:
[List every unchecked item]

Action required:
Run: /agent6-devops
Prompt for Agent 6: "DevOps phase is incomplete. Please complete the following:
[paste missing items]"
```
