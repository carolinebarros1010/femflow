// 🌸 FemFlow Service Worker v5.0 (PWA + CORS safe)
const CACHE_NAME = "femflow-cache-v8";

// --------------------------------------------------
// 🔔 Firebase Cloud Messaging (background)
// --------------------------------------------------
importScripts(
  "https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js"
);

const firebaseConfig = {
  apiKey: "AIzaSyB675lX-la7dGkZP1tfvzlPZ4oxvMPLBh0",
  authDomain: "femflow-ebec2.firebaseapp.com",
  projectId: "femflow-ebec2",
  storageBucket: "femflow-ebec2.firebasestorage.app",
  messagingSenderId: "1043953159611",
  appId: "1:1043953159611:web:d12b82f744740f3124c89e",
  measurementId: "G-6F644L5VTW"
};

if (!firebase.apps?.length) {
  firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

const PUSH_ACTION_URLS = {
  open_treino: "./treino.html",
  open_flowcenter: "./flowcenter.html",
  open_home: "./home.html"
};

const resolvePushUrl = (payload) => {
  const data = payload?.data || {};
  const action =
    data.action ||
    data.click_action ||
    payload?.notification?.click_action ||
    "";

  return PUSH_ACTION_URLS[action] || data.url || "./home.html";
};

messaging.onBackgroundMessage((payload) => {
  const data = payload?.data || {};
  const title = payload?.notification?.title || data.title || "FemFlow";
  const body = payload?.notification?.body || data.body || "";
  const action =
    data.action ||
    data.click_action ||
    payload?.notification?.click_action ||
    "";
  const url = resolvePushUrl(payload);

  const options = {
    body,
    icon: "./assets/icons/icon-192.png",
    badge: "./assets/icons/icon-192.png",
    data: { action, url }
  };

  self.registration.showNotification(title, options);
});

// Arquivos principais do app (tela, JS e manifest)
const ASSETS = [
  "./",
  "./index.html",
  "./home.html",
  "./painel-admin.html",
  "./ciclo.html",
  "./treino.html",
  "./evolucao.html",
  "./anamnese_deluxe.html",
  "./respiracao.html",
  "./reset.html",
  "./offline.html",
  "./manifest.json",

  "./css/style.css",

  "./femflow-core.js",
  "./js/ciclo.js",
  "./js/treino.js",
  "./js/anamnese.js",
  "./js/painel-admin.js",
 
  // Logos / ícones
  "./assets/logofemflowterracota.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png"
];

// --------------------------------------------------
// 🔹 2. LOGOS & ÍCONES (carregados depois, em background)
// Faz o app abrir rápido, SEM delay no logo
// --------------------------------------------------
const CACHE_ASSETS = [
  "./assets/logofemflowterracota.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png"
];

// --------------------------------------------------
// 🪴 3. INSTALAÇÃO — cache inicial rápido
// --------------------------------------------------
self.addEventListener("install", (event) => {
  console.log("📦 Instalando FemFlow PWA…");

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) =>
        Promise.all(
          ASSETS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn("[SW] Falha ao cachear:", url, err);
            })
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

// --------------------------------------------------
// 🔁 4. ATIVAÇÃO — limpa caches antigos e prefetch das logos
// --------------------------------------------------
self.addEventListener("activate", (event) => {
  console.log(`✨ FemFlow SW ativo (${CACHE_NAME})`);

  event.waitUntil(
    (async () => {
      // Remove versões antigas
      const keys = await caches.keys();
      const hadPreviousCache = keys.some((key) => key !== CACHE_NAME);
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );

      // Carrega logos silenciosamente (background)
      const cache = await caches.open(CACHE_NAME);
      CACHE_ASSETS.forEach((url) => {
        fetch(url)
          .then((resp) => {
            if (resp && resp.ok) cache.put(url, resp.clone());
          })
          .catch(() => {});
      });

      await self.clients.claim();

      if (hadPreviousCache) {
        const clients = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true
        });
        clients.forEach((client) => {
          client.postMessage({ type: "FEMFLOW_UPDATE_AVAILABLE" });
        });
      }
    })()
  );
});

// --------------------------------------------------
// ⚙️ 5. FETCH — cache-first somente para arquivos locais
// NUNCA intercepta POST ou requisições externas (Apps Script)
// --------------------------------------------------
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Não intercepta POST (Hotmart, login, treino, descanso, etc.)
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Não intercepta chamadas externas (Google Script, Firebase, Hotmart)
  if (url.origin !== self.location.origin) return;

  // Estratégia cache-first
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);

      if (cached) {
        // atualiza silenciosamente
        fetch(req)
          .then((resp) => {
            if (resp && resp.ok) cache.put(req, resp.clone());
          })
          .catch(() => {});

        return cached;
      }

      // busca na rede
      try {
        const resp = await fetch(req);
        if (resp && resp.ok) cache.put(req, resp.clone());
        return resp;
      } catch (err) {
        console.warn("[SW] Erro de rede:", err);
        return caches.match("./offline.html");
      }
    })()
  );
});

// --------------------------------------------------
// 🔄 6. Mensagens manuais (para update imediato no TWA)
// --------------------------------------------------
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    console.log("🔁 Atualizando SW imediatamente.");
    self.skipWaiting();
  }

  if (event.data === "checkVersion") {
    console.log(`[FemFlow] Cache ativo: ${CACHE_NAME}`);
  }
});

// --------------------------------------------------
// 🔔 Clique em notificações
// --------------------------------------------------
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification?.data?.url || "./home.html";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true
      });

      for (const client of allClients) {
        if (client.url.includes(targetUrl)) {
          await client.focus();
          return;
        }
      }

      await self.clients.openWindow(targetUrl);
    })()
  );
});
