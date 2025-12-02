-- ============================================
-- INSERTAR LOCALES REALES - MUNICIPALIDAD DE HUANCHACO
-- ============================================
-- PROPÓSITO: Insertar 22 locales reales con licencias ITSE
-- FECHA: 2025-10-24
-- TOTAL DE REGISTROS: 22 locales
-- NOTA: Ejecutar DESPUÉS de insertar las solicitudes
-- ============================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;

-- ============================================
-- INSERTAR LOCALES REALES
-- ============================================

INSERT INTO locales (
  solicitud_id, riesgo, expediente, solicitante, razon_social,
  num_resolucion, num_certificado, vigencia, estado_licencia, tipo
)
VALUES

-- ============================================
-- LOCAL 1: MARKET LICORERIA LHUANA
-- ============================================
(
  1, 'MEDIO', '014923-2025-01', 'MARIVEL CHARO CASTAÑEDA GUEVARA',
  'CASTAÑEDA GUEVARA MARIVEL CHARO',
  '178-2025', '145-2025', '2026-09-12', 'VIGENTE', 'NUEVO'
),

-- ============================================
-- LOCAL 2: MIFARMA
-- ============================================
(
  2, 'MEDIO', '014919-2025-01', 'GABRIEL EDUARDO BARRIOS BUJANDA',
  'MIFARMA SAC',
  '176-2025', '143-2025', '2026-09-12', 'VIGENTE', 'NUEVO'
),

-- ============================================
-- LOCAL 3: LA AMA (RESTAURANTE Y HOSPEDAJE)
-- ============================================
(
  3, 'MEDIO', '014682-2025-01', 'KESCH DEBERT AMARYLLIS EMMANUELLE SARAH',
  'KESCH DEBERT AMARYLLIS EMMANUELLE SARAH',
  '179-2025', '146-2025', '2026-09-12', 'VIGENTE', 'NUEVO'
),

-- ============================================
-- LOCAL 4: I.E.P. SAN MATEO
-- ============================================
(
  4, 'ALTO', '014634-2025-01', 'GLORIA MARYLU RUIZ BARRETO',
  'RUIZ BARRETO GLORIA MARYLU',
  '174-2025', '141-2025', '2026-09-05', 'VIGENTE', 'NUEVO'
),

-- ============================================
-- LOCAL 5: RESTAURANT POLLERIA MAREA ALTA
-- ============================================
(
  5, 'MEDIO', '014499-2025-01', 'ELMER NARRO GARCÍA',
  'NARRO GARCÍA ELMER',
  '177-2025', '144-2025', '2026-09-12', 'VIGENTE', 'NUEVO'
),

-- ============================================
-- LOCAL 6: SEREVAL S.A.C. (INDUSTRIA)
-- ============================================
(
  6, 'MUY ALTO', '012127-2025-01', 'SOFIA GAMARRA HURTADO',
  'SERVICIOS AGRÍCOLAS VALDIVIA SAC',
  NULL, NULL, NULL, 'VIGENTE', 'NUEVO'
),

-- ============================================
-- LOCAL 7: FRIOPACKING SA
-- ============================================
(
  7, 'ALTO', '14246-2025-01', 'ALVARO ALEJANDRO CHAVEZ GIRAO',
  'FRIOPACKING SA',
  '173-2025', '140-2025', '2026-08-28', 'VIGENTE', 'NUEVO'
),

-- ============================================
-- LOCAL 8: EL ANZUELO SAC
-- ============================================
(
  8, 'MEDIO', '14236-2025-01', 'GRISELDA CLARA VICTORIA VERGARA BRACAMONTE',
  'EL ANZUELO SAC',
  '181-2025', '148-2025', '2026-09-17', 'VIGENTE', 'NUEVO'
),

-- ============================================
-- LOCAL 9: IEP AMOR EN ACCION
-- ============================================
(
  9, 'ALTO', '14159-2025-01', 'CESAR ATILIO ALVAN CARRANZA',
  'ASOCIACION CIVIL AMOR EN ACCION',
  '192-2025', '159-2025', '2026-09-29', 'VIGENTE', 'RENOVACION'
),

-- ============================================
-- LOCAL 10: RD DENTAL SAC
-- ============================================
(
  10, 'ALTO', '14099-2026-01', 'GREGORIO FEDERICO TAMUS CHAHUD SIERRA',
  'RD DENTAL SAC',
  '171-2025', '138-2025', '2026-08-29', 'VIGENTE', 'NUEVO'
),

-- ============================================
-- LOCAL 11: LA KHALETA DEL 8
-- ============================================
(
  11, 'ALTO', '14072-2025-01', 'YOVANA YSABEL GARCIA QUISPE',
  'LA KHALETA DEL 8',
  '189-2025', '156-2025', '2026-09-24', 'VIGENTE', 'NUEVO'
),

-- ============================================
-- LOCAL 12: TALMA (OFICINA ADMINISTRATIVA)
-- ============================================
(
  12, 'MEDIO', '13975-2025-01', 'CARMEN MILAGROS GRAHAM AYLLON',
  'TALMA SERVICIOS AEROPORTUARIOS SA',
  '168-2025', '135-2025', '2026-08-29', 'VIGENTE', 'RENOVACION'
),

-- ============================================
-- LOCAL 13: TALMA (ALMACEN)
-- ============================================
(
  13, 'ALTO', '13975-2025-01', 'CARMEN MILAGROS GRAHAM AYLLON',
  'TALMA SERVICIOS AEROPORTUARIOS SA',
  '136-2025', '169-2025', '2026-08-29', 'VIGENTE', 'RENOVACION'
),

-- ============================================
-- LOCAL 14: FARMACIA LA RIVERA
-- ============================================
(
  14, 'MEDIO', '13859-2025-01', 'JOHN PAUL VELASQUEZ ALIAGA',
  'JHON PAUL VELASQUEZ ALIAGA',
  '163-2025', '129-2025', '2026-08-21', 'VIGENTE', 'NUEVO'
),

-- ============================================
-- LOCAL 15: MANNUCCI MOTORS SAC
-- ============================================
(
  15, 'MUY ALTO', '13690-2025-01', 'AMADA MARIA DEL ROSARIO CASTILLO SANCHEZ',
  'AMADA MARIA DEL ROSARIO CASTILLO SANCHEZ',
  '165-2025', '132-2025', '2026-08-21', 'VIGENTE', 'NUEVO'
),

-- ============================================
-- LOCAL 16: CHARPAS PERÚ S.A.C.
-- ============================================
(
  16, 'ALTO', '013083-2025-01', 'JULIO CESAR SALVATIERRA CERDA',
  'CHARPAS PERÚ S.A.C.',
  '158-2025', '126-2025', '2026-08-18', 'VIGENTE', 'NUEVO'
),

-- ============================================
-- LOCAL 17: INARA (HOSPEDAJE)
-- ============================================
(
  17, 'MEDIO', '013167-2025-01', 'MARIANA GABRIELA AYALA GUTIERREZ',
  'AYALA GUTIERREZ MARIANA GABRIELA',
  '159-2025', '127-2025', '2026-08-15', 'VIGENTE', 'NUEVO'
),

-- ============================================
-- LOCAL 18: INVERSIONES AVÍCOLA GÉNESIS EIRL
-- ============================================
(
  18, 'MUY ALTO', '013248-2025-01', 'DIANA JULISSA RODRIGUEZ VILLANUEVA',
  'INVERSIONES AVÍCOLA GÉNESIS EIRL',
  '162-2025', '130-2025', '2026-08-18', 'VIGENTE', 'NUEVO'
),

-- ============================================
-- LOCAL 19: R-PLUS EIRL
-- ============================================
(
  19, 'MUY ALTO', '13292-2025-01', 'ROLAND FRANCISCO CRUZ SIGUENZA',
  'R-PLUS EIRL',
  '172-2025', '139-2025', '2026-09-03', 'VIGENTE', 'NUEVO'
),

-- ============================================
-- LOCAL 20: ATA (CENTRO DE REHABILITACIÓN)
-- ============================================
(
  20, 'ALTO', '013483-2025-01', 'HECTOR JOSE ZARZAR VALDECCHY',
  'ASESORAMIENTO TERAPEUTICO ASOCIADO',
  '170-2025', '137-2025', '2026-08-29', 'VIGENTE', 'NUEVO'
),

-- ============================================
-- LOCAL 21: RESTAURANT BAR CARTAGENA
-- ============================================
(
  21, 'ALTO', '013455-2025-01', 'HECTOR KARIM MUSTAFICH CALDERON',
  'MUSTAFICH CALDERON HECTOR KARIM',
  '166-2025', '133-2025', '2026-08-25', 'VIGENTE', 'NUEVO'
),

-- ============================================
-- LOCAL 22: MEDICENTRO G&B MEDIC
-- ============================================
(
  22, 'MEDIO', '13448-2025-01', 'LIDER WUALDO GUEVARA BUSTAMANTE',
  'G&B MEDIC S.A.C.',
  '164-2025', '131-2025', '2026-08-21', 'VIGENTE', 'NUEVO'
);

-- ============================================
-- REACTIVAR VERIFICACIÓN DE CLAVES FORÁNEAS
-- ============================================
SET FOREIGN_KEY_CHECKS = 1;
SET SQL_SAFE_UPDATES = 1;

-- ============================================
-- VERIFICAR INSERCIÓN
-- ============================================

SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS separador;
SELECT '✅ 22 LOCALES REALES INSERTADOS' AS mensaje;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS separador;

SELECT 
  id,
  expediente AS 'N° Expediente',
  razon_social AS 'Razón Social',
  riesgo AS 'Riesgo',
  num_certificado AS 'Certificado',
  num_resolucion AS 'Resolución',
  vigencia AS 'Vigencia',
  estado_licencia AS 'Estado'
FROM locales
ORDER BY id DESC
LIMIT 22;

SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS separador;
SELECT CONCAT('✅ Total de locales en BD: ', COUNT(*), ' registros') AS resumen
FROM locales;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS separador;

-- Resumen por nivel de riesgo
SELECT 
  riesgo AS 'Nivel de Riesgo',
  COUNT(*) AS 'Cantidad',
  CONCAT(ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM locales)), 1), '%') AS 'Porcentaje'
FROM locales
GROUP BY riesgo
ORDER BY 
  CASE riesgo
    WHEN 'MUY ALTO' THEN 1
    WHEN 'ALTO' THEN 2
    WHEN 'MEDIO' THEN 3
    WHEN 'BAJO' THEN 4
  END;

SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS separador;

-- Resumen por estado de licencia
SELECT 
  estado_licencia AS 'Estado de Licencia',
  COUNT(*) AS 'Cantidad'
FROM locales
GROUP BY estado_licencia;

SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS separador;

-- Resumen por tipo de trámite
SELECT 
  tipo AS 'Tipo de Trámite',
  COUNT(*) AS 'Cantidad'
FROM locales
GROUP BY tipo;

SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS separador;
SELECT '🎉 TODOS LOS LOCALES INSERTADOS CORRECTAMENTE' AS mensaje_final;
SELECT '✅ SISTEMA DE DEFENSA CIVIL - MUNICIPALIDAD DE HUANCHACO' AS sistema;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS separador;








