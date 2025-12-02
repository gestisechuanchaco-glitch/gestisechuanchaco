# Script de despliegue para GitHub Pages
# Configurado para dominio personalizado: gestisec.arcode-pe.com
# Los archivos deben estar en docs/

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DESPLIEGUE PARA GITHUB PAGES" -ForegroundColor Cyan
Write-Host "  Dominio: gestisec.arcode-pe.com" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Angular 20 genera docs/browser/browser/, necesitamos mover a docs/
$sourcePath = "docs\browser\browser"
$targetPath = "docs"

# Verificar si existe la estructura anidada browser/browser
if (-not (Test-Path $sourcePath)) {
    # Si no existe browser/browser, verificar si hay archivos directamente en docs/browser
    $altSourcePath = "docs\browser"
    if (Test-Path "$altSourcePath\index.html") {
        Write-Host "Detectada estructura: docs/browser/" -ForegroundColor Yellow
        Write-Host "Moviendo archivos a docs/..." -ForegroundColor Yellow
        Write-Host ""
        
        # Limpiar archivos antiguos en docs (excepto browser y .git)
        Get-ChildItem -Path $targetPath -Exclude "browser", ".git" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        
        # Copiar todos los archivos de browser/ a docs/
        Get-ChildItem -Path $altSourcePath | ForEach-Object {
            if ($_.Name -ne "browser") {
                $destPath = Join-Path $targetPath $_.Name
                Copy-Item -Path $_.FullName -Destination $destPath -Recurse -Force
                Write-Host "   Copiado: $($_.Name)" -ForegroundColor Green
            }
        }
        
        # Eliminar la carpeta browser
        Write-Host ""
        Write-Host "Eliminando carpeta browser/..." -ForegroundColor Yellow
        Remove-Item -Path $altSourcePath -Recurse -Force
        Write-Host "   Carpeta browser/ eliminada" -ForegroundColor Green
    } elseif (Test-Path "$targetPath\index.html") {
        Write-Host "Build ya esta en la ubicacion correcta: $targetPath" -ForegroundColor Green
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  DESPLIEGUE COMPLETADO" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Los archivos estan listos en docs/" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "IMPORTANTE: Configura GitHub Pages:" -ForegroundColor Yellow
        Write-Host "   1. Ve a Settings > Pages en tu repositorio" -ForegroundColor White
        Write-Host "   2. Branch: main" -ForegroundColor White
        Write-Host "   3. Folder: /docs" -ForegroundColor White
        Write-Host ""
        exit 0
    } else {
        Write-Host "ERROR: No se encontro la carpeta de build" -ForegroundColor Red
        Write-Host "   Ejecuta primero: npm run build:prod" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "Detectada estructura anidada: docs/browser/browser/" -ForegroundColor Yellow
    Write-Host "Moviendo archivos a docs/..." -ForegroundColor Yellow
    Write-Host ""
    
    # Limpiar archivos antiguos en docs (excepto browser y .git)
    Get-ChildItem -Path $targetPath -Exclude "browser", ".git" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    
    # Copiar todos los archivos de browser/browser/ a docs/
    Get-ChildItem -Path $sourcePath | ForEach-Object {
        $destPath = Join-Path $targetPath $_.Name
        Copy-Item -Path $_.FullName -Destination $destPath -Recurse -Force
        Write-Host "   Copiado: $($_.Name)" -ForegroundColor Green
    }
    
    # Eliminar la carpeta browser completa
    Write-Host ""
    Write-Host "Eliminando carpeta browser/..." -ForegroundColor Yellow
    Remove-Item -Path "docs\browser" -Recurse -Force
    Write-Host "   Carpeta browser/ eliminada" -ForegroundColor Green
}

# Verificar que index.html existe
if (-not (Test-Path "$targetPath\index.html")) {
    Write-Host ""
    Write-Host "ERROR: No se encontro index.html en $targetPath" -ForegroundColor Red
    Write-Host "   El despliegue puede no funcionar correctamente." -ForegroundColor Yellow
    exit 1
}

# Crear 404.html si no existe
if (-not (Test-Path "$targetPath\404.html")) {
    $html404 = @'
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>GESTISEC - Redirigiendo...</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script>
    var path = window.location.pathname;
    var search = window.location.search;
    var route = path.replace(/^\//, '').replace(/\/$/, '');
    if (route === '404.html' || route === '' || route === 'index.html') {
      window.location.replace('/index.html' + search);
    } else {
      var newUrl = '/index.html' + search;
      sessionStorage.setItem('redirectPath', '/' + route);
      window.location.replace(newUrl);
    }
  </script>
</head>
<body>
  <noscript>
    <p>Redirigiendo...</p>
    <p>Si no eres redirigido automaticamente, <a href="/index.html">haz clic aqui</a>.</p>
  </noscript>
</body>
</html>
'@
    Set-Content -Path "$targetPath\404.html" -Value $html404 -Encoding UTF8
    Write-Host "404.html creado en docs/" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DESPLIEGUE COMPLETADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Los archivos estan listos en docs/" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANTE: Configura GitHub Pages:" -ForegroundColor Yellow
Write-Host "   1. Ve a Settings > Pages en tu repositorio" -ForegroundColor White
Write-Host "   2. Branch: main" -ForegroundColor White
Write-Host "   3. Folder: /docs" -ForegroundColor White
Write-Host ""
Write-Host "Proximos pasos para subir a GitHub:" -ForegroundColor Yellow
Write-Host "   1. git add docs/" -ForegroundColor White
Write-Host "   2. git commit -m 'Deploy: Actualizar build en docs'" -ForegroundColor White
Write-Host "   3. git push origin main" -ForegroundColor White
Write-Host ""
Write-Host "Tu sitio estara disponible en:" -ForegroundColor Cyan
Write-Host "   https://gestisec.arcode-pe.com" -ForegroundColor Cyan
Write-Host ""
