-- ============================================
-- INSERTAR SOLICITUDES REALES - MUNICIPALIDAD DE HUANCHACO
-- ============================================
-- PROPÓSITO: Insertar 22 solicitudes reales de ITSE
-- FECHA: 2025-10-24
-- CREADO POR: ING. PERU LIBERTAD MENDEZ ALAYO
-- TOTAL DE REGISTROS: 22 solicitudes
-- ============================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;

-- ============================================
-- INSERTAR SOLICITUDES REALES
-- ============================================

INSERT INTO solicitudes (
  rol, nombres_apellidos, dni_ce, correo, telefonos,
  tipo_tramite, tipo_itse, riesgo_incendio,
  razon_social, ruc, nombre_comercial, telefonos_establecimiento,
  direccion, referencia, localidad, distrito, provincia, departamento,
  giro_actividades, horario_atencion, area_ocupada, num_pisos, piso_ubicado,
  area_terreno, area_techada_por_nivel, area_libre, aforo_declarado,
  numerodeexpediente, estado, fecha_inicio, fecha,
  creadoPor, modificadoPor, confiabilidad_ml
)
VALUES

-- ============================================
-- SOLICITUD 1: MARKET LICORERIA LHUANA
-- ============================================
(
  'PROPIETARIO', 'MARIVEL CHARO CASTAÑEDA GUEVARA', '47049235', 'NO TIENE', '978598266',
  'ITSE', 'NUEVO', 'MEDIO',
  'CASTAÑEDA GUEVARA MARIVEL CHARO', NULL, 'MARKET LICORERIA LHUANA', '978598266',
  'AV. LA RIVERA 618', 'FRENTE A INSTA BAR', 'HUANCHACO', 'HUANCHACO', 'TRUJILLO', 'LA LIBERTAD',
  'COMERCIO', NULL, 56.00, 3, '1', 56.00, 168.00, 0.00, 1,
  '014923-2025-01', 'FINALIZADO', '2025-08-27', '2025-08-27',
  'ING. PERU LIBERTAD MENDEZ ALAYO', 'ING. PERU LIBERTAD MENDEZ ALAYO', 98
),

-- ============================================
-- SOLICITUD 2: MIFARMA
-- ============================================
(
  'REPRESENTANTE LEGAL', 'GABRIEL EDUARDO BARRIOS BUJANDA', '42740154', 'NO TIENE', '933510684',
  'ITSE', 'NUEVO', 'MEDIO',
  'MIFARMA SAC', '20512000000', 'MIFARMA', '933510684',
  'CALLE GARCILAZO DE LA VEGA MZ 8 LT 27B SECTOR PUEBLO JOVEN', 'POR EL SEMÁFORO QUE NO FUNCIONA FRENTE AL MERCADO SANTA ROSA', 'EL MILAGRO', 'HUANCHACO', 'TRUJILLO', 'LA LIBERTAD',
  'BOTICA', '07:00 - 23:00', 92.93, 1, '1', 99.34, 92.93, 0.00, 21,
  '014919-2025-01', 'FINALIZADO', '2025-08-27', '2025-08-27',
  'ING. PERU LIBERTAD MENDEZ ALAYO', 'ING. PERU LIBERTAD MENDEZ ALAYO', 89
),

-- ============================================
-- SOLICITUD 3: LA AMA (RESTAURANTE Y HOSPEDAJE)
-- ============================================
(
  'REPRESENTANTE LEGAL', 'KESCH DEBERT AMARYLLIS EMMANUELLE SARAH', '44820578', 'NO TIENE', '948320388',
  'ITSE', 'NUEVO', 'MEDIO',
  'KESCH DEBERT AMARYLLIS EMMANUELLE SARAH', '10448205784', 'LA AMA', '948320388',
  'AV LA RIVERA N°316 - URB MARIA DEL SOCORRO - HUANCHACO', 'SIN REFERENCIA', 'HUANCHACO', 'HUANCHACO', 'TRUJILLO', 'LA LIBERTAD',
  'RESTAURANTE Y HOSPEDAJE', '16:00 - 23:00', 747.99, 3, '1,2,3', 280.77, 233.61, 47.16, 25,
  '014682-2025-01', 'FINALIZADO', '2025-08-25', '2025-08-25',
  'ING. PERU LIBERTAD MENDEZ ALAYO', 'ING. PERU LIBERTAD MENDEZ ALAYO', 88
),

-- ============================================
-- SOLICITUD 4: I.E.P. SAN MATEO
-- ============================================
(
  'REPRESENTANTE LEGAL', 'GLORIA MARYLU RUIZ BARRETO', '17942536', 'NO TIENE', '943095287',
  'ITSE', 'NUEVO', 'ALTO',
  'RUIZ BARRETO GLORIA MARYLU', '10179425365', 'I.E.P. SAN MATEO', '943095287',
  'CALLE ITALIA MZ , LOTE 14,15 Y 21 - SECTOR VIRGEN DEL SOCORRO II', 'DETRÁS DEL BAHÍA ROSA', 'EL MILAGRO', 'HUANCHACO', 'TRUJILLO', 'LA LIBERTAD',
  'EDUCACIÓN', '8:00 - 14:00', 423.00, 1, '1', 423.00, 208.52, 113.65, 86,
  '014634-2025-01', 'FINALIZADO', '2025-08-25', '2025-08-25',
  'ING. PERU LIBERTAD MENDEZ ALAYO', 'ING. PERU LIBERTAD MENDEZ ALAYO', 95
),

-- ============================================
-- SOLICITUD 5: RESTAURANT POLLERIA MAREA ALTA
-- ============================================
(
  'REPRESENTANTE LEGAL', 'ELMER NARRO GARCÍA', '40723482', 'NO TIENE', '944607567',
  'ITSE', 'NUEVO', 'MEDIO',
  'NARRO GARCÍA ELMER', '10407234826', 'RESTAURANT POLLERIA MAREA ALTA', '944607567',
  'AV LA RIVERA N°606', 'FRENTE A BARINSTA', 'HUANCHACO', 'HUANCHACO', 'TRUJILLO', 'LA LIBERTAD',
  'RESTAURANTE', '9:00 - 23:00', 339.87, 3, '2,3', 339.81, 339.81, 0.00, 70,
  '014499-2025-01', 'FINALIZADO', '2025-08-21', '2025-08-21',
  'ING. PERU LIBERTAD MENDEZ ALAYO', 'ING. PERU LIBERTAD MENDEZ ALAYO', 97
),

-- ============================================
-- SOLICITUD 6: SEREVAL S.A.C. (INDUSTRIA)
-- ============================================
(
  'REPRESENTANTE LEGAL', 'SOFIA GAMARRA HURTADO', '18217886', 'NO TIENE', '988819574',
  'ITSE', 'NUEVO', 'MUY ALTO',
  'SERVICIOS AGRÍCOLAS VALDIVIA SAC', '20607856975', 'SEREVAL S.A.C.', '973833515',
  'LOTE VD 110 - SECTOR III VALDIVIA BAJA S/N', 'VINIENDO DE LA IGLESIA DE HUANCHACO HACIA LA VIA DE EVITAMIENTO', 'HUANCHACO', 'HUANCHACO', 'TRUJILLO', 'LA LIBERTAD',
  'INDUSTRIA', '9:00 - 17:00', 1300.00, 1, '1', 43940000.00, NULL, NULL, 250,
  '012127-2025-01', 'FINALIZADO', '2025-07-10', '2025-07-10',
  'ING. PERU LIBERTAD MENDEZ ALAYO', 'ING. PERU LIBERTAD MENDEZ ALAYO', 95
),

-- ============================================
-- SOLICITUD 7: FRIOPACKING SA
-- ============================================
(
  'REPRESENTANTE LEGAL', 'ALVARO ALEJANDRO CHAVEZ GIRAO', '71784823', 'NO TIENE', '949375567',
  'ITSE', 'NUEVO', 'ALTO',
  'FRIOPACKING SA', '20494691524', 'FRIOPACKING SA', '949375567',
  'SEC. VALDIVIA BAJA BLOCK J LT VD 122 -IIV 298', 'OVALO EL MILAGRO', 'HUANCHACO', 'HUANCHACO', 'TRUJILLO', 'LA LIBERTAD',
  'INDUSTRIA', '8:00 - 17:00', 2195.00, 1, '1', 2195.00, 319.87, 1875.13, 64,
  '14246-2025-01', 'FINALIZADO', '2025-08-18', '2025-08-18',
  'ING. PERU LIBERTAD MENDEZ ALAYO', 'ING. PERU LIBERTAD MENDEZ ALAYO', 80
),

-- ============================================
-- SOLICITUD 8: EL ANZUELO SAC
-- ============================================
(
  'PROPIETARIO', 'GRISELDA CLARA VICTORIA VERGARA BRACAMONTE', '18138195', 'NO TIENE', '949892347',
  'ITSE', 'NUEVO', 'MEDIO',
  'EL ANZUELO SAC', '20482036989', 'EL ANZUELO', '949892347',
  'AV. LARCO 1050 EL BOQUERON - HUANCHACO', NULL, 'HUANCHACO', 'HUANCHACO', 'TRUJILLO', 'LA LIBERTAD',
  'RESTAURANTE', '9:00 A 13:00', 236.00, 1, '1', 236.00, 236.00, 0.00, 70,
  '14236-2025-01', 'FINALIZADO', '2025-08-18', '2025-08-18',
  'ING. PERU LIBERTAD MENDEZ ALAYO', 'ING. PERU LIBERTAD MENDEZ ALAYO', 96
),

-- ============================================
-- SOLICITUD 9: IEP AMOR EN ACCION
-- ============================================
(
  'REPRESENTANTE LEGAL', 'CESAR ATILIO ALVAN CARRANZA', '17991866', 'NO TIENE', '930938635',
  'ITSE', 'RENOVACION', 'ALTO',
  'ASOCIACION CIVIL AMOR EN ACCION', '20440343792', 'IEP AMOR EN ACCION', '930938635',
  'MZ 81 LT 4 AV. SINCHI ROCA', 'SINCHI ROCA Y ALCUCHIMAC', 'VICTOR RAUL', 'HUANCHACO', 'TRUJILLO', 'LA LIBERTAD',
  'EDUCACIÓN', '8:00 - 14:00', 549.91, 1, '1', 14388.25, 549.91, 888.34, 80,
  '14159-2025-01', 'FINALIZADO', '2025-08-15', '2025-08-15',
  'ING. PERU LIBERTAD MENDEZ ALAYO', 'ING. PERU LIBERTAD MENDEZ ALAYO', 98
),

-- ============================================
-- SOLICITUD 10: RD DENTAL SAC
-- ============================================
(
  'REPRESENTANTE LEGAL', 'GREGORIO FEDERICO TAMUS CHAHUD SIERRA', '68223605', 'NO TIENE', '962791076',
  'ITSE', 'NUEVO', 'ALTO',
  'RD DENTAL SAC', '20517662657', 'RD DENTAL SAC', '962791076',
  'LT 10 PREDIO LA ESMERALDA VALLE MOCHE - HUANCHAQUITO', NULL, 'HUANCHACO', 'HUANCHACO', 'TRUJILLO', 'LA LIBERTAD',
  'ALMACEN', '7:00 - 14:00', 1974.12, 1, '1', 1974.12, 346.61, 1627.51, 30,
  '14099-2026-01', 'FINALIZADO', '2025-08-14', '2025-08-14',
  'ING. PERU LIBERTAD MENDEZ ALAYO', 'ING. PERU LIBERTAD MENDEZ ALAYO', 92
),

-- ============================================
-- SOLICITUD 11: LA KHALETA DEL 8
-- ============================================
(
  'PROPIETARIO', 'YOVANA YSABEL GARCIA QUISPE', '40888508', 'NO TIENE', '926782305',
  'ITSE', 'NUEVO', 'ALTO',
  'LA KHALETA DEL 8', '10408885081', 'LA KHALETA DEL 8', '926782305',
  'SECTOR VIII MZ K LT 2A -1 VILLA EMILIANO', NULL, 'MILAGRO', 'HUANCHACO', 'TRUJILLO', 'LA LIBERTAD',
  'RESTAURANTE -BAR', '10:00 - 22:00', 140.00, 1, '1', 140.00, 140.00, 0.00, 87,
  '14072-2025-01', 'FINALIZADO', '2025-08-14', '2025-08-14',
  'ING. PERU LIBERTAD MENDEZ ALAYO', 'ING. PERU LIBERTAD MENDEZ ALAYO', 93
),

-- ============================================
-- SOLICITUD 12: TALMA (OFICINA ADMINISTRATIVA)
-- ============================================
(
  'REPRESENTANTE LEGAL', 'CARMEN MILAGROS GRAHAM AYLLON', '7776762', 'NO TIENE', '994681152',
  'ITSE', 'RENOVACION', 'MEDIO',
  'TALMA SERVICIOS AEROPORTUARIOS SA', '20204621242', 'TALMA', '994621152',
  'AV AVIACION S/N HUANCHACO AEROPUERTO', NULL, 'HUANCHACO', 'HUANCHACO', 'TRUJILLO', 'LA LIBERTAD',
  'OFICINA ADMINISTRATIVA', '8:00 - 17:00', 16.00, 1, '1', 16.00, 16.00, 0.00, 5,
  '13975-2025-01', 'FINALIZADO', '2025-08-12', '2025-08-12',
  'ING. PERU LIBERTAD MENDEZ ALAYO', 'ING. PERU LIBERTAD MENDEZ ALAYO', 95
),

-- ============================================
-- SOLICITUD 13: TALMA (ALMACEN)
-- ============================================
(
  'REPRESENTANTE LEGAL', 'CARMEN MILAGROS GRAHAM AYLLON', '7776762', 'NO TIENE', '994681152',
  'ITSE', 'RENOVACION', 'ALTO',
  'TALMA SERVICIOS AEROPORTUARIOS SA', '20204621242', 'TALMA', '994681152',
  'AV. AVIACION S/N HUANCHACO AEROPUERTO', NULL, 'HUANCHACO', 'HUANCHACO', 'TRUJILLO', 'LA LIBERTAD',
  'ALMACEN', '8:00 - 17:00', 28.03, 1, '1', 28.03, 28.03, 0.00, 4,
  '13975-2025-01', 'FINALIZADO', '2025-08-12', '2025-08-12',
  'ING. PERU LIBERTAD MENDEZ ALAYO', 'ING. PERU LIBERTAD MENDEZ ALAYO', 94
),

-- ============================================
-- SOLICITUD 14: FARMACIA LA RIVERA
-- ============================================
(
  'PROPIETARIO', 'JOHN PAUL VELASQUEZ ALIAGA', '18154230', 'NO TIENE', '954959842',
  'ITSE', 'NUEVO', 'MEDIO',
  'JHON PAUL VELASQUEZ ALIAGA', '10181542301', 'FARMACIA LA RIVERA', '954959842',
  'AV LA RIVERA 736', 'MUNICIPALIDAD DE HUANCHACO', 'HUANCHACO', 'HUANCHACO', 'TRUJILLO', 'LA LIBERTAD',
  'COMERCIO', '8:00 A 16:00', 18.60, 2, '1', 18.60, 18.60, 0.00, 6,
  '13859-2025-01', 'FINALIZADO', '2025-08-11', '2025-08-11',
  'ING. PERU LIBERTAD MENDEZ ALAYO', 'ING. PERU LIBERTAD MENDEZ ALAYO', 95
),

-- ============================================
-- SOLICITUD 15: MANNUCCI MOTORS SAC
-- ============================================
(
  'REPRESENTANTE LEGAL', 'AMADA MARIA DEL ROSARIO CASTILLO SANCHEZ', '17897691', 'NO TIENE', '977974067',
  'ITSE', 'NUEVO', 'MUY ALTO',
  'AMADA MARIA DEL ROSARIO CASTILLO SANCHEZ', '20604767548', 'MANNUCCI MOTORS SAC', '977974067',
  'URB. SANTO TOMAS MZ B LT 15 VILLA DEL MAR', NULL, 'HUANCHACO', 'HUANCHACO', 'TRUJILLO', 'LA LIBERTAD',
  'INDUSTRIA', '8:00 - 17:00', 2714.20, 2, '1,2', 2633.60, 2404.87, 228.70, 63,
  '13690-2025-01', 'FINALIZADO', '2025-08-08', '2025-08-08',
  'ING. PERU LIBERTAD MENDEZ ALAYO', 'ING. PERU LIBERTAD MENDEZ ALAYO', 95
),

-- ============================================
-- SOLICITUD 16: CHARPAS PERÚ S.A.C.
-- ============================================
(
  'REPRESENTANTE LEGAL', 'JULIO CESAR SALVATIERRA CERDA', '41514302', 'NO TIENE', '962981544',
  'ITSE', 'NUEVO', 'ALTO',
  'CHARPAS PERÚ S.A.C.', '2054394468', 'CHARPAS PERÚ S.A.C.', '962981544',
  'AV. NUEVA ESPERANZA MZ 50 LT 04 C SECTOR NUEVA ESPERANZA', 'A UNA CUADRA DE AGUAS GUTTIS', 'VICTOR RAUL', 'HUANCHACO', 'TRUJILLO', 'LA LIBERTAD',
  'LABORATORIO Y ALMACÉN', '8:00 - 18:00', 516.87, 3, '1,2,3', 269.89, 516.87, 0.00, 17,
  '013083-2025-01', 'FINALIZADO', '2025-08-01', '2025-08-01',
  'ING. PERU LIBERTAD MENDEZ ALAYO', 'ING. PERU LIBERTAD MENDEZ ALAYO', 95
),

-- ============================================
-- SOLICITUD 17: INARA (HOSPEDAJE)
-- ============================================
(
  'REPRESENTANTE LEGAL', 'MARIANA GABRIELA AYALA GUTIERREZ', '784598603', 'NO TIENE', '991489377',
  'ITSE', 'NUEVO', 'MEDIO',
  'AYALA GUTIERREZ MARIANA GABRIELA', '20784598603', 'INARA', '975287545',
  'JIRON COLON N°118, HUANCHACO', 'AL COSTADO DEL RESTAURANTE LIGTH HOUSE', 'HUANCHACO', 'HUANCHACO', 'TRUJILLO', 'LA LIBERTAD',
  'HOSPEDAJE - HOSTELERIA', NULL, 260.83, 3, '1,2,3', 230.90, 260.83, 130.44, 28,
  '013167-2025-01', 'FINALIZADO', '2025-08-01', '2025-08-01',
  'ING. PERU LIBERTAD MENDEZ ALAYO', 'ING. PERU LIBERTAD MENDEZ ALAYO', 95
),

-- ============================================
-- SOLICITUD 18: INVERSIONES AVÍCOLA GÉNESIS EIRL
-- ============================================
(
  'REPRESENTANTE LEGAL', 'DIANA JULISSA RODRIGUEZ VILLANUEVA', '40235246', 'diana_7917@hotmail.com', '948120280',
  'ITSE', 'NUEVO', 'MUY ALTO',
  'INVERSIONES AVÍCOLA GÉNESIS EIRL', '20560202092', 'AVIGEN', '949400272',
  'CALLE LOS LIBERTADORES #901 SECTOR RAMÓN CASTILLA', 'ALTURA COLEGIO MILITAR', 'RAMON CASTILLA', 'HUANCHACO', 'TRUJILLO', 'LA LIBERTAD',
  'ELABORACIÓN DE PIENSOS PARA ANIMALES', '07:30 - 13:00', 611.01, 1, '1', 611.01, 589.25, 21.76, 4,
  '013248-2025-01', 'FINALIZADO', '2025-08-04', '2025-08-04',
  'ING. PERU LIBERTAD MENDEZ ALAYO', 'ING. PERU LIBERTAD MENDEZ ALAYO', 95
),

-- ============================================
-- SOLICITUD 19: R-PLUS EIRL
-- ============================================
(
  'REPRESENTANTE LEGAL', 'ROLAND FRANCISCO CRUZ SIGUENZA', '43007161', 'NO TIENE', '965476439',
  'ITSE', 'NUEVO', 'MUY ALTO',
  'R-PLUS EIRL', '20607780634', 'R-PLUS EIRL', '965476439',
  'MZ A LOTE 13 SECTOR INFORMAL LAS BRISAS,HUANCHACO', 'POR CENTENARIO (AL COSTADO)', 'HUANCHACO', 'HUANCHACO', 'TRUJILLO', 'LA LIBERTAD',
  'INDUSTRIA', '8:00 - 12:00 / 14:00 - 17:00', 691.86, 1, '1', 691.86, 0.00, 0.00, 23,
  '13292-2025-01', 'FINALIZADO', '2025-08-04', '2025-08-04',
  'ING. PERU LIBERTAD MENDEZ ALAYO', 'ING. PERU LIBERTAD MENDEZ ALAYO', 95
),

-- ============================================
-- SOLICITUD 20: ATA (CENTRO DE REHABILITACIÓN)
-- ============================================
(
  'REPRESENTANTE LEGAL', 'HECTOR JOSE ZARZAR VALDECCHY', '18086403', 'asociacionata@hotmail.com', '922577488',
  'ITSE', 'NUEVO', 'ALTO',
  'ASESORAMIENTO TERAPEUTICO ASOCIADO', '20438901826', 'ATA', '922577488',
  'CALLE CAJAMARCA 250 LAS LOMAS', 'SIN REFERENCIA', 'LAS LOMAS', 'HUANCHACO', 'TRUJILLO', 'LA LIBERTAD',
  'CENTRO DE REHABILITACIÓN', '7:00 - 22:00', 1312.88, 1, '1', 1312.85, 254.96, 490.52, 46,
  '013483-2025-01', 'FINALIZADO', '2025-08-05', '2025-08-05',
  'ING. PERU LIBERTAD MENDEZ ALAYO', 'ING. PERU LIBERTAD MENDEZ ALAYO', 95
),

-- ============================================
-- SOLICITUD 21: RESTAURANT BAR CARTAGENA
-- ============================================
(
  'REPRESENTANTE LEGAL', 'HECTOR KARIM MUSTAFICH CALDERON', '43103637', 'NO TIENE', '951729888',
  'ITSE', 'NUEVO', 'ALTO',
  'MUSTAFICH CALDERON HECTOR KARIM', '10431036377', 'RESTURANTE BAR CARTAGENA', '951729888',
  'AV. VICTOR LARCO N°810 HUANCHACO', 'SIN REFERENCIA', 'HUANCHACO', 'HUANCHACO', 'TRUJILLO', 'LA LIBERTAD',
  'RESTAURANTE', '9:30 - 18:30 / 18:00 - 2:00', 247.90, 7, '1,2,3,4,5,6,7', 74.93, 496.16, 15.64, 75,
  '013455-2025-01', 'FINALIZADO', '2025-08-05', '2025-08-05',
  'ING. PERU LIBERTAD MENDEZ ALAYO', 'ING. PERU LIBERTAD MENDEZ ALAYO', 95
),

-- ============================================
-- SOLICITUD 22: MEDICENTRO G&B MEDIC
-- ============================================
(
  'REPRESENTANTE LEGAL', 'LIDER WUALDO GUEVARA BUSTAMANTE', '45551180', 'NO TIENE', '971982972',
  'ITSE', 'NUEVO', 'MEDIO',
  'G&B MEDIC S.A.C.', '20609977419', 'MEDICENTRO G&B MEDIC', '971982972',
  'AV. MIGUEL GRAU MZ 5, LOTE 07, INT 102, CPM EL MILAGRO, SECTOR II', 'SIN REFERENCIA', 'EL MILAGRO', 'HUANCHACO', 'TRUJILLO', 'LA LIBERTAD',
  'CONSULTORIO MEDICO', '8:00 - 21:00', 56.00, 1, '1', 56.00, 56.00, 0.00, 12,
  '13448-2025-01', 'FINALIZADO', '2025-08-05', '2025-08-05',
  'ING. PERU LIBERTAD MENDEZ ALAYO', 'ING. PERU LIBERTAD MENDEZ ALAYO', 95
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
SELECT '✅ 22 SOLICITUDES REALES INSERTADAS' AS mensaje;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS separador;

SELECT 
  id,
  numerodeexpediente AS 'N° Expediente',
  nombre_comercial AS 'Nombre Comercial',
  riesgo_incendio AS 'Riesgo',
  estado AS 'Estado',
  fecha AS 'Fecha'
FROM solicitudes
ORDER BY id DESC
LIMIT 22;

SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS separador;
SELECT CONCAT('✅ Total de solicitudes en BD: ', COUNT(*), ' registros') AS resumen
FROM solicitudes;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS separador;

-- Resumen por tipo de riesgo
SELECT 
  riesgo_incendio AS 'Nivel de Riesgo',
  COUNT(*) AS 'Cantidad',
  CONCAT(ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM solicitudes)), 1), '%') AS 'Porcentaje'
FROM solicitudes
GROUP BY riesgo_incendio
ORDER BY 
  CASE riesgo_incendio
    WHEN 'MUY ALTO' THEN 1
    WHEN 'ALTO' THEN 2
    WHEN 'MEDIO' THEN 3
    WHEN 'BAJO' THEN 4
  END;

SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS separador;
SELECT '🎉 TODAS LAS SOLICITUDES INSERTADAS CORRECTAMENTE' AS mensaje_final;
SELECT '✅ Creado por: ING. PERU LIBERTAD MENDEZ ALAYO' AS creador;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS separador;

