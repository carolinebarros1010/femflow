$ErrorActionPreference = "Stop"

Write-Host "======================================="
Write-Host " FemFlow - REFACTOR ENDPOINTS (AUTO)"
Write-Host "======================================="

$repoRoot = (Get-Location).Path

# ---- URLs conhecidas (GAS) ----
$GAS_PROD = "https://script.google.com/macros/s/AKfycbx0aIDqv8BkIaEKK-xxuN9VIY0w7D6APZ5f1FjQGxzqrzLhtd8JVKAF6_NWrifyr9CP/exec"
$GAS_STAGING = "https://script.google.com/macros/s/AKfycbw1Rp4K3GKH-yruTV0gXboApxNUZcs1qLAYvvuAmZzj29Km6_rHbEJcAVokVnrbx16f/exec"

# ---- Worker ----
$WORKER_BASE = "https://femflowapi.falling-wildflower-a8c0.workers.dev/"
$WORKER_STAGING = "https://femflowapi.falling-wildflower-a8c0.workers.dev/staging"

# arquivos alvo (front)
$targets = Get-ChildItem -Recurse -File -Include *.js,*.html |
  Where-Object {
    $_.FullName -notlike "*\node_modules\*" -and
    $_.FullName -notlike "*\.git\*" -and
    $_.FullName -notlike "*\staging\GAS\*" -and
    $_.FullName -notlike "*\scripts\scan-urls.ps1*" -and
    $_.FullName -notlike "*\scripts\refactor-endpoints.ps1*"
  }

function Backup-File($path) {
  $bak = "$path.bak"
  if (-not (Test-Path $bak)) {
    Copy-Item $path $bak
  }
}

function Replace-InFile($path, $old, $new) {
  $content = Get-Content $path -Raw
  if ($content -like "*$old*") {
    Backup-File $path
    $content = $content.Replace($old, $new)
    Set-Content $path -Value $content
    return $true
  }
  return $false
}

# ------------------------------------------------------
# 1) Ajustar config STAGING: usar /staging no Worker
# ------------------------------------------------------
$stagingConfig = Join-Path $repoRoot "staging\app\config\config.js"
if (Test-Path $stagingConfig) {
  $c = Get-Content $stagingConfig -Raw
  if ($c -like "*$WORKER_BASE*" -and $c -notlike "*$WORKER_STAGING*") {
    Backup-File $stagingConfig
    $c = $c.Replace($WORKER_BASE, $WORKER_STAGING)
    Set-Content $stagingConfig -Value $c
    Write-Host "OK: staging config atualizado para /staging"
  } else {
    Write-Host "INFO: staging config já parece correto"
  }
} else {
  Write-Host "WARN: staging config não encontrado"
}

# ------------------------------------------------------
# 2) Remover GAS hardcoded do FRONT (trocar por FEMFLOW_ACTIVE)
# ------------------------------------------------------
$replacements = @(
  @{ old = $GAS_STAGING; new = "window.FEMFLOW_ACTIVE.scriptUrl" },
  @{ old = $GAS_PROD;    new = "window.FEMFLOW_ACTIVE.scriptUrl" }
)

foreach ($f in $targets) {
  foreach ($r in $replacements) {
    $changed = Replace-InFile $f.FullName $r.old $r.new
    if ($changed) {
      Write-Host "Atualizado:" $f.FullName
    }
  }
}

# ------------------------------------------------------
# 3) Trocar variáveis comuns hardcoded
# (BASE_URL / SCRIPT_URL / URL_SCRIPT) para FEMFLOW_ACTIVE
# ------------------------------------------------------
$regexTargets = @(
  "const\s+BASE_URL\s*=\s*['""]https:\/\/script\.google\.com\/macros\/s\/[^'""]+\/exec['""]\s*;",
  "const\s+SCRIPT_URL\s*=\s*['""]https:\/\/script\.google\.com\/macros\/s\/[^'""]+\/exec['""]\s*;",
  "var\s+SCRIPT_URL\s*=\s*['""]https:\/\/script\.google\.com\/macros\/s\/[^'""]+\/exec['""]\s*;"
)

foreach ($f in $targets) {
  $content = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue

  # proteção: arquivo vazio, travado ou leitura falhou
  if ([string]::IsNullOrWhiteSpace($content)) {
    continue
  }

  $original = $content


  foreach ($pat in $regexTargets) {
    $content = [regex]::Replace(
      $content,
      $pat,
      "const SCRIPT_URL = window.FEMFLOW_ACTIVE.scriptUrl;"
    )
  }

  if ($content -ne $original) {
    Backup-File $f.FullName
    Set-Content $f.FullName -Value $content
    Write-Host "Regex fix:" $f.FullName
  }
}

Write-Host ""
Write-Host "======================================="
Write-Host " Refactor concluído. Rodando SCAN..."
Write-Host "======================================="

# ------------------------------------------------------
# 4) Rodar sca
