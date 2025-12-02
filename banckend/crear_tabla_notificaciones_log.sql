-- ====== TABLA PARA LOG DE NOTIFICACIONES ======
-- Esta tabla guarda el historial de todas las notificaciones enviadas

CREATE TABLE IF NOT EXISTS `notificaciones_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `solicitud_id` INT NOT NULL,
  `tipo_notificacion` ENUM('WHATSAPP', 'EMAIL', 'SMS') NOT NULL,
  `destino` VARCHAR(255) NOT NULL COMMENT 'Número de teléfono o email',
  `mensaje` TEXT NOT NULL COMMENT 'Contenido del mensaje enviado',
  `estado_envio` ENUM('ENVIADO', 'ERROR', 'PENDIENTE') DEFAULT 'PENDIENTE',
  `fecha_envio` DATETIME NOT NULL,
  `error_detalle` TEXT NULL COMMENT 'Detalle del error si hubo',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_solicitud` (`solicitud_id`),
  INDEX `idx_fecha` (`fecha_envio`),
  INDEX `idx_tipo` (`tipo_notificacion`),
  FOREIGN KEY (`solicitud_id`) REFERENCES `solicitudes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comentario descriptivo
ALTER TABLE `notificaciones_log` COMMENT = 'Registro de todas las notificaciones enviadas a los solicitantes';





