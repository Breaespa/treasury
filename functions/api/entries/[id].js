/**
 * Cloudflare Pages Function: Get single entry by ID or slug
 * GET /api/entries/:id
 */

export async function onRequestGet(context) {
  const { request, env } = context;
  const { params } = context;

  try {
    const identifier = params.id;
    const db = env.DB;

    // Check if identifier is numeric (ID) or string (slug)
    const isNumeric = /^\d+$/.test(identifier);

    let query;
    let queryParams;

    if (isNumeric) {
      query = `
        SELECT
          id,
          reference_number,
          name,
          email,
          address,
          previous_status,
          current_status,
          transaction_status,
          illustrative_amount,
          currency,
          illustrative_fee,
          remarks,
          image_key,
          slug,
          created_at,
          updated_at
        FROM demo_entries
        WHERE id = ?
      `;
      queryParams = [parseInt(identifier, 10)];
    } else {
      query = `
        SELECT
          id,
          reference_number,
          name,
          email,
          address,
          previous_status,
          current_status,
          transaction_status,
          illustrative_amount,
          currency,
          illustrative_fee,
          remarks,
          image_key,
          slug,
          created_at,
          updated_at
        FROM demo_entries
        WHERE slug = ?
      `;
      queryParams = [identifier];
    }

    const result = await db.prepare(query).bind(...queryParams).first();

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'Entry not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Add image URL if image_key exists
    if (result.image_key) {
      result.image_url = `/api/images/${result.image_key}`;
    } else {
      result.image_url = '/images/default.png';
    }

    return new Response(
      JSON.stringify({ entry: result }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300' // 5 minutes cache
        }
      }
    );
  } catch (error) {
    console.error('Error fetching entry:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
