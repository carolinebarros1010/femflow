// tools/promote-front.mjs
import fs from "fs";
import path from "path";

const root = process.cwd();
const fromDir = path.join(root, "staging", "app");
const toDir = path.join(root, "app");

function rmDirSafe(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dst, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
function globHtml(dir) {
  return fs.readdirSync(dir)
    .filter(f => f.toLowerCase().endsWith(".html"))
    .map(f => path.join(dir, f));
}
function replaceAllInFile(file, pairs) {
  let c = fs.readFileSync(file, "utf8");
  for (const [a, b] of pairs) c = c.split(a).join(b);
  fs.writeFileSync(file, c, "utf8");
}

console.log("Promoting FRONT: staging/app -> app");

// 1) recria /app a partir do staging/app
rmDirSafe(toDir);
copyDir(fromDir, toDir);

// 2) Ajustar base href de /staging/app/ -> /app/
for (const f of globHtml(toDir)) {
  replaceAllInFile(f, [
    ['<base href="/staging/app/" />', '<base href="/app/" />'],
    ['<base href="/staging/app/">', '<base href="/app/">'],
  ]);
}

// 3) Garantir env.js em /app e trocar referências antigas
for (const f of globHtml(toDir)) {
  const content = fs.readFileSync(f, "utf8");
  const updated = content
    .split("/staging/app/js/env-staging.js").join("/app/js/env.js")
    .split("/app/js/env-prod.js").join("/app/js/env.js")
    .split("/app/js/env-staging.js").join("/app/js/env.js");
  fs.writeFileSync(f, updated, "utf8");
}

// 4) Sanity checks
for (const f of globHtml(toDir)) {
  const c = fs.readFileSync(f, "utf8");
  if (c.includes("/staging/app/")) throw new Error(`Ainda existe /staging/app/ em ${path.basename(f)}`);
  if (c.includes("env-staging.js")) throw new Error(`Ainda existe env-staging.js em ${path.basename(f)}`);
  if (c.includes("env-prod.js")) throw new Error(`Ainda existe env-prod.js em ${path.basename(f)}`);
}

const envPath = path.join(toDir, "js", "env.js");
if (!fs.existsSync(envPath)) {
  throw new Error("app/js/env.js não existe após cópia. Garanta staging/app/js/env.js");
}
// --- ENFORCE PROD env.js (never copy staging env into /app) ---
const prodEnv = `(() => {
  const PROD_EXEC =
    "https://femflowapi.falling-wildflower-a8c0.workers.dev/prod";

  window.FEMFLOW = window.FEMFLOW || {};
  window.FEMFLOW.SCRIPT_URL = PROD_EXEC;
  window.FEMFLOW.API_URL = PROD_EXEC;
  window.SCRIPT_URL = PROD_EXEC;
})();\n`;

fs.writeFileSync(path.join(toDir, "js", "env.js"), prodEnv, "utf8");

// Remove any accidental env-staging.js in /app output
const envStagingOut = path.join(toDir, "js", "env-staging.js");
if (fs.existsSync(envStagingOut)) fs.rmSync(envStagingOut, { force: true });

console.log("OK: /app gerado e ajustado para PROD (base + env.js).");


