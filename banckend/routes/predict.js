const express = require('express');
const router = express.Router();

// Modelo de solicitudes históricas (ajusta según tu ORM o base de datos)
const Solicitud = require('../models/Solicitud');

// Requisitos según nivel de riesgo
const requisitosITSE = {
  'BAJO_MEDIO': [
    'DDJJ Anexo 01', 'DDJJ Anexo 02', 'DDJJ Anexo 03', 'DDJJ Anexo 04',
    'Croquis de áreas', 'Certificado de resistencia de puesta a tierra'
  ],
  'ALTO_MUY_ALTO': [
    'DDJJ Anexo 01', 'DDJJ Anexo 02', 'DDJJ Anexo 03',
    'Croquis de áreas', 'Plano de arquitectura',
    'Plano de tableros eléctricos', 'Certificado de puesta a tierra',
    'Plan de seguridad', 'Memoria/protocolos de pruebas'
  ]
};

// Función de predicción usando datos históricos
async function predecirNivelRiesgoConHistorial({ area, aforo, tipoCertificado }) {
  // 1. Buscar en la base de datos solicitudes pasadas similares (ajusta filtros si necesitas más)
  const historico = await Solicitud.find({ 
    area: { $gte: area - 100, $lte: area + 100 },
    aforo: { $gte: aforo - 20, $lte: aforo + 20 },
    tipoCertificado
  }).sort({ fecha: -1 }).limit(50);

  // 2. Usar ML entrenado con el histórico, o reglas basadas en el patrón encontrado
  // Aquí va tu lógica real. Por ahora se usa la regla dummy:
  let nivelRiesgo = 'BAJO_MEDIO';
  if (aforo > 100 || area > 500) nivelRiesgo = 'ALTO_MUY_ALTO';
  // Si tienes un modelo ML, aquí lo puedes invocar:
  // nivelRiesgo = await modeloML.predecir({ area, aforo, tipoCertificado, ... });

  return nivelRiesgo;
}

// Ruta de predicción (usando historial)
router.post('/api/prediccion', async (req, res) => {
  try {
    const { area, aforo, tipoCertificado, detalles, archivos } = req.body;

    // 1. Predice usando historial y/o ML
    const nivelRiesgo = await predecirNivelRiesgoConHistorial({ area, aforo, tipoCertificado });

    // 2. Define los anexos requeridos
    let requeridos = requisitosITSE[nivelRiesgo] || [];

    // 3. Compara anexos requeridos con los subidos
    const nombresArchivos = archivos.map(a => a.toLowerCase());
    const anexosFaltantes = requeridos.filter(req =>
      !nombresArchivos.some(nombre => nombre.includes(req.toLowerCase()))
    );

    res.json({ nivelRiesgo, anexosFaltantes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la predicción de riesgo.' });
  }
});

module.exports = router;