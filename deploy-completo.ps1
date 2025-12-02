# Script completo de despliegue para GitHub Pages
# Incluye: build, deploy y push a GitHub

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DESPLIEGUE COMPLETO A GITHUB PAGES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Build y deploy
Write-Host "[1/3] Generando build y preparando archivos..." -ForegroundColor Yellow
npm run deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: El build fallo. Revisa los errores arriba." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/3] Agregando archivos a Git..." -ForegroundColor Yellow
git add docs/ src/ deploy-gh-pages.ps1

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: No se pudieron agregar los archivos a Git." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[3/3] Haciendo commit y push a GitHub..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
git commit -m "Deploy: Actualizar build para GitHub Pages - $timestamp"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ADVERTENCIA: No se pudo hacer commit. Puede que no haya cambios nuevos." -ForegroundColor Yellow
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
Write-Host "Tu sitio estara disponible en:" -ForegroundColor Cyan
Write-Host "   https://gestisechuanchaco-glitch.github.io/gestisechuanchaco/" -ForegroundColor White
Write-Host ""
Write-Host "Espera 1-2 minutos para que GitHub Pages se actualice." -ForegroundColor Yellow
Write-Host ""


