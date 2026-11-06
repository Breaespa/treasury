# Deployment Guide - Demo Platform

This guide provides step-by-step instructions for deploying the Demo Platform to Cloudflare Pages with D1 and R2.

## Prerequisites

Before you begin, ensure you have:

- Cloudflare account (free tier works)
- GitHub account
- Node.js 18+ installed locally
- Wrangler CLI installed: `npm install -g wrangler`
- Git installed locally

## Step 1: Cloudflare Account Setup

### 1.1 Create Cloudflare Account
1. Visit https://dash.cloudflare.com/sign-up
2. Create a free account
3. Verify your email address

### 1.2 Install and Authenticate Wrangler
```bash
npm install -g wrangler
wrangler login
```

This will open a browser window to authenticate with Cloudflare.

## Step 2: Create D1 Database

### 2.1 Create the Database
```bash
wrangler d1 create demo-platform-db
```

You will receive output like:
```
✨ Successfully created DB 'demo-platform-db'

[[d1_databases]]
binding = "DB"
database_name = "demo-platform-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Copy the `database_id` - you'll need it later.**

### 2.2 Apply Database Migrations

#### For Local Development:
```bash
# Apply initial schema
wrangler d1 execute demo-platform-db --local --file=migrations/0001_initial_schema.sql

# Apply admin sessions table
wrangler d1 execute demo-platform-db --local --file=migrations/0003_admin_sessions.sql

# Seed with sample data (optional)
wrangler d1 execute demo-platform-db --local --file=migrations/0002_seed_data.sql
```

#### For Production:
```bash
# Apply initial schema
wrangler d1 execute demo-platform-db --file=migrations/0001_initial_schema.sql

# Apply admin sessions table
wrangler d1 execute demo-platform-db --file=migrations/0003_admin_sessions.sql

# Seed with sample data (optional)
wrangler d1 execute demo-platform-db --file=migrations/0002_seed_data.sql
```

### 2.3 Verify Database
```bash
# List tables
wrangler d1 execute demo-platform-db --command="SELECT name FROM sqlite_master WHERE type='table'"

# View sample data
wrangler d1 execute demo-platform-db --command="SELECT * FROM demo_entries LIMIT 5"
```

## Step 3: Create R2 Bucket

### 3.1 Enable R2 (if not already enabled)
1. Go to Cloudflare Dashboard
2. Navigate to R2 > Overview
3. Enable R2 (may require entering payment info, but free tier is available)

### 3.2 Create the Bucket
```bash
wrangler r2 bucket create demo-platform-assets
```

You will receive output like:
```
✨ Successfully created bucket 'demo-platform-assets'
```

### 3.3 Verify Bucket
```bash
wrangler r2 bucket list
```

## Step 4: Update Configuration

### 4.1 Update wrangler.jsonc
Open `wrangler.jsonc` and replace the placeholder values:

```jsonc
{
  "name": "demo-platform",
  "compatibility_date": "2024-01-01",
  "pages_build_output_dir": "public",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "demo-platform-db",
      "database_id": "YOUR_D1_DATABASE_ID"  // Replace with your actual ID
    }
  ],
  "r2_buckets": [
    {
      "binding": "R2",
      "bucket_name": "demo-platform-assets"
    }
  ],
  "vars": {
    "SESSION_TIMEOUT": "3600"
  }
}
```

Replace `YOUR_D1_DATABASE_ID` with the ID you copied in Step 2.1.

### 4.2 Setup Environment Variables (Optional)
```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` if you want to customize settings (defaults work fine).

## Step 5: Push to GitHub

### 5.1 Initialize Git Repository
```bash
git init
git add .
git commit -m "Initial commit"
```

### 5.2 Create GitHub Repository
1. Go to https://github.com/new
2. Create a new repository (can be private)
3. Follow the instructions to push your local repository

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## Step 6: Deploy to Cloudflare Pages

### 6.1 Create Pages Project
1. Go to Cloudflare Dashboard
2. Navigate to Pages > Create a project
3. Select "Connect to Git"
4. Choose your GitHub repository
5. Authorize Cloudflare to access your repository (if first time)

### 6.2 Configure Build Settings
- **Project name**: `demo-platform` (or your preferred name)
- **Production branch**: `main`
- **Framework preset**: None
- **Build command**: Leave empty
- **Build output directory**: `public`

### 6.3 Configure Environment Variables
In the Pages project settings:

1. Go to Settings > Environment variables
2. Add variable:
   - Key: `SESSION_TIMEOUT`
   - Value: `3600`
   - Environment: Production, Preview, and Dev

### 6.4 Configure D1 Binding
1. Go to Settings > Functions > D1 database bindings
2. Add binding:
   - Variable name: `DB`
   - D1 database: `demo-platform-db`
   - Environment: Production, Preview, and Dev

### 6.5 Configure R2 Binding
1. Go to Settings > Functions > R2 bucket bindings
2. Add binding:
   - Variable name: `R2`
   - R2 bucket: `demo-platform-assets`
   - Environment: Production, Preview, and Dev

### 6.6 Deploy
1. Click "Save and Deploy"
2. Wait for the deployment to complete
3. Your site will be available at `https://demo-platform.pages.dev`

## Step 7: Initial Setup

### 7.1 Access Setup Page
Visit: `https://your-domain.pages.dev/admin/setup.html`

### 7.2 Create Admin Account
1. Enter a username
2. Enter a strong password (minimum 8 characters)
3. Confirm password
4. Click "Create Admin Account"

### 7.3 Login
1. Visit: `https://your-domain.pages.dev/admin/login.html`
2. Enter your username and password
3. Click "Sign In"

### 7.4 Access Dashboard
You will be redirected to the admin dashboard where you can:
- View statistics
- Manage entries
- View audit logs

## Step 8: Configure Custom Domain (Optional)

### 8.1 Add Custom Domain
1. Go to Pages project > Custom domains
2. Click "Set up a custom domain"
3. Enter your domain (e.g., `demo.example.com`)
4. Click "Continue"

### 8.2 Update DNS
Cloudflare will provide DNS records. Add them to your domain's DNS configuration.

### 8.3 Enable HTTPS
1. Wait for SSL certificate to be issued (automatic)
2. Enable "Always Use HTTPS" in Cloudflare settings

## Step 9: Testing

### 9.1 Test Public Interface
- Homepage loads: ✅
- Record listing works: ✅
- Search functionality works: ✅
- Filter by status works: ✅
- Individual record pages load: ✅
- Images display correctly: ✅
- Mobile responsive: ✅

### 9.2 Test Admin Interface
- Login works: ✅
- Invalid credentials rejected: ✅
- Dashboard loads: ✅
- Create entry works: ✅
- Edit entry works: ✅
- Delete entry works: ✅
- Image upload works: ✅
- Audit logs visible: ✅
- Logout works: ✅

### 9.3 Test Security
- Cannot access admin pages without login: ✅
- Session expires after timeout: ✅
- Invalid file types rejected: ✅
- Large files rejected: ✅
- SQL injection attempts blocked: ✅

## Step 10: Maintenance

### 10.1 Backup Database
```bash
# Export database
wrangler d1 execute demo-platform-db --command=".dump" > backup.sql

# Import database (if needed)
wrangler d1 execute demo-platform-db --file=backup.sql
```

### 10.2 View Logs
```bash
# View real-time logs
wrangler pages deployment tail

# View deployment logs in dashboard
# Pages > Your Project > Logs
```

### 10.3 Update Code
1. Make changes locally
2. Test with `npm run dev`
3. Commit and push to GitHub
4. Cloudflare will auto-deploy

### 10.4 Update Password
1. Login to admin dashboard
2. (Future enhancement: add password change feature)
3. For now, use database directly:
```bash
wrangler d1 execute demo-platform-db --command="UPDATE demo_users SET password_hash = 'new-hash' WHERE username = 'admin'"
```

## Troubleshooting

### Issue: D1 binding not working
**Solution:**
- Verify binding name matches code (`DB`)
- Check database ID is correct in wrangler.jsonc
- Ensure binding is configured in Cloudflare Pages settings

### Issue: R2 upload fails
**Solution:**
- Verify R2 bucket exists
- Check R2 binding name matches code (`R2`)
- Ensure binding is configured in Cloudflare Pages settings
- Check file size doesn't exceed limits

### Issue: Session not persisting
**Solution:**
- Verify admin_sessions table exists
- Check SESSION_TIMEOUT variable
- Ensure cookies are enabled in browser
- Check for browser privacy settings blocking cookies

### Issue: Images not displaying
**Solution:**
- Verify image was uploaded to R2
- Check image URL format
- Ensure R2 binding is configured
- Check browser console for errors

### Issue: Deployment fails
**Solution:**
- Check build logs in Cloudflare dashboard
- Verify all bindings are configured
- Ensure wrangler.jsonc is valid JSON
- Check for syntax errors in function files

## Advanced Configuration

### Custom Session Timeout
Edit `.dev.vars` or environment variable:
```
SESSION_TIMEOUT=7200  # 2 hours
```

### Adding Custom Fields
1. Add migration file: `migrations/0005_custom_fields.sql`
2. Update schema in `DATABASE_SCHEMA.md`
3. Update API endpoints to handle new fields
4. Update frontend forms to display new fields

### Rate Limiting
Cloudflare Pages Functions includes basic rate limiting. For advanced rate limiting:
1. Configure in Cloudflare WAF
2. Or implement custom rate limiting in functions

## Security Best Practices

1. **Change default admin password** immediately after setup
2. **Enable 2FA** on your Cloudflare account
3. **Use strong passwords** for all accounts
4. **Regular backups** of D1 database
5. **Monitor audit logs** for suspicious activity
6. **Keep dependencies** updated
7. **Review deployment logs** regularly
8. **Use HTTPS** only (enforce in Cloudflare settings)

## Support Resources

- Cloudflare Pages Documentation: https://developers.cloudflare.com/pages/
- Cloudflare D1 Documentation: https://developers.cloudflare.com/d1/
- Cloudflare R2 Documentation: https://developers.cloudflare.com/r2/
- Wrangler CLI Documentation: https://developers.cloudflare.com/workers/wrangler/

## Cost Estimate

- **Cloudflare Pages**: Free tier (up to 500 builds/month)
- **Cloudflare D1**: Free tier (5GB storage, 5M reads/day)
- **Cloudflare R2**: Free tier (10GB storage, 10M Class A operations/month)
- **Custom Domain**: Free if using Cloudflare DNS

Total estimated cost: **$0/month** (within free tiers)

## Next Steps

- Customize branding and colors
- Add additional features as needed
- Integrate with other services (email, notifications, etc.)
- Set up monitoring and alerts
- Configure custom domain
- Add SSL certificate for custom domain

---

**Deployment Complete!** 🎉

Your Demo Platform is now live on Cloudflare's global edge network.
