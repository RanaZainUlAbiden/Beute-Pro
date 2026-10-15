/**
 * Minimal CSV encoder.
 * Handles quotes, commas, newlines, and null values correctly.
 * No external dependency.
 */

const escapeCell = (val) => {
  if (val === null || val === undefined) return '';
  const s = String(val);
  // Quote if the value contains a comma, quote, newline, or CR
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

/**
 * @param {Array<Object>} rows
 * @param {Array<{ key: string, header: string, format?: (row) => any }>} columns
 * @returns {string} CSV text (CRLF line endings, UTF-8 with BOM)
 */
const toCsv = (rows, columns) => {
  const header = columns.map(c => escapeCell(c.header)).join(',');
  const lines = [header];

  for (const row of rows) {
    const line = columns.map(c => {
      const raw = typeof c.format === 'function' ? c.format(row) : row[c.key];
      return escapeCell(raw);
    }).join(',');
    lines.push(line);
  }

  // BOM helps Excel detect UTF-8 correctly (important for Arabic text)
  return '\uFEFF' + lines.join('\r\n');
};

/**
 * Send CSV as a downloadable file.
 */
const sendCsv = (res, filename, csvText) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvText);
};

module.exports = { toCsv, sendCsv };