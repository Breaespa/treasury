/**
 * Cloudflare Pages Function: Admin entry update and delete
 * PUT /api/admin/entries/:id - Update entry (admin)
 * DELETE /api/admin/entries/:id - Delete entry (admin)
 */

import { requireAuth } from '../../../lib/auth.js';

export async function onRequestPut(context) {
  const { request, env, params } = context;

  try {
    // Check authentication
    const authError = await requireAuth(context);
    if (authError) return authError;

    const { user } = context;
    const id = parseInt(params.id, 10);
    const body = await request.json();

    const {
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
      image_key
    } = body;

    const db = env.DB;

    // Check if entry exists
    const existing = await db.prepare('SELECT * FROM demo_entries WHERE id = ?').bind(id).first();
    if (!existing) {
      return new Response(
        JSON.stringify({ error: 'Entry not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Build update query dynamically
    const updates = [];
    const params_list = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params_list.push(name);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      params_list.push(email);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      params_list.push(address);
    }
    if (previous_status !== undefined) {
      updates.push('previous_status = ?');
      params_list.push(previous_status);
    }
    if (current_status !== undefined) {
      updates.push('current_status = ?');
      params_list.push(current_status);
    }
    if (transaction_status !== undefined) {
      updates.push('transaction_status = ?');
      params_list.push(transaction_status);
    }
    if (illustrative_amount !== undefined) {
      updates.push('illustrative_amount = ?');
      params_list.push(illustrative_amount);
    }
    if (currency !== undefined) {
      updates.push('currency = ?');
      params_list.push(currency);
    }
    if (illustrative_fee !== undefined) {
      updates.push('illustrative_fee = ?');
      params_list.push(illustrative_fee);
    }
    if (remarks !== undefined) {
      updates.push('remarks = ?');
      params_list.push(remarks);
    }
    if (image_key !== undefined) {
      updates.push('image_key = ?');
      params_list.push(image_key);
    }

    // Always update updated_at
    updates.push('updated_at = ?');
    params_list.push(new Date().toISOString());

    // Add id to params
    params_list.push(id);

    if (updates.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No fields to update' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const query = `UPDATE demo_entries SET ${updates.join(', ')} WHERE id = ?`;
    await db.prepare(query).bind(...params_list).run();

    // Log the action
    await db.prepare(
      'INSERT INTO audit_logs (administrator_id, action, entity_type, entity_id, description, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(user.id, 'UPDATE', 'demo_entries', id, `Updated entry: ${existing.name}`, request.headers.get('CF-Connecting-IP') || 'unknown', new Date().toISOString()).run();

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error updating entry:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;

  try {
    // Check authentication
    const authError = await requireAuth(context);
    if (authError) return authError;

    const { user } = context;
    const id = parseInt(params.id, 10);
    const db = env.DB;

    // Check if entry exists
    const existing = await db.prepare('SELECT name FROM demo_entries WHERE id = ?').bind(id).first();
    if (!existing) {
      return new Response(
        JSON.stringify({ error: 'Entry not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Delete entry
    await db.prepare('DELETE FROM demo_entries WHERE id = ?').bind(id).run();

    // Log the action
    await db.prepare(
      'INSERT INTO audit_logs (administrator_id, action, entity_type, entity_id, description, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(user.id, 'DELETE', 'demo_entries', id, `Deleted entry: ${existing.name}`, request.headers.get('CF-Connecting-IP') || 'unknown', new Date().toISOString()).run();

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error deleting entry:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
