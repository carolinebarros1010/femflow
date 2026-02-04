import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const STAGING_DIR = path.resolve('./staging/app');
const PROD_DIR = path.resolve('./app');

const FILES = [
  'treino.html',
  'treino_base.html',
  'js/treino.js',
  'js/treino-engine.js',
  'js/flowcenter.js',
  'flowcenter.html',
  'flowcenterx.html',
];

const DIFF_OUTPUT_DIR = path.resolve('./tools/diff-output');

const normalizeEol = (text) => text.replace(/\r\n?/g, '\n');

const sha256 = (text) => crypto.createHash('sha256').update(text, 'utf8').digest('hex');

const formatMeta = (label, meta) => {
  if (!meta) {
    return `${label} bytes=- sha256=-`;
  }
  return `${label} bytes=${meta.bytes} sha256=${meta.hash}`;
};

const safeDiffName = (filePath) => filePath.replace(/[\\/]/g, '__');

const getEdits = (aLines, bLines) => {
  const n = aLines.length;
  const m = bLines.length;
  const max = n + m;
  let v = new Map();
  v.set(1, 0);
  const trace = [];

  const getV = (map, key) => (map.has(key) ? map.get(key) : -Infinity);

  for (let d = 0; d <= max; d += 1) {
    trace.push(new Map(v));
    for (let k = -d; k <= d; k += 2) {
      let x;
      if (k === -d || (k !== d && getV(v, k - 1) < getV(v, k + 1))) {
        x = getV(v, k + 1);
      } else {
        x = getV(v, k - 1) + 1;
      }
      let y = x - k;
      while (x < n && y < m && aLines[x] === bLines[y]) {
        x += 1;
        y += 1;
      }
      v.set(k, x);
      if (x >= n && y >= m) {
        return { trace, aLines, bLines };
      }
    }
  }
  return { trace, aLines, bLines };
};

const buildEdits = (aLines, bLines) => {
  const { trace } = getEdits(aLines, bLines);
  const edits = [];
  let x = aLines.length;
  let y = bLines.length;

  for (let d = trace.length - 1; d >= 0; d -= 1) {
    const v = trace[d];
    const k = x - y;
    let prevK;
    const getV = (map, key) => (map.has(key) ? map.get(key) : -Infinity);

    if (k === -d || (k !== d && getV(v, k - 1) < getV(v, k + 1))) {
      prevK = k + 1;
    } else {
      prevK = k - 1;
    }

    const prevX = getV(v, prevK);
    const prevY = prevX - prevK;

    while (x > prevX && y > prevY) {
      edits.push({ type: 'equal', line: aLines[x - 1] });
      x -= 1;
      y -= 1;
    }

    if (d === 0) {
      break;
    }

    if (x === prevX) {
      edits.push({ type: 'insert', line: bLines[y - 1] });
      y -= 1;
    } else {
      edits.push({ type: 'delete', line: aLines[x - 1] });
      x -= 1;
    }
  }

  return edits.reverse();
};

const buildHunks = (edits, context = 3) => {
  const hunks = [];
  let preContext = [];
  let hunk = null;
  let oldLine = 1;
  let newLine = 1;

  const startHunk = () => {
    hunk = {
      oldStart: oldLine - preContext.length,
      newStart: newLine - preContext.length,
      oldLines: preContext.length,
      newLines: preContext.length,
      lines: preContext.map((line) => ` ${line}`),
      trailingContext: [],
    };
  };

  for (const edit of edits) {
    if (edit.type === 'equal') {
      if (hunk) {
        if (hunk.trailingContext.length < context) {
          hunk.lines.push(` ${edit.line}`);
          hunk.trailingContext.push(edit.line);
          hunk.oldLines += 1;
          hunk.newLines += 1;
          oldLine += 1;
          newLine += 1;
        } else {
          hunks.push(hunk);
          hunk = null;
          preContext = [edit.line];
          oldLine += 1;
          newLine += 1;
        }
      } else {
        preContext.push(edit.line);
        if (preContext.length > context) {
          preContext.shift();
        }
        oldLine += 1;
        newLine += 1;
      }
    } else {
      if (!hunk) {
        startHunk();
      }
      if (edit.type === 'delete') {
        hunk.lines.push(`-${edit.line}`);
        hunk.oldLines += 1;
        oldLine += 1;
      } else {
        hunk.lines.push(`+${edit.line}`);
        hunk.newLines += 1;
        newLine += 1;
      }
      hunk.trailingContext = [];
    }
  }

  if (hunk) {
    hunks.push(hunk);
  }

  return hunks;
};

const buildUnifiedDiff = (relativePath, aText, bText) => {
  const aLines = aText.split('\n');
  const bLines = bText.split('\n');
  const edits = buildEdits(aLines, bLines);
  const hunks = buildHunks(edits);

  const diffLines = [`--- a/${relativePath}`, `+++ b/${relativePath}`];

  for (const hunk of hunks) {
    const oldRange = hunk.oldLines === 1 ? `${hunk.oldStart}` : `${hunk.oldStart},${hunk.oldLines}`;
    const newRange = hunk.newLines === 1 ? `${hunk.newStart}` : `${hunk.newStart},${hunk.newLines}`;
    diffLines.push(`@@ -${oldRange} +${newRange} @@`);
    diffLines.push(...hunk.lines);
  }

  return diffLines.join('\n');
};

const buildMeta = (text) => ({
  bytes: Buffer.byteLength(text, 'utf8'),
  hash: sha256(text),
});

const readFileMeta = async (fullPath) => {
  const raw = await fs.readFile(fullPath, 'utf8');
  const normalized = normalizeEol(raw);
  return { raw, normalized, meta: buildMeta(normalized) };
};

const ensureDiffDir = async () => {
  await fs.mkdir(DIFF_OUTPUT_DIR, { recursive: true });
};

const logDiff = async (relativePath, diffText) => {
  await ensureDiffDir();
  const fileName = `${safeDiffName(relativePath)}.diff`;
  const fullPath = path.join(DIFF_OUTPUT_DIR, fileName);
  await fs.writeFile(fullPath, diffText, 'utf8');
};

const truncateLines = (text, maxLines) => {
  const lines = text.split('\n');
  if (lines.length <= maxLines) {
    return text;
  }
  return [...lines.slice(0, maxLines), '... (diff truncated)'].join('\n');
};

const compareFile = async (relativePath) => {
  const stagingPath = path.join(STAGING_DIR, relativePath);
  const prodPath = path.join(PROD_DIR, relativePath);

  let staging = null;
  let prod = null;
  let status = 'OK';

  try {
    staging = await readFileMeta(stagingPath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  try {
    prod = await readFileMeta(prodPath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  if (!staging || !prod) {
    status = 'MISSING';
  } else if (staging.meta.hash !== prod.meta.hash) {
    status = 'DIFF';
  }

  console.log(`${relativePath}`);
  console.log(`  status=${status}`);
  console.log(`  ${formatMeta('STAGING', staging?.meta)}`);
  console.log(`  ${formatMeta('PROD   ', prod?.meta)}`);

  if (status === 'DIFF' && staging && prod) {
    const diffText = buildUnifiedDiff(relativePath, staging.normalized, prod.normalized);
    const truncated = truncateLines(diffText, 200);
    console.log(truncated);
    await logDiff(relativePath, diffText);
  }

  return status !== 'OK';
};

const main = async () => {
  let hasIssues = false;
  for (const file of FILES) {
    const issue = await compareFile(file);
    if (issue) {
      hasIssues = true;
    }
    console.log('');
  }

  process.exit(hasIssues ? 1 : 0);
};

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
