# Assumptions Log — Asystent Osobisty AI

> NEVER delete rows. Only change Status to INVALIDATED and fill "Why Invalidated" + "Impact".

## Active Assumptions

| Date | Agent | Assumption | Rationale | Status |
|------|-------|-----------|-----------|--------|
| 2025-01-15 | Agent 1 | Primary user is the creator (solo use) | MVP phase, no multi-tenant needed yet | ACTIVE |
| 2025-01-15 | Agent 1 | Users willing to upload documents for RAG | Core value proposition depends on this | ACTIVE |
| 2025-02-01 | Agent 4A | Neon free tier sufficient for MVP traffic | Solo user, low QPS, serverless scales to zero | ACTIVE |
| 2025-02-01 | Agent 4A | Vercel Blob free tier sufficient for document storage | MVP with limited documents (<100 files) | ACTIVE |
| 2025-02-01 | Agent 4A | pgvector via raw SQL embeddings adequate for RAG quality | Small corpus, exact match sufficient vs. ANN | ACTIVE |
| 2025-02-01 | Agent 4A | CallMeBot API reliability acceptable for notifications | Free tier, no SLA, but sufficient for personal use | ACTIVE |
| 2025-03-01 | Agent 4B | Text-based embedding stored as TEXT column is sufficient | Drizzle lacks native pgvector type, cast in queries | ACTIVE |
| 2026-03-16 | Agent 4B | WebAuthn/Passkey supported on target devices | Modern browsers + iOS 16+ / Android 9+ support passkeys | ACTIVE |

## Invalidated Assumptions

| Date | Agent | Assumption | Why Invalidated | Impact |
|------|-------|-----------|-----------------|--------|
| (none yet) | | | | |
