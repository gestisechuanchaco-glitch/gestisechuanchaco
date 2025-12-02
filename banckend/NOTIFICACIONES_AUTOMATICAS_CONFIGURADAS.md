# 🔔 Notificaciones Automáticas - Sistema Configurado

## ✅ Sistema Completamente Integrado

El sistema de notificaciones está **completamente funcional** y se activa automáticamente en los siguientes casos:

---

## 📋 REGLAS DE NOTIFICACIÓN POR ROL

### 👤 ADMINISTRADOR
Recibe notificaciones de **TODAS** las acciones:
- ✅ Nueva solicitud creada
- ✅ Nueva fiscalización creada
- ✅ Cambios de estado en solicitudes
- ✅ Asignación de inspector
- ✅ Cambios en fiscalizaciones
- ✅ Eliminación de fiscalizaciones

### 🔍 INSPECTOR
Recibe notificaciones **SOLO** cuando:
- ✅ Se le asigna una nueva inspección (en fiscalizaciones)
- ✅ Se le asigna una nueva inspección (en solicitudes)

### 📝 ADMINISTRATIVO
Recibe notificaciones **SOLO** cuando:
- ✅ Un inspector acepta una solicitud
- ✅ Un inspector rechaza una solicitud

---

## 🔄 EVENTOS QUE ACTIVAN NOTIFICACIONES

### 1. SOLICITUDES

#### **Al crear una solicitud**
```javascript
POST /api/solicitud
→ Notifica a: ADMINISTRADOR
   Tipo: 'nueva_solicitud'
   Título: 'Nueva Solicitud ITSE Recibida'
   Mensaje: 'Se ha registrado la solicitud EXP-2025-001 de Comercial López SAC'
```

#### **Al cambiar el estado a "Aceptada"**
```javascript
PUT /api/solicitud/:id/editar
Body: { estado: 'Aceptada' }
→ Notifica a: ADMINISTRADOR + ADMINISTRATIVO
   
   ADMINISTRADOR recibe:
     Tipo: 'cambio_estado'
     Título: 'Estado de Solicitud Actualizado'
     Mensaje: 'La solicitud EXP-2025-001 cambió de "En Proceso" a "Aceptada"'
   
   ADMINISTRATIVO recibe:
     Tipo: 'solicitud_aceptada'
     Título: 'Solicitud Aceptada por Inspector'
     Mensaje: 'El inspector ha aceptado la solicitud EXP-2025-001 de Comercial López SAC'
```

#### **Al asignar un inspector**
```javascript
PUT /api/solicitud/:id/editar
Body: { inspector_asignado: 'Juan Pérez' }
→ Notifica a: ADMINISTRADOR
   Tipo: 'asignacion_inspector'
   Título: 'Inspector Asignado a Solicitud'
   Mensaje: 'Se asignó un inspector a la solicitud EXP-2025-001'
```

---

### 2. FISCALIZACIONES

#### **Al crear una fiscalización**
```javascript
POST /api/fiscalizaciones
Body: { 
  razon_social: 'Comercial López SAC',
  inspector_id: 2  // ← Si se asigna inspector
}
→ Notifica a: ADMINISTRADOR + INSPECTOR (si inspector_id está presente)

   ADMINISTRADOR recibe:
     Tipo: 'nueva_fiscalizacion'
     Título: 'Nueva Fiscalización Creada'
     Mensaje: 'Se ha registrado la fiscalización FISC-2025-001 para Comercial López SAC'
   
   INSPECTOR recibe (si inspector_id está presente):
     Tipo: 'asignacion_inspeccion'
     Título: 'Nueva Inspección Asignada'
     Mensaje: 'Se te ha asignado la fiscalización FISC-2025-001 en Av. Larco 123'
```

#### **Al asignar/cambiar inspector**
```javascript
PUT /api/fiscalizaciones/:id
Body: { inspector_id: 3 }  // ← Cambió de inspector
→ Notifica a: INSPECTOR (nuevo)
   Tipo: 'asignacion_inspeccion'
   Título: 'Nueva Inspección Asignada'
   Mensaje: 'Se te ha asignado la fiscalización FISC-2025-001'
```

#### **Al cambiar estado o gravedad**
```javascript
PUT /api/fiscalizaciones/:id
Body: { estado: 'Completada' }  // ← O gravedad
→ Notifica a: ADMINISTRADOR
   Tipo: 'cambio_fiscalizacion'
   Título: 'Fiscalización Actualizada'
   Mensaje: 'La fiscalización FISC-2025-001 ha sido actualizada'
```

#### **Al eliminar una fiscalización**
```javascript
DELETE /api/fiscalizaciones/:id
→ Notifica a: ADMINISTRADOR
   Tipo: 'eliminacion_fiscalizacion'
   Título: 'Fiscalización Eliminada'
   Mensaje: 'La fiscalización FISC-2025-001 ha sido eliminada'
```

---

## 🔧 CÓMO PROBAR EL SISTEMA

### 1. Asegúrate de que el backend está corriendo:
```bash
cd banckend
node index.js
```

### 2. Abre el navegador en el frontend y loguea como **Administrador**

### 3. Realiza alguna de estas acciones:
- ✅ Crea una nueva solicitud → Verás una notificación inmediatamente
- ✅ Edita una solicitud y cambia su estado → Verás una notificación
- ✅ Crea una nueva fiscalización → Verás una notificación

### 4. Para probar notificaciones de INSPECTOR:
- Loguea como un usuario con rol **Inspector**
- Crea una fiscalización y asigna al inspector logueado
- Verás la notificación de asignación

### 5. Para probar notificaciones de ADMINISTRATIVO:
- Loguea como un usuario con rol **Administrativo**
- Cambia el estado de una solicitud a "Aceptada" desde otra sesión
- Verás la notificación de aceptación

---

## 📊 ESTRUCTURA DE BASE DE DATOS

La tabla `notificaciones` se crea automáticamente con:

```sql
CREATE TABLE IF NOT EXISTS `notificaciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` INT NULL COMMENT 'ID del usuario específico (si aplica)',
  `rol_destino` VARCHAR(50) NOT NULL COMMENT 'Rol al que va dirigida',
  `tipo` VARCHAR(100) NOT NULL,
  `titulo` VARCHAR(255) NOT NULL,
  `mensaje` TEXT NOT NULL,
  `icono` VARCHAR(50) DEFAULT 'fa-bell',
  `referencia_tipo` VARCHAR(100) NULL,
  `referencia_id` INT NULL,
  `expediente` VARCHAR(50) NULL,
  `leida` BOOLEAN DEFAULT FALSE,
  `creado_por` VARCHAR(100) NULL,
  `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_leida` DATETIME NULL
);
```

---

## 🎯 ENDPOINTS DISPONIBLES

### GET `/api/notificaciones`
```javascript
// Obtener notificaciones por rol
GET /api/notificaciones?rol=administrador&usuario_id=2
```

### PUT `/api/notificaciones/:id/leer`
```javascript
// Marcar como leída
PUT /api/notificaciones/5/leer
```

### DELETE `/api/notificaciones/:id`
```javascript
// Eliminar notificación
DELETE /api/notificaciones/5
```

### PUT `/api/notificaciones/marcar-todas-leidas`
```javascript
// Marcar todas como leídas
PUT /api/notificaciones/marcar-todas-leidas
Body: { rol: 'administrador', usuario_id: 2 }
```

### GET `/api/notificaciones/no-leidas/count`
```javascript
// Obtener conteo de no leídas
GET /api/notificaciones/no-leidas/count?rol=administrador&usuario_id=2
```

---

## 🔥 FUNCIÓN HELPER PRINCIPAL

```javascript
crearNotificacion(tipo, titulo, mensaje, opciones = {})

// Ejemplo de uso:
crearNotificacion(
  'nueva_solicitud',
  'Nueva Solicitud ITSE',
  'Se registró la solicitud EXP-2025-001',
  {
    rolDestino: 'administrador',
    referenciaTipo: 'solicitud',
    referenciaId: 123,
    expediente: 'EXP-2025-001',
    icono: 'fa-file-alt',
    creadoPor: 'antonia'
  }
);
```

---

## ✨ CARACTERÍSTICAS ADICIONALES

- 🔄 **Polling automático**: Las notificaciones se actualizan cada 30 segundos
- 🎨 **Resaltado visual**: Las notificaciones no leídas tienen un borde verde
- 📱 **Responsive**: El dropdown se adapta a móviles
- 🔢 **Contador**: Badge con el número de notificaciones no leídas
- 🎯 **Click para marcar**: Al hacer click en una notificación, se marca como leída
- ✅ **Marcar todas**: Botón para marcar todas como leídas de una vez

---

## 🚀 PRÓXIMAS MEJORAS SUGERIDAS

1. ✉️ **Email alerts**: Enviar emails para notificaciones críticas
2. 🔔 **Push notifications**: Notificaciones del navegador
3. 🔗 **Links directos**: Click en notificación lleva a la solicitud/fiscalización
4. 📊 **Dashboard de actividad**: Historial completo de notificaciones
5. 🎚️ **Configuración por usuario**: Cada usuario elige qué notificaciones recibir

---

## 📝 NOTAS IMPORTANTES

1. ✅ El sistema **NO** requiere cambios en el frontend para funcionar
2. ✅ Las notificaciones se crean **automáticamente** en el backend
3. ✅ El frontend las consume mediante polling cada 30 segundos
4. ✅ Los roles en `localStorage` pueden estar en mayúscula ('Administrador')
5. ✅ El backend recibe roles en minúscula ('administrador')
6. ✅ La conversión se hace automáticamente en `app.ts`

---

## 🎉 ¡SISTEMA COMPLETAMENTE FUNCIONAL!

Todas las notificaciones están integradas y funcionando. El sistema está listo para usar.

Para cualquier consulta o mejora, revisar este documento y el código en:
- `banckend/index.js` (backend + notificaciones)
- `src/app/app.ts` (frontend + polling)
- `banckend/notificaciones_table.sql` (estructura de BD)




