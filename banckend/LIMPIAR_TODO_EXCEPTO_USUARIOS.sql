-- ============================================
-- SCRIPT DE LIMPIEZA TOTAL
-- ============================================
-- PROPÓSITO: Eliminar TODOS los datos de TODAS las tablas
-- EXCEPTO: usuarios y roles
-- FECHA: 2025-10-24
-- 
-- ⚠️ IMPORTANTE: 
-- Este script elimina TODOS los datos de prueba
-- Se conservan SOLO:
-- - ✅ Usuarios (tabla usuarios)
-- - ✅ Roles (tabla roles)
-- - ✅ Estructura de tablas (no se eliminan tablas)
-- 
-- SE ELIMINAN:
-- - ❌ Todas las solicitudes
-- - ❌ Todos los locales
-- - ❌ Todos los reportes
-- - ❌ Todas las fiscalizaciones
-- - ❌ Todas las evidencias
-- - ❌ Todas las fotos del panel fotográfico
-- - ❌ Todas las notificaciones
-- - ❌ Todo el historial de cambios
-- 
-- MODO DE USO:
-- 1. Abrir MySQL Workbench
-- 2. Conectarse a base de datos defensa_civil_bd
-- 3. Ejecutar este script completo (F5)
-- 4. Verificar resultado
-- ============================================

-- ============================================
-- 1️⃣ DESACTIVAR VERIFICACIÓN DE CLAVES FORÁNEAS
-- ============================================
SET FOREIGN_KEY_CHECKS = 0;
SELECT '🔓 Claves foráneas desactivadas temporalmente' AS mensaje;

-- ============================================
-- 2️⃣ ELIMINAR DATOS DE TODAS LAS TABLAS
-- ============================================

-- 🗑️ Notificaciones
TRUNCATE TABLE notificaciones;
SELECT '✅ Tabla notificaciones limpiada' AS resultado;

-- 🗑️ Historial de cambios
TRUNCATE TABLE historial_cambios;
SELECT '✅ Tabla historial_cambios limpiada' AS resultado;

-- 🗑️ Panel fotográfico (fotos de inspecciones)
TRUNCATE TABLE panel_fotografico;
SELECT '✅ Tabla panel_fotografico limpiada' AS resultado;

-- 🗑️ Evidencias de fiscalización
TRUNCATE TABLE fiscalizacion_evidencias;
SELECT '✅ Tabla fiscalizacion_evidencias limpiada' AS resultado;

-- 🗑️ Fiscalizaciones
TRUNCATE TABLE fiscalizaciones;
SELECT '✅ Tabla fiscalizaciones limpiada' AS resultado;

-- 🗑️ Reportes
TRUNCATE TABLE reportes;
SELECT '✅ Tabla reportes limpiada' AS resultado;

-- 🗑️ Locales registrados
TRUNCATE TABLE locales;
SELECT '✅ Tabla locales limpiada' AS resultado;

-- 🗑️ Solicitudes
TRUNCATE TABLE solicitudes;
SELECT '✅ Tabla solicitudes limpiada' AS resultado;

-- ============================================
-- 3️⃣ REINICIAR AUTO_INCREMENT DE TODAS LAS TABLAS
-- ============================================

ALTER TABLE solicitudes AUTO_INCREMENT = 1;
ALTER TABLE locales AUTO_INCREMENT = 1;
ALTER TABLE reportes AUTO_INCREMENT = 1;
ALTER TABLE fiscalizaciones AUTO_INCREMENT = 1;
ALTER TABLE fiscalizacion_evidencias AUTO_INCREMENT = 1;
ALTER TABLE panel_fotografico AUTO_INCREMENT = 1;
ALTER TABLE historial_cambios AUTO_INCREMENT = 1;
ALTER TABLE notificaciones AUTO_INCREMENT = 1;

-- NO reiniciar usuarios ni roles
SELECT '✅ Contadores AUTO_INCREMENT reiniciados' AS resultado;

-- ============================================
-- 4️⃣ REACTIVAR VERIFICACIÓN DE CLAVES FORÁNEAS
-- ============================================
SET FOREIGN_KEY_CHECKS = 1;
SELECT '🔒 Claves foráneas reactivadas' AS mensaje;

-- ============================================
-- 5️⃣ VERIFICAR LIMPIEZA COMPLETA
-- ============================================

SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS separador;
SELECT '📊 VERIFICACIÓN DE LIMPIEZA' AS titulo;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS separador;

SELECT 
    'solicitudes' AS tabla,
    COUNT(*) AS registros_restantes,
    CASE WHEN COUNT(*) = 0 THEN '✅ LIMPIA' ELSE '⚠️ CON DATOS' END AS estado
FROM solicitudes

UNION ALL

SELECT 
    'locales' AS tabla,
    COUNT(*) AS registros_restantes,
    CASE WHEN COUNT(*) = 0 THEN '✅ LIMPIA' ELSE '⚠️ CON DATOS' END AS estado
FROM locales

UNION ALL

SELECT 
    'reportes' AS tabla,
    COUNT(*) AS registros_restantes,
    CASE WHEN COUNT(*) = 0 THEN '✅ LIMPIA' ELSE '⚠️ CON DATOS' END AS estado
FROM reportes

UNION ALL

SELECT 
    'fiscalizaciones' AS tabla,
    COUNT(*) AS registros_restantes,
    CASE WHEN COUNT(*) = 0 THEN '✅ LIMPIA' ELSE '⚠️ CON DATOS' END AS estado
FROM fiscalizaciones

UNION ALL

SELECT 
    'fiscalizacion_evidencias' AS tabla,
    COUNT(*) AS registros_restantes,
    CASE WHEN COUNT(*) = 0 THEN '✅ LIMPIA' ELSE '⚠️ CON DATOS' END AS estado
FROM fiscalizacion_evidencias

UNION ALL

SELECT 
    'panel_fotografico' AS tabla,
    COUNT(*) AS registros_restantes,
    CASE WHEN COUNT(*) = 0 THEN '✅ LIMPIA' ELSE '⚠️ CON DATOS' END AS estado
FROM panel_fotografico

UNION ALL

SELECT 
    'notificaciones' AS tabla,
    COUNT(*) AS registros_restantes,
    CASE WHEN COUNT(*) = 0 THEN '✅ LIMPIA' ELSE '⚠️ CON DATOS' END AS estado
FROM notificaciones

UNION ALL

SELECT 
    'historial_cambios' AS tabla,
    COUNT(*) AS registros_restantes,
    CASE WHEN COUNT(*) = 0 THEN '✅ LIMPIA' ELSE '⚠️ CON DATOS' END AS estado
FROM historial_cambios

UNION ALL

SELECT 
    '━━━━━━━━━━━━━━━━━' AS tabla,
    NULL AS registros_restantes,
    'TABLAS CONSERVADAS' AS estado

UNION ALL

SELECT 
    'usuarios' AS tabla,
    COUNT(*) AS registros_restantes,
    CASE WHEN COUNT(*) > 0 THEN '✅ CONSERVADOS' ELSE '❌ ERROR' END AS estado
FROM usuarios

UNION ALL

SELECT 
    'roles' AS tabla,
    COUNT(*) AS registros_restantes,
    CASE WHEN COUNT(*) > 0 THEN '✅ CONSERVADOS' ELSE '❌ ERROR' END AS estado
FROM roles;

-- ============================================
-- 6️⃣ RESUMEN FINAL
-- ============================================

SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS separador;
SELECT '🎉 LIMPIEZA COMPLETADA EXITOSAMENTE' AS mensaje;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS separador;

SELECT 
    '✅' AS icono,
    'Todos los datos de prueba eliminados' AS accion;

SELECT 
    '✅' AS icono,
    'Contadores AUTO_INCREMENT reiniciados' AS accion;

SELECT 
    '🔒' AS icono,
    'Usuarios conservados intactos' AS accion;

SELECT 
    '🔒' AS icono,
    'Roles conservados intactos' AS accion;

SELECT 
    '🚀' AS icono,
    'Base de datos lista para datos reales' AS accion;

SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS separador;

-- ============================================
-- 7️⃣ SIGUIENTES PASOS
-- ============================================

SELECT '📋 SIGUIENTES PASOS RECOMENDADOS:' AS titulo;

SELECT 
    '1' AS paso,
    'Reiniciar el backend (Ctrl+C y luego: node index.js)' AS descripcion
UNION ALL
SELECT 
    '2' AS paso,
    'Limpiar localStorage del navegador (F12 > Application > Clear storage)' AS descripcion
UNION ALL
SELECT 
    '3' AS paso,
    'Eliminar fotos de banckend/uploads/ (del *.jpg *.png *.jpeg)' AS descripcion
UNION ALL
SELECT 
    '4' AS paso,
    'Recargar el frontend (Ctrl+F5)' AS descripcion
UNION ALL
SELECT 
    '5' AS paso,
    'Iniciar sesión y comenzar a ingresar datos reales' AS descripcion;

SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS separador;
SELECT '✅ Script completado sin errores' AS estado_final;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS separador;









