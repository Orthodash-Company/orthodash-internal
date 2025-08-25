# GitHub & Vercel Deployment Setup

## Current Status
✅ Next.js + Supabase migration completed
✅ All files committed locally
❌ Need to push to GitHub
❌ Need to deploy to Vercel

## Step 1: GitHub Authentication

You need to authenticate with GitHub to push changes. Choose one of these methods:

### Option A: Personal Access Token (Recommended)
1. Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with these permissions:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
3. Copy the token
4. When pushing, use the token as your password

### Option B: SSH Key Setup
1. Generate SSH key: `ssh-keygen -t ed25519 -C "your-email@example.com"`
2. Add to GitHub: Settings → SSH and GPG keys → New SSH key
3. Change remote URL: `git remote set-url origin git@github.com:Orthodash/orthodash-internal.git`

### Option C: GitHub CLI
1. Install GitHub CLI: `brew install gh`
2. Authenticate: `gh auth login`
3. Follow the prompts

## Step 2: Push to GitHub

Once authenticated, run:
```bash
git push origin main
```

## Step 3: Vercel Deployment

### Option A: Vercel CLI (Recommended)
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`

### Option B: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your repository: `Orthodash/orthodash-internal`
5. Configure environment variables (see below)
6. Deploy

## Step 4: Environment Variables in Vercel

Add these environment variables in Vercel project settings:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://kehjphirpsryupvqknmy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlaGpwaGlycHNyeXVwdnFrbm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNDA0OTcsImV4cCI6MjA3MTcxNjQ5N30.CVqmrQRVudOAcScg4AT3D1bALj_mgSx7kPjqHfr5uL0
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Database Configuration
DATABASE_URL=postgresql://postgres.kehjphirpsryupvqknmy:your_password@aws-0-us-west-1.pooler.supabase.com:6543/postgres

# Greyfinch API Configuration
GREYFINCH_API_KEY=your_greyfinch_api_key_here
GREYFINCH_API_SECRET=your_greyfinch_api_secret_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Session Configuration
SESSION_SECRET=orthodash-secret-key-2025
```

## Step 5: Supabase Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-setup.sql`
4. Run the SQL script

## Step 6: Test Deployment

1. Visit your Vercel deployment URL
2. Test authentication with: `orthodash@teamorthodontics.com` / `OrthoDash2025!`
3. Verify all features work correctly

## Troubleshooting

### GitHub Push Issues
- Check authentication: `git remote -v`
- Verify permissions on the repository
- Try using personal access token

### Vercel Build Issues
- Check environment variables are set correctly
- Verify Node.js version (>=18.17.0)
- Check build logs for specific errors

### Supabase Issues
- Verify database connection string
- Check RLS policies are applied
- Ensure authentication is configured

## Quick Commands

```bash
# Check current status
git status

# Add and commit changes
git add .
git commit -m "Your commit message"

# Push to GitHub (after authentication)
git push origin main

# Deploy to Vercel
vercel --prod

# Check deployment status
vercel ls
```

## Next Steps After Deployment

1. **Test Authentication**: Verify login works
2. **Test Database**: Check if data loads correctly
3. **Test API Routes**: Verify all endpoints work
4. **Configure Custom Domain**: Add your domain if needed
5. **Set Up Monitoring**: Enable Vercel Analytics
6. **Backup Strategy**: Set up database backups

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review Supabase logs
3. Check browser console for errors
4. Verify all environment variables are set
5. Contact support if needed
