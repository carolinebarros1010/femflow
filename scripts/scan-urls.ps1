$ErrorActionPreference = "Stop"

Write-Host "======================================="
Write-Host " FemFlow - URL SCAN"
Write-Host "======================================="

$files = Get-ChildItem -Recurse -File -Include *.js,*.ts,*.html,*.json,*.md,*.gs,*.ps1

# Qualquer ocorrência disso fora dos arquivos permitidos será erro
$badPatterns = @(
  "script.google.com/macros/s/",
  "AKfycb"
)

# Somente estes arquivos podem conter URLs
$allowedFiles = @(
  "\config\endpoints.json",
  "\README.md",
"\scripts\scan-urls.ps1",
"\scripts\refactor-endpoints.ps1",


  # PROD web
  "\app\config\config.js",

  # STAGING web
  "\staging\app\config\config.js",

  # iOS build
  "\ios\App\App\public\config\config.js"
)


$found = @()

foreach ($p in $badPatterns) {
  $matches = $files | Select-String -Pattern $p -SimpleMatch -ErrorAction SilentlyContinue
  foreach ($m in $matches) {

    $allowed = $false
    foreach ($a in $allowedFiles) {
      if ($m.Path -like "*$a") { $allowed = $true; break }
    }

    if (-not $allowed) {
      $found += [PSCustomObject]@{
        File = $m.Path
        Line = $m.LineNumber
        Text = $m.Line.Trim()
      }
    }
  }
}

if ($found.Count -gt 0) {
  Write-Host ""
  Write-Host "ERRO: URLs hardcoded encontradas fora dos locais permitidos:" -ForegroundColor Red
  $found | Format-Table -AutoSize
  exit 1
}

Write-Host "OK: Nenhuma URL hardcoded encontrada fora dos locais permitidos." -ForegroundColor Green
exit 0
