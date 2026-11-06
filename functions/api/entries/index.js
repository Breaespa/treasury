/**
 * Cloudflare Pages Function: List all entries with search and filtering
 * GET /api/entries
 */

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const search = url.searchParams.get('q') || '';
    const status = url.searchParams.get('status') || '';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    const db = env.DB;

    // Build query
    let query = `
      SELECT
        id,
        reference_number,
        name,
        email,
        current_status,
        transaction_status,
        illustrative_amount,
        currency,
        image_key,
        slug,
        created_at
      FROM demo_entries
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (name LIKE ?${paramIndex} OR email LIKE ?${paramIndex + 1})`;
      params.push(`%${search}%`, `%${search}%`);
      paramIndex += 2;
    }

    if (status) {
      query += ` AND current_status = ?${paramIndex}`;
      params.push(status);
      paramIndex += 1;
    }

    query += ` ORDER BY created_at DESC LIMIT ?${paramIndex} OFFSET ?${paramIndex + 1}`;
    params.push(limit, offset);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM demo_entries WHERE 1=1`;
    const countParams = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND (name LIKE ?${countParamIndex} OR email LIKE ?${countParamIndex + 1})`;
      countParams.push(`%${search}%`, `%${search}%`);
      countParamIndex += 2;
    }

    if (status) {
      countQuery += ` AND current_status = ?${countParamIndex}`;
      countParams.push(status);
    }

    // Execute queries
    const { results } = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare(countQuery).bind(...countParams).first();
    const total = countResult.total;

    // Add image URLs
    const entries = results.map(entry => ({
      ...entry,
      image_url: entry.image_key ? `/api/images/${entry.image_key}` : '/images/default.png'
    }));

    return new Response(
      JSON.stringify({
        entries,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60' // 1 minute cache
        }
      }
    );
  } catch (error) {
    console.error('Error fetching entries:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
