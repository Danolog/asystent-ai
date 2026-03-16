# Handover Checklist: Agent 4A → Agent 4B

<!-- Agent 4B reads this file BEFORE starting any work.         -->
<!-- This is the most critical gate — 4B cannot write a single  -->
<!-- line of code without complete interface contracts.          -->

## Required Outputs from Agent 4A

### Files
- [ ] `tech.md` exists in project root
- [ ] `tech_summary.md` exists (max 500 words)

### Interface Contracts (MANDATORY — all three required)
- [ ] `_shared/interface_contracts/openapi.yaml` is complete (all endpoints defined, not a skeleton)
- [ ] `_shared/interface_contracts/db_schema.sql` is complete (all tables, columns, indexes, FK constraints)
- [ ] `_shared/interface_contracts/typescript_types.ts` is complete (all domain types, request/response types)

### Tech Decisions
- [ ] Tech stack selected with ADR written (frontend framework, backend framework, database, ORM)
- [ ] Architecture pattern decided: monolith / modular monolith / microservices (with rationale)
- [ ] Multi-tenancy strategy decided: row-level / schema-per-tenant / database-per-tenant
- [ ] Authentication strategy decided: JWT / session / OAuth provider
- [ ] API design pattern decided: REST / GraphQL / tRPC
- [ ] Cloud provider selected
- [ ] Infrastructure approach decided: IaC tool chosen

### Context Files
- [ ] `decisions_log.md` updated with all tech decisions (each decision = separate row)
- [ ] `status_board.md` shows: `[x] Phase 4A — Tech Foundation (Agent 4A) — COMPLETE`

---

## If Quality Gate FAILS

```
⛔ QUALITY GATE FAILED — Agent 4A → Agent 4B

Cannot write any code without complete interface contracts.
Missing items from Agent 4A:
[List every unchecked item above]

Action required:
Run: /agent4a-tech
Prompt for Agent 4A: "Tech Foundation is incomplete. Agent 4B cannot start development without the following:
[paste missing items]

Priority: Complete interface_contracts/ files first — openapi.yaml, db_schema.sql, typescript_types.ts"
```
