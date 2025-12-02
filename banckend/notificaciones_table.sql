-- ============================================
-- TABLA: notificaciones
-- Sistema de notificaciones por rol
-- ============================================

CREATE TABLE IF NOT EXISTS `notificaciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Destinatario
  `usuario_id` INT NULL COMMENT 'ID del usuario destinatario (NULL = todos los del rol)',
  `rol_destino` ENUM('administrador', 'administrativo', 'inspector') NOT NULL COMMENT 'Rol al que va dirigida',
  
  -- Contenido
  `tipo` VARCHAR(50) NOT NULL COMMENT 'asignacion_inspeccion, aceptacion_solicitud, nueva_fiscalizacion, etc',
  `titulo` VARCHAR(255) NOT NULL,
  `mensaje` TEXT NOT NULL,
  `icono` VARCHAR(50) DEFAULT 'fa-bell' COMMENT 'Icono FontAwesome',
  
  -- Referencia
  `referencia_tipo` VARCHAR(50) NULL COMMENT 'solicitud, fiscalizacion, inspeccion',
  `referencia_id` INT NULL COMMENT 'ID del registro relacionado',
  `expediente` VARCHAR(50) NULL COMMENT 'N° expediente para identificación rápida',
  
  -- Estado
  `leida` BOOLEAN DEFAULT FALSE,
  `fecha_leida` TIMESTAMP NULL,
  
  -- Auditoría
  `creado_por` VARCHAR(100) NULL,
  `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX `idx_usuario_leida` (`usuario_id`, `leida`),
  INDEX `idx_rol_leida` (`rol_destino`, `leida`),
  INDEX `idx_tipo` (`tipo`),
  INDEX `idx_referencia` (`referencia_tipo`, `referencia_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insertar notificaciones de ejemplo
INSERT INTO `notificaciones` 
  (`rol_destino`, `tipo`, `titulo`, `mensaje`, `icono`, `referencia_tipo`, `referencia_id`, `expediente`, `creado_por`) 
VALUES
  ('administrador', 'nueva_solicitud', 'Nueva solicitud ITSE', 'Se ha registrado una nueva solicitud ITSE #EXP-2025-001', 'fa-file-alt', 'solicitud', 1, 'EXP-2025-001', 'Sistema'),
  ('inspector', 'asignacion_inspeccion', 'Nueva inspección asignada', 'Se te ha asignado la inspección del expediente EXP-2025-001', 'fa-clipboard-check', 'solicitud', 1, 'EXP-2025-001', 'Sistema'),
  ('administrativo', 'aceptacion_solicitud', 'Solicitud aceptada', 'El inspector ha aceptado la solicitud EXP-2025-001', 'fa-check-circle', 'solicitud', 1, 'EXP-2025-001', 'Sistema');




