$ErrorActionPreference = "Stop"

Write-Host "======================================="
Write-Host " FemFlow GAS - DEPLOY STAGING"
Write-Host "======================================="

# 1) Seleciona STAGING
Copy-Item ".clasp.staging.json" ".clasp.json" -Force
Write-Host "OK: .clasp.json configurado para STAGING"

# 2) Lê scriptId atual
$clasp = Get-Content ".clasp.json" | ConvertFrom-Json
Write-Host "ScriptId atual: $($clasp.scriptId)"

# 3) Proteção extra: exige que o scriptId seja o do STAGING
# (vamos preencher no próximo passo)
$EXPECTED_STAGING_SCRIPT_ID = "1IlVJJaehwGfm6nG6CV0rKyd3OfOL2T6k42uO4I8-WOgKELIOnPbVE4qw"


if ($clasp.scriptId -ne $EXPECTED_STAGING_SCRIPT_ID) {
  throw "ERRO: scriptId NÃO corresponde ao STAGING esperado. Abortando deploy."
}

# 4) Push
Write-Host ">> clasp push"
npx clasp push

# 5) Version + deploy
$versionDesc = "STAGING update - " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Write-Host ">> clasp version: $versionDesc"
npx clasp version "$versionDesc"

Write-Host ">> clasp deploy"
npx clasp deploy

Write-Host "======================================="
Write-Host " DEPLOY STAGING FINALIZADO"
Write-Host "======================================="
