# GitHub Authentication in Shell - Quick Guide

## Option 1: Personal Access Token (Recommended)

### Step 1: Create Personal Access Token
1. Go to GitHub.com and log in
2. Click your profile picture → **Settings**
3. Scroll down to **Developer settings** (left sidebar)
4. Click **Personal access tokens** → **Tokens (classic)**
5. Click **Generate new token** → **Generate new token (classic)**
6. Fill out the form:
   - **Note**: "ORTHODASH Repository Access"
   - **Expiration**: Choose appropriate duration (30 days, 90 days, etc.)
   - **Scopes**: Check **repo** (this gives full repository access)
7. Click **Generate token**
8. **IMPORTANT**: Copy the token immediately - you won't see it again!

### Step 2: Use Token for Authentication
When you run `git push` and are prompted for credentials:
- **Username**: `orthodash`
- **Password**: Paste your Personal Access Token (NOT your GitHub password)

## Option 2: GitHub CLI (Alternative)

Install and authenticate with GitHub CLI:
```bash
# Install GitHub CLI (if not already installed)
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Authenticate
gh auth login
```

Follow the prompts to authenticate through your browser.

## Quick Git Push Commands

Once you have your Personal Access Token:

```bash
# Clear any remaining locks
rm -f .git/config.lock .git/index.lock .git/refs/heads/main.lock

# Configure Git
git config user.name "orthodash"
git config user.email "orthodash@users.noreply.github.com"

# Set up remote
git remote add origin https://github.com/orthodash/orthodash-internal.git

# Stage and commit
git add -A
git commit -m "feat: Complete ORTHODASH Analytics Platform

Production-ready orthodontic practice analytics dashboard with:
- Real-time Greyfinch API integration
- Multi-period analytics and comparisons
- Interactive visualizations and charts
- Enhanced UX with improved authentication
- Cost management with external API support
- AI-powered insights using OpenAI
- PDF report generation and sharing
- Mobile-optimized responsive design"

# Push (you'll be prompted for username and token)
git push -u origin main
```

## Troubleshooting

### "Authentication failed" error:
- Make sure you're using the Personal Access Token as password, not your GitHub password
- Verify the token has `repo` permissions
- Check that the token hasn't expired

### "Repository not found" error:
- Create the repository first on GitHub:
  1. Go to https://github.com/orthodash
  2. Click "New repository"
  3. Name: `orthodash-internal`
  4. Don't initialize with README
  5. Click "Create repository"

### "Permission denied" error:
- Verify you have write access to the repository
- Make sure you're using the correct username: `orthodash`
- Double-check your Personal Access Token

## Security Notes

- **Never share your Personal Access Token** - treat it like a password
- Store it securely (password manager recommended)
- Set appropriate expiration dates
- Revoke tokens you no longer need
- Use minimal required permissions (repo scope for this project)

## What Happens After Push

Once successfully pushed, your complete ORTHODASH Analytics Platform will be available at:
`https://github.com/orthodash/orthodash-internal`

The repository will contain:
- Complete React TypeScript frontend
- Express TypeScript backend
- Comprehensive documentation
- Production-ready configuration
- All 150+ project files ready for deployment