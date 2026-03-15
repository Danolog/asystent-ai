# Changelog

## [1.0.0] — 2026-03-15

### Added
- Chat UI z streaming responses (Claude Sonnet via Vercel AI SDK)
- Historia konwersacji z sidebar i auto-generowaniem tytułów
- Pamięć krótkoterminowa (kontekst sesji)
- Pamięć długoterminowa (zapamiętywanie faktów między sesjami)
- Baza wiedzy RAG (upload PDF/TXT/DOCX, keyword search)
- Web search (Tavily API) z automatycznym wykrywaniem
- Powiadomienia WhatsApp (CallMeBot) z CRUD i cyklicznością
- Zarządzanie dokumentami (upload, lista, usuwanie, usage tracking)
- Ustawienia (profil, pamięć, preferencje)
- Nawigacja TopNav z linkami do Chat, Baza, Powiadomienia, Ustawienia
- Responsywny design (desktop + mobile sidebar drawer)
- Source badges [RAG/Web/AI/Memory] przy odpowiedziach AI
- Auth (better-auth, email/password, database sessions)
- Health check endpoint (/api/health)

### Security
- Rate limiting na /api/chat (30 req/min) i /api/search (20 req/min)
- OWASP Top 10 audit — 0 Critical/High, 3 Medium fixed
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- Phone number E.164 validation
- Session-based auth on all API endpoints

### Infrastructure
- CI/CD pipeline (GitHub Actions — 5 stages)
- Vercel deployment with security headers and cron jobs
- Neon PostgreSQL with pgvector (10 tables)
- Vercel Blob for file storage
