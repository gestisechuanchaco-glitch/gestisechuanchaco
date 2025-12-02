# 🚀 INSTRUCCIONES PARA DESPLEGAR EN GITHUB PAGES

## ✅ PROBLEMA RESUELTO

El problema era que Angular 20 genera el build en `docs/browser/` pero GitHub Pages busca los archivos directamente en `docs/`.

**Solución implementada:** Script automático que mueve los archivos después del build.

---

## 📋 PASOS PARA DESPLEGAR

### **PASO 1: Generar el Build y Desplegar**

Ejecuta este comando que hace todo automáticamente:

```bash
npm run deploy
```

Este comando:
1. ✅ Genera el build de producción (`ng build --configuration production`)
2. ✅ Mueve los archivos de `docs/browser/` a `docs/`
3. ✅ Limpia archivos antiguos

---

### **PASO 2: Verificar los Archivos**

Después del comando, verifica que en `docs/` tengas:
- ✅ `index.html` (archivo principal)
- ✅ `main-xxxxx.js` (archivos JavaScript)
- ✅ `styles-xxxxx.css` (archivos CSS)
- ✅ `assets/` (carpeta con imágenes)
- ✅ `favicon.ico`
- ✅ Otros archivos necesarios

**NO debe haber** una carpeta `browser/` dentro de `docs/` (o si existe, debe estar vacía).

---

### **PASO 3: Subir a GitHub**

```bash
git add docs/
git commit -m "Deploy: Actualizar build para GitHub Pages"
git push origin main
```

---

### **PASO 4: Verificar en GitHub**

1. Ve a tu repositorio en GitHub
2. Ve a **Settings** → **Pages**
3. Verifica que la fuente sea **Deploy from a branch** → **main** → **/docs**
4. Espera 1-2 minutos para que se actualice
5. Visita: `https://gestisechuanchaco-glitch.github.io/gestisechuanchaco/`

---

## 🔧 COMANDOS ALTERNATIVOS

Si prefieres hacerlo paso a paso:

```bash
# 1. Generar build
npm run build:prod

# 2. Mover archivos (script automático)
node deploy-gh-pages.js

# 3. Subir a GitHub
git add docs/
git commit -m "Deploy: Actualizar build"
git push origin main
```

---

## ⚠️ IMPORTANTE

### **NO hagas esto manualmente:**
- ❌ NO copies archivos manualmente de `docs/browser/` a `docs/`
- ❌ NO elimines la carpeta `docs/browser/` (el script la maneja)
- ❌ NO modifiques archivos dentro de `docs/` manualmente

### **Siempre usa:**
- ✅ `npm run deploy` (recomendado)
- ✅ O `npm run build:prod && node deploy-gh-pages.js`

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### **Error: "No se encontró la carpeta docs/browser"**
**Solución:** Ejecuta primero `npm run build:prod` o `ng build --configuration production`

### **Los archivos no se mueven**
**Solución:** Verifica que tengas permisos de escritura en la carpeta `docs/`

### **GitHub Pages sigue mostrando la documentación**
**Solución:** 
1. Verifica que `docs/index.html` existe (no `docs/browser/index.html`)
2. Espera 2-3 minutos después del push
3. Limpia la caché del navegador (Ctrl+Shift+R)

### **El sitio muestra errores 404**
**Solución:** Verifica que el `base href` en `src/index.html` sea `/` (ya está configurado correctamente)

---

## 📝 ESTRUCTURA CORRECTA DESPUÉS DEL DEPLOY

```
docs/
├── index.html          ← Archivo principal (DEBE estar aquí)
├── main-xxxxx.js
├── styles-xxxxx.css
├── polyfills-xxxxx.js
├── chunk-xxxxx.js
├── favicon.ico
├── assets/
│   └── (imágenes y recursos)
└── media/
    └── (fuentes)
```

**NO debe haber:**
- ❌ `docs/browser/` (o debe estar vacía)
- ❌ `docs/404.html` (archivo de documentación)
- ❌ `docs/3rdpartylicenses.txt` (archivo de documentación)

---

## ✅ CHECKLIST ANTES DE HACER PUSH

- [ ] Ejecuté `npm run deploy`
- [ ] Verifiqué que `docs/index.html` existe
- [ ] Verifiqué que NO hay carpeta `docs/browser/` con archivos
- [ ] Verifiqué que `docs/assets/` tiene las imágenes
- [ ] Hice `git add docs/`
- [ ] Hice `git commit`
- [ ] Estoy listo para hacer `git push`

---

## 🎯 RESUMEN RÁPIDO

```bash
# Todo en un solo comando:
npm run deploy && git add docs/ && git commit -m "Deploy" && git push origin main
```

---

**¡Listo! Tu aplicación debería estar funcionando en GitHub Pages** 🎉


