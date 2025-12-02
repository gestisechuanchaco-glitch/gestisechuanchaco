# 📋 INSTRUCCIONES - DATA MART HOSPITAL

## 🎯 CONTENIDO DEL SCRIPT

El archivo `DATAMART_ESTRELLA_HOSPITAL.sql` contiene:

1. ✅ **Estructura completa** de todas las tablas (sin datos)
2. ✅ **Procedimiento automático** para generar DimTiempo
3. ✅ **Funciones de feriados** para Perú
4. ✅ **Vistas de análisis** predefinidas
5. ✅ **Índices optimizados** para consultas rápidas

---

## 📝 ORDEN DE EJECUCIÓN

### **PASO 1: Ejecutar el script completo**

```sql
-- Ejecutar todo el archivo DATAMART_ESTRELLA_HOSPITAL.sql
-- Esto creará:
-- - Base de datos DATAMART_HOSPITAL
-- - 8 Dimensiones (vacías)
-- - 2 Tablas de Hechos (vacías)
-- - Procedimientos y funciones
-- - Vistas de análisis
```

### **PASO 2: Poblar la Dimensión Tiempo**

Una vez ejecutado el script, poblar DimTiempo:

```sql
USE DATAMART_HOSPITAL;
GO

-- Generar fechas desde 2020 hasta 2030 (11 años)
EXEC sp_PoblarDimTiempo @anio_inicio = 2020, @anio_fin = 2030;
GO
```

**Resultado esperado:**
```
📅 Generando tabla DimTiempo desde 2020 hasta 2030
✅ DimTiempo poblada con 4018 registros
```

### **PASO 3: Verificar DimTiempo**

```sql
-- Ver algunos registros
SELECT TOP 10 * FROM DimTiempo ORDER BY fecha;

-- Contar registros totales
SELECT COUNT(*) AS TotalFechas FROM DimTiempo;

-- Ver feriados del 2025
SELECT fecha, nombre_dia_semana, nombre_feriado
FROM DimTiempo
WHERE anio = 2025 AND es_feriado = 1;
```

### **PASO 4: Poblar las demás dimensiones y hechos vía ETL**

Las siguientes tablas se llenarán con el proceso ETL:
- `DimPaciente`
- `DimDoctor`
- `DimEspecialidad`
- `DimTipoCita`
- `DimEstadoCita`
- `DimZona`
- `DimRecepcionista`
- `HechosCitas`
- `HechosAtenciones`

---

## 🗓️ PROCEDIMIENTO sp_PoblarDimTiempo

### **¿Qué hace?**

Genera automáticamente **todos los días** desde un año inicial hasta un año final, con:

✅ Fecha completa  
✅ Año, mes, día  
✅ Nombre del mes en español  
✅ Trimestre  
✅ Día de la semana (1-7)  
✅ Nombre del día en español  
✅ Si es fin de semana  
✅ Si es feriado (según calendario peruano)  
✅ Nombre del feriado  

### **Parámetros:**

```sql
@anio_inicio INT   -- Año desde donde comenzar (default: 2020)
@anio_fin INT      -- Año donde terminar (default: 2030)
```

### **Ejemplos de uso:**

```sql
-- Solo año 2025
EXEC sp_PoblarDimTiempo @anio_inicio = 2025, @anio_fin = 2025;

-- Últimos 5 años
EXEC sp_PoblarDimTiempo @anio_inicio = 2020, @anio_fin = 2024;

-- Próximos 10 años
EXEC sp_PoblarDimTiempo @anio_inicio = 2025, @anio_fin = 2035;

-- Rango amplio (recomendado)
EXEC sp_PoblarDimTiempo @anio_inicio = 2020, @anio_fin = 2030;
```

---

## 🎉 FERIADOS EN PERÚ (Automáticos)

El script incluye **funciones** que detectan automáticamente los feriados peruanos:

### **Feriados incluidos:**

| Fecha | Feriado |
|-------|---------|
| 1 de Enero | Año Nuevo |
| 1 de Mayo | Día del Trabajo |
| 29 de Junio | San Pedro y San Pablo |
| 28 de Julio | Fiestas Patrias |
| 29 de Julio | Fiestas Patrias |
| 30 de Agosto | Santa Rosa de Lima |
| 8 de Octubre | Combate de Angamos |
| 1 de Noviembre | Todos los Santos |
| 8 de Diciembre | Inmaculada Concepción |
| 25 de Diciembre | Navidad |

### **Funciones disponibles:**

```sql
-- Verificar si una fecha es feriado
SELECT dbo.fn_EsFeriado('2025-07-28');  -- Retorna: 1 (Sí)
SELECT dbo.fn_EsFeriado('2025-10-25');  -- Retorna: 0 (No)

-- Obtener nombre del feriado
SELECT dbo.fn_NombreFeriado('2025-07-28');  -- Retorna: 'Fiestas Patrias'
SELECT dbo.fn_NombreFeriado('2025-12-25');  -- Retorna: 'Navidad'
```

---

## 📊 CONSULTAS ÚTILES PARA VERIFICAR

### **1. Ver estructura de DimTiempo**

```sql
SELECT 
    fecha,
    nombre_dia_semana,
    dia,
    nombre_mes,
    anio,
    trimestre,
    es_fin_semana,
    es_feriado,
    nombre_feriado
FROM DimTiempo
WHERE anio = 2025 AND mes = 10
ORDER BY fecha;
```

### **2. Contar días por tipo**

```sql
SELECT 
    'Días Totales' AS Tipo,
    COUNT(*) AS Cantidad
FROM DimTiempo
WHERE anio = 2025

UNION ALL

SELECT 
    'Fines de Semana' AS Tipo,
    COUNT(*) AS Cantidad
FROM DimTiempo
WHERE anio = 2025 AND es_fin_semana = 1

UNION ALL

SELECT 
    'Feriados' AS Tipo,
    COUNT(*) AS Cantidad
FROM DimTiempo
WHERE anio = 2025 AND es_feriado = 1

UNION ALL

SELECT 
    'Días Laborables' AS Tipo,
    COUNT(*) AS Cantidad
FROM DimTiempo
WHERE anio = 2025 
  AND es_fin_semana = 0 
  AND es_feriado = 0;
```

**Resultado esperado (2025):**
```
Tipo                | Cantidad
--------------------|----------
Días Totales        | 365
Fines de Semana     | 104
Feriados            | 10
Días Laborables     | 251
```

### **3. Ver todos los feriados de un año**

```sql
SELECT 
    fecha,
    nombre_dia_semana,
    nombre_feriado
FROM DimTiempo
WHERE anio = 2025 
  AND es_feriado = 1
ORDER BY fecha;
```

---

## 🔄 REPOBLAR DimTiempo (Si es necesario)

Si necesitas cambiar el rango de años o corregir algo:

```sql
-- El procedimiento limpia automáticamente la tabla antes de repoblar
EXEC sp_PoblarDimTiempo @anio_inicio = 2018, @anio_fin = 2028;
```

**NOTA:** Usa `TRUNCATE TABLE DimTiempo` internamente, así que no hay datos duplicados.

---

## 📈 VENTAJAS DE ESTE ENFOQUE

### ✅ **Automatizado**
- No necesitas insertar 4,000+ fechas manualmente
- Un solo comando genera todos los días

### ✅ **Feriados incluidos**
- Detecta automáticamente feriados peruanos
- Útil para análisis de días laborables vs feriados

### ✅ **Completo**
- Incluye día de la semana en español
- Incluye nombre del mes en español
- Incluye trimestre
- Incluye marcadores de fin de semana

### ✅ **Flexible**
- Puedes generar cualquier rango de años
- Fácil de repoblar si necesitas cambiar

---

## 🎯 SIGUIENTE PASO: ETL

Una vez que DimTiempo está poblada, el siguiente paso es crear el proceso **ETL** para:

1. **Extraer** datos de la base transaccional (`BDHOSPITALESSALUD`)
2. **Transformar** los datos (calcular edad, rangos, etc.)
3. **Cargar** al Data Mart (`DATAMART_HOSPITAL`)

### **Ejemplo de ETL para DimPaciente:**

```sql
-- ETL: Cargar DimPaciente desde base transaccional
INSERT INTO DATAMART_HOSPITAL.dbo.DimPaciente (
    codigo_paciente,
    nombres,
    apellidos,
    nombre_completo,
    sexo,
    edad,
    rango_edad,
    documento_identidad,
    zona,
    distrito,
    provincia,
    departamento
)
SELECT 
    CAST(p.id_paciente AS NVARCHAR(20)) AS codigo_paciente,
    p.nombres,
    p.apellidos,
    p.nombres + ' ' + p.apellidos AS nombre_completo,
    p.sexo,
    DATEDIFF(YEAR, p.fecha_nacimiento, GETDATE()) AS edad,
    CASE 
        WHEN DATEDIFF(YEAR, p.fecha_nacimiento, GETDATE()) < 18 THEN '0-17'
        WHEN DATEDIFF(YEAR, p.fecha_nacimiento, GETDATE()) BETWEEN 18 AND 30 THEN '18-30'
        WHEN DATEDIFF(YEAR, p.fecha_nacimiento, GETDATE()) BETWEEN 31 AND 50 THEN '31-50'
        WHEN DATEDIFF(YEAR, p.fecha_nacimiento, GETDATE()) BETWEEN 51 AND 70 THEN '51-70'
        ELSE '71+'
    END AS rango_edad,
    p.documento_identidad,
    z.descripcion AS zona,
    'Trujillo' AS distrito,
    'Trujillo' AS provincia,
    'La Libertad' AS departamento
FROM BDHOSPITALESSALUD.dbo.Pacientes p
LEFT JOIN BDHOSPITALESSALUD.dbo.Zonas z ON p.id_zona = z.id_zona;
```

---

## 📝 RESUMEN RÁPIDO

### **Para crear el Data Mart:**

```sql
-- 1. Ejecutar script completo
-- (Abrir y ejecutar DATAMART_ESTRELLA_HOSPITAL.sql)

-- 2. Poblar DimTiempo
USE DATAMART_HOSPITAL;
EXEC sp_PoblarDimTiempo @anio_inicio = 2020, @anio_fin = 2030;

-- 3. Verificar
SELECT COUNT(*) FROM DimTiempo;

-- 4. Continuar con ETL para las demás dimensiones
-- (Se hará en otro script ETL)
```

---

## ❓ PREGUNTAS FRECUENTES

### **¿Por qué generar DimTiempo automáticamente?**
Porque contiene miles de registros. Generarlos manualmente sería tedioso y propenso a errores.

### **¿Puedo agregar más feriados?**
Sí, edita la función `fn_EsFeriado` y `fn_NombreFeriado` para incluir feriados regionales.

### **¿Qué pasa si ejecuto el procedimiento dos veces?**
No hay problema. El procedimiento hace `TRUNCATE TABLE` antes de insertar, así que reemplaza todo.

### **¿Cuánto espacio ocupa DimTiempo?**
Para 11 años (2020-2030): ~4,018 registros ≈ 500 KB (muy poco espacio).

---

## 🎓 PARA TU PRESENTACIÓN

**Puntos clave:**

1. ✅ **Data Mart listo para análisis** - Estructura completa sin datos (se llenarán con ETL)
2. ✅ **DimTiempo automática** - Procedimiento genera 11 años en segundos
3. ✅ **Feriados incluidos** - Detecta automáticamente feriados peruanos
4. ✅ **Vistas predefinidas** - 4 vistas listas para reportes
5. ✅ **Optimizado** - Índices creados para consultas rápidas

---

🎯 **Tu Data Mart está listo para recibir datos del proceso ETL.**















