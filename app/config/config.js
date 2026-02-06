(function initFemFlowConfig(global) {
  const ENV = "prod";

  const SCRIPT_URLS = {
    staging: "https://femflowapi.falling-wildflower-a8c0.workers.dev/staging",
    prod: "https://femflowapi.falling-wildflower-a8c0.workers.dev/"
  };

  const SCRIPT_URLS_ADMIN = {
    staging:
      "window.FEMFLOW_ACTIVE.scriptUrl",
    prod: "https://femflowapi.falling-wildflower-a8c0.workers.dev/"
  };

  const SCRIPT_URLS_MODULOS = {
    staging:
      "https://script.google.com/macros/s/AKfycbyovJHpMBqGhKmGFSePjHk-v5xAk8XB9NEfBG735nZjSz08f-jMfKE3OMkPVIZHObb0/exec",
    prod:
      "https://script.google.com/macros/s/AKfycbyovJHpMBqGhKmGFSePjHk-v5xAk8XB9NEfBG735nZjSz08f-jMfKE3OMkPVIZHObb0/exec"
  };

  const FIREBASE_CONFIGS = {
    staging: {
      apiKey: "AIzaSyB675lX-la7dGkZP1tfvzlPZ4oxvMPLBh0",
      authDomain: "femflow-ebec2.firebaseapp.com",
      projectId: "femflow-ebec2",
      storageBucket: "femflow-ebec2.firebasestorage.app",
      messagingSenderId: "1043953159611",
      appId: "1:1043953159611:web:d12b82f744740f3124c89e",
      measurementId: "G-6F644L5VTW"
    },
    prod: {
      apiKey: "AIzaSyB675lX-la7dGkZP1tfvzlPZ4oxvMPLBh0",
      authDomain: "femflow-ebec2.firebaseapp.com",
      projectId: "femflow-ebec2",
      storageBucket: "femflow-ebec2.firebasestorage.app",
      messagingSenderId: "1043953159611",
      appId: "1:1043953159611:web:d12b82f744740f3124c89e",
      measurementId: "G-6F644L5VTW"
    }
  };

  const PUSH_VAPID_KEYS = {
    staging: "",
    prod: ""
  };

  const activeScriptUrl = SCRIPT_URLS[ENV];
  const activeFirebaseConfig = FIREBASE_CONFIGS[ENV];
  const activeVapidKey = PUSH_VAPID_KEYS[ENV];

  global.FEMFLOW_ENV = ENV;
  global.FEMFLOW_CONFIG = {
    env: ENV,
    scriptUrls: SCRIPT_URLS,
    scriptUrlsAdmin: SCRIPT_URLS_ADMIN,
    scriptUrlsModulos: SCRIPT_URLS_MODULOS,
    firebaseConfigs: FIREBASE_CONFIGS,
    pushVapidKeys: PUSH_VAPID_KEYS
  };
  global.FEMFLOW_ACTIVE = {
    env: ENV,
    scriptUrl: activeScriptUrl,
    scriptUrlAdmin: SCRIPT_URLS_ADMIN[ENV],
    scriptUrlModulos: SCRIPT_URLS_MODULOS[ENV],
    firebaseConfig: activeFirebaseConfig,
    pushVapidKey: activeVapidKey
  };

  if (!global.FEMFLOW_VAPID_KEY && activeVapidKey) {
    global.FEMFLOW_VAPID_KEY = activeVapidKey;
  }
})(globalThis);
