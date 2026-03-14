// 🌸 FemFlow Service Worker v5.0 (PWA + CORS safe)
const CACHE_VERSION = "v13";
const CACHE_NAME = `femflow-static-${CACHE_VERSION}`;

// --------------------------------------------------
// 🔔 Firebase Cloud Messaging (background)
// --------------------------------------------------
importScripts(
  "https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js"
);

importScripts("config/config.js");

const ENV = self.FEMFLOW_ENV || "prod";
const firebaseConfig =
  self.FEMFLOW_ACTIVE?.firebaseConfig ||
  self.FEMFLOW_CONFIG?.firebaseConfigs?.[ENV];
const logError = ENV === "staging" ? console.warn : console.error;

if (firebaseConfig?.apiKey && !firebase.apps?.length) {
  try {
    firebase.initializeApp(firebaseConfig);
  } catch (err) {
    logError("[SW] Erro ao inicializar Firebase:", err);
  }
}

let messaging = null;
try {
  messaging = firebase.messaging();
} catch (err) {
  logError("[SW] Firebase messaging indisponível:", err);
}

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

const NOTIFICATION_DB = "femflow-notifications";
const NOTIFICATION_STORE = "notifications";

const openNotificationsDb = () =>
  new Promise((resolve) => {
    const request = indexedDB.open(NOTIFICATION_DB, 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(NOTIFICATION_STORE)) {
        const store = db.createObjectStore(NOTIFICATION_STORE, { keyPath: "id" });
        store.createIndex("data", "data");
        store.createIndex("lida", "lida");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });

const buildInternalNotification = (payload = {}) => {
  const data = payload?.data || {};
  const titulo =
    payload?.notification?.title ||
    data.title ||
    data.titulo ||
    "FemFlow";
  const mensagem =
    payload?.notification?.body ||
    data.body ||
    data.mensagem ||
    "";
  const tipo = data.tipo || data.type || "sistema";
  const id =
    data.id ||
    payload?.messageId ||
    `ff-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return {
    id: String(id),
    titulo,
    mensagem,
    tipo,
    origem: "push",
    data: data.data || new Date().toISOString(),
    lida: false
  };
};

const storeInternalNotification = async (payload) => {
  if (!("indexedDB" in self)) return null;
  const db = await openNotificationsDb();
  if (!db) return null;

  const notification = buildInternalNotification(payload);

  await new Promise((resolve) => {
    const tx = db.transaction(NOTIFICATION_STORE, "readwrite");
    tx.objectStore(NOTIFICATION_STORE).put(notification);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });

  return notification;
};

if (messaging) {
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

    storeInternalNotification(payload).then((notification) => {
      if (!notification) return;
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "FEMFLOW_PUSH_STORED",
              notification
            });
          });
        })
        .catch(() => {});
    });
  });
}

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
  "./docs/privacy.html",
  "./docs/terms.html",
  "./docs/delete-account.html",
  "./docs/legal.css",
  "./docs/legal.js",

  "./css/style.css",
  "./css/core.css",
  "./css/header.css",
  "./css/themes.css",
  "./css/login.css",

  "./config/config.js",
  "./core/femflow-core.js",
  "./services/firebase-init.js",
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

  // Evita cachear endpoints dinâmicos/sensíveis
  if (url.pathname.endsWith("/proxy.php") || url.pathname.endsWith("/config.js")) return;

  const isNavigation = req.mode === "navigate";
  const noStore = req.cache === "no-store";
  const isDocs = url.pathname.includes("/docs/");

  // Estratégia cache-first
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = noStore ? null : await cache.match(req);

      if (isDocs) {
        try {
          const resp = await fetch(req);
          if (resp && resp.ok && !noStore) cache.put(req, resp.clone());
          return resp;
        } catch (err) {
          if (cached) return cached;
          throw err;
        }
      }

      if (cached) {
        fetch(req)
          .then((resp) => {
            if (resp && resp.ok && !noStore) cache.put(req, resp.clone());
          })
          .catch(() => {});

        return cached;
      }

      try {
        const resp = await fetch(req);
        if (resp && resp.ok && !noStore) cache.put(req, resp.clone());
        return resp;
      } catch (err) {
        console.warn("[SW] Erro de rede:", err);
        if (isNavigation) return caches.match("./offline.html");
        if (req.destination === "image") throw err;
        return new Response("", { status: 503, statusText: "Offline" });
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
