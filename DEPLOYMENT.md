# ORTHODASH Deployment Guide

## Quick Deploy to GitHub Repository

This guide walks through pushing the ORTHODASH Analytics Platform to the GitHub repository: `https://github.com/Orthodash/orthodash-internal.git`

## Prerequisites

1. Git installed and configured
2. Access to the GitHub repository
3. Environment variables configured

## Manual Git Commands

Since the Git operations need to be performed manually, here are the exact commands to run:

```bash
# 1. Check current status
git status

# 2. Add all files to staging
git add .

# 3. Create initial commit
git commit -m "feat: Complete ORTHODASH Analytics Platform

- Production-ready orthodontic practice analytics dashboard
- Real-time Greyfinch API integration for practice data
- Multi-period comparison with horizontal scrolling layout
- Interactive visualizations using Syncfusion charts
- Enhanced UX with password visibility, loading states, and feedback
- Comprehensive cost management with API integrations
- AI-powered insights with OpenAI integration
- PDF report generation with jsPDF
- Secure sharing functionality with link and email options
- Mobile-optimized responsive design
- Session-based authentication with PostgreSQL
- Complete TypeScript coverage with shared type definitions
- Production-grade error handling and validation"

# 4. Set the remote repository (if not already set)
git remote add origin https://github.com/Orthodash/orthodash-internal.git

# 5. Push to main branch
git push -u origin main
```

## Environment Variables Required

Create a `.env` file with these variables:

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Session Security
SESSION_SECRET=your_secure_session_secret_here

# Greyfinch API (Practice Management Integration)
GREYFINCH_API_KEY=your_greyfinch_api_key
GREYFINCH_API_SECRET=your_greyfinch_api_secret

# OpenAI (AI Analytics Insights)
OPENAI_API_KEY=your_openai_api_key

# Optional: External Advertising APIs
META_API_KEY=your_meta_ads_api_key
GOOGLE_ADS_API_KEY=your_google_ads_api_key
```

## Project Structure Overview

```
orthodash-analytics/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (dashboard, auth)
│   │   ├── hooks/         # Custom React hooks (useAuth)
│   │   └── lib/           # Utilities and configurations
├── server/                # Express.js backend
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic (Greyfinch, OpenAI)
│   └── auth.ts           # Authentication setup
├── shared/               # Shared types and schemas
│   ├── schema.ts         # Database schema with Drizzle
│   └── types.ts          # TypeScript type definitions
├── README.md            # Project documentation
├── DEPLOYMENT.md        # This deployment guide
├── LICENSE              # MIT License
└── .gitignore          # Git ignore rules
```

## Key Features Implemented

✅ **Authentication System**
- Password visibility toggle with eye icons
- Session-based authentication with PostgreSQL store
- Protected routes and user management

✅ **Enhanced UX Improvements**
- Loading states and feedback for all user actions
- Fixed Add Period button positioning issues
- Enhanced date picker with proper clickability
- Horizontal scrolling layout that prevents UI displacement

✅ **Analytics Dashboard**
- Multi-period comparison with side-by-side columns
- Real-time Greyfinch API integration
- Interactive Syncfusion charts and visualizations
- Mobile-optimized responsive design

✅ **Cost Management**
- Manual cost entry with validation
- API key configuration UI for external integrations
- Automated cost syncing from Meta/Google Ads
- ROI calculations and cost analysis

✅ **Report Generation & Sharing**
- Beautiful PDF report generation with jsPDF
- Comprehensive sharing modal with link and email options
- Secure sharing with access controls
- Template saving functionality

✅ **AI-Powered Insights**
- OpenAI integration for intelligent analytics summaries
- Actionable recommendations based on practice data
- Comparative analysis against industry benchmarks

## Post-Deployment Checklist

After pushing to GitHub:

1. **Configure Repository Settings**
   - Set repository description
   - Add topics: `orthodontics`, `analytics`, `dashboard`, `react`, `typescript`
   - Enable security features

2. **Set up CI/CD** (Optional)
   - GitHub Actions for automated testing
   - Deployment workflows for staging/production

3. **Documentation Updates**
   - Update README with live demo links
   - Add screenshots of the dashboard
   - Document API endpoints

4. **Security Review**
   - Ensure no secrets are committed
   - Review .gitignore completeness
   - Set up branch protection rules

## Troubleshooting

### Common Git Issues

**Error: "could not lock config file"**
```bash
rm .git/config.lock
git config --list
```

**Error: "remote origin already exists"**
```bash
git remote remove origin
git remote add origin https://github.com/Orthodash/orthodash-internal.git
```

**Large file issues**
```bash
# Check for large files
find . -type f -size +50M

# Use Git LFS if needed
git lfs track "*.pdf"
git lfs track "*.png"
```

## Production Deployment

For production deployment on platforms like Vercel, Netlify, or Railway:

1. **Build Configuration**
   ```bash
   npm run build
   ```

2. **Environment Variables**
   - Configure all required environment variables in hosting platform
   - Ensure DATABASE_URL points to production database

3. **Database Migration**
   ```bash
   npm run db:push
   ```

4. **Health Checks**
   - Verify API endpoints are accessible
   - Test authentication flow
   - Confirm Greyfinch integration

## Support

For deployment issues:
- Check the console logs for specific error messages
- Verify all environment variables are set correctly
- Ensure database connectivity
- Test API integrations individually