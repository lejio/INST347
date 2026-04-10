<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AI Flashcard Webapp — Agent Context

## Project Overview
AI-powered flashcard webapp. Users upload textbooks/diagrams/PDFs/DOCX/images, which are converted to flashcard sets via OpenAI gpt-4o. Microsoft Entra ID (Azure AD) for auth.

## Tech Stack
- **Framework**: Next.js 16.2.1 (App Router, Turbopack, `proxy.ts` NOT `middleware.ts`)
- **Auth**: Auth.js v5 (`next-auth@beta`) with Microsoft Entra ID provider
- **Database**: Azure CosmosDB (NoSQL) — 3 containers: `users`, `flashcard_sets`, `cards`
- **File Storage**: Azure Blob Storage
- **AI**: OpenAI gpt-4o (vision for images, native PDF, mammoth for DOCX text extraction)
- **Styling**: Tailwind CSS v4

## Critical Next.js 16 Rules
- All request APIs are **async**: `await cookies()`, `await headers()`, `await params`
- Use `proxy.ts` at project root (NOT `middleware.ts` — deprecated)
- Export `proxy()` function (not `middleware()`)
- Route handler params: `{ params: Promise<{ id: string }> }` — must `await params`

## Key Files
- `proxy.ts` — auth enforcement (cookie check, redirect/401)
- `app/lib/auth.ts` — Auth.js config, exports `{ handlers, auth, signIn, signOut }`
- `app/lib/cosmosdb.ts` — CosmosDB client + CRUD helpers
- `app/lib/blob-storage.ts` — Azure Blob upload helper
- `app/lib/openai.ts` — OpenAI flashcard generation (handles PDF/image/DOCX)
- `app/api/auth/[...nextauth]/route.ts` — Auth.js catch-all
- `app/api/flashcards/route.ts` — GET (list sets), POST (manual create)
- `app/api/flashcards/generate/route.ts` — POST (file upload → AI → flashcards)
- `app/api/flashcards/[setId]/route.ts` — GET/PUT/DELETE individual set
- `app/api/flashcards/public/route.ts` — GET public sets (no auth)

## CosmosDB Schema
- **users** (partition: `/email`): `{ id, email, name }`
- **flashcard_sets** (partition: `/user_id`): `{ id, user_id, set_name, card_count, create_date, visibility }`
- **cards** (partition: `/set_id`): `{ id, set_id, cards: [{ front, back, link }] }`

## Environment Variables (`.env.local`)
`AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`, `AUTH_SECRET`, `COSMOS_ENDPOINT`, `COSMOS_KEY`, `COSMOS_DATABASE`, `AZURE_STORAGE_CONNECTION_STRING`, `AZURE_STORAGE_CONTAINER_NAME`, `OPENAI_API_KEY`
