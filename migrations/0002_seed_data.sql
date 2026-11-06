-- Migration: 0002_seed_data
-- Description: Seed database with fictional demonstration data
-- IMPORTANT: All data is fictional for demonstration purposes only

-- Insert default admin user
-- Password: DemoAdmin123! (hashed with bcrypt)
-- In production, this should be changed immediately after setup
INSERT INTO demo_users (username, password_hash, role, is_active)
VALUES ('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7xNXq.d8iK', 'admin', 1)
ON CONFLICT(username) DO NOTHING;

-- Insert sample demo entries (fictional data)
INSERT INTO demo_entries (reference_number, name, email, address, previous_status, current_status, transaction_status, illustrative_amount, currency, illustrative_fee, remarks, slug)
VALUES
    ('REF-2024-001', 'Alice Johnson', 'alice.johnson@example.com', '123 Maple Street, Springfield, IL 62701', 'Pending', 'Paid', 'Completed', 2500.00, 'USD', 25.00, 'Initial demonstration record', 'alice-johnson'),
    ('REF-2024-002', 'Robert Smith', 'robert.smith@example.com', '456 Oak Avenue, Portland, OR 97201', 'Pending', 'Pending', 'Processing', 1500.00, 'USD', 15.00, 'Pending verification', 'robert-smith'),
    ('REF-2024-003', 'Maria Garcia', 'maria.garcia@example.com', '789 Pine Road, Austin, TX 78701', 'Pending', 'Overdue', 'On Hold', 3200.00, 'USD', 32.00, 'Follow-up required', 'maria-garcia'),
    ('REF-2024-004', 'James Wilson', 'james.wilson@example.com', '321 Elm Street, Denver, CO 80201', 'Pending', 'Paid', 'Completed', 1800.00, 'USD', 18.00, 'Processed successfully', 'james-wilson'),
    ('REF-2024-005', 'Emily Brown', 'emily.brown@example.com', '654 Cedar Lane, Seattle, WA 98101', 'Pending', 'Pending', 'Pending', 4200.00, 'USD', 42.00, 'Awaiting review', 'emily-brown'),
    ('REF-2024-006', 'Michael Davis', 'michael.davis@example.com', '987 Birch Drive, Miami, FL 33101', 'Pending', 'Paid', 'Completed', 2900.00, 'USD', 29.00, 'Completed without issues', 'michael-davis'),
    ('REF-2024-007', 'Sarah Miller', 'sarah.miller@example.com', '147 Willow Way, Boston, MA 02101', 'Pending', 'Overdue', 'On Hold', 3600.00, 'USD', 36.00, 'Payment overdue', 'sarah-miller'),
    ('REF-2024-008', 'David Lee', 'david.lee@example.com', '258 Aspen Court, Chicago, IL 60601', 'Pending', 'Pending', 'Processing', 2100.00, 'USD', 21.00, 'In progress', 'david-lee'),
    ('REF-2024-009', 'Jennifer Taylor', 'jennifer.taylor@example.com', '369 Spruce Street, San Francisco, CA 94101', 'Pending', 'Paid', 'Completed', 4800.00, 'USD', 48.00, 'Successfully processed', 'jennifer-taylor'),
    ('REF-2024-010', 'Christopher Martinez', 'christopher.martinez@example.com', '741 Cherry Blossom Lane, Los Angeles, CA 90001', 'Pending', 'Pending', 'Pending', 5500.00, 'USD', 55.00, 'New submission', 'christopher-martinez')
ON CONFLICT(reference_number) DO NOTHING;

-- Insert sample transaction history
INSERT INTO demo_transactions (entry_id, reference_number, illustrative_amount, currency, status, remarks)
VALUES
    (1, 'REF-2024-001', 2500.00, 'USD', 'Completed', 'Initial payment processed'),
    (2, 'REF-2024-002', 1500.00, 'USD', 'Processing', 'Payment in progress'),
    (3, 'REF-2024-003', 3200.00, 'USD', 'On Hold', 'Awaiting verification'),
    (4, 'REF-2024-004', 1800.00, 'USD', 'Completed', 'Payment received'),
    (5, 'REF-2024-005', 4200.00, 'USD', 'Pending', 'Awaiting processing'),
    (6, 'REF-2024-006', 2900.00, 'USD', 'Completed', 'Transaction complete'),
    (7, 'REF-2024-007', 3600.00, 'USD', 'On Hold', 'Payment overdue - follow-up'),
    (8, 'REF-2024-008', 2100.00, 'USD', 'Processing', 'Currently processing'),
    (9, 'REF-2024-009', 4800.00, 'USD', 'Completed', 'Successfully verified'),
    (10, 'REF-2024-010', 5500.00, 'USD', 'Pending', 'New transaction submitted')
ON CONFLICT DO NOTHING;

-- Insert app settings
INSERT INTO app_settings (setting_key, setting_value)
VALUES
    ('app_name', 'Demo Platform'),
    ('app_description', 'Independent demonstration application'),
    ('currency', 'USD'),
    ('max_file_size', '5242880'),
    ('allowed_image_types', 'image/jpeg,image/png,image/webp,image/gif'),
    ('session_timeout', '3600'),
    ('maintenance_mode', 'false')
ON CONFLICT(setting_key) DO NOTHING;

-- Insert sample audit logs (initial setup)
INSERT INTO audit_logs (administrator_id, action, entity_type, entity_id, description, ip_address)
VALUES
    (1, 'INITIAL_SETUP', 'system', NULL, 'Initial database setup completed', '127.0.0.1'),
    (1, 'CREATE_USER', 'demo_users', 1, 'Default admin user created', '127.0.0.1'),
    (1, 'SEED_DATA', 'demo_entries', NULL, 'Sample demonstration data seeded', '127.0.0.1')
ON CONFLICT DO NOTHING;
