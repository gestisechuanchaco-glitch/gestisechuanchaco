-- =====================================================
-- ACTIVAR VISTAS DEL DATA MART
-- =====================================================
-- Este script crea las vistas de análisis
-- SOLO ejecutar DESPUÉS de haber cargado datos con ETL
-- =====================================================

USE DATAMART_HOSPITAL;
GO

PRINT '📊 Creando vistas de análisis...';
GO

-- =====================================================
-- VISTA 1: Resumen por Especialidad
-- =====================================================

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

PRINT '✅ Vista VistaResumenEspecialidad creada';
GO

-- =====================================================
-- VISTA 2: Resumen Mensual
-- =====================================================

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

PRINT '✅ Vista VistaResumenMensual creada';
GO

-- =====================================================
-- VISTA 3: Top Doctores
-- =====================================================

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

PRINT '✅ Vista VistaTopDoctores creada';
GO

-- =====================================================
-- VISTA 4: Análisis por Zona Geográfica
-- =====================================================

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

PRINT '✅ Vista VistaAnalisisZonas creada';
GO

-- =====================================================
-- VERIFICACIÓN DE VISTAS
-- =====================================================

PRINT '';
PRINT '========================================================';
PRINT '✅ Vistas creadas exitosamente';
PRINT '========================================================';
PRINT '';
PRINT '📊 VISTAS DISPONIBLES:';
PRINT '   1. VistaResumenEspecialidad';
PRINT '   2. VistaResumenMensual';
PRINT '   3. VistaTopDoctores';
PRINT '   4. VistaAnalisisZonas';
PRINT '';
PRINT '💡 EJEMPLO DE USO:';
PRINT '   SELECT * FROM VistaResumenEspecialidad;';
PRINT '   SELECT * FROM VistaResumenMensual WHERE Año = 2025;';
PRINT '   SELECT TOP 10 * FROM VistaTopDoctores ORDER BY IngresoGenerado DESC;';
PRINT '========================================================';
GO















