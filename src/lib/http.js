import { NextResponse } from "next/server";

/**
 * Mapping from API error codes to HTTP status codes.
 * Exact correspondence defined in docs/03_API_CONTRACT.md section 1.
 */
export const ERROR_STATUS = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  SESSION_COMPLETED: 409,
  DEMOGRAPHICS_REQUIRED: 409,
  DEMOGRAPHICS_LOCKED: 409,
  TRIAL_OUT_OF_ORDER: 409,
  INCOMPLETE_SESSION: 409,
  SERVER_ERROR: 500,
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates whether a given string is a valid standard 36-character UUID.
 *
 * @param {string} text
 * @returns {boolean}
 */
export function isValidUuid(text) {
  if (typeof text !== "string") {
    return false;
  }
  return UUID_REGEX.test(text.trim());
}

/**
 * Returns a JSON Response with status and standard no-store caching headers.
 *
 * @param {any} body - JSON serializable body
 * @param {number} [status=200] - HTTP status code
 * @returns {Response}
 */
export function jsonOk(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Returns a standardized JSON error response following the envelope from docs/03_API_CONTRACT.md:
 * { "error": { "code", "message", "details?" } }
 *
 * @param {string} code - Error code from ERROR_STATUS
 * @param {string} message - Human-readable explanation
 * @param {object} [details] - Optional extra metadata
 * @returns {Response}
 */
export function jsonError(code, message, details) {
  const status = ERROR_STATUS[code] || 500;

  const errorPayload = {
    code,
    message,
  };

  if (details !== undefined && details !== null) {
    errorPayload.details = details;
  }

  return NextResponse.json(
    { error: errorPayload },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

/**
 * Logs unexpected server exceptions and returns a generic 500 error response.
 * Prevents internal stack traces or database connection details from leaking.
 *
 * @param {unknown} error - Caught exception
 * @returns {Response}
 */
export function handleUnexpectedError(error) {
  console.error("Unhandled API exception:", error);
  return jsonError("SERVER_ERROR", "Something went wrong. Please try again.");
}
