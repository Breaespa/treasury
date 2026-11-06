/**
 * Cloudflare Pages Function: Admin dashboard statistics
 * GET /api/admin/dashboard
 */

import { requireAuth } from '../../lib/auth.js';

export async function onRequestGet(context) {
  const { env } = context;

  try {
    // Check authentication
    const authError = await requireAuth(context);
    if (authError) return authError;

    const db = env.DB;

    // Get total entries
    const totalResult = await db.prepare('SELECT COUNT(*) as count FROM demo_entries').first();
    const total = totalResult.count;

    // Get entries by status
    const paidResult = await db.prepare("SELECT COUNT(*) as count FROM demo_entries WHERE current_status = 'Paid'").first();
    const pendingResult = await db.prepare("SELECT COUNT(*) as count FROM demo_entries WHERE current_status = 'Pending'").first();
    const overdueResult = await db.prepare("SELECT COUNT(*) as count FROM demo_entries WHERE current_status = 'Overdue'").first();

    // Get total illustrative amount
    const amountResult = await db.prepare('SELECT SUM(illustrative_amount) as total FROM demo_entries').first();
    const totalAmount = amountResult.total || 0;

    // Get recent entries (last 5)
    const { results: recentEntries } = await db.prepare(
      'SELECT id, name, current_status, illustrative_amount, created_at FROM demo_entries ORDER BY created_at DESC LIMIT 5'
    ).all();

    // Get recent audit logs (last 10)
    const { results: recentLogs } = await db.prepare(
      'SELECT a.*, u.username FROM audit_logs a JOIN demo_users u ON a.administrator_id = u.id ORDER BY a.created_at DESC LIMIT 10'
    ).all();

    return new Response(
      JSON.stringify({
        statistics: {
          total_entries: total,
          paid_entries: paidResult.count,
          pending_entries: pendingResult.count,
          overdue_entries: overdueResult.count,
          total_amount: totalAmount
        },
        recent_entries: recentEntries,
        recent_logs: recentLogs
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Dashboard error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
