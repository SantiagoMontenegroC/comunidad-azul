# Aplica migraciones SQL al proyecto remoto Comunidad Azul (Supabase CLI vía npx)
# Uso (una vez): npx supabase login
# Luego: .\aplicar-supabase.ps1
# O con contraseña de BD: .\aplicar-supabase.ps1 -DbPassword "tu_contraseña"

param(
  [string]$DbPassword = $env:SUPABASE_DB_PASSWORD
)

$ErrorActionPreference = "Stop"
$ProjectRef = "xyzyqkxdvdmyoevetxyw"
$Root = $PSScriptRoot

Set-Location $Root

Write-Host "Comunidad Azul — Supabase CLI (npx)" -ForegroundColor Cyan

if (-not $env:SUPABASE_ACCESS_TOKEN) {
  Write-Host "No hay sesion. Ejecuta primero:" -ForegroundColor Yellow
  Write-Host "  npx supabase login" -ForegroundColor White
  Write-Host "Abre el enlace, inicia sesion en GitHub y pega el token si lo pide." -ForegroundColor Gray
  exit 1
}

if (-not (Test-Path "$Root\supabase\.temp\project-ref")) {
  Write-Host "Vinculando proyecto $ProjectRef ..." -ForegroundColor Cyan
  if ($DbPassword) {
    npx --yes supabase link --project-ref $ProjectRef --password $DbPassword --yes
  } else {
    npx --yes supabase link --project-ref $ProjectRef --yes
  }
}

Write-Host "Aplicando gamificacion..." -ForegroundColor Cyan
npx --yes supabase db query --linked -f "$Root\supabase\migrations\20260520120000_gamificacion.sql"

Write-Host "Listo." -ForegroundColor Green
