-- Base de datos Data Mart
CREATE DATABASE DATAMART_HOSPITAL;
GO
USE DATAMART_HOSPITAL;
GO

-- DIMENSIONES

CREATE TABLE DimTiempo (
    id_tiempo INT PRIMARY KEY IDENTITY,
    fecha DATE NOT NULL UNIQUE,
    anio INT NOT NULL,
    mes INT NOT NULL,
    nombre_mes NVARCHAR(20),
    trimestre INT,
    dia INT NOT NULL,
    dia_semana INT,
    nombre_dia_semana NVARCHAR(20),
    es_fin_semana BIT,
    es_feriado BIT,
    nombre_feriado NVARCHAR(100)
);
GO

CREATE TABLE DimPaciente (
    id_paciente INT PRIMARY KEY IDENTITY,
    codigo_paciente NVARCHAR(20) UNIQUE,
    nombres NVARCHAR(100),
    apellidos NVARCHAR(100),
    nombre_completo NVARCHAR(200),
    sexo CHAR(1),
    edad INT,
    rango_edad NVARCHAR(20),
    documento_identidad NVARCHAR(20),
    zona NVARCHAR(100),
    distrito NVARCHAR(100),
    provincia NVARCHAR(100),
    departamento NVARCHAR(100)
);
GO

CREATE TABLE DimDoctor (
    id_doctor INT PRIMARY KEY IDENTITY,
    codigo_doctor NVARCHAR(20) UNIQUE,
    nombres NVARCHAR(100),
    apellidos NVARCHAR(100),
    nombre_completo NVARCHAR(200),
    num_colegiatura NVARCHAR(50),
    especialidad NVARCHAR(100),
    anios_experiencia INT
);
GO

CREATE TABLE DimEspecialidad (
    id_especialidad INT PRIMARY KEY IDENTITY,
    codigo_especialidad NVARCHAR(20) UNIQUE,
    nombre NVARCHAR(100),
    descripcion NVARCHAR(255),
    categoria NVARCHAR(50)
);
GO

CREATE TABLE DimTipoCita (
    id_tipo_cita INT PRIMARY KEY IDENTITY,
    codigo_tipo_cita NVARCHAR(20) UNIQUE,
    descripcion NVARCHAR(100),
    categoria NVARCHAR(50),
    precio_base DECIMAL(10,2)
);
GO

CREATE TABLE DimEstadoCita (
    id_estado INT PRIMARY KEY IDENTITY,
    codigo_estado NVARCHAR(20) UNIQUE,
    descripcion NVARCHAR(50),
    es_exitosa BIT,
    categoria NVARCHAR(50)
);
GO

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
GO

CREATE TABLE DimRecepcionista (
    id_recepcionista INT PRIMARY KEY IDENTITY,
    codigo_recepcionista NVARCHAR(20) UNIQUE,
    nombres NVARCHAR(100),
    apellidos NVARCHAR(100),
    nombre_completo NVARCHAR(200),
    turno NVARCHAR(50)
);
GO

-- TABLA DE HECHOS

CREATE TABLE HechosCitas (
    id_hecho INT PRIMARY KEY IDENTITY,
    id_tiempo INT NOT NULL,
    id_paciente INT NOT NULL,
    id_doctor INT NOT NULL,
    id_especialidad INT NOT NULL,
    id_tipo_cita INT NOT NULL,
    id_estado INT NOT NULL,
    id_zona INT,
    id_recepcionista INT,
    numero_cita NVARCHAR(50),
    hora_cita TIME,
    monto_cita DECIMAL(10,2),
    duracion_minutos INT,
    dias_espera INT,
    fue_atendida BIT,
    fue_confirmada BIT,
    paciente_asistio BIT,
    es_primera_vez BIT,
    es_control BIT,
    fecha_registro_cita DATETIME,
    fecha_atencion DATETIME,
    FOREIGN KEY (id_tiempo) REFERENCES DimTiempo(id_tiempo),
    FOREIGN KEY (id_paciente) REFERENCES DimPaciente(id_paciente),
    FOREIGN KEY (id_doctor) REFERENCES DimDoctor(id_doctor),
    FOREIGN KEY (id_especialidad) REFERENCES DimEspecialidad(id_especialidad),
    FOREIGN KEY (id_tipo_cita) REFERENCES DimTipoCita(id_tipo_cita),
    FOREIGN KEY (id_estado) REFERENCES DimEstadoCita(id_estado),
    FOREIGN KEY (id_zona) REFERENCES DimZona(id_zona),
    FOREIGN KEY (id_recepcionista) REFERENCES DimRecepcionista(id_recepcionista)
);
GO

CREATE TABLE HechosAtenciones (
    id_hecho_atencion INT PRIMARY KEY IDENTITY,
    id_tiempo INT NOT NULL,
    id_paciente INT NOT NULL,
    id_doctor INT NOT NULL,
    id_especialidad INT NOT NULL,
    numero_atencion NVARCHAR(50),
    diagnostico_codigo NVARCHAR(50),
    cantidad_procedimientos INT,
    cantidad_recetas INT,
    cantidad_examenes INT,
    monto_procedimientos DECIMAL(10,2),
    duracion_atencion_minutos INT,
    requirio_procedimientos BIT,
    requirio_examenes BIT,
    requirio_hospitalizacion BIT,
    fecha_atencion DATETIME,
    FOREIGN KEY (id_tiempo) REFERENCES DimTiempo(id_tiempo),
    FOREIGN KEY (id_paciente) REFERENCES DimPaciente(id_paciente),
    FOREIGN KEY (id_doctor) REFERENCES DimDoctor(id_doctor),
    FOREIGN KEY (id_especialidad) REFERENCES DimEspecialidad(id_especialidad)
);
GO

-- ÍNDICES

CREATE INDEX IX_HechosCitas_Tiempo ON HechosCitas(id_tiempo);
CREATE INDEX IX_HechosCitas_Paciente ON HechosCitas(id_paciente);
CREATE INDEX IX_HechosCitas_Doctor ON HechosCitas(id_doctor);
CREATE INDEX IX_HechosCitas_Especialidad ON HechosCitas(id_especialidad);
CREATE INDEX IX_HechosCitas_Estado ON HechosCitas(id_estado);
CREATE INDEX IX_HechosCitas_Zona ON HechosCitas(id_zona);
CREATE INDEX IX_DimTiempo_Fecha ON DimTiempo(fecha);
CREATE INDEX IX_DimTiempo_Anio_Mes ON DimTiempo(anio, mes);
CREATE INDEX IX_DimPaciente_Codigo ON DimPaciente(codigo_paciente);
CREATE INDEX IX_DimDoctor_Codigo ON DimDoctor(codigo_doctor);
GO

-- PROCEDIMIENTO PARA POBLAR DIMTIEMPO

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
        INSERT INTO DimTiempo (
            fecha, anio, mes, nombre_mes, trimestre, dia, dia_semana, 
            nombre_dia_semana, es_fin_semana, es_feriado, nombre_feriado
        )
        VALUES (
            @fecha_actual,
            YEAR(@fecha_actual),
            MONTH(@fecha_actual),
            CASE MONTH(@fecha_actual)
                WHEN 1 THEN 'Enero' WHEN 2 THEN 'Febrero' WHEN 3 THEN 'Marzo'
                WHEN 4 THEN 'Abril' WHEN 5 THEN 'Mayo' WHEN 6 THEN 'Junio'
                WHEN 7 THEN 'Julio' WHEN 8 THEN 'Agosto' WHEN 9 THEN 'Septiembre'
                WHEN 10 THEN 'Octubre' WHEN 11 THEN 'Noviembre' WHEN 12 THEN 'Diciembre'
            END,
            CASE 
                WHEN MONTH(@fecha_actual) IN (1,2,3) THEN 1
                WHEN MONTH(@fecha_actual) IN (4,5,6) THEN 2
                WHEN MONTH(@fecha_actual) IN (7,8,9) THEN 3
                ELSE 4
            END,
            DAY(@fecha_actual),
            DATEPART(WEEKDAY, @fecha_actual),
            CASE DATEPART(WEEKDAY, @fecha_actual)
                WHEN 1 THEN 'Domingo' WHEN 2 THEN 'Lunes' WHEN 3 THEN 'Martes'
                WHEN 4 THEN 'Miércoles' WHEN 5 THEN 'Jueves' WHEN 6 THEN 'Viernes'
                WHEN 7 THEN 'Sábado'
            END,
            CASE WHEN DATEPART(WEEKDAY, @fecha_actual) IN (1, 7) THEN 1 ELSE 0 END,
            CASE 
                WHEN (MONTH(@fecha_actual) = 1 AND DAY(@fecha_actual) = 1) THEN 1
                WHEN (MONTH(@fecha_actual) = 5 AND DAY(@fecha_actual) = 1) THEN 1
                WHEN (MONTH(@fecha_actual) = 6 AND DAY(@fecha_actual) = 29) THEN 1
                WHEN (MONTH(@fecha_actual) = 7 AND DAY(@fecha_actual) IN (28, 29)) THEN 1
                WHEN (MONTH(@fecha_actual) = 8 AND DAY(@fecha_actual) = 30) THEN 1
                WHEN (MONTH(@fecha_actual) = 10 AND DAY(@fecha_actual) = 8) THEN 1
                WHEN (MONTH(@fecha_actual) = 11 AND DAY(@fecha_actual) = 1) THEN 1
                WHEN (MONTH(@fecha_actual) = 12 AND DAY(@fecha_actual) IN (8, 25)) THEN 1
                ELSE 0
            END,
            CASE 
                WHEN (MONTH(@fecha_actual) = 1 AND DAY(@fecha_actual) = 1) THEN 'Año Nuevo'
                WHEN (MONTH(@fecha_actual) = 5 AND DAY(@fecha_actual) = 1) THEN 'Día del Trabajo'
                WHEN (MONTH(@fecha_actual) = 6 AND DAY(@fecha_actual) = 29) THEN 'San Pedro y San Pablo'
                WHEN (MONTH(@fecha_actual) = 7 AND DAY(@fecha_actual) IN (28, 29)) THEN 'Fiestas Patrias'
                WHEN (MONTH(@fecha_actual) = 8 AND DAY(@fecha_actual) = 30) THEN 'Santa Rosa de Lima'
                WHEN (MONTH(@fecha_actual) = 10 AND DAY(@fecha_actual) = 8) THEN 'Combate de Angamos'
                WHEN (MONTH(@fecha_actual) = 11 AND DAY(@fecha_actual) = 1) THEN 'Todos los Santos'
                WHEN (MONTH(@fecha_actual) = 12 AND DAY(@fecha_actual) = 8) THEN 'Inmaculada Concepción'
                WHEN (MONTH(@fecha_actual) = 12 AND DAY(@fecha_actual) = 25) THEN 'Navidad'
                ELSE NULL
            END
        );
        
        SET @fecha_actual = DATEADD(DAY, 1, @fecha_actual);
    END;
END;
GO

PRINT 'Data Mart creado exitosamente';
GO















