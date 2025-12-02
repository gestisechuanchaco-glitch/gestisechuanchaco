# 📊 DATA MART - ESQUEMA EN ESTRELLA

## 🎯 ¿QUÉ ES UN DATA MART EN ESTRELLA?

Un **Data Mart** es una base de datos diseñada específicamente para **análisis y reportes**, no para operaciones diarias.

El **Esquema en Estrella** organiza los datos en:
- **1 Tabla Central (HECHOS)**: Contiene las métricas/mediciones
- **Múltiples Tablas alrededor (DIMENSIONES)**: Contienen los atributos descriptivos

```
        DimPaciente
              ↓
   DimDoctor → [HECHOS CITAS] ← DimTiempo
              ↓
        DimEspecialidad
              ↓
         DimTipoCita
```

---

## ⭐ ESTRUCTURA DEL DATA MART

### **TABLA DE HECHOS: HechosCitas**
Es el **centro de la estrella**, contiene:

#### **Foreign Keys (Puntas hacia dimensiones):**
- `id_tiempo` → DimTiempo
- `id_paciente` → DimPaciente  
- `id_doctor` → DimDoctor
- `id_especialidad` → DimEspecialidad
- `id_tipo_cita` → DimTipoCita
- `id_estado` → DimEstadoCita
- `id_zona` → DimZona
- `id_recepcionista` → DimRecepcionista

#### **Métricas (Lo que se mide):**
- `monto_cita`: Cuánto costó la cita
- `duracion_minutos`: Cuánto duró
- `dias_anticipacion`: Con cuántos días se agendó
- `tiempo_espera_dias`: Cuánto esperó el paciente

#### **Flags (Indicadores Sí/No):**
- `fue_atendida`: ¿Se atendió? (1=Sí, 0=No)
- `fue_confirmada`: ¿Se confirmó? (1=Sí, 0=No)
- `paciente_asistio`: ¿Asistió el paciente? (1=Sí, 0=No)
- `es_primera_vez`: ¿Primera cita del paciente?
- `es_control`: ¿Es una cita de control?

---

## 📊 DIMENSIONES (Puntas de la Estrella)

### **1. DimTiempo** 📅
**Propósito:** Análisis temporal (por día, mes, trimestre, año)

**Campos clave:**
```
- fecha: 2025-10-28
- anio: 2025
- mes: 10
- nombre_mes: "Octubre"
- trimestre: 4
- dia_semana: 3 (Martes)
- nombre_dia_semana: "Martes"
- es_fin_semana: 0 (No)
- es_feriado: 0 (No)
```

**Utilidad:**
- Ver citas por mes/año
- Identificar días con más demanda
- Análisis de tendencias temporales

---

### **2. DimPaciente** 👤
**Propósito:** Información de los pacientes

**Campos clave:**
```
- codigo_paciente: "PAC001"
- nombre_completo: "María González Ruiz"
- sexo: "F"
- edad: 40
- rango_edad: "31-50"
- zona: "Trujillo Centro"
- distrito: "Trujillo"
```

**Utilidad:**
- Análisis por edad (¿qué grupo etario demanda más?)
- Análisis por sexo
- Análisis geográfico por distrito

---

### **3. DimDoctor** 👨‍⚕️
**Propósito:** Información de los doctores

**Campos clave:**
```
- codigo_doctor: "DOC001"
- nombre_completo: "Dr. Juan Carlos Pérez López"
- num_colegiatura: "CMP 45678"
- especialidad: "Cardiología"
- anios_experiencia: 15
```

**Utilidad:**
- Top doctores más solicitados
- Rendimiento por doctor
- Ingresos generados por doctor

---

### **4. DimEspecialidad** 🏥
**Propósito:** Clasificación de especialidades médicas

**Campos clave:**
```
- codigo_especialidad: "ESP001"
- nombre: "Cardiología"
- descripcion: "Enfermedades del corazón"
- categoria: "Médica"
```

**Utilidad:**
- Especialidades más demandadas
- Ingresos por especialidad
- Identificar necesidad de más doctores

---

### **5. DimTipoCita** 📋
**Propósito:** Tipos de consultas

**Campos clave:**
```
- codigo_tipo_cita: "TC001"
- descripcion: "Consulta General"
- categoria: "Programada"
- precio_base: 50.00
```

**Utilidad:**
- Qué tipo de citas se solicitan más
- Ingresos por tipo de cita
- Precio promedio de atenciones

---

### **6. DimEstadoCita** ✅
**Propósito:** Estados de las citas

**Campos clave:**
```
- codigo_estado: "EST003"
- descripcion: "Atendida"
- es_exitosa: 1 (Sí)
- categoria: "Completada"
```

**Utilidad:**
- Tasa de asistencia vs inasistencia
- Citas canceladas
- Eficiencia del proceso

---

### **7. DimZona** 📍
**Propósito:** Ubicación geográfica de pacientes

**Campos clave:**
```
- codigo_zona: "ZON001"
- nombre_zona: "Trujillo Centro"
- distrito: "Trujillo"
- provincia: "Trujillo"
- departamento: "La Libertad"
- poblacion_estimada: 50000
```

**Utilidad:**
- Cobertura geográfica
- Zonas más atendidas
- Identificar áreas desatendidas

---

### **8. DimRecepcionista** 🧑‍💼
**Propósito:** Personal que registra citas

**Campos clave:**
```
- codigo_recepcionista: "REC001"
- nombre_completo: "Ana Torres Vega"
- turno: "Mañana"
```

**Utilidad:**
- Productividad por recepcionista
- Citas registradas por turno
- Evaluación de desempeño

---

## 📈 CONSULTAS DE ANÁLISIS

### **1. ¿Cuántas citas hubo por especialidad este mes?**

```sql
SELECT 
    e.nombre AS Especialidad,
    COUNT(h.id_hecho) AS TotalCitas,
    SUM(h.monto_cita) AS IngresoTotal
FROM HechosCitas h
INNER JOIN DimEspecialidad e ON h.id_especialidad = e.id_especialidad
INNER JOIN DimTiempo t ON h.id_tiempo = t.id_tiempo
WHERE t.anio = 2025 AND t.mes = 10
GROUP BY e.nombre
ORDER BY TotalCitas DESC;
```

**Resultado:**
```
Especialidad    | TotalCitas | IngresoTotal
----------------|------------|-------------
Cardiología     | 52         | S/. 4,160
Pediatría       | 78         | S/. 3,900
Traumatología   | 45         | S/. 3,600
```

---

### **2. ¿Qué doctores generan más ingresos?**

```sql
SELECT 
    d.nombre_completo AS Doctor,
    d.especialidad AS Especialidad,
    COUNT(h.id_hecho) AS TotalCitas,
    SUM(h.monto_cita) AS IngresoGenerado
FROM HechosCitas h
INNER JOIN DimDoctor d ON h.id_doctor = d.id_doctor
WHERE h.fue_atendida = 1
GROUP BY d.nombre_completo, d.especialidad
ORDER BY IngresoGenerado DESC;
```

---

### **3. ¿Cuál es la tasa de asistencia por zona?**

```sql
SELECT 
    z.nombre_zona AS Zona,
    COUNT(h.id_hecho) AS CitasProgramadas,
    SUM(CASE WHEN h.paciente_asistio = 1 THEN 1 ELSE 0 END) AS Asistencias,
    SUM(CASE WHEN h.paciente_asistio = 0 THEN 1 ELSE 0 END) AS Inasistencias,
    CAST(SUM(CASE WHEN h.paciente_asistio = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(h.id_hecho) AS DECIMAL(5,2)) AS TasaAsistencia
FROM HechosCitas h
INNER JOIN DimZona z ON h.id_zona = z.id_zona
GROUP BY z.nombre_zona;
```

**Resultado:**
```
Zona            | CitasProgramadas | Asistencias | TasaAsistencia
----------------|------------------|-------------|---------------
Trujillo Centro | 125              | 112         | 89.60%
Huanchaco       | 68               | 58          | 85.29%
El Porvenir     | 52               | 42          | 80.77%
```

---

### **4. ¿Qué días de la semana hay más citas?**

```sql
SELECT 
    t.nombre_dia_semana AS DiaSemana,
    COUNT(h.id_hecho) AS TotalCitas,
    AVG(h.monto_cita) AS MontoPromedio
FROM HechosCitas h
INNER JOIN DimTiempo t ON h.id_tiempo = t.id_tiempo
GROUP BY t.nombre_dia_semana, t.dia_semana
ORDER BY t.dia_semana;
```

---

### **5. ¿Cuánto tiempo esperan los pacientes para su cita?**

```sql
SELECT 
    AVG(h.tiempo_espera_dias) AS EsperaPromedioDias,
    MIN(h.tiempo_espera_dias) AS EsperaMinimaeDias,
    MAX(h.tiempo_espera_dias) AS EsperaMaximaDias
FROM HechosCitas h
WHERE h.fue_atendida = 1;
```

---

### **6. ¿Citas por rango de edad del paciente?**

```sql
SELECT 
    p.rango_edad AS RangoEdad,
    COUNT(h.id_hecho) AS TotalCitas,
    SUM(h.monto_cita) AS IngresoTotal
FROM HechosCitas h
INNER JOIN DimPaciente p ON h.id_paciente = p.id_paciente
GROUP BY p.rango_edad
ORDER BY 
    CASE p.rango_edad
        WHEN '0-17' THEN 1
        WHEN '18-30' THEN 2
        WHEN '31-50' THEN 3
        WHEN '51-70' THEN 4
        WHEN '71+' THEN 5
    END;
```

**Resultado:**
```
RangoEdad | TotalCitas | IngresoTotal
----------|------------|-------------
0-17      | 78         | S/. 3,900
18-30     | 45         | S/. 3,600
31-50     | 62         | S/. 4,960
51-70     | 38         | S/. 3,040
71+       | 22         | S/. 1,760
```

---

### **7. ¿Cuál es la tendencia mensual de citas?**

```sql
SELECT 
    t.anio AS Año,
    t.mes AS Mes,
    t.nombre_mes AS NombreMes,
    COUNT(h.id_hecho) AS TotalCitas,
    SUM(h.monto_cita) AS IngresoTotal,
    SUM(CASE WHEN h.fue_atendida = 1 THEN 1 ELSE 0 END) AS CitasAtendidas,
    CAST(SUM(CASE WHEN h.fue_atendida = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(h.id_hecho) AS DECIMAL(5,2)) AS PorcentajeEfectividad
FROM HechosCitas h
INNER JOIN DimTiempo t ON h.id_tiempo = t.id_tiempo
GROUP BY t.anio, t.mes, t.nombre_mes
ORDER BY t.anio, t.mes;
```

---

## 🔄 DIFERENCIAS: BASE TRANSACCIONAL vs DATA MART

### **BASE DE DATOS TRANSACCIONAL (Operaciones diarias):**
- ✅ Para registrar citas día a día
- ✅ Múltiples tablas normalizadas (14 tablas)
- ✅ Muchas relaciones FK
- ❌ Consultas de análisis son lentas
- ❌ No optimizada para reportes

### **DATA MART (Análisis y reportes):**
- ✅ Para generar reportes y estadísticas
- ✅ Esquema en estrella (1 tabla de hechos + dimensiones)
- ✅ Consultas rápidas
- ✅ Optimizado para análisis
- ❌ No para operaciones diarias

---

## 🔄 PROCESO ETL (Extracción, Transformación, Carga)

```
[BASE TRANSACCIONAL]
       ↓
   EXTRACCIÓN (Extraer datos)
       ↓
   TRANSFORMACIÓN (Limpiar, calcular)
       ↓
   CARGA (Cargar al Data Mart)
       ↓
   [DATA MART]
       ↓
   ANÁLISIS Y REPORTES
```

### **Ejemplo de transformación:**

**Tabla Transaccional (Pacientes):**
```
nombres: "María"
apellidos: "González Ruiz"
fecha_nacimiento: "1985-03-15"
```

**Dimensión (DimPaciente):**
```
nombre_completo: "María González Ruiz"  ← TRANSFORMADO
edad: 40                                ← CALCULADO
rango_edad: "31-50"                     ← CALCULADO
```

---

## 📊 VISTAS CREADAS (Reportes Rápidos)

El script incluye **4 vistas** para análisis rápido:

### **1. VistaResumenEspecialidad**
```sql
SELECT * FROM VistaResumenEspecialidad;
```
Muestra totales por especialidad.

### **2. VistaResumenMensual**
```sql
SELECT * FROM VistaResumenMensual;
```
Muestra resumen mes a mes.

### **3. VistaTopDoctores**
```sql
SELECT * FROM VistaTopDoctores;
```
Ranking de doctores por desempeño.

### **4. VistaAnalisisZonas**
```sql
SELECT * FROM VistaAnalisisZonas;
```
Análisis geográfico de pacientes.

---

## 🎯 MÉTRICAS CLAVE (KPIs)

### **1. Tasa de Asistencia**
```
(Citas Atendidas / Total Citas) × 100
```

### **2. Ingreso Promedio por Cita**
```
Total Ingresos / Número de Citas
```

### **3. Tiempo de Espera Promedio**
```
Promedio(dias_anticipacion)
```

### **4. Productividad del Doctor**
```
Citas Atendidas / Días Trabajados
```

### **5. Tasa de Cancelación**
```
(Citas Canceladas / Total Citas) × 100
```

---

## 💡 VENTAJAS DEL ESQUEMA EN ESTRELLA

✅ **Consultas rápidas**: Las dimensiones están desnormalizadas  
✅ **Fácil de entender**: Estructura simple e intuitiva  
✅ **Optimizado para BI**: Herramientas como Power BI lo reconocen  
✅ **Escalable**: Fácil agregar nuevas dimensiones  
✅ **Rendimiento**: Índices optimizados para análisis  

---

## 🎓 PARA LA PRESENTACIÓN

### **Puntos clave:**

1. **¿Por qué un Data Mart?**
   - La base transaccional es para operaciones
   - El Data Mart es para análisis y toma de decisiones

2. **¿Por qué esquema en estrella?**
   - Más rápido que consultar 14 tablas normalizadas
   - Estructura clara: 1 tabla central + dimensiones alrededor

3. **¿Qué se puede analizar?**
   - Tendencias temporales (mes a mes)
   - Rendimiento de doctores
   - Especialidades más demandadas
   - Zonas geográficas atendidas
   - Tasa de asistencia/cancelación

4. **¿Cómo se alimenta?**
   - Proceso ETL nocturno
   - Extrae datos de la base transaccional
   - Los transforma y carga al Data Mart
   - Listo para reportes del día siguiente

---

## 📝 RESUMEN

```
⭐ TABLA DE HECHOS:
   - HechosCitas (registros de cada cita con métricas)

📊 DIMENSIONES (8):
   1. DimTiempo (calendario)
   2. DimPaciente (quién)
   3. DimDoctor (con quién)
   4. DimEspecialidad (qué área)
   5. DimTipoCita (qué tipo)
   6. DimEstadoCita (qué pasó)
   7. DimZona (dónde)
   8. DimRecepcionista (quién registró)

📈 ANÁLISIS POSIBLES:
   - Por tiempo (día, mes, año)
   - Por especialidad
   - Por doctor
   - Por zona geográfica
   - Por tipo de cita
   - Por rango de edad
   - Tendencias y proyecciones
```

---

🎯 **Este Data Mart permite al hospital tomar decisiones basadas en datos reales** sobre contratación de personal, horarios, especialidades necesarias, y mejora continua del servicio.















