# Comunidad Azul — Subir proyecto a GitHub
# Carpeta del proyecto (siempre esta):
#   C:\Users\Santiago Montenegro\comunidad-azul
#
# Uso (elige una):
#   cd "C:\Users\Santiago Montenegro\comunidad-azul"
#   gh auth login
#   .\subir-a-github.ps1
#
# Si PowerShell bloquea scripts, usa:
#   .\subir-a-github.bat
# o:
#   powershell -ExecutionPolicy Bypass -File .\subir-a-github.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "Proyecto: $PWD" -ForegroundColor Cyan
Write-Host ""

# Git
$git = "C:\Program Files\Git\bin\git.exe"
if (-not (Test-Path $git)) {
    $gitCmd = Get-Command git -ErrorAction SilentlyContinue
    if ($gitCmd) { $git = $gitCmd.Source } else {
        Write-Host "Git no encontrado. Instala desde https://git-scm.com/download/win" -ForegroundColor Red
        exit 1
    }
}

# GitHub CLI (gh): PATH o instalación local en AppData
$gh = $null
$ghCmd = Get-Command gh -ErrorAction SilentlyContinue
if ($ghCmd) {
    $gh = $ghCmd.Source
} elseif (Test-Path "$env:LOCALAPPDATA\Programs\gh-cli\bin\gh.exe") {
    $gh = "$env:LOCALAPPDATA\Programs\gh-cli\bin\gh.exe"
}

if (-not $gh) {
    Write-Host "GitHub CLI (gh) no encontrado." -ForegroundColor Red
    Write-Host "Instálalo desde https://cli.github.com/ y vuelve a ejecutar este script." -ForegroundColor Yellow
    exit 1
}

Write-Host "Usando git: $git" -ForegroundColor DarkGray
Write-Host "Usando gh:  $gh" -ForegroundColor DarkGray
Write-Host ""

# --- PASO 1: Sesión en GitHub ---
$authOk = $false
& $gh auth status 2>$null
if ($LASTEXITCODE -eq 0) { $authOk = $true }

if (-not $authOk) {
    Write-Host "=== PASO 1: Inicia sesión en GitHub ===" -ForegroundColor Cyan
    Write-Host "Elige: GitHub.com -> HTTPS -> Login with a web browser" -ForegroundColor White
    Write-Host ""
    & $gh auth login -h github.com -p https -w
}

# --- PASO 2: Crear repositorio y subir código ---
Write-Host ""
Write-Host "=== PASO 2: Crear repositorio y subir código ===" -ForegroundColor Cyan

$user = & $gh api user -q .login
$repoName = "comunidad-azul"

$status = & $git status --porcelain
if ($status) {
    Write-Host "Guardando cambios locales..." -ForegroundColor Yellow
    & $git add -A
    & $git commit -m "Actualiza sitio Comunidad Azul"
}

$hasRemote = $false
& $git remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0) { $hasRemote = $true }

if (-not $hasRemote) {
    & $gh repo create $repoName --public --source=. --remote=origin --push `
        --description "Sitio comunitario sobre el agua - Barrio Divino Niño 1"
} else {
    & $gh repo view "$user/$repoName" 2>$null
    if ($LASTEXITCODE -ne 0) {
        & $gh repo create $repoName --public `
            --description "Sitio comunitario sobre el agua - Barrio Divino Niño 1"
        & $git remote set-url origin "https://github.com/$user/$repoName.git"
    }
    & $git push -u origin main
}

Write-Host ""
Write-Host "Listo. Tu repositorio:" -ForegroundColor Green
& $gh repo view --json url -q .url
Write-Host ""
