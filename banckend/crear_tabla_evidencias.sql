-- Tabla para evidencias de fiscalizaciones
CREATE TABLE IF NOT EXISTS fiscalizacion_evidencias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fiscalizacion_id INT NOT NULL,
  nombre_archivo VARCHAR(255) NOT NULL,
  ruta_archivo VARCHAR(500) NOT NULL,
  tipo_archivo VARCHAR(100),
  tamanio_bytes INT,
  descripcion TEXT,
  orden INT DEFAULT 1,
  subido_por VARCHAR(100),
  subido_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fiscalizacion_id) REFERENCES fiscalizaciones(id) ON DELETE CASCADE,
  INDEX idx_fiscalizacion (fiscalizacion_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;








