-- =====================================================
-- AGREGAR MEDICIONES A LA TABLA CITAS
-- Base de Datos Transaccional: BDHOSPITALESSALUD
-- =====================================================
-- 
-- Las MEDICIONES son valores numéricos que se pueden:
-- - Sumar (SUM)
-- - Promediar (AVG)
-- - Contar (COUNT)
-- - Obtener mínimo/máximo (MIN/MAX)
--
-- Estas mediciones son fundamentales para el Data Mart y Cubos OLAP
-- =====================================================

USE BDHOSPITALESSALUD;
GO

PRINT '📊 Agregando mediciones a la tabla Citas...';
GO

-- =====================================================
-- 1. MONTO DE LA CITA (Medición Principal)
-- =====================================================
-- Almacena el precio que se cobró por la cita
-- Se toma del precio del TipoCita al momento de registrar

ALTER TABLE Citas
ADD monto_cita DECIMAL(10,2) NULL;
GO

PRINT '✅ Campo "monto_cita" agregado';
GO

-- =====================================================
-- 2. DURACIÓN ESTIMADA DE LA CITA
-- =====================================================
-- Tiempo en minutos que dura la consulta
-- Útil para análisis de tiempos y productividad

ALTER TABLE Citas
ADD duracion_minutos INT NULL;
GO

PRINT '✅ Campo "duracion_minutos" agregado';
GO

-- =====================================================
-- 3. TIEMPO DE ESPERA
-- =====================================================
-- Días entre el registro de la cita y la fecha programada
-- Medición de eficiencia del sistema

ALTER TABLE Citas
ADD dias_espera INT NULL;
GO

PRINT '✅ Campo "dias_espera" agregado';
GO

-- =====================================================
-- 4. ACTUALIZAR VALORES EXISTENTES (Si hay datos)
-- =====================================================

-- Actualizar monto_cita según el tipo de cita
UPDATE c
SET c.monto_cita = tc.precio
FROM Citas c
INNER JOIN TiposCita tc ON c.id_tipo_cita = tc.id_tipo_cita
WHERE c.monto_cita IS NULL;
GO

PRINT '✅ Montos actualizados según tipo de cita';
GO

-- Asignar duración por defecto según tipo de cita
UPDATE Citas
SET duracion_minutos = CASE 
    WHEN id_tipo_cita IN (SELECT id_tipo_cita FROM TiposCita WHERE descripcion LIKE '%General%') THEN 20
    WHEN id_tipo_cita IN (SELECT id_tipo_cita FROM TiposCita WHERE descripcion LIKE '%Especializada%') THEN 30
    WHEN id_tipo_cita IN (SELECT id_tipo_cita FROM TiposCita WHERE descripcion LIKE '%Emergencia%') THEN 45
    WHEN id_tipo_cita IN (SELECT id_tipo_cita FROM TiposCita WHERE descripcion LIKE '%Control%') THEN 15
    ELSE 20
END
WHERE duracion_minutos IS NULL;
GO

PRINT '✅ Duraciones estimadas asignadas';
GO

-- =====================================================
-- 5. RESTRICCIONES Y VALORES POR DEFECTO
-- =====================================================

-- El monto no puede ser negativo
ALTER TABLE Citas
ADD CONSTRAINT CK_Citas_MontoPositivo CHECK (monto_cita >= 0);
GO

-- La duración no puede ser negativa ni mayor a 8 horas (480 minutos)
ALTER TABLE Citas
ADD CONSTRAINT CK_Citas_DuracionValida CHECK (duracion_minutos >= 0 AND duracion_minutos <= 480);
GO

-- Los días de espera no pueden ser negativos
ALTER TABLE Citas
ADD CONSTRAINT CK_Citas_EsperaValida CHECK (dias_espera >= 0);
GO

PRINT '✅ Restricciones agregadas';
GO

-- =====================================================
-- 6. TRIGGER PARA CALCULAR AUTOMÁTICAMENTE
-- =====================================================

-- Trigger que calcula automáticamente el monto y días de espera
-- al insertar o actualizar una cita
CREATE OR ALTER TRIGGER trg_CalcularMedicionesCita
ON Citas
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Actualizar monto_cita si es NULL
    UPDATE c
    SET c.monto_cita = tc.precio
    FROM Citas c
    INNER JOIN inserted i ON c.id_cita = i.id_cita
    INNER JOIN TiposCita tc ON c.id_tipo_cita = tc.id_tipo_cita
    WHERE c.monto_cita IS NULL;
    
    -- Calcular días de espera (fecha de la cita - fecha actual)
    UPDATE c
    SET c.dias_espera = DATEDIFF(DAY, GETDATE(), c.fecha)
    FROM Citas c
    INNER JOIN inserted i ON c.id_cita = i.id_cita
    WHERE c.dias_espera IS NULL AND c.fecha >= CAST(GETDATE() AS DATE);
    
    -- Asignar duración por defecto si es NULL
    UPDATE c
    SET c.duracion_minutos = CASE 
        WHEN tc.descripcion LIKE '%General%' THEN 20
        WHEN tc.descripcion LIKE '%Especializada%' THEN 30
        WHEN tc.descripcion LIKE '%Emergencia%' THEN 45
        WHEN tc.descripcion LIKE '%Control%' THEN 15
        ELSE 20
    END
    FROM Citas c
    INNER JOIN inserted i ON c.id_cita = i.id_cita
    INNER JOIN TiposCita tc ON c.id_tipo_cita = tc.id_tipo_cita
    WHERE c.duracion_minutos IS NULL;
END;
GO

PRINT '✅ Trigger de cálculo automático creado';
GO

-- =====================================================
-- 7. VISTA DE VERIFICACIÓN
-- =====================================================

CREATE OR ALTER VIEW VistaCitasConMediciones AS
SELECT 
    c.id_cita,
    c.numero_cita,
    p.nombres + ' ' + p.apellidos AS Paciente,
    d.nombres + ' ' + d.apellidos AS Doctor,
    c.fecha,
    c.hora,
    tc.descripcion AS TipoCita,
    ec.descripcion AS Estado,
    -- MEDICIONES
    c.monto_cita AS Monto,
    c.duracion_minutos AS DuracionMinutos,
    c.dias_espera AS DiasEspera,
    -- Campos calculados adicionales
    CASE 
        WHEN ec.descripcion = 'Atendida' THEN c.monto_cita 
        ELSE 0 
    END AS MontoRealizado,
    CASE 
        WHEN ec.descripcion = 'Atendida' THEN 1 
        ELSE 0 
    END AS FueAtendida
FROM Citas c
LEFT JOIN Pacientes p ON c.id_paciente = p.id_paciente
LEFT JOIN Doctores d ON c.id_doctor = d.id_doctor
LEFT JOIN TiposCita tc ON c.id_tipo_cita = tc.id_tipo_cita
LEFT JOIN EstadosCita ec ON c.id_estado = ec.id_estado;
GO

PRINT '✅ Vista de verificación creada';
GO

-- =====================================================
-- 8. CONSULTA DE VERIFICACIÓN
-- =====================================================

PRINT '';
PRINT '========================================================';
PRINT '📊 VERIFICACIÓN DE MEDICIONES';
PRINT '========================================================';
PRINT '';

SELECT 
    'Total de Citas' AS Metrica,
    COUNT(*) AS Valor
FROM Citas

UNION ALL

SELECT 
    'Citas con Monto',
    COUNT(*)
FROM Citas
WHERE monto_cita IS NOT NULL

UNION ALL

SELECT 
    'Monto Promedio',
    AVG(monto_cita)
FROM Citas
WHERE monto_cita IS NOT NULL

UNION ALL

SELECT 
    'Monto Total',
    SUM(monto_cita)
FROM Citas
WHERE monto_cita IS NOT NULL

UNION ALL

SELECT 
    'Duración Promedio (min)',
    AVG(duracion_minutos)
FROM Citas
WHERE duracion_minutos IS NOT NULL;

GO

-- =====================================================
-- ✅ FINALIZACIÓN
-- =====================================================

PRINT '';
PRINT '========================================================';
PRINT '✅ Mediciones agregadas exitosamente a la tabla Citas';
PRINT '========================================================';
PRINT '';
PRINT '📊 MEDICIONES AGREGADAS:';
PRINT '   1. monto_cita (DECIMAL) - Precio de la consulta';
PRINT '   2. duracion_minutos (INT) - Tiempo de la cita';
PRINT '   3. dias_espera (INT) - Tiempo de espera del paciente';
PRINT '';
PRINT '🔧 AUTOMATIZACIONES:';
PRINT '   - Trigger que calcula valores automáticamente';
PRINT '   - Restricciones de integridad agregadas';
PRINT '   - Vista VistaCitasConMediciones creada';
PRINT '';
PRINT '📈 USO EN DATA MART Y CUBO OLAP:';
PRINT '   - SUM(monto_cita) = Ingresos totales';
PRINT '   - AVG(monto_cita) = Precio promedio';
PRINT '   - AVG(duracion_minutos) = Tiempo promedio de atención';
PRINT '   - AVG(dias_espera) = Tiempo de espera promedio';
PRINT '========================================================';
GO















