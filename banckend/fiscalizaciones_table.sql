-- ============================================
-- TABLA: fiscalizaciones
-- Gestión de fiscalizaciones a establecimientos
-- ============================================

CREATE TABLE IF NOT EXISTS `fiscalizaciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Datos básicos
  `numero_fiscalizacion` VARCHAR(50) UNIQUE NOT NULL COMMENT 'FISC-2025-001',
  `fecha_fiscalizacion` DATETIME NOT NULL,
  `origen` ENUM('Oficio', 'Denuncia', 'Post-ITSE', 'Operativo', 'Reinspección') DEFAULT 'Oficio',
  `expediente_relacionado` VARCHAR(50) NULL COMMENT 'N° de expediente ITSE relacionado',
  
  -- Establecimiento fiscalizado
  `razon_social` VARCHAR(255) NOT NULL,
  `ruc` VARCHAR(11) NULL,
  `direccion` TEXT NOT NULL,
  `giro` VARCHAR(255) NULL COMMENT 'Actividad comercial',
  
  -- Inspector
  `inspector_id` INT NULL,
  
  -- Infracción
  `tipo_infraccion` VARCHAR(255) NOT NULL,
  `descripcion_infraccion` TEXT NOT NULL,
  `codigo_infraccion` VARCHAR(50) NULL,
  `base_legal` VARCHAR(255) NULL COMMENT 'Ord. 007-2022-MDH, Ley 27972, etc',
  `gravedad` ENUM('Leve', 'Grave', 'Muy Grave') DEFAULT 'Leve',
  
  -- Documentos generados
  `acta_numero` VARCHAR(50) NULL COMMENT 'N° Acta de Constatación',
  `notificacion_numero` VARCHAR(50) NULL COMMENT 'N° Notificación de Infracción',
  
  -- Resultados
  `monto_multa` DECIMAL(10,2) DEFAULT 0.00,
  `plazo_subsanacion` INT NULL COMMENT 'Días para subsanar',
  `medida_adoptada` VARCHAR(255) NULL COMMENT 'Notificación/Multa/Cierre',
  
  -- Seguimiento
  `fecha_notificacion` DATE NULL,
  `fecha_limite_subsanacion` DATE NULL,
  `fecha_reinspeccion` DATE NULL,
  `estado` ENUM('Programada', 'En Ejecución', 'Ejecutada', 'Notificada', 'Subsanada', 'Multada', 'Cerrado') DEFAULT 'Programada',
  `resultado_final` VARCHAR(255) NULL,
  
  -- Observaciones
  `observaciones` TEXT NULL,
  
  -- Auditoría
  `creado_por` VARCHAR(100) NULL,
  `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Índices
  INDEX `idx_numero` (`numero_fiscalizacion`),
  INDEX `idx_fecha` (`fecha_fiscalizacion`),
  INDEX `idx_estado` (`estado`),
  INDEX `idx_inspector` (`inspector_id`),
  INDEX `idx_expediente` (`expediente_relacionado`),
  
  -- Foreign Keys
  CONSTRAINT `fk_fiscalizacion_inspector` 
    FOREIGN KEY (`inspector_id`) 
    REFERENCES `usuarios`(`id`) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar datos de ejemplo
INSERT INTO `fiscalizaciones` (
  `numero_fiscalizacion`,
  `fecha_fiscalizacion`,
  `origen`,
  `razon_social`,
  `ruc`,
  `direccion`,
  `giro`,
  `inspector_id`,
  `tipo_infraccion`,
  `descripcion_infraccion`,
  `codigo_infraccion`,
  `base_legal`,
  `gravedad`,
  `acta_numero`,
  `monto_multa`,
  `plazo_subsanacion`,
  `medida_adoptada`,
  `estado`
) VALUES
(
  'FISC-2025-001',
  '2025-01-15 10:30:00',
  'Operativo',
  'ROYLI REYNA ARIRAMA',
  '20187738488',
  'CP. VICTOR RAUL',
  'Bodega',
  2,
  'Falta de Certificado ITSE',
  'El establecimiento no cuenta con Certificado ITSE vigente',
  'INF-001',
  'Ordenanza 007-2022-MDH',
  'Grave',
  'ACTA-206-2024',
  1500.00,
  15,
  'Notificación de Infracción',
  'Notificada'
),
(
  'FISC-2025-002',
  '2025-01-18 14:00:00',
  'Denuncia',
  'Comercial El Sol SAC',
  '20145678901',
  'Av. Principal 456, Huanchaco',
  'Restaurante',
  2,
  'Condiciones Inseguras',
  'Salidas de emergencia bloqueadas con cajas de productos',
  'INF-003',
  'Ley 28976',
  'Muy Grave',
  'ACTA-207-2024',
  3000.00,
  10,
  'Multa y Cierre Temporal',
  'Multada'
);


