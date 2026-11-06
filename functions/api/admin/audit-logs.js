/**
 * Cloudflare Pages Function: Admin audit logs
 * GET /api/admin/audit-logs
 */

import { requireAuth } from '../../lib/auth.js';

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    // Check authentication
    const authError = await requireAuth(context);
    if (authError) return authError;

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    const db = env.DB;

    // Get audit logs with pagination
    const { results } = await db.prepare(
      `SELECT a.*, u.username
       FROM audit_logs a
       JOIN demo_users u ON a.administrator_id = u.id
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();

    // Get total count
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM audit_logs').first();
    const total = countResult.total;

    return new Response(
      JSON.stringify({
        logs: results,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Audit logs error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
