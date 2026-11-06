/**
 * Cloudflare Pages Function: Admin entry list and create
 * GET /api/admin/entries - List all entries (admin)
 * POST /api/admin/entries - Create new entry (admin)
 */

import { requireAuth } from '../../../lib/auth.js';

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    // Check authentication
    const authError = await requireAuth(context);
    if (authError) return authError;

    const { user } = context;
    const url = new URL(request.url);
    const search = url.searchParams.get('q') || '';
    const status = url.searchParams.get('status') || '';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    const db = env.DB;

    // Build query
    let query = `
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
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (name LIKE ?${paramIndex} OR email LIKE ?${paramIndex + 1} OR reference_number LIKE ?${paramIndex + 2})`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      paramIndex += 3;
    }

    if (status) {
      query += ` AND current_status = ?${paramIndex}`;
      params.push(status);
      paramIndex += 1;
    }

    query += ` ORDER BY created_at DESC LIMIT ?${paramIndex} OFFSET ?${paramIndex + 1}`;
    params.push(limit, offset);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM demo_entries WHERE 1=1`;
    const countParams = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND (name LIKE ?${countParamIndex} OR email LIKE ?${countParamIndex + 1} OR reference_number LIKE ?${countParamIndex + 2})`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      countParamIndex += 3;
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
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error fetching admin entries:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Check authentication
    const authError = await requireAuth(context);
    if (authError) return authError;

    const { user } = context;
    const body = await request.json();

    const {
      name,
      email,
      address,
      current_status,
      transaction_status,
      illustrative_amount,
      currency,
      illustrative_fee,
      remarks
    } = body;

    // Validate required fields
    if (!name) {
      return new Response(
        JSON.stringify({ error: 'Name is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const db = env.DB;

    // Generate reference number
    const reference_number = `REF-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;

    // Generate slug from name
    let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!slug) slug = 'entry';

    // Ensure slug is unique
    let counter = 1;
    let originalSlug = slug;
    while (true) {
      const existing = await db.prepare('SELECT id FROM demo_entries WHERE slug = ?').bind(slug).first();
      if (!existing) break;
      slug = `${originalSlug}-${counter++}`;
    }

    // Insert entry
    const result = await db.prepare(
      `INSERT INTO demo_entries (
        reference_number, name, email, address, current_status, transaction_status,
        illustrative_amount, currency, illustrative_fee, remarks, slug
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      reference_number,
      name,
      email || null,
      address || null,
      current_status || 'Pending',
      transaction_status || 'Pending',
      illustrative_amount || 0,
      currency || 'USD',
      illustrative_fee || 0,
      remarks || null,
      slug
    ).run();

    // Log the action
    await db.prepare(
      'INSERT INTO audit_logs (administrator_id, action, entity_type, entity_id, description, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(user.id, 'CREATE', 'demo_entries', result.meta.last_row_id, `Created entry: ${name}`, request.headers.get('CF-Connecting-IP') || 'unknown', new Date().toISOString()).run();

    return new Response(
      JSON.stringify({
        success: true,
        entry_id: result.meta.last_row_id,
        reference_number,
        slug
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error creating entry:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
