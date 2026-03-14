(function () {
  const STAGING_EXEC =
    "https://femflowapi.falling-wildflower-a8c0.workers.dev/staging";

  window.FEMFLOW = window.FEMFLOW || {};
  window.FEMFLOW.ENV = "staging";
  window.FEMFLOW.SCRIPT_URL = STAGING_EXEC;
  window.FEMFLOW.API_URL = STAGING_EXEC;
  window.SCRIPT_URL = STAGING_EXEC;
})();
