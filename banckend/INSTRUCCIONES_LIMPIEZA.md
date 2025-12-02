# 📋 GUÍA COMPLETA: LIMPIAR DATOS DE PRUEBA

Esta guía te ayudará a limpiar todos los datos de prueba de tu base de datos para empezar con datos reales.

---

## 🎯 **¿QUÉ SE VA A ELIMINAR?**

### ✅ **SE ELIMINARÁN:**
- ✅ Todas las solicitudes de prueba
- ✅ Todos los locales registrados de prueba
- ✅ Todos los reportes
- ✅ Todas las fiscalizaciones
- ✅ Todas las fotos del panel fotográfico
- ✅ Todas las notificaciones
- ✅ Todo el historial de cambios

### 🔒 **SE CONSERVARÁN:**
- 🔒 **Usuarios y contraseñas** (incluidos bcrypt)
- 🔒 **Roles** (Administrador, Inspector, Administrativo)
- 🔒 **Estructura de tablas** (no se elimina ninguna tabla)

---

## 📝 **PASOS A SEGUIR**

### **PASO 1: Crear Backup de Seguridad** 🛡️

**IMPORTANTE:** Siempre crea un backup antes de eliminar datos.

1. Abre **MySQL Workbench**
2. Conéctate a tu base de datos `defensa_civil_bd`
3. Abre el archivo: `backup_antes_limpieza.sql`
4. Ejecuta el script completo (F5 o botón Execute)
5. Verifica que aparezca el mensaje: **"✅ BACKUP COMPLETADO EXITOSAMENTE"**

**¿Qué hace este script?**
- Crea tablas de backup con prefijo `backup_*`
- Copia TODOS los datos actuales
- Te permite restaurar si algo sale mal

---

### **PASO 2: Limpiar Datos de Prueba** 🗑️

1. Abre el archivo: `limpiar_datos_prueba.sql`
2. **LEE el script** para entender qué va a hacer
3. Ejecuta el script completo (F5 o botón Execute)
4. Espera a que termine (debería tomar pocos segundos)
5. Verifica que aparezca: **"🎉 LIMPIEZA COMPLETADA EXITOSAMENTE"**

**¿Qué hace este script?**
- Desactiva temporalmente las claves foráneas
- Elimina TODOS los datos de prueba con `TRUNCATE`
- Reinicia los contadores AUTO_INCREMENT a 1
- Reactiva las claves foráneas
- Muestra un resumen de registros restantes

---

### **PASO 3: Verificar la Limpieza** ✅

Ejecuta estas consultas para verificar:

```sql
-- Verificar que las tablas estén vacías
SELECT COUNT(*) AS solicitudes FROM solicitudes;
SELECT COUNT(*) AS locales FROM locales;
SELECT COUNT(*) AS reportes FROM reportes;
SELECT COUNT(*) AS fiscalizaciones FROM fiscalizaciones;

-- Verificar que los usuarios se conservaron
SELECT id, usuario, rol_id, email FROM usuarios;
```

**Resultado esperado:**
- ✅ Todas las tablas de datos deben mostrar `0` registros
- ✅ La tabla `usuarios` debe mostrar tus usuarios (5 usuarios)

---

## 🔄 **¿NECESITAS RESTAURAR EL BACKUP?**

Si algo salió mal o quieres recuperar los datos de prueba:

1. Abre el archivo: `restaurar_backup.sql`
2. Ejecuta el script completo
3. Todos los datos se restaurarán desde el backup

---

## 🚀 **DESPUÉS DE LA LIMPIEZA**

### **1. Reiniciar el Backend**

El backend puede tener datos en caché. Reinícialo:

```bash
# Detener el backend (Ctrl+C en la terminal)
# Luego reiniciar:
cd banckend
node index.js
```

### **2. Limpiar el Frontend**

En el navegador:
1. Abre las **Herramientas de Desarrollo** (F12)
2. Ve a la pestaña **Application** (Chrome) o **Storage** (Firefox)
3. Elimina:
   - ✅ `localStorage`
   - ✅ `sessionStorage`
   - ✅ Cookies
4. Recarga la página (Ctrl+F5)

### **3. Limpiar Archivos de Uploads**

Los archivos de fotos NO se eliminan automáticamente. Debes hacerlo manualmente:

```bash
# Navega a la carpeta de uploads
cd banckend/uploads

# Elimina todas las fotos de prueba (Windows)
del *.jpg
del *.png
del *.jpeg

# O elimina todo (Windows)
del /q *.*
```

**Linux/Mac:**
```bash
cd banckend/uploads
rm -f *.jpg *.png *.jpeg
```

---

## 📊 **EMPEZAR CON DATOS REALES**

Ahora que la base de datos está limpia:

### **1. Inicia Sesión**
- Usuario: `antonia` (Administrador)
- Contraseña: Tu contraseña configurada

### **2. Ingresa Solicitudes Reales**
- Ve a **"Solicitudes"**
- Haz clic en **"Nueva Solicitud"**
- Ingresa los datos reales de tu municipalidad

### **3. Asigna Inspectores**
- Asigna las solicitudes a inspectores reales
- Los inspectores recibirán notificaciones

### **4. Completa Inspecciones**
- Los inspectores completan el panel fotográfico
- Aceptan o observan las solicitudes

### **5. Genera Reportes**
- El sistema generará reportes con datos reales
- Los locales se registrarán automáticamente

---

## ⚠️ **ADVERTENCIAS IMPORTANTES**

1. **NO ejecutes el script de limpieza en producción sin backup**
2. **Verifica que el backup se haya creado correctamente**
3. **Los usuarios y contraseñas NO se eliminan**
4. **Las fotos físicas NO se eliminan automáticamente**
5. **Las tablas de backup ocupan espacio** (puedes eliminarlas después)

---

## 🗂️ **ARCHIVOS CREADOS**

| Archivo | Propósito |
|---------|-----------|
| `backup_antes_limpieza.sql` | Crea backup de seguridad |
| `limpiar_datos_prueba.sql` | Elimina datos de prueba |
| `restaurar_backup.sql` | Restaura datos desde backup |
| `INSTRUCCIONES_LIMPIEZA.md` | Esta guía |

---

## 🆘 **¿PROBLEMAS?**

### **Error: "Cannot truncate table because foreign key"**
- El script desactiva las claves foráneas temporalmente
- Si el error persiste, ejecuta manualmente:
```sql
SET FOREIGN_KEY_CHECKS = 0;
-- Luego ejecuta el script de limpieza
```

### **Error: "Table backup_* doesn't exist"**
- Necesitas ejecutar primero `backup_antes_limpieza.sql`

### **Los datos no se eliminaron**
- Verifica que estés conectado a la base de datos correcta
- Asegúrate de ejecutar el script completo (no línea por línea)

---

## ✅ **CHECKLIST FINAL**

Antes de empezar con datos reales:

- [ ] ✅ Backup creado exitosamente
- [ ] ✅ Datos de prueba eliminados
- [ ] ✅ Verificación realizada (tablas vacías)
- [ ] ✅ Usuarios conservados
- [ ] ✅ Backend reiniciado
- [ ] ✅ Frontend limpiado (localStorage, cookies)
- [ ] ✅ Carpeta uploads limpiada
- [ ] ✅ Login funcional

---

## 📞 **SOPORTE**

Si tienes dudas o problemas:
1. Revisa esta guía completa
2. Verifica los mensajes de error en la consola
3. Asegúrate de tener backup antes de cualquier acción

---

**¡Éxito con tus datos reales!** 🎉









