-- ============================================
-- SCRIPT DE BACKUP ANTES DE LIMPIEZA
-- ============================================
-- PROPÓSITO: Crear respaldo de seguridad antes de eliminar datos de prueba
-- FECHA: 2025-10-24
-- 
-- MODO DE USO:
-- 1. Ejecutar este script ANTES de limpiar_datos_prueba.sql
-- 2. Guarda una copia de todos los datos en tablas de backup
-- 3. Si necesitas restaurar, ejecutar restaurar_backup.sql
-- ============================================

-- Desactivar verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- CREAR TABLAS DE BACKUP
-- ============================================

-- 📋 Backup de solicitudes
DROP TABLE IF EXISTS backup_solicitudes;
CREATE TABLE backup_solicitudes AS SELECT * FROM solicitudes;
SELECT COUNT(*) AS 'Solicitudes respaldadas' FROM backup_solicitudes;

-- 🏪 Backup de locales
DROP TABLE IF EXISTS backup_locales;
CREATE TABLE backup_locales AS SELECT * FROM locales;
SELECT COUNT(*) AS 'Locales respaldados' FROM backup_locales;

-- 📊 Backup de reportes
DROP TABLE IF EXISTS backup_reportes;
CREATE TABLE backup_reportes AS SELECT * FROM reportes;
SELECT COUNT(*) AS 'Reportes respaldados' FROM backup_reportes;

-- 🔍 Backup de fiscalizaciones
DROP TABLE IF EXISTS backup_fiscalizaciones;
CREATE TABLE backup_fiscalizaciones AS SELECT * FROM fiscalizaciones;
SELECT COUNT(*) AS 'Fiscalizaciones respaldadas' FROM backup_fiscalizaciones;

-- 📸 Backup de fiscalizacion_evidencias
DROP TABLE IF EXISTS backup_fiscalizacion_evidencias;
CREATE TABLE backup_fiscalizacion_evidencias AS SELECT * FROM fiscalizacion_evidencias;
SELECT COUNT(*) AS 'Evidencias respaldadas' FROM backup_fiscalizacion_evidencias;

-- 📷 Backup de panel_fotografico
DROP TABLE IF EXISTS backup_panel_fotografico;
CREATE TABLE backup_panel_fotografico AS SELECT * FROM panel_fotografico;
SELECT COUNT(*) AS 'Fotos panel respaldadas' FROM backup_panel_fotografico;

-- 🔔 Backup de notificaciones
DROP TABLE IF EXISTS backup_notificaciones;
CREATE TABLE backup_notificaciones AS SELECT * FROM notificaciones;
SELECT COUNT(*) AS 'Notificaciones respaldadas' FROM backup_notificaciones;

-- 📜 Backup de historial_cambios
DROP TABLE IF EXISTS backup_historial_cambios;
CREATE TABLE backup_historial_cambios AS SELECT * FROM historial_cambios;
SELECT COUNT(*) AS 'Historial respaldado' FROM backup_historial_cambios;

-- Reactivar verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- VERIFICAR BACKUP
-- ============================================

SELECT 
    'backup_solicitudes' AS tabla_backup,
    COUNT(*) AS registros_respaldados
FROM backup_solicitudes

UNION ALL

SELECT 
    'backup_locales' AS tabla_backup,
    COUNT(*) AS registros_respaldados
FROM backup_locales

UNION ALL

SELECT 
    'backup_reportes' AS tabla_backup,
    COUNT(*) AS registros_respaldados
FROM backup_reportes

UNION ALL

SELECT 
    'backup_fiscalizaciones' AS tabla_backup,
    COUNT(*) AS registros_respaldados
FROM backup_fiscalizaciones

UNION ALL

SELECT 
    'backup_panel_fotografico' AS tabla_backup,
    COUNT(*) AS registros_respaldados
FROM backup_panel_fotografico

UNION ALL

SELECT 
    'backup_notificaciones' AS tabla_backup,
    COUNT(*) AS registros_respaldados
FROM backup_notificaciones

UNION ALL

SELECT 
    'backup_historial_cambios' AS tabla_backup,
    COUNT(*) AS registros_respaldados
FROM backup_historial_cambios;

-- ============================================
-- ✅ RESUMEN
-- ============================================

SELECT '🎉 BACKUP COMPLETADO EXITOSAMENTE' AS mensaje;
SELECT '✅ Todos los datos respaldados en tablas backup_*' AS estado;
SELECT '✅ Ahora puedes ejecutar limpiar_datos_prueba.sql' AS siguiente_paso;
SELECT '⚠️ Las tablas de backup se conservarán para restauración' AS nota;









