/**
 * Cloudflare Pages Function: Initial admin setup
 * POST /api/admin/setup
 * This endpoint creates the initial admin user with a secure password hash
 * Should be disabled after initial setup
 */

import { hashPassword } from '../../lib/auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Check if admin already exists
    const db = env.DB;
    const existingAdmin = await db.prepare(
      'SELECT id FROM demo_users WHERE username = ?'
    ).bind('admin').first();

    if (existingAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin user already exists' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username and password are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create admin user
    await db.prepare(
      'INSERT INTO demo_users (username, password_hash, role, is_active) VALUES (?, ?, ?, ?)'
    ).bind(username, passwordHash, 'admin', 1).run();

    // Log the setup
    await db.prepare(
      'INSERT INTO audit_logs (administrator_id, action, entity_type, description, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(1, 'INITIAL_SETUP', 'system', 'Initial admin user created', request.headers.get('CF-Connecting-IP') || 'unknown', new Date().toISOString()).run();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Admin user created successfully. Please login.'
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Setup error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
