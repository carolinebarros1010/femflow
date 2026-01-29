// SW V24 Unificado – MyFlowLife / Gerador de Corrida
const CACHE_NAME = "femflow-gerador-v24";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js",
  "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js",
  "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js",
  "https://cdn.jsdelivr.net/npm/dayjs@1.11.11/dayjs.min.js"
];

// Instalação (pré-cache)
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Ativação (limpa versões antigas)
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estratégia híbrida: cache-first com atualização em background
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return; // ignora POST, PUT etc.

  event.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req)
        .then(netRes => {
          if (!netRes || netRes.status === 206) return netRes;
          // Atualiza cache em background
          if (!netRes.bodyUsed) {
            const resClone = netRes.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, resClone)).catch(() => {});
            return netRes;
          }
          return netRes;
        })
        .catch(() => cached || new Response("Você está offline 📴", {status: 200}));
      return cached || fetchPromise;
    })
  );
});

// Mensagem opcional para debug
console.log("✅ SW V24 ativo e funcional");
