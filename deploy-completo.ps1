# Script completo de despliegue para GitHub Pages
# Incluye: build, deploy y push a GitHub
# Configurado para dominio personalizado: gestisec.arcode-pe.com

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DESPLIEGUE COMPLETO A GITHUB PAGES" -ForegroundColor Cyan
Write-Host "  Dominio: gestisec.arcode-pe.com" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Build y deploy
Write-Host "[1/4] Generando build de produccion..." -ForegroundColor Yellow
npm run build:prod

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: El build fallo. Revisa los errores arriba." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/4] Preparando archivos para GitHub Pages..." -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File deploy-gh-pages.ps1

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: El script de deploy fallo. Revisa los errores arriba." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[3/4] Agregando archivos a Git..." -ForegroundColor Yellow
git add docs/ angular.json src/index.html src/app/login/login.css deploy-gh-pages.ps1 deploy-completo.ps1

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: No se pudieron agregar los archivos a Git." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[4/4] Haciendo commit y push a GitHub..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
git commit -m "Deploy: Actualizar build en docs para gestisec.arcode-pe.com - $timestamp"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ADVERTENCIA: No se pudo hacer commit. Puede que no haya cambios nuevos." -ForegroundColor Yellow
    Write-Host "   Verifica con: git status" -ForegroundColor Yellow
} else {
    git push origin main
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERROR: No se pudo hacer push a GitHub. Verifica tu conexion y permisos." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DESPLIEGUE COMPLETADO EXITOSAMENTE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANTE: Verifica la configuracion en GitHub:" -ForegroundColor Yellow
Write-Host "   1. Ve a Settings > Pages en tu repositorio" -ForegroundColor White
Write-Host "   2. Branch: main" -ForegroundColor White
Write-Host "   3. Folder: /docs" -ForegroundColor White
Write-Host ""
Write-Host "Tu sitio estara disponible en:" -ForegroundColor Cyan
Write-Host "   https://gestisec.arcode-pe.com/" -ForegroundColor Cyan
Write-Host ""
Write-Host "Espera 1-2 minutos para que GitHub Pages se actualice." -ForegroundColor Yellow
Write-Host ""
