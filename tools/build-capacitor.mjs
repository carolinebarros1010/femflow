import fs from "fs";
import path from "path";

const root = process.cwd();

// Fonte: seu PROD gerado (app)
const fromDir = path.join(root, "app");
// Saída: bundle do Capacitor
const toDir = path.join(root, "cap", "www");

function rm(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}
function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}
function copyDir(src, dest) {
  mkdirp(dest);
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function rewriteHtml(file) {
  let html = fs.readFileSync(file, "utf8");

  // 1) base href para Capacitor (relativo)
  html = html.replace(/<base\s+href="\/app\/"\s*\/>/g, '<base href="./" />');

  // 2) trocar refs absolutas /app/... para relativas ./
  html = html.replace(/(["'(])\/app\//g, "$1./");

  fs.writeFileSync(file, html, "utf8");
}

function rewriteServiceWorker(file) {
  if (!fs.existsSync(file)) return;
  let sw = fs.readFileSync(file, "utf8");

  // tenta evitar caches apontando para /app/
  sw = sw.replace(/\/app\//g, "./");

  fs.writeFileSync(file, sw, "utf8");
}

console.log("Building Capacitor WWW: app -> cap/www");
rm(toDir);
copyDir(fromDir, toDir);

// Reescreve HTMLs (paths e base)
for (const f of fs.readdirSync(toDir)) {
  if (f.endsWith(".html")) rewriteHtml(path.join(toDir, f));
}

// Ajuste SW se existir
rewriteServiceWorker(path.join(toDir, "service-worker.js"));

console.log("OK: cap/www gerado (base ./ + paths relativos).");

