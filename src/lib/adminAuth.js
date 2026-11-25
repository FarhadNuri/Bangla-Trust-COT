import crypto from "node:crypto";

/**
 * Validates the Authorization header of an incoming admin request.
 *
 * Security requirements:
 * 1. Checks that process.env.ADMIN_SECRET is set and non-empty. Fails closed (returns false) if missing.
 * 2. Compares secret using crypto.timingSafeEqual to prevent side-channel timing attacks.
 * 3. Expects header shape: 'Authorization: Bearer <secret>'.
 *
 * @param {Request} request - Web API Request object
 * @returns {boolean} True if authenticated, false otherwise
 */
export function checkAdminAuth(request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || typeof secret !== "string" || secret.trim().length === 0) {
    // Fail closed if the admin secret environment variable is not configured
    return false;
  }

  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!authHeader || typeof authHeader !== "string") {
    return false;
  }

  const prefix = "Bearer ";
  if (!authHeader.startsWith(prefix)) {
    return false;
  }

  const token = authHeader.slice(prefix.length).trim();
  if (token.length === 0) {
    return false;
  }

  const expectedBuffer = Buffer.from(secret, "utf8");
  const providedBuffer = Buffer.from(token, "utf8");

  // timingSafeEqual requires buffers of identical length.
  // If lengths differ, it cannot match, so return false immediately.
  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}
