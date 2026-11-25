#!/usr/bin/env node
// Counts requirement status from a Markdown PRD table, per family and per board.
//   node prd_status.mjs <prd.md> [matrix.json]
// A row is any table line that starts with an ID (ABC-001) and has a cell that says done, partial or missing.
// matrix.json: [{ "family": "ALR", "from": 1, "to": 20, "boards": ["S05", "S19"] }]
// With a matrix, it fails when a row lands on no board. Without arguments, it runs its self-check.
import fs from 'node:fs';
import assert from 'node:assert';

export function parseRows(md) {
  const rows = [];
  for (const line of md.split(/\r?\n/)) {
    const m = line.match(/^\|\s*([A-Z]+)-(\d+)\s*\|/);
    if (!m) continue;
    const cells = line.split('|').map(c => c.trim());
    const st = cells.find(c => /^(done|partial|missing)$/i.test(c));
    if (st) rows.push({ id: `${m[1]}-${m[2]}`, family: m[1], n: +m[2], status: st.toLowerCase() });
  }
  return rows;
}

export function byBoard(rows, matrix) {
  const boards = {}, unmapped = [];
  for (const r of rows) {
    const hits = matrix.filter(x => x.family === r.family && r.n >= x.from && r.n <= x.to);
    if (!hits.length) unmapped.push(r.id);
    for (const h of hits) for (const b of h.boards) {
      boards[b] = boards[b] || { done: 0, partial: 0, missing: 0 };
      boards[b][r.status]++;
    }
  }
  return { boards, unmapped };
}

const totals = (rows) => rows.reduce((a, r) => (a[r.status]++, a), { done: 0, partial: 0, missing: 0 });

function selfCheck() {
  const md = '| ID | R | Status |\n|---|---|---|\n| ALR-001 | a | done | x |\n| ALR-002 | b | partial | y\n| REC-001 | c | missing | z |\n| note | d | done |\n';
  const rows = parseRows(md);
  assert.deepStrictEqual(totals(rows), { done: 1, partial: 1, missing: 1 }, 'a row without a closing pipe still counts');
  const { boards, unmapped } = byBoard(rows, [{ family: 'ALR', from: 1, to: 2, boards: ['S05'] }]);
  assert.deepStrictEqual(boards.S05, { done: 1, partial: 1, missing: 0 });
  assert.deepStrictEqual(unmapped, ['REC-001'], 'a row with no board is reported');
  console.log('prd_status self-check passed');
}

const [file, matrixFile] = process.argv.slice(2);
if (!file) selfCheck();
else {
  const rows = parseRows(fs.readFileSync(file, 'utf8'));
  console.log(JSON.stringify({ rows: rows.length, ...totals(rows) }));
  if (matrixFile) {
    const { boards, unmapped } = byBoard(rows, JSON.parse(fs.readFileSync(matrixFile, 'utf8')));
    console.log(JSON.stringify(boards, null, 1));
    if (unmapped.length) { console.error('Rows on no board: ' + unmapped.join(', ')); process.exit(1); }
  }
}
