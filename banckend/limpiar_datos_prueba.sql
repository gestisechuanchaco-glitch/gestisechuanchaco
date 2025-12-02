-- ============================================
-- SCRIPT DE LIMPIEZA DE DATOS DE PRUEBA
-- ============================================
-- PROPÓSITO: Eliminar datos de prueba para empezar con datos reales
-- FECHA: 2025-10-24
-- 
-- ⚠️ IMPORTANTE: 
-- Este script elimina TODOS los datos de prueba pero mantiene:
-- - Usuarios y contraseñas
-- - Roles
-- - Estructura de tablas
-- 
-- MODO DE USO:
-- 1. Hacer backup primero (ejecutar backup_antes_limpieza.sql)
-- 2. Ejecutar este script en MySQL Workbench o terminal
-- 3. Verificar que se hayan eliminado los datos correctamente
-- ============================================

-- 1️⃣ DESACTIVAR VERIFICACIÓN DE CLAVES FORÁNEAS TEMPORALMENTE
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 2️⃣ ELIMINAR DATOS DE TABLAS RELACIONADAS
-- ============================================

-- 🗑️ Limpiar notificaciones
TRUNCATE TABLE notificaciones;
SELECT '✅ Notificaciones eliminadas' AS mensaje;

-- 🗑️ Limpiar historial de cambios
TRUNCATE TABLE historial_cambios;
SELECT '✅ Historial de cambios eliminado' AS mensaje;

-- 🗑️ Limpiar panel fotográfico (fotos de inspecciones)
TRUNCATE TABLE panel_fotografico;
SELECT '✅ Panel fotográfico eliminado' AS mensaje;

-- 🗑️ Limpiar evidencias de fiscalización
TRUNCATE TABLE fiscalizacion_evidencias;
SELECT '✅ Evidencias de fiscalización eliminadas' AS mensaje;

-- 🗑️ Limpiar fiscalizaciones
TRUNCATE TABLE fiscalizaciones;
SELECT '✅ Fiscalizaciones eliminadas' AS mensaje;

-- 🗑️ Limpiar reportes
TRUNCATE TABLE reportes;
SELECT '✅ Reportes eliminados' AS mensaje;

-- 🗑️ Limpiar locales registrados
TRUNCATE TABLE locales;
SELECT '✅ Locales registrados eliminados' AS mensaje;

-- 🗑️ Limpiar solicitudes
TRUNCATE TABLE solicitudes;
SELECT '✅ Solicitudes eliminadas' AS mensaje;

-- ============================================
-- 3️⃣ REINICIAR AUTO_INCREMENT
-- ============================================

ALTER TABLE solicitudes AUTO_INCREMENT = 1;
ALTER TABLE locales AUTO_INCREMENT = 1;
ALTER TABLE reportes AUTO_INCREMENT = 1;
ALTER TABLE fiscalizaciones AUTO_INCREMENT = 1;
ALTER TABLE fiscalizacion_evidencias AUTO_INCREMENT = 1;
ALTER TABLE panel_fotografico AUTO_INCREMENT = 1;
ALTER TABLE historial_cambios AUTO_INCREMENT = 1;
ALTER TABLE notificaciones AUTO_INCREMENT = 1;

SELECT '✅ Contadores AUTO_INCREMENT reiniciados' AS mensaje;

-- ============================================
-- 4️⃣ REACTIVAR VERIFICACIÓN DE CLAVES FORÁNEAS
-- ============================================

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 5️⃣ VERIFICAR LIMPIEZA
-- ============================================

SELECT 
    'solicitudes' AS tabla,
    COUNT(*) AS registros_restantes
FROM solicitudes

UNION ALL

SELECT 
    'locales' AS tabla,
    COUNT(*) AS registros_restantes
FROM locales

UNION ALL

SELECT 
    'reportes' AS tabla,
    COUNT(*) AS registros_restantes
FROM reportes

UNION ALL

SELECT 
    'fiscalizaciones' AS tabla,
    COUNT(*) AS registros_restantes
FROM fiscalizaciones

UNION ALL

SELECT 
    'panel_fotografico' AS tabla,
    COUNT(*) AS registros_restantes
FROM panel_fotografico

UNION ALL

SELECT 
    'notificaciones' AS tabla,
    COUNT(*) AS registros_restantes
FROM notificaciones

UNION ALL

SELECT 
    'historial_cambios' AS tabla,
    COUNT(*) AS registros_restantes
FROM historial_cambios

UNION ALL

SELECT 
    'usuarios' AS tabla,
    COUNT(*) AS registros_restantes
FROM usuarios;

-- ============================================
-- ✅ RESUMEN
-- ============================================

SELECT '🎉 LIMPIEZA COMPLETADA EXITOSAMENTE' AS mensaje;
SELECT '✅ Datos de prueba eliminados' AS estado;
SELECT '✅ Usuarios y roles conservados' AS usuarios;
SELECT '✅ Base de datos lista para datos reales' AS siguiente_paso;









