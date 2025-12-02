-- =====================================================
-- DATA MART - ESQUEMA EN ESTRELLA
-- Sistema de Gestión de Citas Hospitalarias
-- =====================================================
-- 
-- ESTRUCTURA:
-- - Tabla de HECHOS: HechosCitas (centro de la estrella)
-- - Tablas de DIMENSIONES: Dim* (puntas de la estrella)
--
-- NOTA: Este script solo crea la estructura.
--       Los datos se cargarán mediante proceso ETL.
-- =====================================================

-- 🔹 Crear base de datos para Data Mart
CREATE DATABASE DATAMART_HOSPITAL;
GO
USE DATAMART_HOSPITAL;
GO

PRINT '🏗️ Creando estructura del Data Mart...';
GO

-- =====================================================
-- 📊 TABLAS DE DIMENSIONES
-- =====================================================

-- 1. DIMENSIÓN TIEMPO (Calendario)
CREATE TABLE DimTiempo (
    id_tiempo INT PRIMARY KEY IDENTITY,
    fecha DATE NOT NULL UNIQUE,
    anio INT NOT NULL,
    mes INT NOT NULL,
    nombre_mes NVARCHAR(20),
    trimestre INT,
    dia INT NOT NULL,
    dia_semana INT,                    -- 1=Domingo, 7=Sábado
    nombre_dia_semana NVARCHAR(20),
    es_fin_semana BIT,
    es_feriado BIT,
    nombre_feriado NVARCHAR(100)
);

-- 2. DIMENSIÓN PACIENTE
CREATE TABLE DimPaciente (
    id_paciente INT PRIMARY KEY IDENTITY,
    codigo_paciente NVARCHAR(20) UNIQUE,  -- ID del sistema transaccional
    nombres NVARCHAR(100),
    apellidos NVARCHAR(100),
    nombre_completo NVARCHAR(200),
    sexo CHAR(1),
    edad INT,                              -- Calculada al momento de la carga
    rango_edad NVARCHAR(20),               -- '0-17', '18-30', '31-50', '51-70', '71+'
    documento_identidad NVARCHAR(20),
    zona NVARCHAR(100),
    distrito NVARCHAR(100),
    provincia NVARCHAR(100),
    departamento NVARCHAR(100)
);

-- 3. DIMENSIÓN DOCTOR
CREATE TABLE DimDoctor (
    id_doctor INT PRIMARY KEY IDENTITY,
    codigo_doctor NVARCHAR(20) UNIQUE,     -- ID del sistema transaccional
    nombres NVARCHAR(100),
    apellidos NVARCHAR(100),
    nombre_completo NVARCHAR(200),
    num_colegiatura NVARCHAR(50),
    especialidad NVARCHAR(100),
    anios_experiencia INT
);

-- 4. DIMENSIÓN ESPECIALIDAD
CREATE TABLE DimEspecialidad (
    id_especialidad INT PRIMARY KEY IDENTITY,
    codigo_especialidad NVARCHAR(20) UNIQUE,
    nombre NVARCHAR(100),
    descripcion NVARCHAR(255),
    categoria NVARCHAR(50)                 -- 'Médica', 'Quirúrgica', 'Diagnóstica'
);

-- 5. DIMENSIÓN TIPO DE CITA
CREATE TABLE DimTipoCita (
    id_tipo_cita INT PRIMARY KEY IDENTITY,
    codigo_tipo_cita NVARCHAR(20) UNIQUE,
    descripcion NVARCHAR(100),
    categoria NVARCHAR(50),                -- 'Programada', 'Urgente', 'Control'
    precio_base DECIMAL(10,2)
);

-- 6. DIMENSIÓN ESTADO DE CITA
CREATE TABLE DimEstadoCita (
    id_estado INT PRIMARY KEY IDENTITY,
    codigo_estado NVARCHAR(20) UNIQUE,
    descripcion NVARCHAR(50),
    es_exitosa BIT,                        -- 1=Atendida, 0=Cancelada/No asistió
    categoria NVARCHAR(50)                 -- 'Completada', 'Pendiente', 'Fallida'
);

-- 7. DIMENSIÓN ZONA GEOGRÁFICA
CREATE TABLE DimZona (
    id_zona INT PRIMARY KEY IDENTITY,
    codigo_zona NVARCHAR(20) UNIQUE,
    nombre_zona NVARCHAR(100),
    distrito NVARCHAR(100),
    provincia NVARCHAR(100),
    departamento NVARCHAR(100),
    poblacion_estimada INT,
    estado NVARCHAR(50)
);

-- 8. DIMENSIÓN RECEPCIONISTA
CREATE TABLE DimRecepcionista (
    id_recepcionista INT PRIMARY KEY IDENTITY,
    codigo_recepcionista NVARCHAR(20) UNIQUE,
    nombres NVARCHAR(100),
    apellidos NVARCHAR(100),
    nombre_completo NVARCHAR(200),
    turno NVARCHAR(50)                     -- 'Mañana', 'Tarde', 'Noche'
);

-- =====================================================
-- ⭐ TABLA DE HECHOS (CENTRO DE LA ESTRELLA)
-- =====================================================

CREATE TABLE HechosCitas (
    -- Surrogate Key (Primary Key)
    id_hecho INT PRIMARY KEY IDENTITY,
    
    -- Foreign Keys hacia Dimensiones (Puntas de la Estrella)
    id_tiempo INT NOT NULL,
    id_paciente INT NOT NULL,
    id_doctor INT NOT NULL,
    id_especialidad INT NOT NULL,
    id_tipo_cita INT NOT NULL,
    id_estado INT NOT NULL,
    id_zona INT,
    id_recepcionista INT,
    
    -- Degenerate Dimensions (Datos que no justifican su propia dimensión)
    numero_cita NVARCHAR(50),              -- Número de cita del sistema transaccional
    hora_cita TIME,
    
    -- ========================================================
    -- 📊 MÉTRICAS ADITIVAS (Se pueden sumar, promediar)
    -- ========================================================
    -- Estas métricas provienen de la tabla Citas
    
    monto_cita DECIMAL(10,2),              -- Precio de la consulta (desde Citas.monto_cita)
    duracion_minutos INT,                  -- Duración de la cita (desde Citas.duracion_minutos)
    dias_espera INT,                       -- Días de espera del paciente (desde Citas.dias_espera)
    
    -- ========================================================
    -- 🔢 MÉTRICAS NO ADITIVAS (Flags y estados)
    -- ========================================================
    
    fue_atendida BIT,                      -- 1=Sí, 0=No
    fue_confirmada BIT,                    -- 1=Sí, 0=No
    paciente_asistio BIT,                  -- 1=Sí, 0=No
    es_primera_vez BIT,                    -- Primera cita del paciente
    es_control BIT,                        -- Es una cita de control/seguimiento
    
    -- Auditoría
    fecha_registro_cita DATETIME,          -- Cuándo se registró la cita
    fecha_atencion DATETIME,               -- Cuándo se atendió realmente
    
    -- Foreign Keys Constraints
    FOREIGN KEY (id_tiempo) REFERENCES DimTiempo(id_tiempo),
    FOREIGN KEY (id_paciente) REFERENCES DimPaciente(id_paciente),
    FOREIGN KEY (id_doctor) REFERENCES DimDoctor(id_doctor),
    FOREIGN KEY (id_especialidad) REFERENCES DimEspecialidad(id_especialidad),
    FOREIGN KEY (id_tipo_cita) REFERENCES DimTipoCita(id_tipo_cita),
    FOREIGN KEY (id_estado) REFERENCES DimEstadoCita(id_estado),
    FOREIGN KEY (id_zona) REFERENCES DimZona(id_zona),
    FOREIGN KEY (id_recepcionista) REFERENCES DimRecepcionista(id_recepcionista)
);

-- =====================================================
-- 📈 TABLA DE HECHOS ADICIONAL: ATENCIONES MÉDICAS
-- =====================================================

CREATE TABLE HechosAtenciones (
    id_hecho_atencion INT PRIMARY KEY IDENTITY,
    
    -- Foreign Keys
    id_tiempo INT NOT NULL,
    id_paciente INT NOT NULL,
    id_doctor INT NOT NULL,
    id_especialidad INT NOT NULL,
    
    -- Degenerate Dimensions
    numero_atencion NVARCHAR(50),
    diagnostico_codigo NVARCHAR(50),       -- Código CIE-10
    
    -- Métricas
    cantidad_procedimientos INT,
    cantidad_recetas INT,
    cantidad_examenes INT,
    monto_procedimientos DECIMAL(10,2),
    duracion_atencion_minutos INT,
    
    -- Flags
    requirio_procedimientos BIT,
    requirio_examenes BIT,
    requirio_hospitalizacion BIT,
    
    -- Auditoría
    fecha_atencion DATETIME,
    
    -- Foreign Keys Constraints
    FOREIGN KEY (id_tiempo) REFERENCES DimTiempo(id_tiempo),
    FOREIGN KEY (id_paciente) REFERENCES DimPaciente(id_paciente),
    FOREIGN KEY (id_doctor) REFERENCES DimDoctor(id_doctor),
    FOREIGN KEY (id_especialidad) REFERENCES DimEspecialidad(id_especialidad)
);

-- =====================================================
-- 📊 ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices en tabla de Hechos principal
CREATE INDEX IX_HechosCitas_Tiempo ON HechosCitas(id_tiempo);
CREATE INDEX IX_HechosCitas_Paciente ON HechosCitas(id_paciente);
CREATE INDEX IX_HechosCitas_Doctor ON HechosCitas(id_doctor);
CREATE INDEX IX_HechosCitas_Especialidad ON HechosCitas(id_especialidad);
CREATE INDEX IX_HechosCitas_Estado ON HechosCitas(id_estado);
CREATE INDEX IX_HechosCitas_Zona ON HechosCitas(id_zona);
CREATE INDEX IX_HechosCitas_FechaRegistro ON HechosCitas(fecha_registro_cita);

-- Índices en Dimensiones
CREATE INDEX IX_DimTiempo_Fecha ON DimTiempo(fecha);
CREATE INDEX IX_DimTiempo_Anio_Mes ON DimTiempo(anio, mes);
CREATE INDEX IX_DimPaciente_Codigo ON DimPaciente(codigo_paciente);
CREATE INDEX IX_DimDoctor_Codigo ON DimDoctor(codigo_doctor);

-- =====================================================
-- 🗓️ PROCEDIMIENTO PARA POBLAR DIMENSIÓN TIEMPO
-- =====================================================
-- Este procedimiento genera automáticamente los registros
-- de la tabla DimTiempo para un rango de años especificado
-- =====================================================

CREATE PROCEDURE sp_PoblarDimTiempo
    @anio_inicio INT = 2020,    -- Año inicial
    @anio_fin INT = 2030        -- Año final
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @fecha_actual DATE;
    DECLARE @fecha_inicio DATE;
    DECLARE @fecha_fin DATE;
    
    -- Definir rango de fechas
    SET @fecha_inicio = DATEFROMPARTS(@anio_inicio, 1, 1);
    SET @fecha_fin = DATEFROMPARTS(@anio_fin, 12, 31);
    SET @fecha_actual = @fecha_inicio;
    
    PRINT '📅 Generando tabla DimTiempo desde ' + CAST(@anio_inicio AS VARCHAR) + ' hasta ' + CAST(@anio_fin AS VARCHAR);
    
    -- Limpiar tabla si existe datos
    TRUNCATE TABLE DimTiempo;
    
    -- Loop para insertar cada fecha
    WHILE @fecha_actual <= @fecha_fin
    BEGIN
        INSERT INTO DimTiempo (
            fecha,
            anio,
            mes,
            nombre_mes,
            trimestre,
            dia,
            dia_semana,
            nombre_dia_semana,
            es_fin_semana,
            es_feriado,
            nombre_feriado
        )
        VALUES (
            @fecha_actual,
            YEAR(@fecha_actual),
            MONTH(@fecha_actual),
            -- Nombre del mes
            CASE MONTH(@fecha_actual)
                WHEN 1 THEN 'Enero'
                WHEN 2 THEN 'Febrero'
                WHEN 3 THEN 'Marzo'
                WHEN 4 THEN 'Abril'
                WHEN 5 THEN 'Mayo'
                WHEN 6 THEN 'Junio'
                WHEN 7 THEN 'Julio'
                WHEN 8 THEN 'Agosto'
                WHEN 9 THEN 'Septiembre'
                WHEN 10 THEN 'Octubre'
                WHEN 11 THEN 'Noviembre'
                WHEN 12 THEN 'Diciembre'
            END,
            -- Trimestre
            CASE 
                WHEN MONTH(@fecha_actual) IN (1,2,3) THEN 1
                WHEN MONTH(@fecha_actual) IN (4,5,6) THEN 2
                WHEN MONTH(@fecha_actual) IN (7,8,9) THEN 3
                ELSE 4
            END,
            DAY(@fecha_actual),
            DATEPART(WEEKDAY, @fecha_actual),
            -- Nombre del día
            CASE DATEPART(WEEKDAY, @fecha_actual)
                WHEN 1 THEN 'Domingo'
                WHEN 2 THEN 'Lunes'
                WHEN 3 THEN 'Martes'
                WHEN 4 THEN 'Miércoles'
                WHEN 5 THEN 'Jueves'
                WHEN 6 THEN 'Viernes'
                WHEN 7 THEN 'Sábado'
            END,
            -- Es fin de semana
            CASE WHEN DATEPART(WEEKDAY, @fecha_actual) IN (1, 7) THEN 1 ELSE 0 END,
            -- Es feriado (se marca con función auxiliar)
            dbo.fn_EsFeriado(@fecha_actual),
            -- Nombre del feriado
            dbo.fn_NombreFeriado(@fecha_actual)
        );
        
        -- Avanzar al siguiente día
        SET @fecha_actual = DATEADD(DAY, 1, @fecha_actual);
    END;
    
    PRINT '✅ DimTiempo poblada con ' + CAST(DATEDIFF(DAY, @fecha_inicio, @fecha_fin) + 1 AS VARCHAR) + ' registros';
END;
GO

-- =====================================================
-- 🎉 FUNCIONES AUXILIARES PARA FERIADOS EN PERÚ
-- =====================================================

-- Función que verifica si una fecha es feriado
CREATE FUNCTION fn_EsFeriado (@fecha DATE)
RETURNS BIT
AS
BEGIN
    DECLARE @es_feriado BIT = 0;
    DECLARE @dia INT = DAY(@fecha);
    DECLARE @mes INT = MONTH(@fecha);
    
    -- Feriados fijos en Perú
    IF (@mes = 1 AND @dia = 1)   -- Año Nuevo
        OR (@mes = 5 AND @dia = 1)   -- Día del Trabajo
        OR (@mes = 6 AND @dia = 29)  -- San Pedro y San Pablo
        OR (@mes = 7 AND @dia = 28)  -- Fiestas Patrias
        OR (@mes = 7 AND @dia = 29)  -- Fiestas Patrias
        OR (@mes = 8 AND @dia = 30)  -- Santa Rosa de Lima
        OR (@mes = 10 AND @dia = 8)  -- Combate de Angamos
        OR (@mes = 11 AND @dia = 1)  -- Todos los Santos
        OR (@mes = 12 AND @dia = 8)  -- Inmaculada Concepción
        OR (@mes = 12 AND @dia = 25) -- Navidad
    BEGIN
        SET @es_feriado = 1;
    END;
    
    RETURN @es_feriado;
END;
GO

-- Función que retorna el nombre del feriado
CREATE FUNCTION fn_NombreFeriado (@fecha DATE)
RETURNS NVARCHAR(100)
AS
BEGIN
    DECLARE @nombre NVARCHAR(100) = NULL;
    DECLARE @dia INT = DAY(@fecha);
    DECLARE @mes INT = MONTH(@fecha);
    
    -- Feriados fijos en Perú
    IF (@mes = 1 AND @dia = 1)
        SET @nombre = 'Año Nuevo';
    ELSE IF (@mes = 5 AND @dia = 1)
        SET @nombre = 'Día del Trabajo';
    ELSE IF (@mes = 6 AND @dia = 29)
        SET @nombre = 'San Pedro y San Pablo';
    ELSE IF (@mes = 7 AND @dia = 28)
        SET @nombre = 'Fiestas Patrias';
    ELSE IF (@mes = 7 AND @dia = 29)
        SET @nombre = 'Fiestas Patrias';
    ELSE IF (@mes = 8 AND @dia = 30)
        SET @nombre = 'Santa Rosa de Lima';
    ELSE IF (@mes = 10 AND @dia = 8)
        SET @nombre = 'Combate de Angamos';
    ELSE IF (@mes = 11 AND @dia = 1)
        SET @nombre = 'Todos los Santos';
    ELSE IF (@mes = 12 AND @dia = 8)
        SET @nombre = 'Inmaculada Concepción';
    ELSE IF (@mes = 12 AND @dia = 25)
        SET @nombre = 'Navidad';
    
    RETURN @nombre;
END;
GO

-- =====================================================
-- 🚀 EJECUTAR POBLACIÓN DE DIMTIEMPO
-- =====================================================
-- Descomentar la siguiente línea para poblar DimTiempo automáticamente
-- desde el año 2020 hasta el 2030 (genera ~3,652 registros)
-- =====================================================

-- EXEC sp_PoblarDimTiempo @anio_inicio = 2020, @anio_fin = 2030;
-- GO

-- =====================================================
-- 📊 VISTAS DE ANÁLISIS RÁPIDO
-- =====================================================
-- NOTA: Estas vistas se crearán DESPUÉS de cargar datos con ETL
-- Por ahora están comentadas para evitar errores
-- =====================================================

/*
-- Vista: Resumen de citas por especialidad
CREATE OR ALTER VIEW VistaResumenEspecialidad AS
SELECT 
    e.nombre AS Especialidad,
    COUNT(h.id_hecho) AS TotalCitas,
    SUM(CASE WHEN h.fue_atendida = 1 THEN 1 ELSE 0 END) AS CitasAtendidas,
    SUM(h.monto_cita) AS IngresoTotal,
    AVG(h.duracion_minutos) AS DuracionPromedio
FROM HechosCitas h
INNER JOIN DimEspecialidad e ON h.id_especialidad = e.id_especialidad
GROUP BY e.nombre;
GO

-- Vista: Resumen mensual
CREATE OR ALTER VIEW VistaResumenMensual AS
SELECT 
    t.anio AS Año,
    t.mes AS Mes,
    t.nombre_mes AS NombreMes,
    COUNT(h.id_hecho) AS TotalCitas,
    SUM(h.monto_cita) AS IngresoTotal,
    AVG(h.monto_cita) AS MontoPromedio,
    SUM(CASE WHEN h.paciente_asistio = 1 THEN 1 ELSE 0 END) AS Asistencias,
    SUM(CASE WHEN h.paciente_asistio = 0 THEN 1 ELSE 0 END) AS Inasistencias
FROM HechosCitas h
INNER JOIN DimTiempo t ON h.id_tiempo = t.id_tiempo
GROUP BY t.anio, t.mes, t.nombre_mes;
GO

-- Vista: Top doctores
CREATE OR ALTER VIEW VistaTopDoctores AS
SELECT 
    d.nombre_completo AS Doctor,
    d.especialidad AS Especialidad,
    COUNT(h.id_hecho) AS TotalCitas,
    SUM(CASE WHEN h.fue_atendida = 1 THEN 1 ELSE 0 END) AS CitasAtendidas,
    SUM(h.monto_cita) AS IngresoGenerado,
    AVG(h.duracion_minutos) AS DuracionPromedioMinutos
FROM HechosCitas h
INNER JOIN DimDoctor d ON h.id_doctor = d.id_doctor
GROUP BY d.nombre_completo, d.especialidad;
GO

-- Vista: Análisis por zona geográfica
CREATE OR ALTER VIEW VistaAnalisisZonas AS
SELECT 
    z.nombre_zona AS Zona,
    z.distrito AS Distrito,
    COUNT(h.id_hecho) AS TotalCitas,
    COUNT(DISTINCT h.id_paciente) AS PacientesUnicos,
    SUM(h.monto_cita) AS IngresoTotal,
    AVG(p.edad) AS EdadPromedioPacientes
FROM HechosCitas h
INNER JOIN DimZona z ON h.id_zona = z.id_zona
INNER JOIN DimPaciente p ON h.id_paciente = p.id_paciente
GROUP BY z.nombre_zona, z.distrito;
GO
*/

PRINT '📊 Las vistas de análisis están comentadas.';
PRINT '   Descomentar después de cargar datos con ETL.';
GO

-- =====================================================
-- ✅ FINALIZACIÓN
-- =====================================================

PRINT '';
PRINT '========================================================';
PRINT '✅ Data Mart en Esquema de Estrella creado exitosamente';
PRINT '========================================================';
PRINT '';
PRINT '⭐ TABLA DE HECHOS:';
PRINT '   - HechosCitas';
PRINT '   - HechosAtenciones';
PRINT '';
PRINT '📊 DIMENSIONES (8):';
PRINT '   1. DimTiempo (calendario)';
PRINT '   2. DimPaciente';
PRINT '   3. DimDoctor';
PRINT '   4. DimEspecialidad';
PRINT '   5. DimTipoCita';
PRINT '   6. DimEstadoCita';
PRINT '   7. DimZona';
PRINT '   8. DimRecepcionista';
PRINT '';
PRINT '📈 VISTAS DE ANÁLISIS:';
PRINT '   (Comentadas - activar después del ETL)';
PRINT '';
PRINT '🗓️ SIGUIENTE PASO - POBLAR DIMTIEMPO:';
PRINT '   EXEC sp_PoblarDimTiempo @anio_inicio = 2020, @anio_fin = 2030;';
PRINT '';
PRINT '📝 NOTAS IMPORTANTES:';
PRINT '   1. Las demás dimensiones y hechos se poblarán mediante ETL';
PRINT '   2. Las vistas están comentadas (activar tras cargar datos)';
PRINT '   3. El Data Mart está listo para recibir datos';
PRINT '========================================================';
GO

