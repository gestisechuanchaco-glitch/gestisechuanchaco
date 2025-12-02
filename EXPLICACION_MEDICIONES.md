# 📊 MEDICIONES EN LA TABLA CITAS

## 🎯 ¿QUÉ SON LAS MEDICIONES?

Las **mediciones** (también llamadas **métricas** o **hechos numéricos**) son valores numéricos que se pueden:

- ✅ **Sumar** (SUM) - Total de ingresos
- ✅ **Promediar** (AVG) - Monto promedio
- ✅ **Contar** (COUNT) - Cantidad de citas
- ✅ **Calcular mínimo/máximo** (MIN/MAX) - Valores extremos

Son **fundamentales** para:
1. **Data Mart** - Tabla de Hechos necesita mediciones
2. **Cubos OLAP** - Para análisis multidimensional
3. **Reportes** - KPIs y dashboards

---

## 📋 MEDICIONES AGREGADAS A LA TABLA CITAS

### **1. monto_cita** 💰

**Tipo:** `DECIMAL(10,2)`

**Descripción:** Precio que se cobra por la consulta

**Origen:** Se toma automáticamente del campo `precio` de la tabla `TiposCita`

**Ejemplos de análisis:**
```sql
-- Ingresos totales del mes
SELECT SUM(monto_cita) AS IngresosMensuales
FROM Citas
WHERE MONTH(fecha) = 10 AND YEAR(fecha) = 2025;

-- Precio promedio por especialidad
SELECT e.nombre, AVG(c.monto_cita) AS PrecioPromedio
FROM Citas c
INNER JOIN Doctores d ON c.id_doctor = d.id_doctor
INNER JOIN Especialidades e ON d.id_especialidad = e.id_especialidad
GROUP BY e.nombre;
```

**Uso en OLAP:**
- **SUM** → Ingresos totales
- **AVG** → Precio promedio
- **MIN/MAX** → Rango de precios

---

### **2. duracion_minutos** ⏱️

**Tipo:** `INT`

**Descripción:** Tiempo estimado que dura la consulta médica (en minutos)

**Valores típicos:**
- Consulta General: 20 minutos
- Consulta Especializada: 30 minutos
- Emergencia: 45 minutos
- Control: 15 minutos

**Ejemplos de análisis:**
```sql
-- Tiempo promedio de atención por doctor
SELECT 
    d.nombres + ' ' + d.apellidos AS Doctor,
    AVG(c.duracion_minutos) AS DuracionPromedio
FROM Citas c
INNER JOIN Doctores d ON c.id_doctor = d.id_doctor
WHERE c.id_estado = 3 -- Atendida
GROUP BY d.nombres, d.apellidos;

-- Total de horas trabajadas en el mes
SELECT SUM(duracion_minutos) / 60.0 AS HorasTotales
FROM Citas
WHERE MONTH(fecha) = 10 AND id_estado = 3;
```

**Uso en OLAP:**
- **SUM** → Total de minutos/horas de atención
- **AVG** → Duración promedio de consultas
- **Calcular productividad** → Citas/hora

---

### **3. dias_espera** 📅

**Tipo:** `INT`

**Descripción:** Cantidad de días que el paciente debe esperar desde que registra la cita hasta la fecha programada

**Cálculo:** `fecha_cita - fecha_registro`

**Ejemplos de análisis:**
```sql
-- Tiempo de espera promedio por especialidad
SELECT 
    e.nombre AS Especialidad,
    AVG(c.dias_espera) AS EsperaPromedioDias
FROM Citas c
INNER JOIN Doctores d ON c.id_doctor = d.id_doctor
INNER JOIN Especialidades e ON d.id_especialidad = e.id_especialidad
GROUP BY e.nombre;

-- Identificar especialidades con mayor demanda
SELECT 
    e.nombre,
    MAX(c.dias_espera) AS MaximaEspera
FROM Citas c
INNER JOIN Doctores d ON c.id_doctor = d.id_doctor
INNER JOIN Especialidades e ON d.id_especialidad = e.id_especialidad
GROUP BY e.nombre
ORDER BY MaximaEspera DESC;
```

**Uso en OLAP:**
- **AVG** → Tiempo de espera promedio
- **MAX** → Mayor tiempo de espera
- **Indicador de calidad de servicio**

---

## 🔄 CÁLCULO AUTOMÁTICO

El script incluye un **TRIGGER** que calcula automáticamente las mediciones:

```sql
CREATE TRIGGER trg_CalcularMedicionesCita
ON Citas
AFTER INSERT, UPDATE
AS
BEGIN
    -- Asigna monto según tipo de cita
    -- Calcula días de espera
    -- Asigna duración estimada
END;
```

**Ventaja:** No necesitas calcular manualmente, el sistema lo hace solo.

---

## 📊 ESTRUCTURA FINAL DE LA TABLA CITAS

```
Citas
├─ id_cita (PK)
├─ id_paciente (FK)
├─ id_doctor (FK)
├─ id_recepcionista (FK)
├─ id_estado (FK)
├─ id_tipo_cita (FK)
├─ fecha
├─ hora
├─ motivo
│
├─ 📊 MEDICIONES:
├─ monto_cita           ← NUEVA (precio)
├─ duracion_minutos     ← NUEVA (tiempo)
└─ dias_espera          ← NUEVA (eficiencia)
```

---

## 🎯 USO EN DATA MART Y CUBO OLAP

### **En el Data Mart (Tabla HechosCitas):**

Estas mediciones se copian a la tabla de hechos:

```sql
CREATE TABLE HechosCitas (
    id_hecho INT PRIMARY KEY IDENTITY,
    
    -- Dimensiones (FKs)
    id_tiempo INT,
    id_paciente INT,
    id_doctor INT,
    
    -- MEDICIONES (copiadas de Citas)
    monto_cita DECIMAL(10,2),        ← Desde Citas.monto_cita
    duracion_minutos INT,            ← Desde Citas.duracion_minutos
    dias_espera INT,                 ← Desde Citas.dias_espera
    
    -- Otras métricas
    ...
);
```

### **En Cubos OLAP:**

Las mediciones permiten análisis multidimensional:

```
CUBO: CitasHospital

MEDICIONES:
- SUM(monto_cita) → Ingresos
- AVG(monto_cita) → Precio Promedio
- COUNT(id_cita) → Total Citas
- AVG(duracion_minutos) → Tiempo Promedio
- AVG(dias_espera) → Espera Promedio

DIMENSIONES:
- Tiempo (Año, Mes, Día)
- Doctor
- Especialidad
- Tipo de Cita
- Zona Geográfica
```

**Ejemplo de consulta OLAP:**
```
"Mostrar el TOTAL DE INGRESOS (SUM monto_cita) 
 por ESPECIALIDAD y por MES del año 2025"

Resultado:
                Enero    Febrero   Marzo
Cardiología     S/.4,500  S/.5,200  S/.4,800
Pediatría       S/.3,200  S/.3,800  S/.4,100
Traumatología   S/.2,900  S/.3,100  S/.3,400
```

---

## 📈 EJEMPLOS DE KPIs CON LAS MEDICIONES

### **1. Ingresos Totales**
```sql
SELECT SUM(monto_cita) AS IngresosTotales
FROM Citas
WHERE YEAR(fecha) = 2025;
```

### **2. Ticket Promedio**
```sql
SELECT AVG(monto_cita) AS TicketPromedio
FROM Citas
WHERE id_estado = 3; -- Solo atendidas
```

### **3. Eficiencia Operativa**
```sql
SELECT 
    COUNT(*) AS TotalCitas,
    SUM(duracion_minutos) / 60.0 AS HorasTotales,
    COUNT(*) * 1.0 / (SUM(duracion_minutos) / 60.0) AS CitasPorHora
FROM Citas
WHERE id_estado = 3;
```

### **4. Calidad de Servicio**
```sql
SELECT 
    AVG(dias_espera) AS EsperaPromedio,
    CASE 
        WHEN AVG(dias_espera) <= 3 THEN 'Excelente'
        WHEN AVG(dias_espera) <= 7 THEN 'Bueno'
        WHEN AVG(dias_espera) <= 15 THEN 'Regular'
        ELSE 'Deficiente'
    END AS Calificacion
FROM Citas;
```

### **5. Productividad por Doctor**
```sql
SELECT 
    d.nombres + ' ' + d.apellidos AS Doctor,
    COUNT(*) AS CitasAtendidas,
    SUM(c.monto_cita) AS IngresoGenerado,
    AVG(c.duracion_minutos) AS TiempoPromedio
FROM Citas c
INNER JOIN Doctores d ON c.id_doctor = d.id_doctor
WHERE c.id_estado = 3
GROUP BY d.nombres, d.apellidos
ORDER BY IngresoGenerado DESC;
```

---

## ✅ RESTRICCIONES DE INTEGRIDAD

Para garantizar datos válidos:

```sql
-- El monto no puede ser negativo
CHECK (monto_cita >= 0)

-- La duración debe estar entre 0 y 480 minutos (8 horas)
CHECK (duracion_minutos >= 0 AND duracion_minutos <= 480)

-- Los días de espera no pueden ser negativos
CHECK (dias_espera >= 0)
```

---

## 🎓 PARA TU PRESENTACIÓN

### **Puntos clave:**

1. **¿Por qué se agregan mediciones?**
   - Son necesarias para el Data Mart
   - Permiten análisis cuantitativo
   - Base de los cubos OLAP

2. **¿Qué mediciones se agregaron?**
   - `monto_cita`: Para análisis financiero
   - `duracion_minutos`: Para análisis de tiempos
   - `dias_espera`: Para análisis de calidad

3. **¿Cómo se calculan?**
   - Automáticamente con triggers
   - Basadas en el tipo de cita
   - Sin intervención manual

4. **¿Para qué sirven?**
   - Calcular ingresos totales
   - Medir productividad
   - Evaluar calidad de servicio
   - Generar reportes ejecutivos

---

## 🔍 VISTA DE VERIFICACIÓN

El script incluye una vista para verificar las mediciones:

```sql
SELECT * FROM VistaCitasConMediciones;
```

**Muestra:**
- Datos de la cita
- Las 3 mediciones
- Campos calculados adicionales
- Fácil de usar en reportes

---

## 📝 RESUMEN

```
TABLA CITAS - MEDICIONES AGREGADAS

┌─────────────────────┬──────────┬────────────────────────┐
│ Campo               │ Tipo     │ Uso en OLAP            │
├─────────────────────┼──────────┼────────────────────────┤
│ monto_cita          │ DECIMAL  │ SUM, AVG (Ingresos)    │
│ duracion_minutos    │ INT      │ SUM, AVG (Tiempos)     │
│ dias_espera         │ INT      │ AVG, MAX (Calidad)     │
└─────────────────────┴──────────┴────────────────────────┘

CARACTERÍSTICAS:
✅ Cálculo automático con triggers
✅ Restricciones de integridad
✅ Vista de verificación incluida
✅ Listas para Data Mart y OLAP
```

---

🎯 **Con estas mediciones, tu base de datos está lista para análisis avanzados en Data Mart y Cubos OLAP.**















