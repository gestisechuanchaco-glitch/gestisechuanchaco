-- ============================================
-- SCRIPT DE LIMPIEZA COMPLETA (INCLUYE USUARIOS)
-- ============================================
-- PROPÓSITO: Eliminar TODOS los datos de prueba incluyendo usuarios
-- FECHA: 2025-10-24
-- 
-- ⚠️ ADVERTENCIA CRÍTICA: 
-- Este script elimina TODO excepto 1 usuario administrador
-- Solo úsalo si quieres empezar desde cero con usuarios reales
-- 
-- SE CONSERVARÁ:
-- - 1 usuario administrador (antonia)
-- - Roles (Administrador, Inspector, Administrativo)
-- - Estructura de tablas
-- 
-- MODO DE USO:
-- 1. Hacer backup primero (ejecutar backup_antes_limpieza.sql)
-- 2. Ejecutar este script solo si estás SEGURO
-- 3. Verificar que puedas hacer login con: antonia / tu_contraseña
-- ============================================

-- Desactivar verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1️⃣ ELIMINAR DATOS DE TABLAS RELACIONADAS
-- ============================================

TRUNCATE TABLE notificaciones;
SELECT '✅ Notificaciones eliminadas' AS mensaje;

TRUNCATE TABLE historial_cambios;
SELECT '✅ Historial de cambios eliminado' AS mensaje;

TRUNCATE TABLE panel_fotografico;
SELECT '✅ Panel fotográfico eliminado' AS mensaje;

TRUNCATE TABLE fiscalizacion_evidencias;
SELECT '✅ Evidencias de fiscalización eliminadas' AS mensaje;

TRUNCATE TABLE fiscalizaciones;
SELECT '✅ Fiscalizaciones eliminadas' AS mensaje;

TRUNCATE TABLE reportes;
SELECT '✅ Reportes eliminados' AS mensaje;

TRUNCATE TABLE locales;
SELECT '✅ Locales registrados eliminados' AS mensaje;

TRUNCATE TABLE solicitudes;
SELECT '✅ Solicitudes eliminadas' AS mensaje;

-- ============================================
-- 2️⃣ ELIMINAR USUARIOS DE PRUEBA
-- ============================================

-- Mantener solo el usuario administrador 'antonia'
DELETE FROM usuarios 
WHERE usuario != 'antonia';

SELECT '⚠️ Usuarios de prueba eliminados (conservado: antonia)' AS mensaje;

-- Verificar usuarios restantes
SELECT 
    id, 
    usuario, 
    rol_id,
    email,
    'Usuario conservado' AS estado
FROM usuarios;

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
-- NO reiniciar usuarios para mantener el ID del admin

SELECT '✅ Contadores AUTO_INCREMENT reiniciados' AS mensaje;

-- ============================================
-- 4️⃣ REACTIVAR VERIFICACIÓN DE CLAVES FORÁNEAS
-- ============================================

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 5️⃣ VERIFICAR LIMPIEZA COMPLETA
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

SELECT '🎉 LIMPIEZA COMPLETA FINALIZADA' AS mensaje;
SELECT '✅ Datos de prueba eliminados' AS datos;
SELECT '✅ Usuarios de prueba eliminados' AS usuarios;
SELECT '🔐 Usuario admin conservado: antonia' AS admin;
SELECT '⚠️ Debes crear nuevos usuarios reales' AS siguiente_paso;
SELECT '🚀 Sistema listo para producción' AS estado;

-- ============================================
-- 📋 SIGUIENTE PASO: CREAR USUARIOS REALES
-- ============================================

-- Ejemplo para crear un nuevo inspector:
-- INSERT INTO usuarios (usuario, nombre_completo, rol_id, contraseña, email, dni, telefono, cargo, departamento, fecha_ingreso, id_empleado)
-- VALUES (
--   'nombre_usuario',
--   'Nombre Completo',
--   2, -- 2 = Inspector
--   '$2b$10$...', -- Usar bcrypt para hashear la contraseña
--   'email@municipalidad.gob.pe',
--   '12345678',
--   '987654321',
--   'Inspector de Defensa Civil',
--   'Defensa Civil',
--   CURDATE(),
--   'EMP001'
-- );









