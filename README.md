# Asystent Osobisty AI

Osobisty asystent AI z pamięcią długoterminową, bazą wiedzy RAG, wyszukiwaniem w internecie, komunikacją głosową i proaktywnymi powiadomieniami WhatsApp. Dostępny przez własną aplikację webową, zdeployowany na Vercel.

## Tech Stack

| Warstwa | Technologia |
|---------|-------------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS 4 |
| Backend | Next.js API Routes (Route Handlers) |
| Database | Neon PostgreSQL + pgvector |
| ORM | Drizzle ORM |
| Auth | better-auth (email/password, database sessions) |
| AI | Vercel AI SDK + Anthropic Claude (Sonnet) |
| Web Search | Tavily API |
| File Storage | Vercel Blob |
| Notifications | CallMeBot (WhatsApp) |
| Hosting | Vercel (serverless) |
| Tests | Vitest (unit) + Playwright (E2E) |

## Quick Start

```bash
# 1. Clone
git clone https://github.com/Danolog/asystent-ai.git
cd asystent-ai

# 2. Install
npm install

# 3. Environment
cp .env.example .env.local
# Fill in: ANTHROPIC_API_KEY, DATABASE_URL (Neon), BETTER_AUTH_SECRET

# 4. Database
npm run db:push    # Push schema to Neon

# 5. Run
npm run dev        # http://localhost:3000
```

## Features

- **Chat z AI** — streaming responses, markdown rendering, source badges
- **Pamięć krótkoterminowa** — kontekst w ramach sesji
- **Pamięć długoterminowa** — zapamiętywanie faktów między sesjami
- **Baza wiedzy (RAG)** — upload PDF/TXT/DOCX, odpytywanie dokumentów
- **Web Search** — automatyczne wyszukiwanie aktualnych informacji (Tavily)
- **Powiadomienia WhatsApp** — przypomnienia o płatnościach i terminach
- **Tool Use** — AI automatycznie korzysta z narzędzi (search, memory, RAG)

## Architecture

Modular Monolith — folder-based modules:

```
src/
├── app/              # Next.js pages + API routes
├── modules/          # Business logic
│   ├── chat/         # Chat service, AI tools
│   ├── rag/          # Document processing, search
│   ├── memory/       # Long-term memory
│   ├── notifications/# WhatsApp notifications
│   └── auth/         # Authentication
├── components/       # React components (Atomic Design)
├── lib/              # Shared: db, ai client, utils
└── types/            # TypeScript types (from interface contracts)
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/chat | Send message, streaming AI response |
| GET/POST | /api/conversations | List / create conversations |
| GET/DELETE | /api/conversations/[id] | Get messages / delete |
| GET/POST | /api/documents | List / upload documents |
| DELETE | /api/documents/[id] | Delete document |
| GET | /api/memory | List memories |
| DELETE | /api/memory/[id] | Delete memory |
| GET/POST | /api/notifications | List / create notifications |
| PUT/DELETE | /api/notifications/[id] | Update / delete |
| POST | /api/search | Web search (Tavily) |
| GET/PUT | /api/user/profile | Get / update profile |
| GET | /api/health | Health check |

## Testing

```bash
npm test              # Unit tests (Vitest)
npm run test:watch    # Watch mode
npx playwright test   # E2E tests (requires running app)
```

## Deployment

Auto-deployed via Vercel on push to `main`. See `devops.md` for details.

```bash
# Manual deploy
vercel --prod

# Database migrations
npm run db:push
```

## Environment Variables

See `.env.example` for all required variables. Key ones:
- `ANTHROPIC_API_KEY` — Claude API key
- `DATABASE_URL` — Neon PostgreSQL connection string
- `BETTER_AUTH_SECRET` — Random 32+ char string for session encryption

## License

Private project.
