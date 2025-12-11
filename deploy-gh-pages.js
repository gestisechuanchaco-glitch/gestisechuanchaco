const fs = require('fs');
const path = require('path');

// Rutas
const sourceDir = path.join(__dirname, 'docs', 'browser');
const targetDir = path.join(__dirname, 'docs');

console.log('🚀 Iniciando despliegue para GitHub Pages...\n');

// Verificar que existe la carpeta source
if (!fs.existsSync(sourceDir)) {
  console.error('❌ Error: No se encontró la carpeta docs/browser');
  console.error('   Ejecuta primero: ng build --configuration production');
  process.exit(1);
}

// Función para copiar archivos recursivamente
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Limpiar archivos antiguos en docs (excepto browser, .git, CNAME, sitemap.xml y google*.html)
console.log('📁 Limpiando archivos antiguos en docs/...');
const filesToKeep = ['browser', '.git', 'CNAME', 'sitemap.xml'];
const filesToKeepPatterns = [/^google.*\.html$/i]; // Patrones para archivos que deben preservarse
if (fs.existsSync(targetDir)) {
  fs.readdirSync(targetDir).forEach(file => {
    const filePath = path.join(targetDir, file);
    
    // Verificar si el archivo debe preservarse
    const shouldKeep = filesToKeep.includes(file) || 
                      filesToKeepPatterns.some(pattern => pattern.test(file));
    
    if (!shouldKeep) {
      try {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
          console.log(`   ✅ Eliminada carpeta: ${file}`);
        } else {
          fs.unlinkSync(filePath);
          console.log(`   ✅ Eliminado archivo: ${file}`);
        }
      } catch (err) {
        console.log(`   ⚠️  No se pudo eliminar: ${file} - ${err.message}`);
      }
    } else {
      console.log(`   🔒 Preservado: ${file}`);
    }
  });
}

// Copiar archivos de docs/browser a docs (excluyendo la carpeta browser anidada)
console.log('\n📦 Copiando archivos de docs/browser/ a docs/...');
if (fs.existsSync(sourceDir)) {
  fs.readdirSync(sourceDir).forEach(file => {
    // Ignorar la carpeta 'browser' anidada
    if (file === 'browser') {
      console.log(`   ⏭️  Omitido: ${file} (carpeta anidada)`);
      return;
    }
    const srcPath = path.join(sourceDir, file);
    const destPath = path.join(targetDir, file);
    
    // Preservar CNAME y otros archivos importantes si ya existen
    if (file === 'CNAME' && fs.existsSync(destPath)) {
      console.log(`   🔒 Preservado: ${file} (archivo de dominio)`);
      return;
    }
    
    try {
      copyRecursiveSync(srcPath, destPath);
      console.log(`   ✅ Copiado: ${file}`);
    } catch (err) {
      console.log(`   ❌ Error al copiar ${file}: ${err.message}`);
    }
  });
} else {
  console.error('❌ Error: La carpeta docs/browser no existe');
  process.exit(1);
}

// Eliminar la carpeta browser de docs si existe (después de copiar)
const browserDirInDocs = path.join(targetDir, 'browser');
if (fs.existsSync(browserDirInDocs)) {
  console.log('\n🧹 Eliminando carpeta browser/ de docs/...');
  try {
    fs.rmSync(browserDirInDocs, { recursive: true, force: true });
    console.log('   ✅ Carpeta browser/ eliminada');
  } catch (err) {
    console.log(`   ⚠️  No se pudo eliminar browser/: ${err.message}`);
  }
}

// Verificar que index.html existe
const indexHtmlPath = path.join(targetDir, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  console.error('\n❌ ERROR: No se encontró index.html en docs/');
  console.error('   El despliegue puede no funcionar correctamente.');
  process.exit(1);
} else {
  console.log('\n✅ Verificación: index.html encontrado en docs/');
}

// Asegurar que CNAME existe
const cnamePath = path.join(targetDir, 'CNAME');
if (!fs.existsSync(cnamePath)) {
  console.log('\n📝 Creando archivo CNAME...');
  fs.writeFileSync(cnamePath, 'gestisec.arcode-pe.com\n', 'utf8');
  console.log('   ✅ CNAME creado: gestisec.arcode-pe.com');
} else {
  console.log('\n✅ Verificación: CNAME encontrado en docs/');
}

console.log('\n✨ ¡Despliegue completado!');
console.log('📝 Los archivos están listos en docs/ para GitHub Pages');
console.log('\n💡 Próximos pasos:');
console.log('   1. git add docs/');
console.log('   2. git commit -m "Deploy: Actualizar build para GitHub Pages"');
console.log('   3. git push origin main');
console.log('\n🌐 Tu sitio estará disponible en:');
console.log('   https://gestisec.arcode-pe.com\n');
