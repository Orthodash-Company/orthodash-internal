# Deployment

This project is a Next.js app with Supabase-backed auth and database access. Deploy it like a normal App Router application and provide the required environment variables.

## Required Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
GREYFINCH_API_KEY=
GREYFINCH_API_SECRET=
OPENAI_API_KEY=
```

Common optional variables:

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
```

## Supabase

1. Create or select the Supabase project.
2. Copy the project URL, anon key, service role key, and database URL.
3. Confirm auth settings match the environment you want to run.
4. Apply database changes with the Drizzle scripts if needed.

## App Deploy

Recommended flow:

```bash
npm install
npm run type-check
npm run build
```

Then deploy to your hosting platform and set the environment variables there.

## Post-Deploy Checks

1. Confirm login and signup work against the intended Supabase project.
2. Confirm `/api/greyfinch/analytics` can read Greyfinch credentials.
3. Confirm OpenAI-backed routes succeed.
4. If QuickBooks is used, confirm the QuickBooks env vars are present.
5. Verify report generation and saved-session flows.

## Notes

- Local Supabase CLI config may differ from the hosted Supabase project.
- If auth behavior looks inconsistent, check the hosted Supabase auth settings first.
- If deployment uses a public app URL, set `NEXT_PUBLIC_APP_URL` to that value.
