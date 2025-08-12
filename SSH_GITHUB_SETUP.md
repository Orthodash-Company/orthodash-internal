# Alternative GitHub Authentication - SSH Keys

## SSH Key Method (Recommended Alternative)

### Step 1: SSH Key Generated
I've generated an SSH key for you. Here's your public key:

```
[See the public key output above]
```

### Step 2: Add SSH Key to GitHub
1. **Copy the public key** from the output above
2. **Go to GitHub**: https://github.com/settings/keys
3. **Click "New SSH key"**
4. **Title**: "ORTHODASH Replit Key"
5. **Key**: Paste the public key
6. **Click "Add SSH key"**

### Step 3: Use SSH URL for Git
```bash
# Remove HTTPS remote and add SSH remote
git remote remove origin
git remote add origin git@github.com:orthodash/orthodash-internal.git

# Test SSH connection
ssh -T git@github.com

# Now push without needing password
git push -u origin main
```

## Alternative: GitHub CLI Installation

If SSH doesn't work, install GitHub CLI:

```bash
# Install GitHub CLI
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Authenticate with GitHub
gh auth login
```

Follow the prompts to authenticate through your browser.

## Alternative: Direct Repository Creation

If authentication is still problematic, create repository directly:

```bash
# Create repository using GitHub CLI (after authentication)
gh repo create orthodash-internal --private --description "Comprehensive orthodontic practice analytics dashboard"

# Push using GitHub CLI
gh repo push
```

## Complete Push Commands After SSH Setup

```bash
# Clear any locks
rm -f .git/config.lock .git/index.lock .git/refs/heads/main.lock

# Configure Git
git config user.name "orthodash"
git config user.email "orthodash@users.noreply.github.com"

# Set SSH remote
git remote remove origin 2>/dev/null || true
git remote add origin git@github.com:orthodash/orthodash-internal.git

# Stage and commit
git add -A
git commit -m "feat: Complete ORTHODASH Analytics Platform

Production-ready orthodontic practice analytics dashboard featuring:
- Real-time Greyfinch API integration for practice data
- Multi-period analytics with side-by-side comparisons
- Interactive Syncfusion visualizations and charts
- Enhanced UX with password visibility and loading states
- Comprehensive cost management with API integrations
- AI-powered insights using OpenAI for recommendations
- Beautiful PDF report generation with charts and data
- Advanced sharing capabilities with secure links
- Mobile-optimized responsive design
- Session-based authentication with PostgreSQL"

# Push using SSH (no password required)
git push -u origin main
```

## Troubleshooting SSH

### Permission denied (publickey):
- Make sure you added the SSH key to your GitHub account
- Verify the key was copied correctly
- Test connection: `ssh -T git@github.com`

### Host key verification failed:
```bash
ssh-keyscan github.com >> ~/.ssh/known_hosts
```

### Repository doesn't exist:
Create it first on GitHub or use:
```bash
gh repo create orthodash-internal --private
```

The SSH method eliminates the need for Personal Access Tokens and provides seamless authentication for future Git operations.