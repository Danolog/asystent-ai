# Decisions Log — Asystent Osobisty AI

> IMMUTABLE — never delete rows. Add PIVOT flag if decision changes core.md.

| Date | Agent | Decision | Rationale | Alternatives Considered | Pivot? |
|------|-------|----------|-----------|------------------------|--------|
| 2025-01-15 | Agent 1 | Target: solo professionals / knowledge workers | Highest need for persistent AI assistant with document access | Teams, students, enterprise | NO |
| 2025-02-01 | Agent 4A | Frontend: Next.js 16 (App Router) | Full-stack TypeScript, Vercel deployment, RSC support | Remix, SvelteKit, Nuxt | NO |
| 2025-02-01 | Agent 4A | Backend: Next.js API Routes | Same framework, no separate backend needed for MVP | Express, Fastify, tRPC | NO |
| 2025-02-01 | Agent 4A | Database: Neon PostgreSQL (serverless) | Free tier, serverless scales to zero, pgvector support for RAG | Supabase, PlanetScale, Railway Postgres | NO |
| 2025-02-01 | Agent 4A | ORM: Drizzle | Type-safe, lightweight, good DX with push/generate | Prisma, Kysely, raw SQL | NO |
| 2025-02-01 | Agent 4A | Auth: better-auth | Simple, self-hosted, supports email+password natively | NextAuth, Clerk, Auth0, Lucia | NO |
| 2025-02-01 | Agent 4A | AI Provider: Anthropic Claude (AI SDK) | Best reasoning quality, streaming support via Vercel AI SDK | OpenAI GPT-4, Gemini, local LLM | NO |
| 2025-02-01 | Agent 4A | Architecture: Modular monolith | Solo dev, fast iteration, modules for chat/rag/memory/notifications/auth | Microservices, serverless functions | NO |
| 2025-02-01 | Agent 4A | File storage: Vercel Blob | Native Vercel integration, simple API, free tier | S3, Cloudflare R2, Supabase Storage | NO |
| 2025-02-01 | Agent 4A | Web search: Tavily API | Purpose-built for AI search, clean JSON responses | SerpAPI, Google Custom Search, Brave Search | NO |
| 2025-02-01 | Agent 4A | Notifications: CallMeBot WhatsApp API | Free, simple HTTP API, reaches user's phone directly | Twilio, email, push notifications | NO |
| 2025-03-01 | Agent 4A | Hosting: Vercel | Free tier, Edge runtime, native Next.js support, Cron jobs | Railway, Fly.io, AWS Amplify | NO |
| 2026-03-16 | Agent 4B | Auth extension: @better-auth/passkey (WebAuthn) | Biometric login for mobile (Face ID, fingerprint, Windows Hello) | Custom WebAuthn implementation, FIDO2 library | NO |
