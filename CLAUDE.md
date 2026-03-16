# Asystent Osobisty AI

Personal AI assistant with long-term memory, RAG knowledge base, web search, voice, and WhatsApp notifications.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI**: React 19, Tailwind CSS 4, Lucide icons
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Auth**: better-auth + @better-auth/passkey (WebAuthn/biometric)
- **AI**: Anthropic Claude (via AI SDK), Tavily (web search)
- **Storage**: Vercel Blob
- **Testing**: Vitest (unit), Playwright (E2E)
- **Deploy**: Vercel

## Project Structure

```
src/
  app/              # Next.js App Router pages & API routes
    (app)/          # Authenticated layout (chat, settings, knowledge, notifications)
    api/            # REST API endpoints
    login/          # Login page (email + passkey)
  components/       # React components (organisms: Sidebar, ChatArea, TopNav)
  lib/              # Shared utilities (auth client, DB, helpers)
  modules/          # Business logic modules (auth, chat, rag, memory, notifications)
  types/            # TypeScript type definitions (single source of truth)
saas-agents/        # Multi-agent SaaS development pipeline (SKILL.md per agent)
  _shared/          # Interface contracts, handover checklists, project context templates
project_context/    # Active project state (core.md, status_board.md, logs)
.claude/commands/   # Slash commands for agent system (/agent1-discovery, /status, etc.)
```

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest (unit tests)
npm run db:push      # Push Drizzle schema to DB
npm run db:generate  # Generate migrations
npm run db:studio    # Drizzle Studio (DB GUI)
```

## Key Conventions

- **Language**: Polish UI, English code
- **Auth**: All API routes use `getSession()` from `src/modules/auth/auth.config.ts`
- **DB access**: Always through Drizzle ORM (`src/lib/db/index.ts`)
- **Types**: Single source of truth in `src/types/index.ts` — never duplicate
- **Schema**: Drizzle schema in `src/lib/db/schema.ts` — tables managed by better-auth (users, sessions, accounts, passkeys) + app tables
- **API pattern**: Route handlers in `src/app/api/`, return `NextResponse.json()`
- **Components**: Organisms in `src/components/organisms/`, no atomic design yet
- **Env vars**: Never hardcode secrets. Template in `.env.example`
- **Commits**: Conventional Commits format (`feat:`, `fix:`, `docs:`, etc.)
- **Error handling**: Use `ApiError` type from `src/types/index.ts`

## Agent System

This project includes a multi-agent SaaS development pipeline in `saas-agents/`. Use slash commands to invoke agents:

- `/new-saas-project` — Initialize project context
- `/status` — View project phase status
- `/agent1-discovery` through `/agent7-launch` — Run individual phases

Project state lives in `project_context/` (core.md, status_board.md, logs).
Interface contracts in `saas-agents/_shared/interface_contracts/`.

## Environment Variables

See `.env.example` for full list. Required:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `BETTER_AUTH_SECRET` — Auth signing secret
- `BETTER_AUTH_URL` — App URL (used by passkey rpID)
- `ANTHROPIC_API_KEY` — Claude API key
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob storage
