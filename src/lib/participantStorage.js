/**
 * Browser storage helpers for participant session persistence.
 *
 * CRITICAL EXPERIMENT DESIGN RULE:
 * localStorage stores ONLY the participant_uuid.
 * It NEVER stores the trial queue, ground truth answers, or conditions.
 * The server is the single source of truth; on reload, the client queries
 * the server with the stored UUID to retrieve sanitized trials.
 */

const STORAGE_KEY = "banglatrust:participant_uuid";

/**
 * Persists the participant UUID to localStorage.
 *
 * @param {string} uuid
 */
export function saveParticipantUuid(uuid) {
  try {
    if (typeof window !== "undefined" && window.localStorage && uuid) {
      window.localStorage.setItem(STORAGE_KEY, uuid);
    }
  } catch {
    // Gracefully handle environments where localStorage is blocked (e.g. private mode)
  }
}

/**
 * Loads the stored participant UUID from localStorage.
 * Returns null if not found or if storage is inaccessible.
 *
 * @returns {string|null}
 */
export function loadParticipantUuid() {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(STORAGE_KEY);
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Removes the participant UUID from localStorage.
 */
export function clearParticipantUuid() {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore errors on removal
  }
}
