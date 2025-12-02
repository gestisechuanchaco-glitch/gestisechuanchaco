-- ============================================
-- SCRIPT PARA INSERTAR SOLICITUDES REALES
-- ============================================
-- PROPÓSITO: Insertar datos reales de solicitudes ITSE
-- FECHA: 2025-10-24
-- CREADO POR: ING. PERU LIBERTAD MENDEZ ALAYO
--
-- INSTRUCCIONES:
-- 1. Reemplaza los datos de ejemplo con tus datos reales
-- 2. Ejecuta este script en MySQL Workbench
-- 3. Verifica que se hayan insertado correctamente
-- ============================================

-- Desactivar verificación de claves foráneas temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- INSERTAR SOLICITUDES REALES
-- ============================================

INSERT INTO solicitudes (
  -- DATOS DEL SOLICITANTE
  rol,
  nombres_apellidos,
  dni_ce,
  domicilio,
  correo,
  telefonos,
  
  -- TIPO DE TRÁMITE
  tipo_tramite,
  tipo_itse,
  tipo_ecse,
  
  -- DATOS DEL ESTABLECIMIENTO
  razon_social,
  ruc,
  nombre_comercial,
  telefonos_establecimiento,
  direccion,
  referencia,
  localidad,
  distrito,
  provincia,
  departamento,
  
  -- UBICACIÓN (OPCIONAL)
  latitud,
  longitud,
  
  -- CARACTERÍSTICAS DEL ESTABLECIMIENTO
  giro_actividades,
  actividad_especifica,
  horario_atencion,
  area_ocupada,
  num_pisos,
  piso_ubicado,
  area_terreno,
  area_techada_por_nivel,
  area_libre,
  antiguedad_edificacion_anios,
  antiguedad_actividad_anios,
  
  -- EVALUACIÓN DE RIESGO
  riesgo_incendio,
  riesgo_colapso,
  riesgo_detalle,
  aforo_declarado,
  
  -- ASIGNACIÓN Y ESTADO
  inspector_asignado,
  numerodeexpediente,
  estado,
  fecha_inicio,
  fecha,
  
  -- AUDITORÍA
  creadoPor,
  modificadoPor,
  confiabilidad_ml
)
VALUES
-- ============================================
-- SOLICITUD 1: EJEMPLO - REEMPLAZAR CON DATOS REALES
-- ============================================
(
  'Propietario',                                    -- rol
  'JUAN CARLOS RODRIGUEZ PEREZ',                    -- nombres_apellidos
  '12345678',                                       -- dni_ce
  'AV. LARCO 1234, TRUJILLO',                       -- domicilio
  'jrodriguez@email.com',                           -- correo
  '987654321',                                      -- telefonos
  
  'itse',                                           -- tipo_tramite
  'Básico Ex Post',                                 -- tipo_itse
  NULL,                                             -- tipo_ecse
  
  'COMERCIAL SAN MARTIN S.A.C.',                    -- razon_social
  '20123456789',                                    -- ruc
  'BODEGA SAN MARTIN',                              -- nombre_comercial
  '044-123456',                                     -- telefonos_establecimiento
  'JR. BOLIVAR 456, HUANCHACO',                     -- direccion
  'A UNA CUADRA DE LA PLAZA',                       -- referencia
  'HUANCHACO',                                      -- localidad
  'HUANCHACO',                                      -- distrito
  'TRUJILLO',                                       -- provincia
  'LA LIBERTAD',                                    -- departamento
  
  -8.0833,                                          -- latitud (EJEMPLO)
  -79.1167,                                         -- longitud (EJEMPLO)
  
  'COMERCIO DE ABARROTES',                          -- giro_actividades
  'VENTA AL POR MENOR DE PRODUCTOS ALIMENTICIOS',  -- actividad_especifica
  'L-S: 8:00-20:00',                                -- horario_atencion
  50.00,                                            -- area_ocupada (m²)
  1,                                                -- num_pisos
  1,                                                -- piso_ubicado
  60.00,                                            -- area_terreno (m²)
  50.00,                                            -- area_techada_por_nivel (m²)
  10.00,                                            -- area_libre (m²)
  5,                                                -- antiguedad_edificacion_anios
  3,                                                -- antiguedad_actividad_anios
  
  'BAJO',                                           -- riesgo_incendio
  'BAJO',                                           -- riesgo_colapso
  'Local en buen estado, sin riesgos aparentes',   -- riesgo_detalle
  15,                                               -- aforo_declarado
  
  NULL,                                             -- inspector_asignado (sin asignar aún)
  'ITSE-2025-001',                                  -- numerodeexpediente
  'PENDIENTE',                                      -- estado
  CURDATE(),                                        -- fecha_inicio
  CURDATE(),                                        -- fecha
  
  'ING. PERU LIBERTAD MENDEZ ALAYO',                -- creadoPor
  'ING. PERU LIBERTAD MENDEZ ALAYO',                -- modificadoPor
  'ALTA'                                            -- confiabilidad_ml
),

-- ============================================
-- SOLICITUD 2: EJEMPLO - REEMPLAZAR CON DATOS REALES
-- ============================================
(
  'Representante Legal',
  'MARIA ELENA GARCIA TORRES',
  '87654321',
  'JR. INDEPENDENCIA 789, TRUJILLO',
  'mgarcia@email.com',
  '987654322',
  
  'itse',
  'Detallado',
  NULL,
  
  'RESTAURANT EL PACIFICO E.I.R.L.',
  '20987654321',
  'RESTAURANT EL PACIFICO',
  '044-789456',
  'AV. VICTOR LARCO 1010, HUANCHACO',
  'FRENTE AL MAR',
  'HUANCHACO',
  'HUANCHACO',
  'TRUJILLO',
  'LA LIBERTAD',
  
  -8.0850,
  -79.1200,
  
  'RESTAURANTE',
  'PREPARACIÓN Y VENTA DE COMIDAS',
  'L-D: 10:00-22:00',
  120.00,
  2,
  1,
  150.00,
  60.00,
  30.00,
  10,
  7,
  
  'MEDIO',
  'BAJO',
  'Local de dos pisos, requiere inspección detallada',
  50,
  
  NULL,
  'ITSE-2025-002',
  'PENDIENTE',
  CURDATE(),
  CURDATE(),
  
  'ING. PERU LIBERTAD MENDEZ ALAYO',
  'ING. PERU LIBERTAD MENDEZ ALAYO',
  'MEDIA'
),

-- ============================================
-- SOLICITUD 3: EJEMPLO - REEMPLAZAR CON DATOS REALES
-- ============================================
(
  'Propietario',
  'CARLOS ALBERTO DIAZ SANCHEZ',
  '45678912',
  'AV. AMERICA 456, TRUJILLO',
  'cdiaz@email.com',
  '987654323',
  
  'itse',
  'Básico Ex Ante',
  NULL,
  
  'FERRETERIA LA UNION S.R.L.',
  '20456789123',
  'FERRETERIA LA UNION',
  '044-456789',
  'JR. GRAU 234, HUANCHACO',
  'CERCA DEL MERCADO',
  'HUANCHACO',
  'HUANCHACO',
  'TRUJILLO',
  'LA LIBERTAD',
  
  NULL,                                             -- Sin ubicación GPS
  NULL,
  
  'FERRETERIA',
  'VENTA DE MATERIALES DE CONSTRUCCIÓN',
  'L-S: 7:00-19:00',
  80.00,
  1,
  1,
  100.00,
  80.00,
  20.00,
  8,
  5,
  
  'MEDIO',
  'MEDIO',
  'Local con materiales inflamables, requiere extintores',
  20,
  
  NULL,
  'ITSE-2025-003',
  'PENDIENTE',
  CURDATE(),
  CURDATE(),
  
  'ING. PERU LIBERTAD MENDEZ ALAYO',
  'ING. PERU LIBERTAD MENDEZ ALAYO',
  'ALTA'
);

-- ============================================
-- REACTIVAR VERIFICACIÓN DE CLAVES FORÁNEAS
-- ============================================
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- VERIFICAR INSERCIÓN
-- ============================================

SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS separador;
SELECT '✅ SOLICITUDES INSERTADAS' AS mensaje;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS separador;

SELECT 
  id,
  numerodeexpediente AS 'N° Expediente',
  razon_social AS 'Razón Social',
  ruc AS 'RUC',
  estado AS 'Estado',
  creadoPor AS 'Creado Por',
  fecha AS 'Fecha'
FROM solicitudes
ORDER BY id DESC
LIMIT 10;

SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS separador;
SELECT CONCAT('✅ Total de solicitudes: ', COUNT(*), ' registros') AS resumen
FROM solicitudes;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS separador;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Reemplaza los datos de ejemplo con tus datos reales
-- 2. Los campos NULL son opcionales
-- 3. El campo 'inspector_asignado' se llena cuando asignes un inspector
-- 4. Las coordenadas (latitud/longitud) son opcionales
-- 5. El estado inicial debe ser 'PENDIENTE'
-- 6. Todos los registros tendrán creadoPor = 'ING. PERU LIBERTAD MENDEZ ALAYO'
-- ============================================








