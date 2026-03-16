# Core Project Context — Asystent Osobisty AI

> STRICTLY CONTROLLED — only Agent 1 may modify this file. All changes logged in `decisions_log.md` with PIVOT flag.

## Project Identity

- **Name**: Asystent Osobisty AI
- **Vision**: Osobisty asystent AI z pamięcią długoterminową, bazą wiedzy i proaktywnymi powiadomieniami — dostępny z każdego urządzenia
- **Problem**: Użytkownicy potrzebują inteligentnego asystenta, który pamięta ich preferencje, ma dostęp do ich dokumentów (RAG), potrafi szukać w sieci i proaktywnie przypomina o ważnych rzeczach — bez konieczności powtarzania kontekstu w każdej rozmowie
- **Unique Value Proposition**: AI assistant z trwałą pamięcią, bazą wiedzy z dokumentów, web search i powiadomieniami WhatsApp — w jednym interfejsie

## Target User

- **Primary Persona**: Profesjonalista / solopreneur szukający osobistego asystenta AI do zarządzania wiedzą i zadaniami
- **Secondary Persona**: Programista / knowledge worker potrzebujący RAG na swoich dokumentach
- **Jobs-to-be-Done**:
  - Mieć asystenta AI który pamięta moje preferencje i fakty o mnie
  - Przeszukiwać moje dokumenty (PDF, DOCX, TXT) bez ręcznego szukania
  - Dostawać proaktywne przypomnienia o ważnych rzeczach via WhatsApp
  - Szukać informacji w internecie bez opuszczania czatu

## Business Constraints

- **Budget**: Solo developer, infrastruktura Vercel + Neon (free/hobby tier)
- **Timeline**: MVP delivered, iterative improvements
- **Team size**: 1 developer
- **Technical skills**: Full-stack TypeScript/React/Next.js

## Success Definition

- **Metrics**: Codzienne użycie przez twórcę, <2s response time, 100% uptime na Vercel
- **Failure criteria**: Asystent zapomina kontekst, RAG nie znajduje relevantnych dokumentów, powiadomienia nie dochodzą

## Non-negotiables

- Pamięć długoterminowa (nie resetuje się po sesji)
- Bezpieczeństwo danych (auth, row-level access)
- Dostęp z telefonu (responsive UI)
- Logowanie biometryczne (Face ID / fingerprint via WebAuthn)

## Tech Preferences

- **Language**: TypeScript (full-stack)
- **Framework**: Next.js (App Router)
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle
- **Auth**: better-auth + passkey plugin
- **AI**: Anthropic Claude (via AI SDK)
- **Hosting**: Vercel
- **Exclusions**: No Firebase, no Supabase, no MongoDB
