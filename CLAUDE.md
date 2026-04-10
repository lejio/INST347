@AGENTS.md

## Build & Run
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — run ESLint

## Conventions
- Route handlers validate auth via `auth()` from `app/lib/auth.ts`, not just proxy cookie checks
- All CosmosDB queries use parameterized queries (never string interpolation)
- File uploads limited to 10MB, allowed types: PDF, PNG, JPEG, DOCX
- Visibility values: `public`, `private`, `unlisted`
- Ownership checks required before PUT/DELETE operations on flashcard sets
