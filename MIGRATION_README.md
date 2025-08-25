# Orthodash Migration to Next.js + Supabase

This document outlines the migration from the original Vite/Express setup to Next.js with Supabase.

## Migration Overview

### What Changed
- **Frontend**: Vite + React → Next.js 14 (App Router)
- **Backend**: Express.js → Next.js API Routes
- **Database**: Neon PostgreSQL → Supabase PostgreSQL
- **Authentication**: Express sessions → Supabase Auth
- **Build System**: Vite → Next.js built-in bundler

### What Stayed the Same
- All React components and UI/UX
- All pages and functionality
- TanStack Query for state management
- Tailwind CSS + shadcn/ui components
- Greyfinch API integration
- OpenAI integration
- PDF generation capabilities
- All analytics features

## Project Structure

```
orthodash/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes (replaces Express routes)
│   │   ├── auth/              # Auth pages
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Main page
│   ├── components/            # React components (unchanged)
│   ├── hooks/                 # Custom hooks (updated for Supabase)
│   ├── lib/                   # Utilities and services
│   │   ├── db.ts             # Database connection (Supabase)
│   │   ├── supabase.ts       # Supabase client
│   │   ├── queryClient.ts    # TanStack Query config
│   │   └── services/         # API services (Greyfinch, OpenAI)
│   ├── pages/                # Page components (unchanged)
│   └── shared/               # Shared types and schemas
├── drizzle/                  # Database migrations
├── package.json              # Updated dependencies
├── next.config.js           # Next.js configuration
├── tailwind.config.ts       # Updated for Next.js
└── drizzle.config.ts        # Updated for Supabase
```

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Database Configuration (Supabase PostgreSQL)
DATABASE_URL=your_supabase_database_url_here

# Greyfinch API Configuration
GREYFINCH_API_KEY=your_greyfinch_api_key_here
GREYFINCH_API_SECRET=your_greyfinch_api_secret_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Session Configuration
SESSION_SECRET=orthodash-secret-key-2025
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Supabase**
   - Create a new Supabase project
   - Get your project URL and API keys
   - Update environment variables

3. **Database Setup**
   ```bash
   npm run db:generate  # Generate migrations
   npm run db:push      # Push schema to Supabase
   ```

4. **Development**
   ```bash
   npm run dev
   ```

## Key Changes Made

### 1. Authentication System
- **Before**: Express sessions with Passport.js
- **After**: Supabase Auth with built-in user management
- **Migration**: Updated `useAuth` hook to use Supabase client

### 2. API Routes
- **Before**: Express routes in `server/routes.ts`
- **After**: Next.js API routes in `src/app/api/`
- **Migration**: Converted all Express endpoints to Next.js route handlers

### 3. Database Connection
- **Before**: Neon serverless with Drizzle
- **After**: Supabase PostgreSQL with Drizzle
- **Migration**: Updated database connection and schema paths

### 4. Routing
- **Before**: Wouter for client-side routing
- **After**: Next.js App Router
- **Migration**: Converted to Next.js pages and layouts

### 5. Build System
- **Before**: Vite for development and build
- **After**: Next.js built-in bundler
- **Migration**: Updated build scripts and configuration

## API Endpoints

All API endpoints have been migrated to Next.js API routes:

- `GET /api/locations` - Get locations
- `POST /api/locations` - Create location
- `GET /api/analytics` - Get analytics data
- `GET /api/acquisition-costs` - Get acquisition costs
- `POST /api/acquisition-costs` - Update acquisition costs
- `GET /api/greyfinch/test` - Test Greyfinch connection
- `POST /api/greyfinch/setup` - Setup Greyfinch credentials
- `POST /api/generate-summary` - Generate AI summary
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user

## Benefits of Migration

1. **Better Performance**: Next.js App Router with server components
2. **Simplified Deployment**: Single framework for frontend and backend
3. **Enhanced Security**: Supabase Auth with built-in security features
4. **Better Developer Experience**: TypeScript-first, better tooling
5. **Scalability**: Supabase's managed PostgreSQL and real-time features
6. **Cost Efficiency**: Supabase's generous free tier

## Deployment

The application can now be deployed to:
- Vercel (recommended for Next.js)
- Netlify
- Railway
- Any platform supporting Next.js

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure Supabase credentials are correct
2. **Authentication**: Check Supabase Auth settings
3. **API Routes**: Verify Next.js API route structure
4. **Environment Variables**: Ensure all required variables are set

### Migration Notes

- All existing functionality has been preserved
- UI/UX remains identical
- Performance should be improved
- Authentication is now more secure with Supabase

## Support

For issues related to the migration, check:
1. Next.js documentation
2. Supabase documentation
3. Drizzle ORM documentation
4. Project-specific issues in the codebase
