(function initFemFlowPlatform(global) {
  const FEMFLOW = global.FEMFLOW = global.FEMFLOW || {};

  function getCapacitorPlatform() {
    try {
      if (global.Capacitor && typeof global.Capacitor.getPlatform === "function") {
        return String(global.Capacitor.getPlatform() || "").toLowerCase();
      }
    } catch (err) {
      console.warn("[FEMFLOW.platform] Falha ao detectar plataforma via Capacitor.", err);
    }
    return "";
  }

  function getPlatform() {
    const cap = getCapacitorPlatform();
    if (cap === "ios") return "ios";
    if (cap === "android") return "android";

    const ua = String(global.navigator?.userAgent || "").toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return "ios";
    if (/android/.test(ua)) return "android";
    return "web";
  }

  FEMFLOW.platform = FEMFLOW.platform || {};
  FEMFLOW.platform.getPlatform = getPlatform;
  FEMFLOW.platform.isIOS = function isIOS() {
    return getPlatform() === "ios";
  };
  FEMFLOW.platform.isAndroid = function isAndroid() {
    return getPlatform() === "android";
  };
  FEMFLOW.platform.isWeb = function isWeb() {
    return getPlatform() === "web";
  };
})(window);
