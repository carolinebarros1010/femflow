<?php
// ===============================
// FemFlow Proxy — Versão Oficial
// ===============================

// CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Cache OFF (CRÍTICO)
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

// Endpoint público do backend (Cloudflare Worker)
$API = "https://api-myflowlife.falling-wildflower-a8c0.workers.dev";

// Método
$method = $_SERVER['REQUEST_METHOD'];

// Query string (GET)
$query = $_SERVER['QUERY_STRING'] ?? "";

// Corpo (POST)
$body = file_get_contents("php://input");

// Monta URL final
$url = $API . ($query ? "?" . $query : "");

// cURL
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

if ($method === "POST" && !empty($body)) {
  curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

curl_setopt($ch, CURLOPT_HTTPHEADER, [
  "Content-Type: application/json",
  "X-FemFlow-Proxy: php",
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Retorno
http_response_code($httpCode);
echo $response;
