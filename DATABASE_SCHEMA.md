# Database Schema Documentation

## Overview

This document describes the Cloudflare D1 database schema for the demo platform. The schema is SQLite-compatible and designed for the demonstration application.

## Schema Diagram

```
demo_entries (1) ----< (N) demo_transactions
     |
     | (1)
     |
demo_assets (N)

demo_users (1) ----< (N) audit_logs

app_settings (standalone)
```

## Tables

### demo_entries

Stores the main demonstration records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| reference_number | TEXT | UNIQUE NOT NULL | External reference number |
| name | TEXT | NOT NULL | Full name |
| email | TEXT | - | Email address |
| address | TEXT | - | Physical address |
| previous_status | TEXT | - | Previous status before update |
| current_status | TEXT | NOT NULL DEFAULT 'Pending' | Current status (Paid/Pending/Overdue) |
| transaction_status | TEXT | DEFAULT 'Pending' | Transaction status (Pending/Processing/Completed/On Hold) |
| illustrative_amount | REAL | DEFAULT 0.00 | Illustrative monetary amount |
| currency | TEXT | DEFAULT 'USD' | Currency code |
| illustrative_fee | REAL | DEFAULT 0.00 | Illustrative fee amount |
| remarks | TEXT | - | Administrative remarks |
| image_key | TEXT | - | R2 object key for profile image |
| slug | TEXT | UNIQUE NOT NULL | URL-friendly identifier |
| created_at | TEXT | DEFAULT (datetime('now')) | Creation timestamp |
| updated_at | TEXT | DEFAULT (datetime('now')) | Last update timestamp |

**Indexes:**
- `idx_demo_entries_slug` on slug
- `idx_demo_entries_reference` on reference_number
- `idx_demo_entries_status` on current_status
- `idx_demo_entries_created` on created_at DESC

### demo_users

Stores administrator accounts for authentication.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| username | TEXT | UNIQUE NOT NULL | Login username |
| password_hash | TEXT | NOT NULL | Bcrypt password hash |
| role | TEXT | NOT NULL DEFAULT 'admin' | User role (admin only for now) |
| is_active | INTEGER | NOT NULL DEFAULT 1 | Active status (1=active, 0=inactive) |
| created_at | TEXT | DEFAULT (datetime('now')) | Creation timestamp |
| updated_at | TEXT | DEFAULT (datetime('now')) | Last update timestamp |

**Indexes:**
- `idx_demo_users_username` on username

**Default Admin:**
- Username: `admin`
- Password: `DemoAdmin123!` (hashed with bcrypt)
- **Important:** Change this password immediately after setup

### audit_logs

Tracks all administrative actions for accountability.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| administrator_id | INTEGER | NOT NULL, FK → demo_users.id | Admin who performed action |
| action | TEXT | NOT NULL | Action type (CREATE, UPDATE, DELETE, etc.) |
| entity_type | TEXT | NOT NULL | Type of entity affected |
| entity_id | INTEGER | - | ID of entity affected |
| description | TEXT | - | Human-readable description |
| ip_address | TEXT | - | IP address of requester |
| created_at | TEXT | DEFAULT (datetime('now')) | Timestamp of action |

**Foreign Key:**
- `administrator_id` → `demo_users(id)` ON DELETE CASCADE

**Indexes:**
- `idx_audit_logs_admin` on administrator_id
- `idx_audit_logs_entity` on entity_type, entity_id
- `idx_audit_logs_created` on created_at DESC

### demo_transactions

Stores transaction history for demonstration records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| entry_id | INTEGER | NOT NULL, FK → demo_entries.id | Associated entry |
| reference_number | TEXT | NOT NULL | Transaction reference |
| illustrative_amount | REAL | NOT NULL | Transaction amount |
| currency | TEXT | DEFAULT 'USD' | Currency code |
| status | TEXT | NOT NULL DEFAULT 'Pending' | Transaction status |
| remarks | TEXT | - | Transaction notes |
| created_at | TEXT | DEFAULT (datetime('now')) | Creation timestamp |
| updated_at | TEXT | DEFAULT (datetime('now')) | Last update timestamp |

**Foreign Key:**
- `entry_id` → `demo_entries(id)` ON DELETE CASCADE

**Indexes:**
- `idx_demo_transactions_entry` on entry_id
- `idx_demo_transactions_reference` on reference_number
- `idx_demo_transactions_status` on status

### app_settings

Stores application configuration settings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| setting_key | TEXT | UNIQUE NOT NULL | Configuration key |
| setting_value | TEXT | - | Configuration value |
| updated_at | TEXT | DEFAULT (datetime('now')) | Last update timestamp |

**Indexes:**
- `idx_app_settings_key` on setting_key

**Default Settings:**
- `app_name`: "Demo Platform"
- `app_description`: "Independent demonstration application"
- `currency`: "USD"
- `max_file_size`: "5242880" (5MB)
- `allowed_image_types`: "image/jpeg,image/png,image/webp,image/gif"
- `session_timeout`: "3600" (1 hour)
- `maintenance_mode`: "false"

### demo_assets

Stores metadata for files stored in R2.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| object_key | TEXT | UNIQUE NOT NULL | R2 object key |
| original_filename | TEXT | NOT NULL | Original filename |
| content_type | TEXT | NOT NULL | MIME type |
| file_size | INTEGER | NOT NULL | File size in bytes |
| entry_id | INTEGER | FK → demo_entries.id | Associated entry (optional) |
| created_at | TEXT | DEFAULT (datetime('now')) | Upload timestamp |

**Foreign Key:**
- `entry_id` → `demo_entries(id)` ON DELETE SET NULL

**Indexes:**
- `idx_demo_assets_key` on object_key
- `idx_demo_assets_entry` on entry_id

## Relationships

### Many-to-One: demo_transactions → demo_entries
- Each transaction belongs to one entry
- One entry can have multiple transactions
- Cascade delete: if entry is deleted, its transactions are deleted

### One-to-Many: demo_entries → demo_assets
- Each entry can have multiple assets
- Each asset belongs to one entry (optional)
- Set null on delete: if entry is deleted, assets become orphaned

### One-to-Many: demo_users → audit_logs
- Each admin can have multiple audit log entries
- Each audit log belongs to one admin
- Cascade delete: if user is deleted, their logs are deleted

## Data Types

- **INTEGER**: Whole numbers (IDs, flags)
- **TEXT**: Strings (names, emails, remarks)
- **REAL**: Decimal numbers (amounts, fees)
- **DATETIME**: ISO 8601 timestamps stored as TEXT

## Status Values

### current_status (demo_entries)
- `Pending`: Initial state
- `Paid`: Payment completed
- `Overdue`: Payment past due

### transaction_status (demo_entries, demo_transactions)
- `Pending`: Not yet processed
- `Processing`: Currently being processed
- `Completed`: Successfully processed
- `On Hold`: Temporarily paused

## Security Considerations

1. **Password Hashing**: All passwords stored as bcrypt hashes
2. **Foreign Keys**: Enforce referential integrity
3. **Indexes**: Optimized for common queries
4. **Audit Trail**: All admin actions logged
5. **Soft Deletes**: Consider adding soft delete flags for critical data

## Migration Strategy

Migrations are numbered sequentially:
- `0001_initial_schema.sql`: Creates all tables and indexes
- `0002_seed_data.sql`: Inserts sample demonstration data

To apply migrations:
```bash
wrangler d1 execute DB_NAME --file=migrations/0001_initial_schema.sql
wrangler d1 execute DB_NAME --file=migrations/0002_seed_data.sql
```

## Performance Notes

- All frequently queried columns are indexed
- Slug and reference_number are unique for fast lookups
- Created_at indexes are descending for recent-first queries
- Foreign keys have indexes for join performance

## Future Enhancements

Potential additions for future versions:
- Soft delete flags
- Additional user roles
- Permission system
- Email notification settings
- Two-factor authentication support
- Advanced search indexes
- Full-text search capabilities
