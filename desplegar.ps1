# Despliegue a producción: commit + push → Netlify reconstruye solo
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$msg = $args[0]
if (-not $msg) { $msg = "Actualiza sitio Comunidad Azul" }

if (git status --porcelain) {
    git add -A
    git commit -m $msg
}

git push origin main
Write-Host ""
Write-Host "Desplegado: push a main (Netlify publicara en unos segundos)." -ForegroundColor Green
