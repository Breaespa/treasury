/**
 * Cloudflare Pages Function: Admin logout
 * POST /api/admin/logout
 */

import { requireAuth } from '../../lib/auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Check authentication
    const authError = await requireAuth(context);
    if (authError) return authError;

    const { user } = context;
    const db = env.DB;

    const cookieHeader = request.headers.get('Cookie');
    const sessionToken = cookieHeader?.match(/session_token=([^;]+)/)?.[1];

    if (sessionToken) {
      // Delete session from database
      await db.prepare(
        'DELETE FROM admin_sessions WHERE session_token = ?'
      ).bind(sessionToken).run();

      // Log the logout
      await db.prepare(
        'INSERT INTO audit_logs (administrator_id, action, entity_type, description, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(user.id, 'LOGOUT', 'user', 'Admin logged out', request.headers.get('CF-Connecting-IP') || 'unknown', new Date().toISOString()).run();
    }

    // Clear session cookie
    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': 'session_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
        }
      }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
