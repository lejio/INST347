@AGENTS.md
<<<<<<< HEAD
=======

## Build & Run
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — run ESLint

## Conventions
- Route handlers validate auth via `auth.api.getSession({ headers: await headers() })` from `app/lib/auth.ts`
- Auth uses better-auth with email/password (MSSQL adapter)
- Session checked in proxy.ts via `getSessionCookie` from `better-auth/cookies`
- Client-side auth via `signIn`, `signUp`, `signOut`, `useSession` from `app/lib/auth-client.ts`
- All CosmosDB queries use parameterized queries (never string interpolation)
- File uploads limited to 10MB, allowed types: PDF, PNG, JPEG, DOCX
- Visibility values: `public`, `private`, `unlisted`
- Ownership checks required before PUT/DELETE operations on flashcard sets
- Azure infrastructure managed by Terraform in `terraform/`
>>>>>>> origin/Gene-backend
