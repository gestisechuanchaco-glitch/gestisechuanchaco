-- ============================================
-- BACKUP DE SEGURIDAD - TABLA USUARIOS
-- Fecha: 2025-10-23
-- Propósito: Backup antes de implementar bcrypt
-- ============================================

-- Crear backup completo de la tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios_backup_antes_bcrypt AS SELECT * FROM usuarios;

-- Verificar que el backup se creó correctamente
SELECT 
  COUNT(*) as total_usuarios_backup,
  'Backup creado exitosamente' as estado
FROM usuarios_backup_antes_bcrypt;

-- Mostrar usuarios en el backup
SELECT id, usuario, rol_id, email, fecha_creacion 
FROM usuarios_backup_antes_bcrypt
ORDER BY id;









