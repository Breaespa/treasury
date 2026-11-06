/**
 * Cloudflare Pages Function: Serve images from R2
 * GET /api/images/:path
 */

export async function onRequestGet(context) {
  const { request, env, params } = context;

  try {
    const path = params.path;
    const objectKey = path;

    // Get object from R2
    const object = await env.R2.get(objectKey);

    if (!object) {
      return new Response('Image not found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Get object metadata
    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=31536000'); // 1 year cache

    // Return image
    return new Response(object.body, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
