/**
 * Authentication utilities for Cloudflare Workers
 * Uses Web Crypto API for password hashing (PBKDF2)
 */

const SALT_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;
const HASH_ALGORITHM = 'SHA-256';

/**
 * Generate a random salt
 */
async function generateSalt() {
  const salt = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(salt);
  return salt;
}

/**
 * Convert buffer to hex string
 */
function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to buffer
 */
function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Hash a password using PBKDF2
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password in format: salt:hash
 */
export async function hashPassword(password) {
  const salt = await generateSalt();
  const saltHex = bufferToHex(salt);

  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const key = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: HASH_ALGORITHM
    },
    key,
    KEY_LENGTH * 8
  );

  const hashHex = bufferToHex(new Uint8Array(derivedBits));

  return `${saltHex}:${hashHex}`;
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Stored hash in format: salt:hash
 * @returns {Promise<boolean>} - True if password matches
 */
export async function verifyPassword(password, hash) {
  try {
    const [saltHex, storedHashHex] = hash.split(':');

    if (!saltHex || !storedHashHex) {
      return false;
    }

    const salt = hexToBuffer(saltHex);
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const key = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: ITERATIONS,
        hash: HASH_ALGORITHM
      },
      key,
      KEY_LENGTH * 8
    );

    const computedHashHex = bufferToHex(new Uint8Array(derivedBits));

    // Constant-time comparison to prevent timing attacks
    if (computedHashHex.length !== storedHashHex.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < computedHashHex.length; i++) {
      result |= computedHashHex.charCodeAt(i) ^ storedHashHex.charCodeAt(i);
    }

    return result === 0;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Verify session token
 * @param {string} sessionToken - Session token from cookie
 * @param {object} env - Cloudflare environment (contains DB)
 * @returns {Promise<object|null>} - User object if valid, null otherwise
 */
export async function verifySession(sessionToken, env) {
  if (!sessionToken) {
    return null;
  }

  try {
    const db = env.DB;

    // Get session from database
    const session = await db.prepare(
      'SELECT s.user_id, s.expires_at, u.username, u.role FROM admin_sessions s JOIN demo_users u ON s.user_id = u.id WHERE s.session_token = ? AND s.expires_at > ?'
    ).bind(sessionToken, new Date().toISOString()).first();

    if (!session) {
      return null;
    }

    return {
      id: session.user_id,
      username: session.username,
      role: session.role
    };
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

/**
 * Middleware to check if user is authenticated
 */
export async function requireAuth(context) {
  const { request, env } = context;

  const cookieHeader = request.headers.get('Cookie');
  const sessionToken = cookieHeader?.match(/session_token=([^;]+)/)?.[1];

  const user = await verifySession(sessionToken, env);

  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Attach user to context for use in handlers
  context.user = user;
  return null; // Continue to handler
}
