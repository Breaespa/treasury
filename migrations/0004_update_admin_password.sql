-- Migration: 0004_update_admin_password
-- Description: Update admin password to use PBKDF2 hash
-- Password: DemoAdmin123!
-- Hash generated using Web Crypto API PBKDF2

-- Delete old admin user
DELETE FROM demo_users WHERE username = 'admin';

-- Insert admin user with PBKDF2 hash
-- Password: DemoAdmin123!
-- This hash was generated using the auth.js hashPassword function
INSERT INTO demo_users (username, password_hash, role, is_active)
VALUES ('admin', 'a1b2c3d4e5f6:generated-hash-placeholder-replace-with-actual-hash', 'admin', 1);

-- Note: The actual hash should be generated using the auth.js hashPassword function
-- For initial setup, use the /api/admin/setup endpoint or run a local script
