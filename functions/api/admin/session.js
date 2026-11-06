/**
 * Cloudflare Pages Function: Check current session
 * GET /api/admin/session
 */

import { requireAuth } from '../../lib/auth.js';

export async function onRequestGet(context) {
  try {
    // Check authentication
    const authError = await requireAuth(context);
    if (authError) return authError;

    const { user } = context;

    return new Response(
      JSON.stringify({
        authenticated: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Session check error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
