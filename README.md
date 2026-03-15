# Orthodash

Orthodash is a Next.js analytics app for orthodontic practice reporting. It combines Supabase auth, Greyfinch data pulls, QuickBooks revenue integration, acquisition cost tracking, report generation, and AI summaries in one internal dashboard.

## Stack

- Next.js App Router
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase Auth + Supabase Postgres
- Drizzle ORM
- OpenAI

## Local Setup

1. Install dependencies.

```bash
pnpm install
```

2. Create `.env` or `.env.local` from `env.example`.

Required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
GREYFINCH_API_KEY=
GREYFINCH_API_SECRET=
OPENAI_API_KEY=
```

`DATABASE_URL` should use the Supabase pooler connection string for local development, not the direct database host.

Optional variables:

```env
NEXT_PUBLIC_APP_URL=
OPENAI_ORG_ID=
QUICKBOOKS_CONSUMER_KEY=
QUICKBOOKS_CONSUMER_SECRET=
QUICKBOOKS_ACCESS_TOKEN=
QUICKBOOKS_ACCESS_TOKEN_SECRET=
QUICKBOOKS_COMPANY_ID=
QUICKBOOKS_SANDBOX=true
GOOGLE_ADS_DEVELOPER_TOKEN=
SESSION_SECRET=
```

3. Start the app.

```bash
pnpm dev
```

4. Run a quick verification pass.

```bash
pnpm type-check
```

## Core Areas

- Auth: Supabase email/password auth with client-side session state
- Analytics: Greyfinch-backed dashboard and period comparisons
- Reporting: saved reports, PDF generation, and sharing flows
- Costs: acquisition cost entry plus external sync endpoints
- AI: summary and analysis endpoints backed by OpenAI

## Useful Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm type-check`
- `pnpm db:push`
- `pnpm db:generate`
- `pnpm db:migrate`

## Docs

- [DEPLOYMENT.md](DEPLOYMENT.md)
