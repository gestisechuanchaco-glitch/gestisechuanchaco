-- ============================================
-- BORRAR DATOS INSERTADOS RÁPIDAMENTE
-- ============================================
-- Este script borra SOLO los datos de solicitudes y locales
-- sin tocar otras tablas
-- ============================================

USE defensa_civil_bd;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;

-- ============================================
-- BORRAR DATOS DE LOCALES Y SOLICITUDES
-- ============================================

TRUNCATE TABLE locales;
TRUNCATE TABLE solicitudes;

-- Reiniciar contadores
ALTER TABLE locales AUTO_INCREMENT = 1;
ALTER TABLE solicitudes AUTO_INCREMENT = 1;

-- ============================================
-- REACTIVAR VERIFICACIONES
-- ============================================
SET FOREIGN_KEY_CHECKS = 1;
SET SQL_SAFE_UPDATES = 1;

-- ============================================
-- VERIFICAR
-- ============================================
SELECT '✅ DATOS BORRADOS CORRECTAMENTE' AS mensaje;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS separador;

SELECT 'solicitudes' AS tabla, COUNT(*) AS registros FROM solicitudes
UNION ALL
SELECT 'locales' AS tabla, COUNT(*) AS registros FROM locales;

SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS separador;
SELECT '✅ Ambas tablas están vacías y listas para nuevos datos' AS estado;








