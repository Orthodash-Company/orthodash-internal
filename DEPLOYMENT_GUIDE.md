# Orthodash Deployment Guide

## 1. Supabase Setup

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and API keys

### Step 2: Set Up Database
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-setup.sql`
4. Run the SQL script

### Step 3: Configure Authentication
1. Go to Authentication > Settings
2. Enable Email authentication
3. Add your domain to allowed redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://your-vercel-domain.vercel.app/auth/callback`

### Step 4: Get Environment Variables
From your Supabase project settings, get:
- Project URL
- Anon public key
- Service role key (for server-side operations)
- Database connection string

## 2. Environment Variables Setup

Create a `.env.local` file with:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Database Configuration
DATABASE_URL=postgresql://postgres.your-project-ref:your_password@aws-0-us-west-1.pooler.supabase.com:6543/postgres

# Greyfinch API Configuration
GREYFINCH_API_KEY=your_greyfinch_api_key_here
GREYFINCH_API_SECRET=your_greyfinch_api_secret_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Session Configuration
SESSION_SECRET=orthodash-secret-key-2025
```

## 3. GitHub Setup

### Step 1: Initialize Git (if not already done)
```bash
git init
git add .
git commit -m "Initial commit: Next.js + Supabase migration"
```

### Step 2: Create GitHub Repository
1. Go to GitHub and create a new repository
2. Follow the instructions to push your code

### Step 3: Push to GitHub
```bash
git remote add origin https://github.com/your-username/orthodash.git
git branch -M main
git push -u origin main
```

## 4. Vercel Deployment

### Step 1: Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your GitHub repository

### Step 2: Configure Environment Variables
In Vercel project settings, add all environment variables from `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `GREYFINCH_API_KEY`
- `GREYFINCH_API_SECRET`
- `OPENAI_API_KEY`
- `SESSION_SECRET`

### Step 3: Deploy
1. Vercel will automatically detect Next.js
2. Click "Deploy"
3. Wait for build to complete

### Step 4: Configure Custom Domain (Optional)
1. Go to project settings
2. Add your custom domain
3. Update Supabase redirect URLs

## 5. Post-Deployment Setup

### Step 1: Test Authentication
1. Visit your deployed app
2. Try logging in with: `orthodash@teamorthodontics.com` / `OrthoDash2025!`
3. Verify user creation in Supabase Auth

### Step 2: Test Database Operations
1. Check if locations are loaded
2. Test analytics data fetching
3. Verify report creation

### Step 3: Configure Greyfinch API
1. Add your Greyfinch API credentials
2. Test API connection
3. Verify data synchronization

## 6. Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check Supabase redirect URLs
   - Verify environment variables
   - Check browser console for errors

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check Supabase database status
   - Ensure RLS policies are correct

3. **Build Errors**
   - Check Node.js version (>=18.17.0)
   - Verify all dependencies are installed
   - Check TypeScript compilation

4. **API Route Errors**
   - Verify environment variables in Vercel
   - Check Supabase service role key
   - Ensure proper CORS configuration

### Debug Commands

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Install dependencies
npm install

# Run type check
npm run type-check

# Build locally
npm run build

# Start development server
npm run dev
```

## 7. Monitoring and Maintenance

### Vercel Analytics
- Enable Vercel Analytics for performance monitoring
- Set up error tracking

### Supabase Monitoring
- Monitor database performance
- Check authentication logs
- Review API usage

### Regular Updates
- Keep dependencies updated
- Monitor for security updates
- Backup database regularly

## 8. Security Considerations

1. **Environment Variables**
   - Never commit `.env.local` to Git
   - Use Vercel's environment variable system
   - Rotate keys regularly

2. **Database Security**
   - RLS policies are enabled
   - Service role key is server-side only
   - Regular security audits

3. **Authentication**
   - Supabase handles auth securely
   - Email verification enabled
   - Session management handled by Supabase

## 9. Performance Optimization

1. **Database**
   - Indexes are created for common queries
   - Connection pooling enabled
   - Query optimization

2. **Frontend**
   - Next.js App Router for better performance
   - Image optimization
   - Code splitting

3. **Caching**
   - Analytics cache implemented
   - Browser caching configured
   - CDN for static assets

## 10. Support

For issues:
1. Check Vercel deployment logs
2. Review Supabase logs
3. Check browser console
4. Review this deployment guide
5. Contact support if needed
