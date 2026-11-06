# Demo Platform

**Independent demonstration application. Not affiliated with or endorsed by any government agency or financial institution. All records and transactions displayed are fictional.**

A modern, serverless demonstration application built with Cloudflare Pages, D1, and R2. This platform showcases a complete CRUD application with authentication, file uploads, and audit logging running entirely on Cloudflare's edge infrastructure.

## Features

### Public Interface
- 📋 Record listing with search and filtering
- 🔍 Search by name, email, or reference number
- 🏷️ Filter by payment status (Paid, Pending, Overdue)
- 📄 Individual record detail pages
- 📱 Fully responsive design
- 🖼️ Profile image display

### Admin Interface
- 🔐 Secure authentication with PBKDF2 password hashing
- 📊 Dashboard with statistics and recent activity
- ✏️ Create, edit, and delete records
- 📤 Image upload to R2 storage
- 📝 Administrative remarks
- 📜 Complete audit log of all actions
- 🔒 Session management with expiration

### Technical Features
- ⚡ Cloudflare Pages Functions for serverless backend
- 🗄️ Cloudflare D1 (SQLite) for relational database
- 📦 Cloudflare R2 for persistent file storage
- 🔒 Secure password hashing with Web Crypto API
- 📝 Comprehensive audit logging
- 🚀 Edge deployment for global performance
- 📱 Responsive Tailwind CSS design

## Technology Stack

- **Frontend**: HTML5, JavaScript (Vanilla), Tailwind CSS
- **Backend**: Cloudflare Pages Functions (JavaScript)
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Authentication**: PBKDF2 (Web Crypto API)
- **Deployment**: Cloudflare Pages with GitHub integration

## Project Structure

```
cloudflare-demo-platform/
├── functions/
│   ├── api/
│   │   ├── entries/
│   │   │   ├── index.js          # List and create entries
│   │   │   └── [id].js           # Get, update, delete entry
│   │   ├── admin/
│   │   │   ├── login.js          # Admin login
│   │   │   ├── logout.js         # Admin logout
│   │   │   ├── session.js        # Check session
│   │   │   ├── setup.js          # Initial admin setup
│   │   │   ├── dashboard.js     # Dashboard statistics
│   │   │   ├── entries/
│   │   │   │   ├── index.js      # Admin entry management
│   │   │   │   └── [id].js       # Admin entry CRUD
│   │   │   ├── upload.js         # Image upload
│   │   │   └── audit-logs.js     # Audit log viewer
│   │   └── images/
│   │       └── [...path].js      # Serve images from R2
│   └── lib/
│       └── auth.js               # Authentication utilities
├── migrations/
│   ├── 0001_initial_schema.sql   # Database schema
│   ├── 0002_seed_data.sql        # Sample data
│   ├── 0003_admin_sessions.sql   # Session management
│   └── 0004_update_admin_password.sql
├── public/
│   ├── index.html                # Public homepage
│   ├── profile.html              # Record detail page
│   ├── admin/
│   │   ├── login.html            # Admin login
│   │   ├── setup.html           # Initial setup
│   │   ├── dashboard.html        # Admin dashboard
│   │   ├── entries.html          # Entry management
│   │   └── audit-logs.html       # Audit log viewer
│   └── images/
│       └── default.svg           # Default profile image
├── wrangler.jsonc                # Cloudflare configuration
├── package.json                  # Node.js dependencies
├── .gitignore                    # Git ignore rules
├── .dev.vars.example            # Environment variables example
├── README.md                     # This file
├── DATABASE_SCHEMA.md            # Database documentation
├── DEPLOYMENT_GUIDE.md           # Deployment instructions
└── AUDIT_REPORT.md               # Original application audit
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account (free tier works)
- Git and GitHub account

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd cloudflare-demo-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .dev.vars.example .dev.vars
   # Edit .dev.vars if needed (defaults work for local dev)
   ```

4. **Update wrangler.jsonc**
   - Replace `YOUR_D1_DATABASE_ID` with your actual D1 database ID (see Deployment Guide)

5. **Run local development**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Public site: http://localhost:8788
   - Admin setup: http://localhost:8788/admin/setup.html

### Initial Setup

1. Visit `/admin/setup.html` to create your admin account
2. Choose a username and strong password
3. After setup, login at `/admin/login.html`

## Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

### Quick Deploy

1. Create D1 database and R2 bucket (see guide)
2. Update `wrangler.jsonc` with your IDs
3. Push to GitHub
4. Connect repository to Cloudflare Pages
5. Configure bindings in Cloudflare dashboard
6. Deploy!

## API Endpoints

### Public APIs
- `GET /api/entries` - List all entries (with search/filter)
- `GET /api/entries/:id` - Get single entry by ID or slug
- `GET /api/images/:path` - Serve images from R2

### Admin APIs (Authentication Required)
- `POST /api/admin/setup` - Create initial admin account
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/session` - Check current session
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/entries` - List all entries (admin view)
- `POST /api/admin/entries` - Create new entry
- `PUT /api/admin/entries/:id` - Update entry
- `DELETE /api/admin/entries/:id` - Delete entry
- `POST /api/admin/upload` - Upload image to R2
- `GET /api/admin/audit-logs` - View audit logs

## Database Schema

The application uses Cloudflare D1 (SQLite) with the following tables:

- `demo_entries` - Main demonstration records
- `demo_users` - Administrator accounts
- `admin_sessions` - Session management
- `audit_logs` - Activity tracking
- `demo_transactions` - Transaction history
- `app_settings` - Application configuration
- `demo_assets` - R2 file metadata

See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for complete schema documentation.

## Security Features

- 🔐 PBKDF2 password hashing with 100,000 iterations
- 🍪 HttpOnly, Secure, SameSite cookies
- 🚫 CSRF protection (recommended to add tokens)
- 📝 Comprehensive audit logging
- ⏱️ Session expiration (configurable)
- 🔍 Input validation and output escaping
- 📁 File upload validation (type and size)
- 🛡️ SQL injection protection (prepared statements)

## Customization

### Branding
- Update `public/index.html` header section
- Modify color scheme in Tailwind classes
- Replace logo in `public/images/`

### Database
- Edit migration files in `migrations/`
- Add custom fields to schema
- Update API endpoints accordingly

### Features
- Add new API endpoints in `functions/api/`
- Extend admin dashboard in `public/admin/`
- Add new pages to `public/`

## Troubleshooting

### Common Issues

**Admin setup page doesn't load**
- Check that Wrangler is running with D1 bindings
- Verify database migrations have been applied

**Images not displaying**
- Ensure R2 bucket is configured
- Check that image URLs are correct
- Verify R2 binding in wrangler.jsonc

**Session not persisting**
- Check SESSION_TIMEOUT variable
- Verify cookie settings in browser
- Ensure admin_sessions table exists

### Getting Help

- Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- Review Cloudflare Pages Functions documentation
- Check Cloudflare D1 and R2 documentation

## License

MIT License - See LICENSE file for details

## Disclaimer

**This is an independent demonstration application. All records, transactions, and data displayed are fictional. This application is not affiliated with, endorsed by, or connected to any government agency, financial institution, or real organization.**

## Credits

Built with:
- Cloudflare Pages, D1, and R2
- Tailwind CSS
- Web Crypto API
