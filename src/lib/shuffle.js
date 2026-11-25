/**
 * Generates an integer uniformly distributed between min and max (inclusive).
 *
 * @param {number} min - Lower bound
 * @param {number} max - Upper bound
 * @returns {number}
 */
export function randomInt(min, max) {
  if (min > max) {
    throw new Error(`randomInt: min (${min}) cannot be greater than max (${max})`);
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Performs a Fisher-Yates shuffle on an array and returns a new shuffled copy.
 * The original array is never mutated.
 *
 * @template T
 * @param {Array<T>} items
 * @returns {Array<T>}
 */
export function shuffle(items) {
  if (!Array.isArray(items)) {
    throw new Error("shuffle: items must be an array");
  }

  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const targetIndex = Math.floor(Math.random() * (index + 1));
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
  }

  return copy;
}

/**
 * Calculates the maximum length of any consecutive streak sharing the same key.
 *
 * @template T
 * @param {Array<T>} items
 * @param {(item: T) => any} [getKey=(item) => item]
 * @returns {number} Longest streak length (0 if empty)
 */
export function maxRunLength(items, getKey = (item) => item) {
  if (!Array.isArray(items) || items.length === 0) {
    return 0;
  }

  let longestRun = 1;
  let currentRun = 1;

  for (let index = 1; index < items.length; index++) {
    const prevKey = getKey(items[index - 1]);
    const currKey = getKey(items[index]);

    if (prevKey === currKey) {
      currentRun++;
      if (currentRun > longestRun) {
        longestRun = currentRun;
      }
    } else {
      currentRun = 1;
    }
  }

  return longestRun;
}

/**
 * Shuffles items repeatedly until no key appears consecutively more than maxRun times.
 *
 * WHY CONSTRAINED:
 * In trust calibration HCI experiments, long streaks of identical fidelity (e.g. 4+ flawed
 * or faithful items in a row) induce severe order and anchoring biases: participants may assume
 * the model is entirely broken or entirely perfect, distorting subsequent Likert trust scores.
 * Restricting consecutive runs to at most 3 balances randomization with stimulus diversity.
 *
 * @template T
 * @param {Array<T>} items - Array of items to shuffle
 * @param {(item: T) => any} [getKey=(item) => item] - Key extraction function
 * @param {number} [maxRun=3] - Maximum allowable run length of identical keys
 * @param {number} [maxAttempts=1000] - Retry limit before throwing
 * @returns {Array<T>} A new shuffled array adhering to the run-length constraint
 */
export function constrainedShuffle(items, getKey = (item) => item, maxRun = 3, maxAttempts = 1000) {
  if (!Array.isArray(items)) {
    throw new Error("constrainedShuffle: items must be an array");
  }

  if (items.length <= 1) {
    return [...items];
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const candidate = shuffle(items);
    if (maxRunLength(candidate, getKey) <= maxRun) {
      return candidate;
    }
  }

  throw new Error(
    `constrainedShuffle: Failed to find an arrangement with max run length <= ${maxRun} after ${maxAttempts} attempts.`
  );
}
