# 📬 SISTEMA DE NOTIFICACIONES COMPLETO

## 🎯 Reglas de Notificaciones por Rol

### 👨‍💼 ADMINISTRADOR
- ✅ Recibe notificaciones de **TODAS las acciones** del sistema
- Nueva fiscalización creada
- Fiscalización editada
- Fiscalización eliminada
- Nueva solicitud ITSE
- Inspector asignado
- Estado de inspección cambiado
- Evidencias subidas
- PDFs generados

### 🔍 INSPECTOR
- ✅ Solo recibe notificaciones cuando se le **asigna una nueva inspección**
- Asignación de solicitud ITSE
- Asignación de fiscalización

### 📋 ADMINISTRATIVO
- ✅ Solo recibe notificaciones cuando un **inspector acepta una solicitud**
- Solicitud aceptada por inspector
- Solicitud rechazada por inspector
- Observaciones del inspector

---

## 📊 Base de Datos

### 1. Ejecutar el archivo SQL

```bash
mysql -u root -p defensacivil < banckend/notificaciones_table.sql
```

O desde MySQL Workbench:
1. Abrir `banckend/notificaciones_table.sql`
2. Ejecutar el script completo

---

## 🔌 Endpoints del Backend

### GET `/api/notificaciones`
Obtener notificaciones del usuario/rol actual

**Query Params:**
- `usuario_id` (opcional): ID del usuario
- `rol` (requerido): `administrador`, `inspector`, `administrativo`

**Ejemplo:**
```javascript
GET http://localhost:3000/api/notificaciones?rol=inspector&usuario_id=2
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "usuario_id": 2,
    "rol_destino": "inspector",
    "tipo": "asignacion_inspeccion",
    "titulo": "Nueva inspección asignada",
    "mensaje": "Se te ha asignado la inspección del expediente EXP-2025-001",
    "icono": "fa-clipboard-check",
    "referencia_tipo": "solicitud",
    "referencia_id": 1,
    "expediente": "EXP-2025-001",
    "leida": false,
    "fecha_leida": null,
    "creado_por": "Sistema",
    "creado_en": "2025-01-22T10:30:00.000Z"
  }
]
```

### GET `/api/notificaciones/no-leidas/count`
Obtener cantidad de notificaciones no leídas

**Query Params:**
- `usuario_id` (opcional): ID del usuario
- `rol` (requerido): rol del usuario

**Ejemplo:**
```javascript
GET http://localhost:3000/api/notificaciones/no-leidas/count?rol=inspector&usuario_id=2
```

**Respuesta:**
```json
{
  "count": 3
}
```

### POST `/api/notificaciones`
Crear notificación manualmente

**Body:**
```json
{
  "usuario_id": 2,
  "rol_destino": "inspector",
  "tipo": "asignacion_inspeccion",
  "titulo": "Nueva inspección asignada",
  "mensaje": "Se te ha asignado la inspección FISC-2025-001",
  "icono": "fa-clipboard-check",
  "referencia_tipo": "fiscalizacion",
  "referencia_id": 1,
  "expediente": "FISC-2025-001",
  "creado_por": "admin"
}
```

### PUT `/api/notificaciones/:id/leer`
Marcar una notificación como leída

**Ejemplo:**
```javascript
PUT http://localhost:3000/api/notificaciones/5/leer
```

### PUT `/api/notificaciones/marcar-todas-leidas`
Marcar todas las notificaciones como leídas

**Body:**
```json
{
  "usuario_id": 2,
  "rol": "inspector"
}
```

### DELETE `/api/notificaciones/:id`
Eliminar una notificación

**Ejemplo:**
```javascript
DELETE http://localhost:3000/api/notificaciones/5
```

---

## 🔧 Implementación Automática de Notificaciones

### Ejemplo: Notificar al crear una Fiscalización

```javascript
// En el endpoint POST /api/fiscalizaciones
app.post('/api/fiscalizaciones', (req, res) => {
  // ... código de creación de fiscalización ...
  
  const fiscalizacionId = result.insertId;
  const numero = req.body.numero_fiscalizacion;
  
  // 1. NOTIFICAR AL ADMINISTRADOR (siempre)
  crearNotificacion(
    'nueva_fiscalizacion',
    'Nueva Fiscalización Creada',
    `Se ha creado la fiscalización ${numero}`,
    {
      rolDestino: 'administrador',
      referenciaTipo: 'fiscalizacion',
      referenciaId: fiscalizacionId,
      expediente: numero,
      icono: 'fa-clipboard-check',
      creadoPor: req.body.creado_por || 'Sistema'
    }
  );
  
  // 2. NOTIFICAR AL INSPECTOR (solo si se le asigna)
  if (req.body.inspector_id) {
    crearNotificacion(
      'asignacion_inspeccion',
      'Nueva Inspección Asignada',
      `Se te ha asignado la fiscalización ${numero}`,
      {
        rolDestino: 'inspector',
        usuarioId: req.body.inspector_id,
        referenciaTipo: 'fiscalizacion',
        referenciaId: fiscalizacionId,
        expediente: numero,
        icono: 'fa-clipboard-check',
        creadoPor: req.body.creado_por || 'Sistema'
      }
    );
  }
});
```

### Ejemplo: Notificar cuando Inspector acepta solicitud

```javascript
// En el endpoint PUT /api/solicitudes/:id que cambia estado a "ACEPTADO"
app.put('/api/solicitudes/:id/estado', (req, res) => {
  const nuevoEstado = req.body.estado;
  const expediente = req.body.numerodeexpediente;
  
  if (nuevoEstado === 'ACEPTADO' || nuevoEstado === 'LISTO') {
    // NOTIFICAR AL ADMINISTRATIVO
    crearNotificacion(
      'aceptacion_solicitud',
      'Solicitud Aceptada',
      `El inspector ha aceptado la solicitud ${expediente}`,
      {
        rolDestino: 'administrativo',
        referenciaTipo: 'solicitud',
        referenciaId: req.params.id,
        expediente: expediente,
        icono: 'fa-check-circle',
        creadoPor: req.body.inspector_nombre || 'Inspector'
      }
    );
    
    // NOTIFICAR AL ADMINISTRADOR (siempre)
    crearNotificacion(
      'cambio_estado_solicitud',
      'Cambio de Estado',
      `La solicitud ${expediente} ha sido aceptada`,
      {
        rolDestino: 'administrador',
        referenciaTipo: 'solicitud',
        referenciaId: req.params.id,
        expediente: expediente,
        icono: 'fa-check-circle',
        creadoPor: req.body.inspector_nombre || 'Inspector'
      }
    );
  }
});
```

---

## 📱 Frontend - Componente de Notificaciones

### Modificar `src/app/app.ts`

```typescript
import { HttpClient } from '@angular/common/http';

export class AppComponent implements OnInit {
  private apiUrl = 'http://localhost:3000/api';
  
  notificaciones: any[] = [];
  notificacionesNoLeidasCount = 0;
  showNotifications = false;
  
  private usuarioActual: any;
  
  constructor(private http: HttpClient) {}
  
  ngOnInit() {
    this.cargarUsuarioActual();
    this.cargarNotificaciones();
    
    // Actualizar notificaciones cada 30 segundos
    setInterval(() => {
      this.cargarNotificaciones();
    }, 30000);
  }
  
  cargarUsuarioActual() {
    const usuarioId = localStorage.getItem('usuario_id');
    const rol = localStorage.getItem('rol');
    
    this.usuarioActual = {
      id: usuarioId ? parseInt(usuarioId) : null,
      rol: rol || 'administrativo'
    };
  }
  
  cargarNotificaciones() {
    const params = {
      rol: this.usuarioActual.rol,
      usuario_id: this.usuarioActual.id
    };
    
    this.http.get<any[]>(`${this.apiUrl}/notificaciones`, { params }).subscribe({
      next: (notificaciones) => {
        this.notificaciones = notificaciones;
        this.notificacionesNoLeidasCount = notificaciones.filter(n => !n.leida).length;
      },
      error: (error) => {
        console.error('Error al cargar notificaciones:', error);
      }
    });
  }
  
  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }
  
  marcarComoLeida(notificacion: any) {
    if (notificacion.leida) return;
    
    this.http.put(`${this.apiUrl}/notificaciones/${notificacion.id}/leer`, {}).subscribe({
      next: () => {
        notificacion.leida = true;
        this.notificacionesNoLeidasCount--;
      },
      error: (error) => {
        console.error('Error al marcar como leída:', error);
      }
    });
  }
  
  eliminarNoti(notificacion: any) {
    if (!confirm('¿Eliminar esta notificación?')) return;
    
    this.http.delete(`${this.apiUrl}/notificaciones/${notificacion.id}`).subscribe({
      next: () => {
        this.notificaciones = this.notificaciones.filter(n => n.id !== notificacion.id);
        if (!notificacion.leida) {
          this.notificacionesNoLeidasCount--;
        }
      },
      error: (error) => {
        console.error('Error al eliminar notificación:', error);
      }
    });
  }
  
  marcarTodasLeidas() {
    const body = {
      usuario_id: this.usuarioActual.id,
      rol: this.usuarioActual.rol
    };
    
    this.http.put(`${this.apiUrl}/notificaciones/marcar-todas-leidas`, body).subscribe({
      next: () => {
        this.notificaciones.forEach(n => n.leida = true);
        this.notificacionesNoLeidasCount = 0;
      },
      error: (error) => {
        console.error('Error al marcar todas como leídas:', error);
      }
    });
  }
}
```

---

## ✅ Pasos para Activar el Sistema

1. **Ejecutar el SQL**:
   ```bash
   mysql -u root -p defensacivil < banckend/notificaciones_table.sql
   ```

2. **Reiniciar el backend**:
   ```bash
   cd banckend
   node index.js
   ```

3. **Probar las notificaciones**:
   - Crear una nueva fiscalización → El administrador debe recibir notificación
   - Asignar un inspector → El inspector debe recibir notificación
   - Aceptar una solicitud → El administrativo debe recibir notificación

---

## 🎨 Diseño de las Notificaciones

Las notificaciones aparecen en el header con:
- 🔔 **Icono de campana** con badge de contador
- 📋 **Dropdown** con lista de notificaciones
- ✅ **Marcar como leída** al hacer clic
- ❌ **Botón para eliminar**
- 👁️ **Indicador visual** (no leída = negrita)

---

## 🚀 Próximas Mejoras

- [ ] Notificaciones en tiempo real con WebSockets
- [ ] Sonido al recibir notificación
- [ ] Categorías de notificaciones (urgente, normal, info)
- [ ] Historial de notificaciones eliminadas
- [ ] Configuración de preferencias de notificaciones









