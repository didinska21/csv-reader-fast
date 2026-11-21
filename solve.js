// Exact csv-reader 1.0.0 recovery rules, with slices for ordinary field text.
export function run(input) {
  const text = String(input.text);
  const header = input.header === true;
  const length = text.length;
  const rows = [];
  const errors = [];
  let columns = null;
  let width = -1;
  let pos = text.charCodeAt(0) === 65279 ? 1 : 0;
  let line = 1;

  // Keep delimiter lookahead across fields and records, including when a
  // delimiter doesn't occur again. Quoted lookahead leaves these cursors alone.
  let comma = -1;
  let lf = -1;
  let cr = -1;
  const quotedSpecial = /""|\r\n?|\n/g;

  while (pos < length) {
    // Empty physical lines do not establish a record or its width.
    const code = text.charCodeAt(pos);
    if (code === 10) {
      ++pos;
      ++line;
      continue;
    }
    if (code === 13 && text.charCodeAt(pos + 1) === 10) {
      pos += 2;
      ++line;
      continue;
    }

    const recordLine = line;
    const recordRow = header && columns === null ? null : rows.length;
    const fields = [];
    let more;
    let quoted;
    do {
      quoted = text.charCodeAt(pos) === 34;
      let value = '';
      let closed = false;
      let added = false;

      if (quoted) {
        const start = ++pos;
        const firstQuote = text.indexOf('"', start);
        let close = firstQuote;
        while (close !== -1 && text.charCodeAt(close + 1) === 34) {
          close = text.indexOf('"', close + 2);
        }
        if (close === -1) {
          value = '"';
          errors.push({ code: 'unterminated_quote', line: recordLine, row: recordRow });
        } else {
          if (lf < start) {
            lf = text.indexOf('\n', start);
            if (lf === -1) lf = length;
          }
          if (cr < start) {
            cr = text.indexOf('\r', start);
            if (cr === -1) cr = length;
          }
          value = text.slice(start, close);
          if (close !== firstQuote || lf < close || cr < close) {
            value = value.replace(quotedSpecial, match => {
              if (match === '""') return '"';
              ++line;
              return '\n';
            });
          }
          pos = close + 1;
          closed = true;
        }
      }

      more = false;
      while (pos < length) {
        if (comma < pos) {
          comma = text.indexOf(',', pos);
          if (comma === -1) comma = length;
        }
        if (lf < pos) {
          lf = text.indexOf('\n', pos);
          if (lf === -1) lf = length;
        }
        if (cr < pos) {
          cr = text.indexOf('\r', pos);
          if (cr === -1) cr = length;
        }
        const end = Math.min(comma, lf, cr);
        if (end > pos) {
          value += text.slice(pos, end);
          added = true;
        }
        pos = end;
        if (end === length) break;
        if (end === comma) {
          ++pos;
          more = true;
          break;
        }
        if (end === lf || (lf < length && lf === end + 1)) {
          pos = lf + 1;
          ++line;
          break;
        }
        errors.push({ code: 'stray_cr', line: recordLine, row: recordRow });
        ++pos;
      }
      if (closed && added) {
        errors.push({ code: 'quote_junk', line: recordLine, row: recordRow });
      }
      fields.push(value);
    } while (more);

    // A record consisting solely of discarded CRs is absent; its errors stay.
    if (fields.length === 1 && fields[0] === '' && !quoted) continue;

    if (width < 0) width = fields.length;
    if (header && columns === null) {
      columns = fields;
      continue;
    }
    if (fields.length < width) {
      errors.push({ code: 'short_row', line: recordLine, row: recordRow, fields: fields.length });
      while (fields.length < width) fields.push('');
    } else if (fields.length > width) {
      errors.push({ code: 'long_row', line: recordLine, row: recordRow, extra: fields.splice(width) });
    }
    rows.push(fields);
  }

  return { columns: header ? (columns ?? []) : null, rows, errors };
}
