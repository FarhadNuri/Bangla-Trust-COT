/**
 * Standard client API error class representing structured server errors.
 */
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Common fetch wrapper that parses the API error envelope and throws ApiError.
 *
 * @param {string} path - API endpoint path (e.g. /api/sessions/start)
 * @param {RequestInit} [options={}] - Fetch options
 * @returns {Promise<any>}
 */
async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  let response;
  try {
    response = await fetch(path, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Network connection error. Please check your internet connection."
    );
  }

  let data = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorInfo = data?.error || {};
    const code = errorInfo.code || "UNKNOWN_ERROR";
    const message = errorInfo.message || `Request failed with status ${response.status}`;
    const details = errorInfo.details;
    throw new ApiError(response.status, code, message, details);
  }

  return data;
}

/**
 * Creates a new participant session upon study consent.
 *
 * @returns {Promise<{ participant_uuid: string, form_id: string, block_order: string, trials: Array<object> }>}
 */
export async function startSession() {
  return request("/api/sessions/start", {
    method: "POST",
    body: JSON.stringify({ consent: true }),
  });
}

/**
 * Restores a participant's session upon page reload.
 *
 * @param {string} uuid
 * @returns {Promise<object>} Session status, demographics info, answered count, and sanitized trials
 */
export async function getSession(uuid) {
  return request(`/api/sessions/${encodeURIComponent(uuid)}`, {
    method: "GET",
  });
}

/**
 * Submits participant demographic responses.
 *
 * @param {string} uuid
 * @param {object} data
 * @returns {Promise<{ saved: boolean, demographics_completed: boolean }>}
 */
export async function saveDemographics(uuid, data) {
  return request(`/api/sessions/${encodeURIComponent(uuid)}/demographics`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Saves a single trial response (idempotent upsert on the server).
 *
 * @param {object} payload
 * @returns {Promise<{ saved: boolean, answered_count: number }>}
 */
export async function saveResponse(payload) {
  return request("/api/responses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Completes a participant's session once all 34 trials are answered.
 *
 * @param {string} uuid
 * @returns {Promise<{ completion_code: string, attention_checks_passed: number, summary: object }>}
 */
export async function completeSession(uuid) {
  return request(`/api/sessions/${encodeURIComponent(uuid)}/complete`, {
    method: "POST",
  });
}

/**
 * Retrieves administrative study statistics using Bearer authentication.
 *
 * @param {string} secret - ADMIN_SECRET
 * @returns {Promise<object>} Totals, cell counts, attention tallies, and speeder logs
 */
export async function getAdminStats(secret) {
  return request("/api/admin/stats", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secret}`,
    },
  });
}

/**
 * Downloads the analysis CSV dataset directly in the browser via Blob download.
 *
 * @param {string} secret - ADMIN_SECRET
 * @param {{ completedOnly?: boolean, includeName?: boolean }} [options={}]
 */
export async function downloadAdminCsv(secret, { completedOnly = false, includeName = false } = {}) {
  const query = new URLSearchParams();
  if (completedOnly) query.set("completed_only", "true");
  if (includeName) query.set("include_name", "true");

  const url = `/api/admin/export.csv?${query.toString()}`;

  let response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Failed to connect to export service.");
  }

  if (!response.ok) {
    let message = "Export download failed";
    try {
      const errorJson = await response.json();
      message = errorJson?.error?.message || message;
    } catch {
      // Ignore JSON parse failure on text error
    }
    throw new ApiError(response.status, "EXPORT_ERROR", message);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;

  const today = new Date().toISOString().slice(0, 10);
  link.download = `banglatrust_export_${today}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
