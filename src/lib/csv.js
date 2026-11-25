/**
 * Converts a single value to a properly formatted, RFC 4180 compliant CSV cell.
 * Includes protection against CSV formula injection (DDE attacks).
 *
 * Cell formatting rules:
 * 1. null / undefined -> empty string ""
 * 2. boolean -> "1" (true) or "0" (false)
 * 3. Date -> ISO 8601 string in UTC
 * 4. number -> String representation (numbers like -1 are NOT prefixed with quotes)
 * 5. string -> If string starts with '=', '+', '-', or '@', prefix with a single quote "'"
 *              to neutralize spreadsheet formula execution.
 * 6. Quoting -> If cell contains comma, double quote, CR ('\r'), or LF ('\n'),
 *               wrap in double quotes and escape inner double quotes by doubling them.
 *
 * @param {any} value
 * @returns {string}
 */
export function toCsvCell(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "number") {
    return String(value);
  }

  let text = String(value);

  // CSV formula injection protection:
  // Spreadsheets (Excel, Google Sheets, LibreOffice) interpret cells beginning with =, +, -, or @ as formulas.
  // Prefixing with a single quote instructs spreadsheets to treat the contents strictly as text.
  if (
    text.startsWith("=") ||
    text.startsWith("+") ||
    text.startsWith("-") ||
    text.startsWith("@")
  ) {
    text = "'" + text;
  }

  // Quote the field if it contains special characters
  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\r") ||
    text.includes("\n")
  ) {
    const escaped = text.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  return text;
}

/**
 * Builds an RFC 4180 compliant CSV document with a UTF-8 BOM.
 *
 * @param {Array<string>} columns - Ordered list of column header names
 * @param {Array<object>} rows - Array of objects where keys match column names
 * @returns {string} Full CSV content including UTF-8 BOM, headers, and \r\n line endings
 */
export function buildCsv(columns, rows) {
  if (!Array.isArray(columns)) {
    throw new Error("buildCsv: columns must be an array of strings");
  }

  if (!Array.isArray(rows)) {
    throw new Error("buildCsv: rows must be an array of objects");
  }

  // UTF-8 Byte Order Mark (\uFEFF) ensures Excel opens Bangla characters without mojibake
  let output = "\uFEFF";

  // Header row
  const headerLine = columns.map(toCsvCell).join(",");
  output += headerLine + "\r\n";

  // Data rows
  for (const row of rows) {
    const line = columns
      .map((col) => toCsvCell(row[col]))
      .join(",");
    output += line + "\r\n";
  }

  return output;
}
