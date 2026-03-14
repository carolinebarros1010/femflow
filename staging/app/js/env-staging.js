(function initEnvStaging() {
  const STAGING_EXEC =
    "https://femflowapi.falling-wildflower-a8c0.workers.dev/staging";

  window.FEMFLOW_ENV = "staging";
  window.__FEMFLOW_STAGING__ = true;
  window.FEMFLOW = window.FEMFLOW || {};
  window.FEMFLOW.ENV = "staging";
  window.FEMFLOW.SCRIPT_URL = STAGING_EXEC;
  window.FEMFLOW.API_URL = STAGING_EXEC;
  window.SCRIPT_URL = STAGING_EXEC;
})();
