-- =====================================================
-- BASE DE DATOS TRANSACCIONAL
-- Sistema de Gestión de Citas Hospitalarias
-- Hospital - Perú
-- =====================================================

-- 🔹 Crear base de datos limpia
CREATE DATABASE BDHOSPITALESSALUD;
GO
USE BDHOSPITALESSALUD;
GO

PRINT '🏗️ Creando base de datos transaccional...';
GO

-- =====================================================
-- TABLAS CATÁLOGO Y MAESTRAS
-- =====================================================

-- 1. Especialidades
CREATE TABLE Especialidades (
    id_especialidad INT PRIMARY KEY IDENTITY,
    nombre NVARCHAR(100) NOT NULL,
    descripcion NVARCHAR(255)
);
GO

-- 2. Doctores
CREATE TABLE Doctores (
    id_doctor INT PRIMARY KEY IDENTITY,
    nombres NVARCHAR(100) NOT NULL,
    apellidos NVARCHAR(100) NOT NULL,
    id_especialidad INT NOT NULL,
    telefono NVARCHAR(20),
    email NVARCHAR(100),
    num_colegiatura NVARCHAR(50),
    FOREIGN KEY (id_especialidad) REFERENCES Especialidades(id_especialidad)
);
GO

-- 3. Horarios de los doctores
CREATE TABLE HorariosDoctores (
    id_horario INT PRIMARY KEY IDENTITY,
    id_doctor INT NOT NULL,
    dia_semana NVARCHAR(20) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    FOREIGN KEY (id_doctor) REFERENCES Doctores(id_doctor)
);
GO

-- 4. Zonas (clasificación geográfica de los pacientes)
CREATE TABLE Zonas (
    id_zona INT PRIMARY KEY IDENTITY,
    descripcion NVARCHAR(255),
    estado NVARCHAR(50)  -- Activo / Inactivo
);
GO

-- 5. Pacientes
CREATE TABLE Pacientes (
    id_paciente INT PRIMARY KEY IDENTITY,
    nombres NVARCHAR(100) NOT NULL,
    apellidos NVARCHAR(100) NOT NULL,
    fecha_nacimiento DATE,
    sexo CHAR(1),
    direccion NVARCHAR(150),
    telefono NVARCHAR(20),
    correo NVARCHAR(100),
    documento_identidad NVARCHAR(20) UNIQUE,
    id_zona INT NULL,
    FOREIGN KEY (id_zona) REFERENCES Zonas(id_zona)
);
GO

-- 6. Recepcionistas
CREATE TABLE Recepcionistas (
    id_recepcionista INT PRIMARY KEY IDENTITY,
    nombres NVARCHAR(100) NOT NULL,
    apellidos NVARCHAR(100) NOT NULL
);
GO

-- 7. Usuarios del sistema
CREATE TABLE Usuarios (
    id_usuario INT PRIMARY KEY IDENTITY,
    username NVARCHAR(50) UNIQUE NOT NULL,
    password NVARCHAR(100) NOT NULL,
    rol NVARCHAR(50) NOT NULL,
    id_recepcionista INT NULL,      -- si el usuario es recepcionista
    FOREIGN KEY (id_recepcionista) REFERENCES Recepcionistas(id_recepcionista)
);
GO

-- 8. Estados de citas
CREATE TABLE EstadosCita (
    id_estado INT PRIMARY KEY IDENTITY,
    descripcion NVARCHAR(50)
);
GO

-- 9. Tipos de cita
CREATE TABLE TiposCita (
    id_tipo_cita INT PRIMARY KEY IDENTITY,
    descripcion NVARCHAR(100) NOT NULL,   -- Ej: Consulta, Urgencia, Control, Examen
    precio DECIMAL(10,2) NOT NULL         -- Precio definido por tipo
);
GO

-- =====================================================
-- TABLA PRINCIPAL: CITAS
-- =====================================================

-- 10. Citas
CREATE TABLE Citas (
    id_cita INT PRIMARY KEY IDENTITY,
    id_paciente INT NOT NULL,
    id_doctor INT NOT NULL,
    id_recepcionista INT,
    id_estado INT,
    id_tipo_cita INT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    motivo NVARCHAR(255), 
    FOREIGN KEY (id_paciente) REFERENCES Pacientes(id_paciente),
    FOREIGN KEY (id_doctor) REFERENCES Doctores(id_doctor),
    FOREIGN KEY (id_recepcionista) REFERENCES Recepcionistas(id_recepcionista),
    FOREIGN KEY (id_estado) REFERENCES EstadosCita(id_estado),
    FOREIGN KEY (id_tipo_cita) REFERENCES TiposCita(id_tipo_cita)
);
GO

-- =====================================================
-- TABLAS DE ATENCIÓN MÉDICA
-- =====================================================

-- 11. Procedimientos
CREATE TABLE Procedimientos (
    id_procedimiento INT PRIMARY KEY IDENTITY,
    nombre NVARCHAR(100),
    descripcion NVARCHAR(255),
    fecha_registro DATE
);
GO

-- 12. Resultados de exámenes
CREATE TABLE ResultadosExamenes (
    id_examen INT PRIMARY KEY IDENTITY,
    id_procedimiento INT NOT NULL,
    tipo_examen NVARCHAR(100),
    resultado NVARCHAR(255),
    fecha_examen DATE,
    FOREIGN KEY (id_procedimiento) REFERENCES Procedimientos(id_procedimiento)
);
GO

-- 13. Atención de citas
CREATE TABLE AtencionCita (
    id_atencion INT PRIMARY KEY IDENTITY,
    id_cita INT NOT NULL,
    id_procedimiento INT,
    diagnostico NVARCHAR(255),
    observaciones NVARCHAR(500),
    fecha DATE,
    FOREIGN KEY (id_cita) REFERENCES Citas(id_cita),
    FOREIGN KEY (id_procedimiento) REFERENCES Procedimientos(id_procedimiento)
);
GO

-- 14. Recetas médicas
CREATE TABLE RecetasMedicas (
    id_receta INT PRIMARY KEY IDENTITY,
    id_atencion INT NOT NULL,
    medicamento NVARCHAR(100),
    dosis NVARCHAR(50),
    duracion NVARCHAR(50),
    indicaciones NVARCHAR(255),
    fecha DATE,
    FOREIGN KEY (id_atencion) REFERENCES AtencionCita(id_atencion)
);
GO

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX IX_Citas_Fecha ON Citas(fecha);
CREATE INDEX IX_Citas_Paciente ON Citas(id_paciente);
CREATE INDEX IX_Citas_Doctor ON Citas(id_doctor);
CREATE INDEX IX_Pacientes_DNI ON Pacientes(documento_identidad);
GO

-- =====================================================
-- ✅ FINALIZACIÓN
-- =====================================================

PRINT '';
PRINT '========================================================';
PRINT '✅ Base de Datos Transaccional creada exitosamente';
PRINT '========================================================';
PRINT '';
PRINT '📊 TABLAS CREADAS (14):';
PRINT '   1. Especialidades';
PRINT '   2. Doctores';
PRINT '   3. HorariosDoctores';
PRINT '   4. Zonas';
PRINT '   5. Pacientes';
PRINT '   6. Recepcionistas';
PRINT '   7. Usuarios';
PRINT '   8. EstadosCita';
PRINT '   9. TiposCita';
PRINT '   10. Citas ⭐ (TABLA PRINCIPAL)';
PRINT '   11. Procedimientos';
PRINT '   12. ResultadosExamenes';
PRINT '   13. AtencionCita';
PRINT '   14. RecetasMedicas';
PRINT '';
PRINT '✅ Sin bucles circulares';
PRINT '✅ Relaciones correctamente definidas';
PRINT '✅ Índices de optimización creados';
PRINT '';
PRINT '📝 SIGUIENTE PASO:';
PRINT '   Ejecutar: AGREGAR_MEDICIONES_CITAS.sql';
PRINT '   Para agregar las 3 mediciones a la tabla Citas';
PRINT '========================================================';
GO















