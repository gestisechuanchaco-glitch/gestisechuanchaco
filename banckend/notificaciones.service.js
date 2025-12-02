/**
 * SERVICIO DE NOTIFICACIONES AUTOMÁTICAS
 * Envía notificaciones por WhatsApp y Email cuando cambia el estado de una solicitud
 */

const { pool } = require('./db');

// ====== PLANTILLAS DE MENSAJES ======
const plantillas = {
  'EN PROCESO': {
    whatsapp: {
      mensaje: `📋 *DEFENSA CIVIL - HUANCHACO*

Hola {{nombre_solicitante}},

Tu solicitud de Certificado ITSE/ECSE ha sido recibida y está *EN PROCESO*.

📄 *Expediente:* {{expediente}}
🏢 *Establecimiento:* {{razon_social}}
📅 *Fecha de recepción:* {{fecha_recepcion}}

Estamos revisando la documentación presentada. Te notificaremos cuando haya cambios en el estado.

_Defensa Civil - Municipalidad de Huanchaco_`,
      asunto: null // WhatsApp no tiene asunto
    },
    email: {
      asunto: 'Solicitud ITSE/ECSE en Proceso - Defensa Civil Huanchaco',
      cuerpo: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
              <div style="background: #1B5E5E; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                <h2 style="margin: 0;">📋 Defensa Civil - Huanchaco</h2>
              </div>
              <div style="background: white; padding: 30px; border-radius: 0 0 5px 5px;">
                <h3>Estimado/a {{nombre_solicitante}},</h3>
                <p>Su solicitud de Certificado ITSE/ECSE ha sido recibida y está <strong>EN PROCESO</strong>.</p>
                <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>📄 Expediente:</strong> {{expediente}}</p>
                  <p><strong>🏢 Establecimiento:</strong> {{razon_social}}</p>
                  <p><strong>📅 Fecha de recepción:</strong> {{fecha_recepcion}}</p>
                </div>
                <p>Estamos revisando la documentación presentada. Le notificaremos cuando haya cambios en el estado.</p>
                <p style="margin-top: 30px; color: #666; font-size: 12px;">
                  Defensa Civil - Municipalidad de Huanchaco<br/>
                  Av. La Rivera N° 165, Huanchaco, Trujillo
                </p>
              </div>
            </div>
          </body>
        </html>
      `
    }
  },
  'OBSERVADO': {
    whatsapp: {
      mensaje: `⚠️ *DEFENSA CIVIL - HUANCHACO*

Hola {{nombre_solicitante}},

Tu solicitud ha sido *OBSERVADA* y requiere atención.

📄 *Expediente:* {{expediente}}
🏢 *Establecimiento:* {{razon_social}}

*Acción requerida:*
{{observaciones}}

Por favor, revisa y completa la información solicitada para continuar con el proceso.

_Defensa Civil - Municipalidad de Huanchaco_`,
      asunto: null
    },
    email: {
      asunto: 'Solicitud Observada - Acción Requerida',
      cuerpo: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
              <div style="background: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                <h2 style="margin: 0;">⚠️ Solicitud Observada</h2>
              </div>
              <div style="background: white; padding: 30px; border-radius: 0 0 5px 5px;">
                <h3>Estimado/a {{nombre_solicitante}},</h3>
                <p>Su solicitud ha sido <strong>OBSERVADA</strong> y requiere atención.</p>
                <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #FF9800; margin: 20px 0;">
                  <p><strong>📄 Expediente:</strong> {{expediente}}</p>
                  <p><strong>🏢 Establecimiento:</strong> {{razon_social}}</p>
                  <p><strong>⚠️ Observaciones:</strong></p>
                  <p style="white-space: pre-line;">{{observaciones}}</p>
                </div>
                <p>Por favor, revise y complete la información solicitada para continuar con el proceso.</p>
              </div>
            </div>
          </body>
        </html>
      `
    }
  },
  'ACEPTADO': {
    whatsapp: {
      mensaje: `✅ *DEFENSA CIVIL - HUANCHACO*

Hola {{nombre_solicitante}},

¡Excelentes noticias! Tu solicitud ha sido *ACEPTADA*.

📄 *Expediente:* {{expediente}}
🏢 *Establecimiento:* {{razon_social}}
📅 *Fecha de aprobación:* {{fecha_aprobacion}}

Tu certificado está siendo procesado. Recibirás una notificación cuando esté listo.

_Defensa Civil - Municipalidad de Huanchaco_`,
      asunto: null
    },
    email: {
      asunto: 'Solicitud Aceptada - Certificado en Proceso',
      cuerpo: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
              <div style="background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                <h2 style="margin: 0;">✅ Solicitud Aceptada</h2>
              </div>
              <div style="background: white; padding: 30px; border-radius: 0 0 5px 5px;">
                <h3>Estimado/a {{nombre_solicitante}},</h3>
                <p>¡Excelentes noticias! Su solicitud ha sido <strong>ACEPTADA</strong>.</p>
                <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>📄 Expediente:</strong> {{expediente}}</p>
                  <p><strong>🏢 Establecimiento:</strong> {{razon_social}}</p>
                  <p><strong>📅 Fecha de aprobación:</strong> {{fecha_aprobacion}}</p>
                </div>
                <p>Su certificado está siendo procesado. Recibirá una notificación cuando esté listo.</p>
              </div>
            </div>
          </body>
        </html>
      `
    }
  },
  'FINALIZADO': {
    whatsapp: {
      mensaje: `🎉 *DEFENSA CIVIL - HUANCHACO*

Hola {{nombre_solicitante}},

¡Tu certificado ITSE/ECSE está *LISTO*!

📄 *Expediente:* {{expediente}}
🏢 *Establecimiento:* {{razon_social}}
📜 *Certificado:* {{numero_certificado}}
📅 *Fecha de emisión:* {{fecha_emision}}
⏰ *Vigencia:* {{vigencia}}

Puede recogerlo en nuestras oficinas:
📍 Av. La Rivera N° 165, Huanchaco

¡Gracias por confiar en nosotros!

_Defensa Civil - Municipalidad de Huanchaco_`,
      asunto: null
    },
    email: {
      asunto: 'Certificado ITSE/ECSE Listo - Retiro Disponible',
      cuerpo: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
              <div style="background: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                <h2 style="margin: 0;">🎉 Certificado Listo</h2>
              </div>
              <div style="background: white; padding: 30px; border-radius: 0 0 5px 5px;">
                <h3>Estimado/a {{nombre_solicitante}},</h3>
                <p>¡Su certificado ITSE/ECSE está <strong>LISTO</strong>!</p>
                <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>📄 Expediente:</strong> {{expediente}}</p>
                  <p><strong>🏢 Establecimiento:</strong> {{razon_social}}</p>
                  <p><strong>📜 Certificado:</strong> {{numero_certificado}}</p>
                  <p><strong>📅 Fecha de emisión:</strong> {{fecha_emision}}</p>
                  <p><strong>⏰ Vigencia:</strong> {{vigencia}}</p>
                </div>
                <p><strong>📍 Puede recogerlo en nuestras oficinas:</strong><br/>
                Av. La Rivera N° 165, Huanchaco, Trujillo</p>
                <p style="margin-top: 30px;">¡Gracias por confiar en nosotros!</p>
              </div>
            </div>
          </body>
        </html>
      `
    }
  }
};

// ====== FUNCIÓN PARA REEMPLAZAR VARIABLES EN PLANTILLAS ======
function reemplazarVariables(template, datos) {
  let resultado = template;
  for (const [key, value] of Object.entries(datos)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    resultado = resultado.replace(regex, value || 'N/A');
  }
  return resultado;
}

// ====== FUNCIÓN PARA OBTENER DATOS DE LA SOLICITUD ======
function obtenerDatosSolicitud(solicitudId, callback) {
  pool.query(
    `SELECT 
      s.id, s.numerodeexpediente, s.nombres_apellidos, s.razon_social, 
      s.correo, s.telefonos, s.whatsapp_consent, s.whatsapp_numero,
      s.estado, s.fecha, s.numero_certificado, s.numero_resolucion,
      s.fecha_aprobada, s.vigencia
    FROM solicitudes s 
    WHERE s.id = ?`,
    [solicitudId],
    (err, resultados) => {
      if (err) {
        console.error('[NOTIFICACIONES] Error al obtener datos de solicitud:', err);
        return callback(err, null);
      }
      if (resultados.length === 0) {
        return callback(new Error('Solicitud no encontrada'), null);
      }
      callback(null, resultados[0]);
    }
  );
}

// ====== FUNCIÓN PARA PREPARAR DATOS PARA PLANTILLA ======
function prepararDatosPlantilla(solicitud) {
  const fechaRecep = solicitud.fecha ? new Date(solicitud.fecha).toLocaleDateString('es-PE') : 'N/A';
  const fechaAprob = solicitud.fecha_aprobada ? new Date(solicitud.fecha_aprobada).toLocaleDateString('es-PE') : 'N/A';
  const fechaEmision = solicitud.fecha ? new Date(solicitud.fecha).toLocaleDateString('es-PE') : 'N/A';
  
  // Calcular vigencia (2 años desde emisión)
  let vigencia = 'N/A';
  if (solicitud.vigencia) {
    vigencia = new Date(solicitud.vigencia).toLocaleDateString('es-PE');
  } else if (solicitud.fecha) {
    const fechaVig = new Date(solicitud.fecha);
    fechaVig.setFullYear(fechaVig.getFullYear() + 2);
    vigencia = fechaVig.toLocaleDateString('es-PE');
  }

  return {
    nombre_solicitante: solicitud.nombres_apellidos || 'Estimado/a solicitante',
    expediente: solicitud.numerodeexpediente || 'Sin expediente',
    razon_social: solicitud.razon_social || 'N/A',
    fecha_recepcion: fechaRecep,
    fecha_aprobacion: fechaAprob,
    fecha_emision: fechaEmision,
    vigencia: vigencia,
    numero_certificado: solicitud.numero_certificado || 'En proceso',
    observaciones: solicitud.motivo_rechazo || solicitud.observaciones || 'Por favor, revise la información en el sistema.'
  };
}

// ====== FUNCIÓN PARA GUARDAR LOG DE NOTIFICACIÓN ======
function guardarLogNotificacion(solicitudId, tipo, destino, mensaje, estado, callback) {
  const fecha = new Date().toISOString().slice(0, 19).replace('T', ' ');
  
  pool.query(
    `INSERT INTO notificaciones_log 
      (solicitud_id, tipo_notificacion, destino, mensaje, estado_envio, fecha_envio) 
    VALUES (?, ?, ?, ?, ?, ?)`,
    [solicitudId, tipo, destino, mensaje.substring(0, 500), estado, fecha],
    (err, resultados) => {
      if (err) {
        console.error('[NOTIFICACIONES] Error al guardar log:', err);
      }
      if (callback) callback(err, resultados);
    }
  );
}

// ====== FUNCIÓN PARA ENVIAR WHATSAPP (SIMULACIÓN - IMPLEMENTAR CON API REAL) ======
function enviarWhatsApp(numero, mensaje, callback) {
  // TODO: Integrar con API de WhatsApp (Twilio, WhatsApp Business API, etc.)
  // Por ahora simulamos el envío
  
  console.log(`📱 [WHATSAPP] Enviando a ${numero}:`);
  console.log(mensaje);
  
  // Simular éxito
  setTimeout(() => {
    if (callback) callback(null, { success: true, mensaje: 'WhatsApp enviado (simulado)' });
  }, 100);
}

// ====== FUNCIÓN PARA ENVIAR EMAIL (SIMULACIÓN - IMPLEMENTAR CON NODEMAILER) ======
function enviarEmail(destino, asunto, cuerpoHtml, callback) {
  // TODO: Integrar con Nodemailer o servicio de email (SendGrid, AWS SES, etc.)
  // Por ahora simulamos el envío
  
  console.log(`📧 [EMAIL] Enviando a ${destino}:`);
  console.log(`Asunto: ${asunto}`);
  console.log(`Cuerpo: ${cuerpoHtml.substring(0, 200)}...`);
  
  // Simular éxito
  setTimeout(() => {
    if (callback) callback(null, { success: true, mensaje: 'Email enviado (simulado)' });
  }, 100);
}

// ====== FUNCIÓN PRINCIPAL: ENVIAR NOTIFICACIÓN POR ESTADO ======
function enviarNotificacionPorEstado(solicitudId, estadoAnterior, estadoNuevo, observaciones = null) {
  // Si no hay cambio de estado relevante, no enviar
  const estadosRelevantes = ['EN PROCESO', 'OBSERVADO', 'ACEPTADO', 'FINALIZADO'];
  if (!estadosRelevantes.includes(estadoNuevo?.toUpperCase())) {
    console.log(`[NOTIFICACIONES] Estado ${estadoNuevo} no requiere notificación`);
    return;
  }

  // Obtener datos de la solicitud
  obtenerDatosSolicitud(solicitudId, (err, solicitud) => {
    if (err || !solicitud) {
      console.error('[NOTIFICACIONES] Error al obtener solicitud:', err);
      return;
    }

    // Preparar datos para plantilla
    const datos = prepararDatosPlantilla(solicitud);
    if (observaciones) {
      datos.observaciones = observaciones;
    }

    // Obtener plantilla según estado
    const plantilla = plantillas[estadoNuevo.toUpperCase()];
    if (!plantilla) {
      console.log(`[NOTIFICACIONES] No hay plantilla para estado ${estadoNuevo}`);
      return;
    }

    // ENVIAR WHATSAPP (si tiene consentimiento)
    if (solicitud.whatsapp_consent == 1) {
      const numeroWhatsApp = solicitud.whatsapp_numero || solicitud.telefonos;
      if (numeroWhatsApp && /^\d{9}$/.test(numeroWhatsApp.replace(/\D/g, ''))) {
        const mensajeWhatsApp = reemplazarVariables(plantilla.whatsapp.mensaje, datos);
        
        enviarWhatsApp(numeroWhatsApp, mensajeWhatsApp, (errWhatsApp, resultadoWhatsApp) => {
          const estadoEnvio = errWhatsApp ? 'ERROR' : 'ENVIADO';
          guardarLogNotificacion(
            solicitudId, 
            'WHATSAPP', 
            numeroWhatsApp, 
            mensajeWhatsApp, 
            estadoEnvio,
            (errLog) => {
              if (errLog) console.error('[NOTIFICACIONES] Error guardando log WhatsApp:', errLog);
            }
          );
        });
      }
    }

    // ENVIAR EMAIL (siempre que tenga correo)
    if (solicitud.correo && solicitud.correo !== 'NO TIENE' && solicitud.correo.includes('@')) {
      const asuntoEmail = reemplazarVariables(plantilla.email.asunto, datos);
      const cuerpoEmail = reemplazarVariables(plantilla.email.cuerpo, datos);
      
      enviarEmail(solicitud.correo, asuntoEmail, cuerpoEmail, (errEmail, resultadoEmail) => {
        const estadoEnvio = errEmail ? 'ERROR' : 'ENVIADO';
        guardarLogNotificacion(
          solicitudId, 
          'EMAIL', 
          solicitud.correo, 
          cuerpoEmail.substring(0, 500), 
          estadoEnvio,
          (errLog) => {
            if (errLog) console.error('[NOTIFICACIONES] Error guardando log Email:', errLog);
          }
        );
      });
    }

    console.log(`✅ [NOTIFICACIONES] Notificaciones programadas para solicitud ${solicitudId} (Estado: ${estadoNuevo})`);
  });
}

module.exports = {
  enviarNotificacionPorEstado,
  obtenerDatosSolicitud,
  guardarLogNotificacion,
  plantillas
};





