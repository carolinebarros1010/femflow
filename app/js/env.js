(function () {
  const PROD_EXEC =
    "https://femflowapi.falling-wildflower-a8c0.workers.dev";

  window.FEMFLOW = window.FEMFLOW || {};
  window.FEMFLOW.ENV = "prod";
  window.FEMFLOW.SCRIPT_URL = PROD_EXEC;
  window.FEMFLOW.API_URL = PROD_EXEC;
  window.SCRIPT_URL = PROD_EXEC;
})();
