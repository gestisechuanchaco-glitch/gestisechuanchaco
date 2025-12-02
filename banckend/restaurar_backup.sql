-- ============================================
-- SCRIPT DE RESTAURACIÓN DESDE BACKUP
-- ============================================
-- PROPÓSITO: Restaurar datos desde las tablas de backup
-- FECHA: 2025-10-24
-- 
-- ⚠️ IMPORTANTE: 
-- Solo ejecutar si necesitas recuperar los datos de prueba
-- después de haber ejecutado limpiar_datos_prueba.sql
-- 
-- MODO DE USO:
-- 1. Verificar que existan las tablas backup_*
-- 2. Ejecutar este script en MySQL Workbench o terminal
-- 3. Los datos se restaurarán desde el backup
-- ============================================

-- Desactivar verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- LIMPIAR DATOS ACTUALES
-- ============================================

TRUNCATE TABLE notificaciones;
TRUNCATE TABLE historial_cambios;
TRUNCATE TABLE panel_fotografico;
TRUNCATE TABLE fiscalizacion_evidencias;
TRUNCATE TABLE fiscalizaciones;
TRUNCATE TABLE reportes;
TRUNCATE TABLE locales;
TRUNCATE TABLE solicitudes;

SELECT '✅ Datos actuales eliminados' AS mensaje;

-- ============================================
-- RESTAURAR DESDE BACKUP
-- ============================================

-- 📋 Restaurar solicitudes
INSERT INTO solicitudes SELECT * FROM backup_solicitudes;
SELECT COUNT(*) AS 'Solicitudes restauradas' FROM solicitudes;

-- 🏪 Restaurar locales
INSERT INTO locales SELECT * FROM backup_locales;
SELECT COUNT(*) AS 'Locales restaurados' FROM locales;

-- 📊 Restaurar reportes
INSERT INTO reportes SELECT * FROM backup_reportes;
SELECT COUNT(*) AS 'Reportes restaurados' FROM reportes;

-- 🔍 Restaurar fiscalizaciones
INSERT INTO fiscalizaciones SELECT * FROM backup_fiscalizaciones;
SELECT COUNT(*) AS 'Fiscalizaciones restauradas' FROM fiscalizaciones;

-- 📸 Restaurar fiscalizacion_evidencias
INSERT INTO fiscalizacion_evidencias SELECT * FROM backup_fiscalizacion_evidencias;
SELECT COUNT(*) AS 'Evidencias restauradas' FROM fiscalizacion_evidencias;

-- 📷 Restaurar panel_fotografico
INSERT INTO panel_fotografico SELECT * FROM backup_panel_fotografico;
SELECT COUNT(*) AS 'Fotos panel restauradas' FROM panel_fotografico;

-- 🔔 Restaurar notificaciones
INSERT INTO notificaciones SELECT * FROM backup_notificaciones;
SELECT COUNT(*) AS 'Notificaciones restauradas' FROM notificaciones;

-- 📜 Restaurar historial_cambios
INSERT INTO historial_cambios SELECT * FROM backup_historial_cambios;
SELECT COUNT(*) AS 'Historial restaurado' FROM historial_cambios;

-- Reactivar verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- VERIFICAR RESTAURACIÓN
-- ============================================

SELECT 
    'solicitudes' AS tabla,
    COUNT(*) AS registros_restaurados
FROM solicitudes

UNION ALL

SELECT 
    'locales' AS tabla,
    COUNT(*) AS registros_restaurados
FROM locales

UNION ALL

SELECT 
    'reportes' AS tabla,
    COUNT(*) AS registros_restaurados
FROM reportes

UNION ALL

SELECT 
    'fiscalizaciones' AS tabla,
    COUNT(*) AS registros_restaurados
FROM fiscalizaciones

UNION ALL

SELECT 
    'panel_fotografico' AS tabla,
    COUNT(*) AS registros_restaurados
FROM panel_fotografico

UNION ALL

SELECT 
    'notificaciones' AS tabla,
    COUNT(*) AS registros_restaurados
FROM notificaciones

UNION ALL

SELECT 
    'historial_cambios' AS tabla,
    COUNT(*) AS registros_restaurados
FROM historial_cambios;

-- ============================================
-- ✅ RESUMEN
-- ============================================

SELECT '🎉 RESTAURACIÓN COMPLETADA EXITOSAMENTE' AS mensaje;
SELECT '✅ Datos de prueba restaurados desde backup' AS estado;
SELECT '⚠️ Los datos actuales fueron reemplazados' AS advertencia;









