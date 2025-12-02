# Script de despliegue para GitHub Pages
Write-Host "Iniciando despliegue para GitHub Pages..." -ForegroundColor Cyan
Write-Host ""

# Determinar la ruta correcta (puede ser docs/browser o docs/browser/browser)
$sourcePath = "docs\browser"
if (Test-Path "docs\browser\browser") {
    $sourcePath = "docs\browser\browser"
    Write-Host "Detectada estructura anidada: usando docs/browser/browser/" -ForegroundColor Yellow
}

# Verificar que existe la carpeta fuente
if (-not (Test-Path $sourcePath)) {
    Write-Host "ERROR: No se encontro la carpeta de build" -ForegroundColor Red
    Write-Host "   Ejecuta primero: npm run build:prod" -ForegroundColor Yellow
    exit 1
}

# Limpiar archivos antiguos en docs (excepto browser, .git y 404.html)
Write-Host "Limpiando archivos antiguos en docs/..." -ForegroundColor Yellow
Get-ChildItem -Path "docs" -Exclude "browser", ".git", "404.html" | Remove-Item -Recurse -Force
Write-Host "   Archivos antiguos eliminados" -ForegroundColor Green
Write-Host ""

# Copiar archivos de la carpeta fuente a docs
Write-Host "Copiando archivos de $sourcePath a docs/..." -ForegroundColor Yellow
Get-ChildItem -Path $sourcePath | ForEach-Object {
    $destPath = Join-Path "docs" $_.Name
    Copy-Item -Path $_.FullName -Destination $destPath -Recurse -Force
    Write-Host "   Copiado: $($_.Name)" -ForegroundColor Green
}

# Eliminar la carpeta browser de docs
if (Test-Path "docs\browser") {
    Write-Host ""
    Write-Host "Eliminando carpeta browser/ de docs/..." -ForegroundColor Yellow
    Remove-Item -Path "docs\browser" -Recurse -Force
    Write-Host "   Carpeta browser/ eliminada" -ForegroundColor Green
}

# Verificar que index.html existe
if (Test-Path "docs\index.html") {
    Write-Host ""
    Write-Host "Verificacion: index.html encontrado en docs/" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "ERROR: No se encontro index.html en docs/" -ForegroundColor Red
    Write-Host "   El despliegue puede no funcionar correctamente." -ForegroundColor Yellow
    exit 1
}

# Copiar 404.html si existe en la raiz del proyecto
if (Test-Path "docs\404.html") {
    Write-Host "Verificacion: 404.html encontrado en docs/" -ForegroundColor Green
} else {
    # Si no existe, copiarlo desde la raiz si existe
    if (Test-Path "404.html") {
        Copy-Item -Path "404.html" -Destination "docs\404.html" -Force
        Write-Host "404.html copiado a docs/" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Despliegue completado!" -ForegroundColor Green
Write-Host "Los archivos estan listos en docs/ para GitHub Pages" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proximos pasos:" -ForegroundColor Yellow
Write-Host "   1. git add docs/" -ForegroundColor White
Write-Host "   2. git commit -m 'Deploy: Actualizar build para GitHub Pages'" -ForegroundColor White
Write-Host "   3. git push origin main" -ForegroundColor White
Write-Host ""
Write-Host "Tu sitio estara disponible en:" -ForegroundColor Cyan
Write-Host "   https://gestisechuanchaco-glitch.github.io/gestisechuanchaco/" -ForegroundColor Cyan
Write-Host ""
