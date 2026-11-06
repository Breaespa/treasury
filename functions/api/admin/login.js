/**
 * Cloudflare Pages Function: Admin login
 * POST /api/admin/login
 */

import { hashPassword, verifyPassword } from '../../lib/auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username and password are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const db = env.DB;

    // Get user from database
    const user = await db.prepare(
      'SELECT id, username, password_hash, role, is_active FROM demo_users WHERE username = ?'
    ).bind(username).first();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user is active
    if (user.is_active !== 1) {
      return new Response(
        JSON.stringify({ error: 'Account is disabled' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate session token
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + (parseInt(env.SESSION_TIMEOUT || '3600') * 1000)).toISOString();

    // Store session in database (or use KV in production)
    await db.prepare(
      'INSERT INTO admin_sessions (session_token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)'
    ).bind(sessionToken, user.id, expiresAt, new Date().toISOString()).run();

    // Log the login
    await db.prepare(
      'INSERT INTO audit_logs (administrator_id, action, entity_type, description, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(user.id, 'LOGIN', 'user', 'Admin logged in', request.headers.get('CF-Connecting-IP') || 'unknown', new Date().toISOString()).run();

    // Set session cookie
    const response = new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `session_token=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${env.SESSION_TIMEOUT || '3600'}`
        }
      }
    );

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
