<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AI Flashcard Webapp — Agent Context

## Project Overview
AI-powered flashcard webapp. Users upload textbooks/diagrams/PDFs/DOCX/images, which are converted to flashcard sets via OpenAI gpt-4o. better-auth with email/password for auth, Azure SQL Server for auth storage.

## Tech Stack
- **Framework**: Next.js 16.2.1 (App Router, Turbopack, `proxy.ts` NOT `middleware.ts`)
- **Auth**: better-auth with email/password, MSSQL adapter (Kysely + Tedious + Tarn)
- **Auth Database**: Azure SQL Server (serverless GP_S_Gen5_1)
- **Database**: Azure CosmosDB (NoSQL) — 2 containers: `flashcard_sets`, `cards`
- **File Storage**: Azure Blob Storage
- **AI**: OpenAI gpt-4o (vision for images, native PDF, mammoth for DOCX text extraction)
- **Styling**: Tailwind CSS v4
- **Infrastructure**: Terraform (Azure resources in `terraform/`)

## Critical Next.js 16 Rules
- All request APIs are **async**: `await cookies()`, `await headers()`, `await params`
- Use `proxy.ts` at project root (NOT `middleware.ts` — deprecated)
- Export `proxy()` function (not `middleware()`)
- Route handler params: `{ params: Promise<{ id: string }> }` — must `await params`

## Key Files
- `proxy.ts` — auth enforcement (cookie check via `getSessionCookie`, redirect/401)
- `app/lib/auth.ts` — better-auth config, exports `auth` instance
- `app/lib/auth-client.ts` — client-side auth helpers (`signIn`, `signUp`, `signOut`, `useSession`)
- `app/lib/cosmosdb.ts` — CosmosDB client + CRUD helpers
- `app/lib/blob-storage.ts` — Azure Blob upload helper
- `app/lib/openai.ts` — OpenAI flashcard generation (handles PDF/image/DOCX)
- `app/api/auth/[...all]/route.ts` — better-auth catch-all
- `app/api/flashcards/route.ts` — GET (list sets), POST (manual create)
- `app/api/flashcards/generate/route.ts` — POST (file upload → AI → flashcards)
- `app/api/flashcards/[setId]/route.ts` — GET/PUT/DELETE individual set
- `app/api/flashcards/public/route.ts` — GET public sets (no auth)

## CosmosDB Schema
- **flashcard_sets** (partition: `/user_id`): `{ id, user_id, set_name, card_count, create_date, visibility }`
- **cards** (partition: `/set_id`): `{ id, set_id, cards: [{ front, back, link }] }`

## Environment Variables (`.env.local`)
`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `MSSQL_SERVER`, `MSSQL_DATABASE`, `MSSQL_USER`, `MSSQL_PASSWORD`, `MSSQL_PORT`, `COSMOS_ENDPOINT`, `COSMOS_KEY`, `COSMOS_DATABASE`, `AZURE_STORAGE_CONNECTION_STRING`, `AZURE_STORAGE_CONTAINER_NAME`, `OPENAI_API_KEY`

## Terraform (`terraform/`)
- `main.tf` — provider config, resource group, random suffix
- `cosmosdb.tf` — Cosmos account (serverless) + database + 2 containers
- `storage.tf` — Storage account + blob container
- `mssql.tf` — Azure SQL Server (serverless) + database + firewall rules
- `entra.tf` — (empty, auth no longer uses Azure AD)
- `outputs.tf` — All values for `.env.local`
- `variables.tf` — Input variables
- Run: `cd terraform && terraform init && terraform apply`
