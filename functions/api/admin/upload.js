/**
 * Cloudflare Pages Function: Admin image upload
 * POST /api/admin/upload
 */

import { requireAuth } from '../../lib/auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Check authentication
    const authError = await requireAuth(context);
    if (authError) return authError;

    const { user } = context;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size: 5MB' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate unique object key
    const ext = file.name.split('.').pop();
    const objectKey = `images/${crypto.randomUUID()}.${ext}`;

    // Upload to R2
    await env.R2.put(objectKey, file.stream(), {
      httpMetadata: {
        contentType: file.type
      },
      customMetadata: {
        originalFilename: file.name,
        uploadedBy: user.username
      }
    });

    // Store metadata in database
    const db = env.DB;
    await db.prepare(
      'INSERT INTO demo_assets (object_key, original_filename, content_type, file_size, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(objectKey, file.name, file.type, file.size, new Date().toISOString()).run();

    // Log the action
    await db.prepare(
      'INSERT INTO audit_logs (administrator_id, action, entity_type, description, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(user.id, 'UPLOAD', 'demo_assets', `Uploaded image: ${file.name}`, request.headers.get('CF-Connecting-IP') || 'unknown', new Date().toISOString()).run();

    return new Response(
      JSON.stringify({
        success: true,
        object_key: objectKey,
        url: `/api/images/${objectKey}`
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
