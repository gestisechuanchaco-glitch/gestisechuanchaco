-- Base de datos Data Mart
CREATE DATABASE DATAMART_HOSPITAL;
GO
USE DATAMART_HOSPITAL;
GO

-- =====================================================
-- DIMENSIONES
-- =====================================================

-- Dimensión Tiempo
CREATE TABLE DimTiempo (
    id_tiempo INT PRIMARY KEY IDENTITY,
    fecha DATE NOT NULL UNIQUE,
    dia INT NOT NULL,
    mes INT NOT NULL,
    anio INT NOT NULL,
    trimestre INT
);
GO

-- Dimensión Paciente (campos de tabla Pacientes)
CREATE TABLE DimPaciente (
    id_paciente INT PRIMARY KEY IDENTITY,
    codigo_paciente NVARCHAR(20) UNIQUE,
    nombres NVARCHAR(100),
    apellidos NVARCHAR(100),
    sexo CHAR(1),
    fecha_nacimiento DATE,
    documento_identidad NVARCHAR(20),
    telefono NVARCHAR(20),
    correo NVARCHAR(100)
);
GO

-- Dimensión Doctor (campos de tabla Doctores + especialidad)
CREATE TABLE DimDoctor (
    id_doctor INT PRIMARY KEY IDENTITY,
    codigo_doctor NVARCHAR(20) UNIQUE,
    nombres NVARCHAR(100),
    apellidos NVARCHAR(100),
    num_colegiatura NVARCHAR(50),
    telefono NVARCHAR(20),
    email NVARCHAR(100),
    especialidad NVARCHAR(100)
);
GO

-- Dimensión Tipo de Cita (campos de tabla TiposCita)
CREATE TABLE DimTipoCita (
    id_tipo_cita INT PRIMARY KEY IDENTITY,
    codigo_tipo_cita NVARCHAR(20) UNIQUE,
    descripcion NVARCHAR(100),
    precio DECIMAL(10,2)
);
GO

-- Dimensión Estado de Cita (campos de tabla EstadosCita)
CREATE TABLE DimEstadoCita (
    id_estado INT PRIMARY KEY IDENTITY,
    codigo_estado NVARCHAR(20) UNIQUE,
    descripcion NVARCHAR(50)
);
GO

-- =====================================================
-- TABLA DE HECHOS (SOLO UNA)
-- =====================================================

CREATE TABLE HechosCitas (
    id_hecho INT PRIMARY KEY IDENTITY,
    
    -- Foreign Keys a Dimensiones (ESTRELLA PURA - solo a hechos)
    id_tiempo INT NOT NULL,
    id_paciente INT NOT NULL,
    id_doctor INT NOT NULL,
    id_tipo_cita INT NOT NULL,
    id_estado INT NOT NULL,
    
    -- Datos adicionales
    numero_cita NVARCHAR(50),
    hora_cita TIME,
    
    -- MEDICIONES (las 3 principales)
    monto_cita DECIMAL(10,2),
    duracion_minutos INT,
    dias_espera INT,
    
    -- Indicadores
    fue_atendida BIT,
    paciente_asistio BIT,
    
    -- Fechas
    fecha_registro DATETIME,
    fecha_atencion DATETIME,
    
    -- Relaciones (solo a dimensiones, no entre dimensiones)
    FOREIGN KEY (id_tiempo) REFERENCES DimTiempo(id_tiempo),
    FOREIGN KEY (id_paciente) REFERENCES DimPaciente(id_paciente),
    FOREIGN KEY (id_doctor) REFERENCES DimDoctor(id_doctor),
    FOREIGN KEY (id_tipo_cita) REFERENCES DimTipoCita(id_tipo_cita),
    FOREIGN KEY (id_estado) REFERENCES DimEstadoCita(id_estado)
);
GO

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IX_HechosCitas_Tiempo ON HechosCitas(id_tiempo);
CREATE INDEX IX_HechosCitas_Paciente ON HechosCitas(id_paciente);
CREATE INDEX IX_HechosCitas_Doctor ON HechosCitas(id_doctor);
CREATE INDEX IX_DimTiempo_Fecha ON DimTiempo(fecha);
GO

-- =====================================================
-- PROCEDIMIENTO PARA POBLAR DIMTIEMPO
-- =====================================================

CREATE PROCEDURE sp_PoblarDimTiempo
    @anio_inicio INT = 2020,
    @anio_fin INT = 2030
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @fecha_actual DATE;
    DECLARE @fecha_inicio DATE;
    DECLARE @fecha_fin DATE;
    
    SET @fecha_inicio = DATEFROMPARTS(@anio_inicio, 1, 1);
    SET @fecha_fin = DATEFROMPARTS(@anio_fin, 12, 31);
    SET @fecha_actual = @fecha_inicio;
    
    TRUNCATE TABLE DimTiempo;
    
    WHILE @fecha_actual <= @fecha_fin
    BEGIN
        INSERT INTO DimTiempo (fecha, dia, mes, anio, trimestre)
        VALUES (
            @fecha_actual,
            DAY(@fecha_actual),
            MONTH(@fecha_actual),
            YEAR(@fecha_actual),
            CASE 
                WHEN MONTH(@fecha_actual) IN (1,2,3) THEN 1
                WHEN MONTH(@fecha_actual) IN (4,5,6) THEN 2
                WHEN MONTH(@fecha_actual) IN (7,8,9) THEN 3
                ELSE 4
            END
        );
        
        SET @fecha_actual = DATEADD(DAY, 1, @fecha_actual);
    END;
    
    PRINT 'DimTiempo poblada exitosamente';
END;
GO

PRINT 'Data Mart creado exitosamente';
PRINT 'MODELO ESTRELLA PURO';
PRINT '1 Tabla de Hechos: HechosCitas';
PRINT '5 Dimensiones: Tiempo, Paciente, Doctor, TipoCita, EstadoCita';
PRINT '(Especialidad incluida en DimDoctor - desnormalizado)';
GO

