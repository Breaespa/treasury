-- Migration: 0001_initial_schema
-- Description: Create initial database schema for demo platform
-- D1 (SQLite) compatible schema

-- Demo entries table (migrated from original entries table)
CREATE TABLE IF NOT EXISTS demo_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reference_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    address TEXT,
    previous_status TEXT,
    current_status TEXT NOT NULL DEFAULT 'Pending',
    transaction_status TEXT DEFAULT 'Pending',
    illustrative_amount REAL DEFAULT 0.00,
    currency TEXT DEFAULT 'USD',
    illustrative_fee REAL DEFAULT 0.00,
    remarks TEXT,
    image_key TEXT,
    slug TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for demo_entries
CREATE INDEX IF NOT EXISTS idx_demo_entries_slug ON demo_entries(slug);
CREATE INDEX IF NOT EXISTS idx_demo_entries_reference ON demo_entries(reference_number);
CREATE INDEX IF NOT EXISTS idx_demo_entries_status ON demo_entries(current_status);
CREATE INDEX IF NOT EXISTS idx_demo_entries_created ON demo_entries(created_at DESC);

-- Demo users table for admin authentication
CREATE TABLE IF NOT EXISTS demo_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Index for demo_users
CREATE INDEX IF NOT EXISTS idx_demo_users_username ON demo_users(username);

-- Audit logs table for activity tracking
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    administrator_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,
    description TEXT,
    ip_address TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (administrator_id) REFERENCES demo_users(id) ON DELETE CASCADE
);

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(administrator_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Demo transactions table for transaction history
CREATE TABLE IF NOT EXISTS demo_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL,
    reference_number TEXT NOT NULL,
    illustrative_amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'Pending',
    remarks TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (entry_id) REFERENCES demo_entries(id) ON DELETE CASCADE
);

-- Indexes for demo_transactions
CREATE INDEX IF NOT EXISTS idx_demo_transactions_entry ON demo_transactions(entry_id);
CREATE INDEX IF NOT EXISTS idx_demo_transactions_reference ON demo_transactions(reference_number);
CREATE INDEX IF NOT EXISTS idx_demo_transactions_status ON demo_transactions(status);

-- App settings table for configuration
CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Index for app_settings
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(setting_key);

-- Demo assets table for R2 file metadata
CREATE TABLE IF NOT EXISTS demo_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    object_key TEXT UNIQUE NOT NULL,
    original_filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    entry_id INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (entry_id) REFERENCES demo_entries(id) ON DELETE SET NULL
);

-- Indexes for demo_assets
CREATE INDEX IF NOT EXISTS idx_demo_assets_key ON demo_assets(object_key);
CREATE INDEX IF NOT EXISTS idx_demo_assets_entry ON demo_assets(entry_id);
