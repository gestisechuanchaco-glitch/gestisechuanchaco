-- ============================================
-- AGREGAR COLUMNAS DE UBICACIÓN GPS
-- ============================================
-- Ejecutar este script en MySQL Workbench o PHPMyAdmin

USE defensacivil;

-- Agregar columnas latitud y longitud a la tabla fiscalizaciones
ALTER TABLE fiscalizaciones 
ADD COLUMN latitud DECIMAL(10, 8) NULL COMMENT 'Latitud GPS del lugar fiscalizado',
ADD COLUMN longitud DECIMAL(11, 8) NULL COMMENT 'Longitud GPS del lugar fiscalizado';

-- Verificar que se agregaron correctamente
DESCRIBE fiscalizaciones;

-- ✅ Si sale "latitud" y "longitud" en la lista, está listo!

