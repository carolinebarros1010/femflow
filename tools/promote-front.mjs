import fs from "fs";
import path from "path";

const SRC = path.resolve("staging/app");
const DST = path.resolve("app");

// staging -> prod
const FROM_BASE = /<base\s+href="\/staging\/app\/"\s*\/?>/g;
const TO_BASE   = '<base href="/app/" />';


const FROM_ENV  = /\/staging\/app\/js\/env-staging\.js/g;
const TO_ENV    = "/app/js/env-prod.js";

// se tiver hardcode do worker em algum arquivo
const FROM_ENDPOINT = /workers\.dev\/staging/g;
const TO_ENDPOINT   = "workers.dev/prod";

function rm(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}
function cpDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) cpDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
function patch(file) {
  const ext = path.extname(file).toLowerCase();
  if (![".html", ".js", ".css"].includes(ext)) return;

  let s = fs.readFileSync(file, "utf8");
  const before = s;

  s = s.replace(FROM_BASE, TO_BASE);
  s = s.replace(FROM_ENV, TO_ENV);
  s = s.replace(FROM_ENDPOINT, TO_ENDPOINT);

  if (s !== before) fs.writeFileSync(file, s, "utf8");
}

if (!fs.existsSync(SRC)) {
  console.error("ERRO: staging/app não existe:", SRC);
  process.exit(1);
}

console.log("Promoting FRONT: staging/app -> app");
rm(DST);
cpDir(SRC, DST);

for (const f of walk(DST)) patch(f);

console.log("OK: /app gerado a partir de /staging/app");
