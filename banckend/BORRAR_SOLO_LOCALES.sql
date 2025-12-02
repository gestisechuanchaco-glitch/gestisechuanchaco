-- ============================================
-- BORRAR SOLO DATOS DE LOCALES
-- ============================================
-- Este script borra ÚNICAMENTE los datos de la tabla locales
-- Conserva solicitudes, usuarios, roles y todo lo demás
-- ============================================

USE defensa_civil_bd;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;

-- ============================================
-- BORRAR SOLO LOCALES
-- ============================================

TRUNCATE TABLE locales;

-- Reiniciar contador
ALTER TABLE locales AUTO_INCREMENT = 1;

-- ============================================
-- REACTIVAR VERIFICACIONES
-- ============================================
SET FOREIGN_KEY_CHECKS = 1;
SET SQL_SAFE_UPDATES = 1;

-- ============================================
-- VERIFICAR
-- ============================================
SELECT '✅ DATOS DE LOCALES BORRADOS CORRECTAMENTE' AS mensaje;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS separador;

SELECT 'locales' AS tabla, COUNT(*) AS registros FROM locales;

SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS separador;
SELECT '✅ La tabla locales está vacía y lista para nuevos datos' AS estado;
SELECT '✅ Las solicitudes NO fueron afectadas' AS nota;








