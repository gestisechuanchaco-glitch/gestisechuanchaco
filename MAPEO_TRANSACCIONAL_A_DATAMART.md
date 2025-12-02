# 🔄 MAPEO: BASE TRANSACCIONAL → DATA MART

## 📋 RESUMEN

Este documento muestra cómo se **mapean** (relacionan) los datos desde la **base transaccional** (`BDHOSPITALESSALUD`) hacia el **Data Mart** (`DATAMART_HOSPITAL`).

---

## 🗺️ MAPEO DE MEDICIONES PRINCIPALES

### ⭐ **TABLA ORIGEN: Citas (Base Transaccional)**

```sql
-- Base de Datos: BDHOSPITALESSALUD
-- Tabla: Citas

Campos de medición agregados:
├─ monto_cita DECIMAL(10,2)       ← Precio de la consulta
├─ duracion_minutos INT           ← Tiempo de la cita
└─ dias_espera INT                ← Tiempo de espera del paciente
```

### ⭐ **TABLA DESTINO: HechosCitas (Data Mart)**

```sql
-- Base de Datos: DATAMART_HOSPITAL
-- Tabla: HechosCitas

Métricas que se copian desde Citas:
├─ monto_cita DECIMAL(10,2)       ← Desde Citas.monto_cita
├─ duracion_minutos INT           ← Desde Citas.duracion_minutos
└─ dias_espera INT                ← Desde Citas.dias_espera
```

---

## 📊 MAPEO COMPLETO DE HECHOS CITAS

### **Tabla: HechosCitas**

| Campo Data Mart | Origen (Base Transaccional) | Tipo Dato | Descripción |
|----------------|----------------------------|-----------|-------------|
| **LLAVES FORÁNEAS** | | | |
| `id_tiempo` | DimTiempo (lookup por fecha) | INT | FK a dimensión tiempo |
| `id_paciente` | DimPaciente (lookup por id) | INT | FK a dimensión paciente |
| `id_doctor` | DimDoctor (lookup por id) | INT | FK a dimensión doctor |
| `id_especialidad` | DimEspecialidad (lookup) | INT | FK a dimensión especialidad |
| `id_tipo_cita` | DimTipoCita (lookup) | INT | FK a dimensión tipo cita |
| `id_estado` | DimEstadoCita (lookup) | INT | FK a dimensión estado |
| `id_zona` | DimZona (lookup) | INT | FK a dimensión zona |
| `id_recepcionista` | DimRecepcionista (lookup) | INT | FK a dimensión recepcionista |
| **DIMENSIONES DEGENERADAS** | | | |
| `numero_cita` | Citas.id_cita (convertido a texto) | NVARCHAR | Número de cita original |
| `hora_cita` | Citas.hora | TIME | Hora de la cita |
| **MÉTRICAS ADITIVAS** | | | |
| `monto_cita` | **Citas.monto_cita** | DECIMAL | Precio de la consulta |
| `duracion_minutos` | **Citas.duracion_minutos** | INT | Duración estimada |
| `dias_espera` | **Citas.dias_espera** | INT | Tiempo de espera |
| **MÉTRICAS NO ADITIVAS** | | | |
| `fue_atendida` | Calculado (id_estado = 3) | BIT | Si fue atendida |
| `fue_confirmada` | Calculado (id_estado >= 2) | BIT | Si fue confirmada |
| `paciente_asistio` | Calculado (id_estado = 3) | BIT | Si asistió |
| `es_primera_vez` | Calculado (COUNT previas = 0) | BIT | Primera cita |
| `es_control` | TiposCita.descripcion LIKE '%Control%' | BIT | Cita de control |
| **AUDITORÍA** | | | |
| `fecha_registro_cita` | GETDATE() en el momento del registro | DATETIME | Cuándo se registró |
| `fecha_atencion` | AtencionCita.fecha | DATETIME | Cuándo se atendió |

---

## 🔄 PROCESO ETL SIMPLIFICADO

### **Paso 1: Extraer datos de la base transaccional**

```sql
SELECT 
    -- Datos básicos
    c.id_cita,
    c.id_paciente,
    c.id_doctor,
    c.id_recepcionista,
    c.id_estado,
    c.id_tipo_cita,
    c.fecha,
    c.hora,
    
    -- ⭐ MEDICIONES (LAS 3 QUE AGREGAMOS)
    c.monto_cita,           -- ← Desde Citas.monto_cita
    c.duracion_minutos,     -- ← Desde Citas.duracion_minutos
    c.dias_espera,          -- ← Desde Citas.dias_espera
    
    -- Datos relacionados
    d.id_especialidad,
    p.id_zona
    
FROM BDHOSPITALESSALUD.dbo.Citas c
INNER JOIN BDHOSPITALESSALUD.dbo.Doctores d ON c.id_doctor = d.id_doctor
INNER JOIN BDHOSPITALESSALUD.dbo.Pacientes p ON c.id_paciente = p.id_paciente;
```

### **Paso 2: Transformar datos**

```sql
-- Convertir IDs de la base transaccional a IDs del Data Mart
-- Calcular flags (fue_atendida, fue_confirmada, etc.)
-- Buscar FK correctas en las dimensiones
```

### **Paso 3: Cargar al Data Mart**

```sql
INSERT INTO DATAMART_HOSPITAL.dbo.HechosCitas (
    id_tiempo,
    id_paciente,
    id_doctor,
    id_especialidad,
    id_tipo_cita,
    id_estado,
    id_zona,
    id_recepcionista,
    numero_cita,
    hora_cita,
    
    -- ⭐ MEDICIONES
    monto_cita,          -- ← Aquí van las mediciones
    duracion_minutos,    -- ← Que extrajimos antes
    dias_espera,         -- ← De la base transaccional
    
    fue_atendida,
    fue_confirmada,
    paciente_asistio,
    es_primera_vez,
    es_control,
    fecha_registro_cita,
    fecha_atencion
)
SELECT 
    -- ... los valores transformados
FROM 
    -- ... la consulta de extracción
```

---

## 📊 EJEMPLO PRÁCTICO DE MAPEO

### **REGISTRO EN BASE TRANSACCIONAL:**

```sql
-- Tabla: BDHOSPITALESSALUD.dbo.Citas

id_cita: 1
id_paciente: 5
id_doctor: 2
id_tipo_cita: 2
id_estado: 3
fecha: 2025-10-28
hora: 10:00
monto_cita: 80.00          ← MEDICIÓN 1
duracion_minutos: 30       ← MEDICIÓN 2
dias_espera: 5             ← MEDICIÓN 3
```

### **SE TRANSFORMA Y CARGA EN DATA MART:**

```sql
-- Tabla: DATAMART_HOSPITAL.dbo.HechosCitas

id_hecho: (auto-generado)
id_tiempo: 1825              ← Busca en DimTiempo donde fecha='2025-10-28'
id_paciente: 45              ← Busca en DimPaciente donde codigo_paciente='5'
id_doctor: 12                ← Busca en DimDoctor donde codigo_doctor='2'
id_especialidad: 3           ← Desde el doctor
id_tipo_cita: 2              ← Busca en DimTipoCita
id_estado: 3                 ← Busca en DimEstadoCita
numero_cita: 'CITA-00001'
hora_cita: 10:00
monto_cita: 80.00            ← COPIADO DIRECTAMENTE
duracion_minutos: 30         ← COPIADO DIRECTAMENTE  
dias_espera: 5               ← COPIADO DIRECTAMENTE
fue_atendida: 1              ← Calculado (estado=3)
fue_confirmada: 1
paciente_asistio: 1
```

---

## 🎯 USO DE LAS MEDICIONES EN ANÁLISIS

### **1. Análisis de Ingresos (monto_cita)**

```sql
-- Ingresos totales por mes
SELECT 
    t.nombre_mes,
    SUM(h.monto_cita) AS IngresoTotal,
    AVG(h.monto_cita) AS IngresoPromedio,
    COUNT(*) AS TotalCitas
FROM HechosCitas h
INNER JOIN DimTiempo t ON h.id_tiempo = t.id_tiempo
WHERE t.anio = 2025
GROUP BY t.mes, t.nombre_mes
ORDER BY t.mes;
```

### **2. Análisis de Tiempos (duracion_minutos)**

```sql
-- Tiempo promedio de atención por especialidad
SELECT 
    e.nombre AS Especialidad,
    AVG(h.duracion_minutos) AS DuracionPromedio,
    SUM(h.duracion_minutos) / 60.0 AS HorasTotales,
    COUNT(*) AS CitasAtendidas
FROM HechosCitas h
INNER JOIN DimEspecialidad e ON h.id_especialidad = e.id_especialidad
WHERE h.fue_atendida = 1
GROUP BY e.nombre;
```

### **3. Análisis de Calidad (dias_espera)**

```sql
-- Tiempo de espera promedio por especialidad
SELECT 
    e.nombre AS Especialidad,
    AVG(h.dias_espera) AS EsperaPromedioDias,
    MIN(h.dias_espera) AS EsperaMinimaeDias,
    MAX(h.dias_espera) AS EsperaMaximaDias,
    CASE 
        WHEN AVG(h.dias_espera) <= 3 THEN 'Excelente'
        WHEN AVG(h.dias_espera) <= 7 THEN 'Bueno'
        ELSE 'Mejorable'
    END AS CalificacionServicio
FROM HechosCitas h
INNER JOIN DimEspecialidad e ON h.id_especialidad = e.id_especialidad
GROUP BY e.nombre
ORDER BY AVG(h.dias_espera);
```

---

## 🔄 FLUJO COMPLETO: TRANSACCIONAL → DATA MART → OLAP

```
┌───────────────────────────────────────────────────┐
│  BASE TRANSACCIONAL (BDHOSPITALESSALUD)           │
│                                                   │
│  Tabla: Citas                                     │
│  ├─ monto_cita        (S/. 80.00)                │
│  ├─ duracion_minutos  (30 min)                   │
│  └─ dias_espera       (5 días)                   │
└───────────────────────────────────────────────────┘
                        ↓
              ┌─────────────────┐
              │  PROCESO ETL    │
              │  (Extracción,   │
              │  Transformación,│
              │  Carga)         │
              └─────────────────┘
                        ↓
┌───────────────────────────────────────────────────┐
│  DATA MART (DATAMART_HOSPITAL)                    │
│                                                   │
│  Tabla: HechosCitas                               │
│  ├─ monto_cita        (S/. 80.00) ← COPIADO      │
│  ├─ duracion_minutos  (30 min)    ← COPIADO      │
│  └─ dias_espera       (5 días)    ← COPIADO      │
│                                                   │
│  + 8 Dimensiones (Tiempo, Paciente, Doctor, etc.)│
└───────────────────────────────────────────────────┘
                        ↓
┌───────────────────────────────────────────────────┐
│  CUBO OLAP                                        │
│                                                   │
│  MEDICIONES:                                      │
│  ├─ SUM(monto_cita)      → Ingresos Totales      │
│  ├─ AVG(monto_cita)      → Ticket Promedio       │
│  ├─ AVG(duracion_minutos)→ Tiempo Promedio       │
│  └─ AVG(dias_espera)     → Espera Promedio       │
│                                                   │
│  DIMENSIONES:                                     │
│  ├─ Por Tiempo (Año, Mes, Día)                   │
│  ├─ Por Especialidad                             │
│  ├─ Por Doctor                                    │
│  └─ Por Zona Geográfica                          │
└───────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE VALIDACIÓN

Antes de ejecutar el ETL, verificar:

- [x] ✅ **Base Transaccional:** Tabla `Citas` tiene las 3 mediciones
  - `monto_cita`
  - `duracion_minutos`
  - `dias_espera`

- [x] ✅ **Data Mart:** Tabla `HechosCitas` tiene campos para las 3 mediciones
  - `monto_cita`
  - `duracion_minutos`
  - `dias_espera`

- [x] ✅ **Dimensiones:** Todas las dimensiones están creadas y pobladas
  - `DimTiempo` ← Poblada con `sp_PoblarDimTiempo`
  - `DimPaciente` ← Por poblar con ETL
  - `DimDoctor` ← Por poblar con ETL
  - (etc.)

- [ ] ⏳ **ETL:** Proceso que copia datos de Transaccional a Data Mart
  - Por crear (siguiente paso)

---

## 📝 RESUMEN

```
MAPEO DE MEDICIONES:

Base Transaccional          →    Data Mart
═══════════════════              ══════════════════

Tabla: Citas                     Tabla: HechosCitas
├─ monto_cita        ──────────→ ├─ monto_cita
├─ duracion_minutos  ──────────→ ├─ duracion_minutos
└─ dias_espera       ──────────→ └─ dias_espera

TIPOS DE ANÁLISIS POSIBLES:
━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SUM(monto_cita)       → Ingresos totales
✅ AVG(monto_cita)       → Ticket promedio
✅ AVG(duracion_minutos) → Tiempo promedio de atención
✅ AVG(dias_espera)      → Tiempo de espera promedio
✅ COUNT(*)              → Total de citas

Por Dimensiones:
- Tiempo (mes, año, día)
- Especialidad
- Doctor
- Zona geográfica
- Tipo de cita
```

---

🎯 **Con este mapeo claro, el proceso ETL sabrá exactamente qué datos copiar y cómo transformarlos para el análisis en el Data Mart y Cubos OLAP.**















