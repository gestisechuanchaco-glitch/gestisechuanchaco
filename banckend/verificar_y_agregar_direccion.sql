-- ============================================
-- VERIFICAR Y AGREGAR COLUMNA 'direccion' SI NO EXISTE
-- ============================================
-- Ejecutar este script en MySQL Workbench o PHPMyAdmin

USE defensacivil;

-- Verificar si la columna 'direccion' existe
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'defensacivil' 
  AND TABLE_NAME = 'fiscalizaciones' 
  AND COLUMN_NAME = 'direccion';

-- Si no existe, agregarla
ALTER TABLE fiscalizaciones 
ADD COLUMN IF NOT EXISTS direccion TEXT NOT NULL DEFAULT '' COMMENT 'Dirección del establecimiento fiscalizado';

-- Verificar que se agregó correctamente
DESCRIBE fiscalizaciones;

-- ✅ Si sale "direccion" en la lista, está listo!










