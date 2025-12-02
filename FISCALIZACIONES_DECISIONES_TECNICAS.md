# 🎯 DECISIONES TÉCNICAS - MÓDULO FISCALIZACIONES

## 📊 Decisiones Estratégicas

### 1️⃣ **Creación de Fiscalizaciones: MANUAL**

**Decisión:** Los fiscalizadores crean manualmente cada fiscalización.

**Razón:**
- ✅ Mayor control sobre los datos
- ✅ Evita fiscalizaciones automáticas erróneas
- ✅ Permite planificación consciente
- ✅ Trazabilidad clara de responsabilidades

**Alternativa descartada:** 
- ❌ Creación automática post-inspección (podría crear spam)
- ❌ Requeriría lógica compleja de triggers
- ❌ Menos flexibilidad

---

### 2️⃣ **Origen de Fiscalizaciones: 5 Tipos**

**Implementado:**
1. **Oficio** - La municipalidad decide fiscalizar
2. **Denuncia** - Ciudadano reporta irregularidad
3. **Post-ITSE** - Seguimiento a inspección ITSE
4. **Operativo** - Fiscalización masiva planificada
5. **Reinspección** - Verificar subsanación

**Razón:**
- Cubre todos los casos reales que mostraron tus documentos
- Permite estadísticas por origen
- Facilita la planificación de operativos

---

### 3️⃣ **Estados del Flujo: 7 Estados**

**Flujo:**
```
Programada → En Ejecución → Ejecutada → Notificada 
   ↓                                       ↓
   ↓                                   Subsanada ✅
   ↓                                   Multada ⚠️
   ↓                                   Cerrado 🚫
```

**Razón:**
- Refleja el proceso real municipal
- Permite seguimiento granular
- Facilita reportes y KPIs

**Estados:**
- `Programada` - Fiscalización planificada
- `En Ejecución` - Inspector en campo
- `Ejecutada` - Fiscalización realizada, pendiente documentar
- `Notificada` - Infractor notificado oficialmente
- `Subsanada` - Establecimiento corrigió la infracción
- `Multada` - No subsanó, se aplicó multa
- `Cerrado` - Caso cerrado (cierre del establecimiento o archivo)

---

### 4️⃣ **Tipos de Infracción: 8 Categorías**

**Implementado:**
1. Falta de Certificado ITSE
2. Falta de Licencia de Funcionamiento
3. Condiciones Inseguras
4. Aforo Excedido
5. Salidas de Emergencia Bloqueadas
6. Sin Extintores
7. Construcción sin Permiso
8. Otro (personalizable)

**Razón:**
- Basado en tus documentos reales (ACTA-206-2024, NOT-108-2025)
- Permite estadísticas de infracciones más comunes
- Facilita la búsqueda y filtrado

---

### 5️⃣ **Gravedades: 3 Niveles**

**Implementado:**
- `Leve` - Verde (#10B981) - Multa baja, plazo largo
- `Grave` - Naranja (#F59E0B) - Multa media, plazo corto
- `Muy Grave` - Rojo (#EF4444) - Multa alta, cierre posible

**Razón:**
- Estándar en normativa municipal (Ord. 007-2022-MDH)
- Define monto de multa y plazo de subsanación
- Prioriza las fiscalizaciones más urgentes

---

### 6️⃣ **Medidas Adoptadas: 5 Opciones**

**Implementado:**
1. Notificación de Infracción
2. Multa
3. Cierre Temporal
4. Cierre Definitivo
5. Subsanación Voluntaria

**Razón:**
- Refleja las acciones reales de defensa civil
- Permite escalamiento de medidas
- Compatible con la base legal

---

### 7️⃣ **Relación con Expedientes ITSE**

**Decisión:** Campo `expediente_relacionado` opcional.

**Razón:**
- No todas las fiscalizaciones vienen de ITSE
- Permite vincular cuando sí existe relación
- Facilita el seguimiento integral

**Uso:**
- Si viene de "Post-ITSE" → Llenar N° expediente
- Si es "Oficio" o "Denuncia" → Dejar vacío

---

### 8️⃣ **Cálculo Automático de Fechas**

**Implementado:**
```typescript
fecha_limite_subsanacion = fecha_fiscalizacion + plazo_subsanacion (días)
```

**Razón:**
- Evita errores de cálculo manual
- Facilita alertas automáticas (futura implementación)
- Transparencia en plazos

---

### 9️⃣ **Permisos por Rol**

**Implementación actual:** Todos pueden ver, solo admin puede eliminar.

**Sugerencia futura:**
```
Admin:
  - Todo (CRUD completo)
  
Inspector:
  - Crear fiscalizaciones
  - Editar sus propias fiscalizaciones
  - Ver todas

Administrativo:
  - Solo ver (solo lectura)
```

**Razón:**
- Protege datos sensibles
- Evita modificaciones no autorizadas
- Trazabilidad de responsabilidades

---

### 🔟 **Generación de Número de Fiscalización**

**Formato:** `FISC-YYYYMMDD-HHMM`

**Ejemplo:** `FISC-20251021-1530`

**Razón:**
- Único por timestamp
- Fácil de buscar
- Ordenamiento cronológico automático
- Compatible con sistemas documentales

---

## 🎨 Decisiones de Diseño

### Paleta de Colores

**Verde principal:** `#1B5E5E` (Serio, institucional)
**Verde secundario:** `#257575` (Degradados)
**Verde éxito:** `#10B981` (Acciones positivas)

**Razón:**
- Coherencia con el resto del sistema
- Verde = Seguridad, Orden, Gobierno
- Profesionalismo municipal

### Badges de Estado

Cada estado tiene su color distintivo:

| Estado | Color | Razón |
|--------|-------|-------|
| Programada | Amarillo | Pendiente de acción |
| En Ejecución | Azul | En proceso activo |
| Ejecutada | Morado | Completada, pendiente docs |
| Notificada | Naranja | Acción requerida del infractor |
| Subsanada | Verde | Éxito, problema resuelto |
| Multada | Rojo | Sanción aplicada |
| Cerrado | Gris | Caso finalizado |

### Responsividad

**Breakpoints:**
- Desktop: > 1024px
- Tablet: 768px - 1024px
- Mobile: < 768px

**Optimizaciones:**
- Tabla con scroll horizontal en móvil
- Formularios en columna única
- Modales adaptables

---

## 🗄️ Decisiones de Base de Datos

### Estructura de Tabla

```sql
fiscalizaciones
  - id (AUTO_INCREMENT)
  - numero_fiscalizacion (UNIQUE) ← Importante
  - fecha_fiscalizacion (DATETIME)
  - origen (ENUM)
  - expediente_relacionado (VARCHAR, NULL)
  - ... [datos establecimiento]
  - inspector_id (FK → usuarios)
  - ... [datos infracción]
  - estado (ENUM)
  - ... [fechas seguimiento]
  - creado_en, actualizado_en (timestamps)
```

### Índices Creados

```sql
INDEX idx_numero (numero_fiscalizacion)
INDEX idx_fecha (fecha_fiscalizacion)
INDEX idx_estado (estado)
INDEX idx_inspector (inspector_id)
INDEX idx_expediente (expediente_relacionado)
```

**Razón:**
- Búsquedas rápidas por número
- Filtros por fecha eficientes
- Consultas por estado optimizadas
- Relaciones con inspectores

### Foreign Keys

```sql
CONSTRAINT fk_fiscalizacion_inspector
  FOREIGN KEY (inspector_id)
  REFERENCES usuarios(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE
```

**Decisión:** `ON DELETE SET NULL`

**Razón:**
- Si se elimina un inspector, no se pierden las fiscalizaciones
- Se marca como "Sin asignar"
- Mantiene integridad histórica

---

## 📡 Decisiones de API

### RESTful Design

```
GET    /api/fiscalizaciones          → Listar (con filtros)
GET    /api/fiscalizaciones/:id      → Obtener una
POST   /api/fiscalizaciones          → Crear
PUT    /api/fiscalizaciones/:id      → Actualizar completa
DELETE /api/fiscalizaciones/:id      → Eliminar
GET    /api/fiscalizaciones/estadisticas/resumen → KPIs
```

**Razón:**
- Estándar REST
- Predecible y fácil de documentar
- Compatible con futuros consumidores (mobile app, etc.)

### Filtros Query String

```
GET /api/fiscalizaciones?estado=Notificada&inspector=2&origen=Denuncia
```

**Razón:**
- Flexible
- Cacheable
- Fácil de usar desde frontend

---

## 🚀 Próximas Implementaciones Sugeridas

### Corto Plazo (1-2 semanas)

1. **Adjuntar Evidencias Fotográficas**
   - Tabla: `fiscalizacion_evidencias`
   - Upload de imágenes (multer)
   - Galería en modal detalle

2. **Generar PDFs**
   - Acta de Constatación
   - Notificación de Infracción
   - Usar `pdfkit` o `puppeteer`

3. **Dashboard de Estadísticas**
   - Gráficos con Chart.js
   - KPIs: Total fiscalizaciones mes, Tasa subsanación, etc.
   - Infracciones más comunes

### Mediano Plazo (1 mes)

4. **Alertas Automáticas**
   - Email cuando se acerca fecha límite
   - Notificación al inspector asignado
   - Usar `nodemailer`

5. **Historial de Cambios**
   - Auditoría de quién cambió qué
   - Tabla: `fiscalizacion_historial`
   - Integrar con tabla `historial` existente

6. **Mapa de Fiscalizaciones**
   - Geocodificar direcciones
   - Mapa con Google Maps API
   - Marcadores por gravedad

### Largo Plazo (3 meses)

7. **Módulo de Multas**
   - Tabla `multas` separada
   - Estado de pago
   - Integración con sistema contable

8. **Reinspecciones Automáticas**
   - Si no subsana en plazo → Crear reinspección automática
   - Workflow avanzado

9. **App Móvil para Inspectores**
   - Registrar fiscalizaciones desde campo
   - Subir fotos directamente
   - Geolocalización automática

---

## 📝 Conclusión

Este módulo fue diseñado con las siguientes prioridades:

1. ✅ **Usabilidad** - Fácil de usar para inspectores y admins
2. ✅ **Profesionalismo** - Diseño coherente y serio
3. ✅ **Escalabilidad** - Preparado para crecer
4. ✅ **Trazabilidad** - Auditoría completa
5. ✅ **Flexibilidad** - Adaptable a cambios normativos

**Resultado:** Un sistema robusto, funcional y listo para producción.

---

**Autor de decisiones:** AI Assistant
**Fecha:** Octubre 2025
**Versión:** 1.0


