const express = require('express');
const cors = require('cors');
const { pool, promise } = require('./db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt'); // 🔐 Librería para hashear contraseñas
const notificacionesService = require('./notificaciones.service'); // 📧 Servicio de notificaciones
const app = express();

// ====== Crear carpeta uploads si no existe ======
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📂 Carpeta uploads creada');
}

// ====== MULTER para guardar archivos con extensión ======
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + Date.now() + ext);
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

// Logger de peticiones
app.use((req, res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.originalUrl}`);
  if (req.method !== 'GET') {
    try { console.log('Body:', req.body); } catch {}
  }
  next();
});

// ====== FUNCIÓN PARA CONVERTIR STRINGS VACÍOS A NULL ======
function toNullIfEmpty(value) {
  if (value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '')) {
    return null;
  }
  return value;
}

// FUNCIÓN PARA FORMATO DE FECHA MySQL
function toMySQLDateTime(fecha) {
  if (!fecha) return null;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(fecha)) return fecha;
  if (typeof fecha === 'string' && fecha.includes('T')) {
    return fecha.replace('T', ' ').replace('Z', '').split('.')[0];
  }
  return fecha;
}

// FUNCIONES AUXILIARES
function valueOrNull(v) {
  return (v === 'null' || v === '' || v === undefined || v === 'undefined' || v === null) ? null : v;
}

function getField(data, ...fields) {
  for (const f of fields) {
    if (data[f] !== undefined && data[f] !== '' && data[f] !== 'null') return data[f];
  }
  return null;
}

// ====== LOGIN ACTUALIZADO CON BCRYPT 🔐 ======
app.post('/login', (req, res) => {
  const { usuario, contraseña, rol } = req.body;
  
  console.log('[LOGIN] Intento:', { usuario, rol });
  
  pool.query(
    `SELECT 
      u.id, u.usuario, u.nombres_completos, u.contraseña, u.rol_id, 
      u.fecha_creacion, u.email, u.foto_perfil, r.nombre as rol
     FROM usuarios u
     INNER JOIN roles r ON u.rol_id = r.id
     WHERE u.usuario = ? AND r.nombre = ?`,
    [usuario, rol],
    async (err, results) => {
      if (err) {
        console.error('[LOGIN] Error DB:', err.sqlMessage || err.message);
        return res.status(500).json({ 
          success: false,
          error: 'Error de base de datos',
          detail: err.sqlMessage || err.message
        });
      }
      
      if (results.length === 0) {
        return res.json({ success: false, message: 'Usuario o rol incorrecto' });
      }

      const user = results[0];
      
      // 🔐 COMPARACIÓN SEGURA CON BCRYPT
      try {
        const passwordMatch = await bcrypt.compare(contraseña, user.contraseña);
        
        if (!passwordMatch) {
          console.log('[LOGIN] ❌ Contraseña incorrecta para:', usuario);
          return res.json({ success: false, message: 'Contraseña incorrecta' });
        }
        
        console.log('[LOGIN] ✅ Contraseña verificada con bcrypt');
      } catch (bcryptError) {
        console.error('[LOGIN] Error al comparar contraseña:', bcryptError);
        return res.status(500).json({ 
          success: false, 
          message: 'Error en la verificación de contraseña' 
        });
      }
      
      // ⭐ CONSTRUIR URL COMPLETA PARA LA FOTO
      let fotoPerfilUrl = null;
      if (user.foto_perfil) {
        if (user.foto_perfil.startsWith('http')) {
          fotoPerfilUrl = user.foto_perfil;
        } else if (user.foto_perfil.startsWith('data:')) {
          fotoPerfilUrl = user.foto_perfil;
        } else {
          fotoPerfilUrl = `http://localhost:3000${user.foto_perfil}`;
        }
      }
      
      console.log('[LOGIN] ✅ Login exitoso:', user.usuario, '| roleId:', user.rol_id, '| foto:', fotoPerfilUrl);
      
      // ✅ Actualizar última sesión
      pool.query('UPDATE usuarios SET ultima_sesion = NOW() WHERE id = ?', [user.id], (errSesion) => {
        if (errSesion) console.warn('[LOGIN] No se pudo actualizar ultima_sesion:', errSesion.message);
      });
      
      res.json({ 
        success: true,
        token: 'session-' + Date.now(),
        message: 'Login exitoso',
        usuario: {
          id: user.id,
          usuario: user.usuario,
          nombres_apellidos: user.nombres_completos || user.usuario,
          nombre_completo: user.nombres_completos || user.usuario,
          fullName: user.nombres_completos || user.usuario,
          email: user.email || 'admin@huanchaco.gob.pe',
          rol: user.rol,
          rol_id: user.rol_id,
          roleId: user.rol_id,
          roleName: user.rol,
          foto_perfil: fotoPerfilUrl,
          fecha_creacion: user.fecha_creacion
        }
      });
    }
  );
});

// ====== CREAR SOLICITUD CON LATITUD Y LONGITUD ✅ CORREGIDO ======
app.post('/api/solicitud', upload.array('archivos'), (req, res) => {
  const data = req.body;

  console.log('📍 [SOLICITUD] Datos recibidos latitud:', data.latitud, 'longitud:', data.longitud);

  let archivosFinal = [];
  if (req.files && req.files.length > 0) {
    archivosFinal = req.files.map(file => ({
      nombre: file.originalname,
      url: `/uploads/${file.filename}`
    }));
  } else if (data.archivos) {
    try { archivosFinal = JSON.parse(data.archivos); } catch { archivosFinal = []; }
  }

  if (data.fecha) {
    data.fecha = toMySQLDateTime(data.fecha);
  } else {
    const ahora = new Date();
    const yyyy = ahora.getFullYear();
    const mm = String(ahora.getMonth() + 1).padStart(2, '0');
    const dd = String(ahora.getDate()).padStart(2, '0');
    const HH = String(ahora.getHours()).padStart(2, '0');
    const MM = String(ahora.getMinutes()).padStart(2, '0');
    const SS = String(ahora.getSeconds()).padStart(2, '0');
    data.fecha = `${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}`;
  }
  if (data.fecha_inicio) data.fecha_inicio = toMySQLDateTime(data.fecha_inicio);

  let confRaw = getField(data, 'confiabilidad_ml');
  if (Array.isArray(confRaw)) confRaw = confRaw[0];
  const confiabilidad = (confRaw === undefined || confRaw === null || confRaw === '' || isNaN(parseFloat(confRaw)))
    ? null : parseFloat(confRaw);

  // ⭐ PROCESAR LATITUD Y LONGITUD CORRECTAMENTE
  let latitud = null;
  let longitud = null;

  if (data.latitud && data.latitud !== '' && data.latitud !== 'null' && data.latitud !== 'undefined') {
    const latParsed = parseFloat(data.latitud);
    if (!isNaN(latParsed)) {
      latitud = latParsed;
      console.log('✅ [SOLICITUD] Latitud parseada:', latitud);
    }
  }

  if (data.longitud && data.longitud !== '' && data.longitud !== 'null' && data.longitud !== 'undefined') {
    const lngParsed = parseFloat(data.longitud);
    if (!isNaN(lngParsed)) {
      longitud = lngParsed;
      console.log('✅ [SOLICITUD] Longitud parseada:', longitud);
    }
  }

  const columnas = `
      rol, nombres_apellidos, dni_ce, domicilio, correo, telefonos,
      tipo_tramite, tipo_itse, tipo_ecse, razon_social, ruc, nombre_comercial, telefonos_establecimiento,
      direccion, referencia, localidad, distrito, provincia, departamento,
      latitud, longitud,
      giro_actividades, actividad_especifica, horario_atencion, area_ocupada, num_pisos, piso_ubicado,
      area_terreno, area_techada_por_nivel, area_libre, antiguedad_edificacion_anios, antiguedad_actividad_anios,
      riesgo_incendio, riesgo_colapso, riesgo_detalle, aforo_declarado,
      inspector_asignado, creadoPor, modificadoPor, numerodeexpediente, estado, fecha_inicio, fecha, confiabilidad_ml
    `;

  const valores = [
    valueOrNull(getField(data, 'rol')),
    valueOrNull(getField(data, 'nombres_apellidos', 'nombresApellidos')),
    valueOrNull(getField(data, 'dni_ce', 'dniCe')),
    valueOrNull(getField(data, 'domicilio')),
    valueOrNull(getField(data, 'correo')),
    valueOrNull(getField(data, 'telefonos')),
    valueOrNull(getField(data, 'tipo_tramite', 'tipoTramite')),
    valueOrNull(getField(data, 'tipo_itse', 'tipoItse')),
    valueOrNull(getField(data, 'tipo_ecse', 'tipoEcse')),
    valueOrNull(getField(data, 'razon_social', 'razonSocial')),
    valueOrNull(getField(data, 'ruc')),
    valueOrNull(getField(data, 'nombre_comercial', 'nombreComercial')),
    valueOrNull(getField(data, 'telefonos_establecimiento', 'telefonosEstablecimiento')),
    valueOrNull(getField(data, 'direccion')),
    valueOrNull(getField(data, 'referencia')),
    valueOrNull(getField(data, 'localidad')),
    valueOrNull(getField(data, 'distrito')),
    valueOrNull(getField(data, 'provincia')),
    valueOrNull(getField(data, 'departamento')),
    latitud,
    longitud,
    valueOrNull(getField(data, 'giro_actividades', 'giroActividades')),
    valueOrNull(getField(data, 'actividad_especifica', 'actividadEspecifica')),
    valueOrNull(getField(data, 'horario_atencion', 'horarioAtencion')),
    valueOrNull(getField(data, 'area_ocupada', 'areaOcupada')),
    valueOrNull(getField(data, 'num_pisos', 'numPisos')),
    valueOrNull(getField(data, 'piso_ubicado', 'pisoUbicado')),
    valueOrNull(getField(data, 'area_terreno', 'areaTerreno')),
    valueOrNull(getField(data, 'area_techada_por_nivel', 'areaTechadaPorNivel')),
    valueOrNull(getField(data, 'area_libre', 'areaLibre')),
    valueOrNull(getField(data, 'antiguedad_edificacion_anios', 'antiguedadEdificacion', 'antiguedad_edificacion')),
    valueOrNull(getField(data, 'antiguedad_actividad_anios', 'antiguedadActividad', 'antiguedad_actividad')),
    valueOrNull(getField(data, 'riesgo_incendio', 'riesgoIncendio')),
    valueOrNull(getField(data, 'riesgo_colapso', 'riesgoColapso')),
    valueOrNull(getField(data, 'riesgo_detalle', 'riesgoDetalle')),
    valueOrNull(getField(data, 'aforo_declarado', 'aforoDeclarado')),
    valueOrNull(getField(data, 'inspector_asignado', 'inspectorAsignado')),
    valueOrNull(getField(data, 'creadoPor')),
    valueOrNull(getField(data, 'modificadoPor')),
    getField(data, 'numerodeexpediente') || null,
    valueOrNull(getField(data, 'estado')),
    data.fecha_inicio || null,
    data.fecha || null,
    confiabilidad
  ];

  console.log('📍 [SOLICITUD] Valores a insertar - latitud:', valores[19], 'longitud:', valores[20]);

  const placeholders = new Array(valores.length).fill('?').join(', ');

  pool.query(
    `INSERT INTO solicitudes (${columnas}) VALUES (${placeholders})`,
    valores,
    (err, results) => {
      if (err) {
        console.error("ERROR en /api/solicitud:", err);
        return res.status(500).json({
          success: false,
          message: 'Error al guardar la solicitud',
          error: err
        });
      }

      console.log('✅ [SOLICITUD] Guardada con ID:', results.insertId);

      const id_solicitud_generado = results.insertId;

      if (data.docsSeleccionados) {
        let docs = [];
        try {
          docs = typeof data.docsSeleccionados === 'string' ? JSON.parse(data.docsSeleccionados) : data.docsSeleccionados;
        } catch { docs = []; }
        for (const [doc, seleccionado] of Object.entries(docs)) {
          if (seleccionado) {
            pool.query(
              `INSERT INTO documentos_solicitud (solicitud_id, documento, seleccionado) VALUES (?, ?, ?)`,
              [id_solicitud_generado, doc, true]
            );
          }
        }
      }

      // ✅ INSERTAR ARCHIVOS CON VALIDACIÓN MEJORADA
      for (const archivo of archivosFinal) {
        console.log('📎 Insertando archivo:', archivo.nombre, 'URL:', archivo.url);
        pool.query(
          `INSERT INTO archivos_solicitud (solicitud_id, archivo_nombre, archivo_url) VALUES (?, ?, ?)`,
          [id_solicitud_generado, archivo.nombre, archivo.url],
          (errArch) => {
            if (errArch) {
              console.error('❌ Error insertando archivo:', errArch);
            } else {
              console.log('✅ Archivo insertado correctamente');
            }
          }
        );
      }

      pool.query(
        'INSERT INTO historial (numerodeexpediente, accion, realizadoPor, campos_modificados, motivo, detalle_eliminado) VALUES (?, ?, ?, ?, ?, ?)',
        [data.numerodeexpediente || null, 'Creación solicitud', data.creadoPor || 'SIN DATOS', null, null, null],
        (errHist) => {
          if (errHist) {
            console.warn('No se pudo registrar historial:', errHist.message);
          }
          
          // ✅ NOTIFICAR AL ADMINISTRADOR sobre nueva solicitud
          crearNotificacion(
            'nueva_solicitud',
            'Nueva Solicitud ITSE Recibida',
            `Se ha registrado la solicitud ${data.numerodeexpediente || 'sin expediente'} de ${data.razon_social || 'establecimiento'}`,
            {
              rolDestino: 'administrador',
              referenciaTipo: 'solicitud',
              referenciaId: id_solicitud_generado,
              expediente: data.numerodeexpediente || null,
              icono: 'fa-file-alt',
              creadoPor: data.creadoPor || 'Sistema'
            }
          );
          
          res.status(200).json({ success: true, message: 'Solicitud guardada exitosamente' });
        }
      );
    }
  );
});

// ====== OBTENER SOLICITUDES ======
app.get('/api/solicitudes', (req, res) => {
  pool.query('SELECT * FROM solicitudes', (err, solicitudes) => {
    if (err) return res.status(500).json({ error: 'Error de base de datos' });
    if (solicitudes.length === 0) return res.json([]);
    
    let completed = 0;
    const solicitudesTransformadas = new Array(solicitudes.length);
    
    solicitudes.forEach((sol, idx) => {
      solicitudesTransformadas[idx] = {
        ...sol,
        solicitante: sol.nombres_apellidos || 'SIN DATOS',
        creadoPor: sol.creadoPor || 'SIN DATOS',
        nivelRiesgoSugerido: sol.riesgo_incendio || 'SIN_DATOS',
        documentos: [],
        archivos: []
      };
      
      pool.query('SELECT documento FROM documentos_solicitud WHERE solicitud_id = ?', [sol.id], (err2, docs) => {
        solicitudesTransformadas[idx].documentos = docs ? docs.map(d => d.documento) : [];
        
        // ✅ MEJORADO: OBTENER ARCHIVOS CON VALIDACIÓN
        pool.query(
          'SELECT archivo_nombre, archivo_url FROM archivos_solicitud WHERE solicitud_id = ?', 
          [sol.id], 
          (err3, archivos) => {
            if (archivos && archivos.length > 0) {
              solicitudesTransformadas[idx].archivos = archivos.map(a => ({
                archivo_nombre: a.archivo_nombre,
                archivoNombre: a.archivo_nombre,
                archivo_url: a.archivo_url,
                archivoUrl: a.archivo_url
              }));
              console.log(`📎 Solicitud ${sol.id} tiene ${archivos.length} archivos`);
            } else {
              solicitudesTransformadas[idx].archivos = [];
            }
            
            completed++;
            if (completed === solicitudes.length) {
              res.json(solicitudesTransformadas);
            }
          }
        );
      });
    });
  });
});

// ====== OBTENER SOLICITUD POR ID ======
app.get('/api/solicitud/:id', (req, res) => {
  const id = req.params.id;
  pool.query('SELECT * FROM solicitudes WHERE id = ?', [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    
    // ✅ MEJORADO: OBTENER ARCHIVOS CON VALIDACIÓN
    pool.query(
      'SELECT archivo_nombre, archivo_url FROM archivos_solicitud WHERE solicitud_id = ?', 
      [id], 
      (err2, archivos) => {
        if (err2) return res.status(500).json({ error: err2 });
        
        const solicitud = rows[0];
        
        if (archivos && archivos.length > 0) {
          solicitud.archivos = archivos.map(a => ({
            archivo_nombre: a.archivo_nombre,
            archivoNombre: a.archivo_nombre,
            archivo_url: a.archivo_url,
            archivoUrl: a.archivo_url
          }));
          console.log(`📎 Solicitud ${id} - Archivos encontrados:`, solicitud.archivos.length);
        } else {
          solicitud.archivos = [];
          console.log(`📎 Solicitud ${id} - Sin archivos`);
        }
        
        res.json(solicitud);
      }
    );
  });
});

// ====== SUBIR ARCHIVOS ======
app.post('/api/solicitud/:id/archivos', upload.array('archivos'), (req, res) => {
  const id = req.params.id;
  let archivosFinal = [];
  
  if (req.files && req.files.length > 0) {
    archivosFinal = req.files.map(file => ({
      nombre: file.originalname,
      url: `/uploads/${file.filename}`
    }));
  }
  
  console.log(`📎 Subiendo ${archivosFinal.length} archivos para solicitud ${id}`);
  
  for (const archivo of archivosFinal) {
    pool.query(
      `INSERT INTO archivos_solicitud (solicitud_id, archivo_nombre, archivo_url) VALUES (?, ?, ?)`,
      [id, archivo.nombre, archivo.url],
      (errArch) => {
        if (errArch) {
          console.error('❌ Error insertando archivo:', errArch);
        } else {
          console.log('✅ Archivo insertado:', archivo.nombre);
        }
      }
    );
  }
  
  res.status(200).json({ success: true, message: 'Archivos subidos correctamente' });
});

// ====== ELIMINAR ARCHIVO ======
app.delete('/api/solicitud/:id/archivo', (req, res) => {
  const id = req.params.id;
  const archivoNombre = req.query.archivoNombre;
  
  console.log(`🗑️ Eliminando archivo "${archivoNombre}" de solicitud ${id}`);
  
  if (!archivoNombre) return res.status(400).json({ error: 'archivoNombre es requerido' });
  
  pool.query(
    `DELETE FROM archivos_solicitud WHERE solicitud_id = ? AND archivo_nombre = ?`,
    [id, archivoNombre],
    (err) => {
      if (err) {
        console.error('❌ Error eliminando archivo:', err);
        return res.status(500).json({ error: err });
      }
      console.log('✅ Archivo eliminado correctamente');
      res.json({ success: true });
    }
  );
});

// ====== ELIMINAR SOLICITUD ======
app.delete('/api/solicitud/:id', (req, res) => {
  const id = req.params.id;
  pool.query('SELECT * FROM solicitudes WHERE id = ?', [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    if (!rows.length) return res.status(404).json({ success: false, message: 'Expediente no encontrado' });
    
    const detalleEliminado = JSON.stringify(rows[0]);
    const motivo = rows[0].motivo_rechazo || req.query.motivo || req.body?.motivo || null;
    const numerodeexpediente = rows[0].numerodeexpediente;
    const usuario = rows[0].creadoPor || 'SIN DATOS';

    pool.query('DELETE FROM archivos_solicitud WHERE solicitud_id = ?', [id], (errArch) => {
      if (errArch) return res.status(500).json({ error: errArch });
      pool.query('DELETE FROM documentos_solicitud WHERE solicitud_id = ?', [id], (errDocs) => {
        if (errDocs) return res.status(500).json({ error: errDocs });
        pool.query('DELETE FROM panel_fotografico WHERE solicitud_id = ?', [id], (errPanel) => {
          if (errPanel) return res.status(500).json({ error: errPanel });
          pool.query('DELETE FROM solicitudes WHERE id = ?', [id], (errDel) => {
            if (errDel) return res.status(500).json({ error: errDel });
            pool.query(
              'INSERT INTO historial (numerodeexpediente, accion, realizadoPor, campos_modificados, motivo, detalle_eliminado) VALUES (?, ?, ?, ?, ?, ?)',
              [numerodeexpediente, 'Borrado', usuario, null, motivo, detalleEliminado],
              (errHist) => {
                if (errHist) {
                  return res.json({ success: true, message: 'Solicitud eliminada (no se registró historial)' });
                }
                res.json({ success: true, message: 'Solicitud eliminada correctamente' });
              }
            );
          });
        });
      });
    });
  });
});

// ====== EDITAR SOLICITUD CON LATITUD Y LONGITUD ======
const uploadEdit = multer().any();
app.put('/api/solicitud/:id/editar', upload.array('archivos'), (req, res) => {
  const id = req.params.id;
  let data = req.body;
  for (const k in data) {
    if (Array.isArray(data[k]) && data[k].length === 1) data[k] = data[k][0];
  }
  if (data.fecha) data.fecha = toMySQLDateTime(data.fecha);

  const camposValidos = [
    'numerodeexpediente', 'nombres_apellidos', 'dni_ce', 'domicilio', 'correo', 'telefonos',
    'tipo_tramite', 'tipo_itse', 'tipo_ecse', 'razon_social', 'ruc', 'nombre_comercial', 'telefonos_establecimiento',
    'direccion', 'referencia', 'localidad', 'distrito', 'provincia', 'departamento',
    'latitud', 'longitud',
    'giro_actividades', 'actividad_especifica', 'horario_atencion', 'area_ocupada', 'num_pisos', 'piso_ubicado',
    'area_terreno', 'area_techada_por_nivel', 'area_libre', 'antiguedad_edificacion_anios', 'antiguedad_actividad_anios',
    'riesgo_incendio', 'riesgo_colapso', 'riesgo_detalle', 'aforo_declarado', 'inspector_asignado',
    'estado', 'modificadoPor', 'creadoPor', 'fecha'
  ];

  pool.query('SELECT * FROM solicitudes WHERE id = ?', [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    const actual = rows[0] || {};
    const campos = [];
    const valores = [];
    const camposModificados = [];

    for (const key in data) {
      if (
        key !== 'id' &&
        key !== 'archivos' &&
        camposValidos.includes(key) &&
        data[key] !== undefined &&
        data[key] !== 'undefined' &&
        data[key] !== null
      ) {
        if (actual[key] != data[key]) {
          campos.push(`${key} = ?`);
          valores.push(data[key]);
          camposModificados.push(key);
        }
      }
    }

    if (campos.length === 0 && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
    }

    if (campos.length > 0) {
      valores.push(id);
      pool.query(
        `UPDATE solicitudes SET ${campos.join(', ')} WHERE id = ?`,
        valores,
        (err) => {
          if (err) {
            console.error("ERROR en editar:", err);
            return res.status(500).json({ success: false, message: 'Error al actualizar', error: err });
          }
          
          // ✅ INSERTAR ARCHIVOS NUEVOS CON VALIDACIÓN
          if (req.files && req.files.length > 0) {
            console.log(`📎 Insertando ${req.files.length} archivos nuevos para solicitud ${id}`);
            
            for (const file of req.files) {
              pool.query(
                `INSERT INTO archivos_solicitud (solicitud_id, archivo_nombre, archivo_url) VALUES (?, ?, ?)`,
                [id, file.originalname, `/uploads/${file.filename}`],
                (errArch) => {
                  if (errArch) {
                    console.error('❌ Error insertando archivo:', errArch);
                  } else {
                    console.log('✅ Archivo insertado:', file.originalname);
                  }
                }
              );
            }
          }
          
          if (data.numerodeexpediente && camposModificados.length > 0) {
            let accion = 'Edición solicitud';
            if (camposModificados.length === 1 && camposModificados[0] === 'estado') {
              accion = 'Edición expediente/estado';
            }
            pool.query(
              'INSERT INTO historial (numerodeexpediente, accion, realizadoPor, campos_modificados) VALUES (?, ?, ?, ?)',
              [data.numerodeexpediente, accion, data.modificadoPor || 'SIN DATOS', camposModificados.join(', ')]
            );
          }
          
          // ✅ NOTIFICACIONES AUTOMÁTICAS CUANDO CAMBIA EL ESTADO
          if (camposModificados.includes('estado') && data.estado !== actual.estado) {
            const estadoNuevo = data.estado;
            const estadoAnterior = actual.estado;
            const expediente = data.numerodeexpediente || actual.numerodeexpediente;
            const razonSocial = data.razon_social || actual.razon_social;
            
            // ✅ NOTIFICAR AL ADMINISTRADOR sobre CUALQUIER cambio de estado
            crearNotificacion(
              'cambio_estado',
              'Estado de Solicitud Actualizado',
              `La solicitud ${expediente} cambió de "${estadoAnterior}" a "${estadoNuevo}"`,
              {
                rolDestino: 'administrador',
                referenciaTipo: 'solicitud',
                referenciaId: id,
                expediente: expediente,
                icono: 'fa-exchange-alt',
                creadoPor: data.modificadoPor || 'Sistema'
              }
            );
            
            // ✅ NOTIFICAR AL ADMINISTRATIVO cuando el inspector ACEPTA/APRUEBA
            if (['Aceptada', 'Aprobada', 'Aprobado', 'Completada'].includes(estadoNuevo)) {
              crearNotificacion(
                'solicitud_aceptada',
                'Solicitud Aceptada por Inspector',
                `El inspector ha aceptado la solicitud ${expediente} de ${razonSocial}`,
                {
                  rolDestino: 'administrativo',
                  referenciaTipo: 'solicitud',
                  referenciaId: id,
                  expediente: expediente,
                  icono: 'fa-check-circle',
                  creadoPor: data.modificadoPor || 'Inspector'
                }
              );
            }
            
            // ✅ NOTIFICAR AL ADMINISTRATIVO cuando se RECHAZA
            if (['Rechazada', 'Rechazado', 'Denegada'].includes(estadoNuevo)) {
              crearNotificacion(
                'solicitud_rechazada',
                'Solicitud Rechazada',
                `La solicitud ${expediente} ha sido rechazada`,
                {
                  rolDestino: 'administrativo',
                  referenciaTipo: 'solicitud',
                  referenciaId: id,
                  expediente: expediente,
                  icono: 'fa-times-circle',
                  creadoPor: data.modificadoPor || 'Inspector'
                }
              );
            }
          }
          
          // ✅ NOTIFICAR AL ADMINISTRADOR cuando se asigna un inspector
          if (camposModificados.includes('inspector_asignado') && data.inspector_asignado !== actual.inspector_asignado) {
            crearNotificacion(
              'asignacion_inspector',
              'Inspector Asignado a Solicitud',
              `Se asignó un inspector a la solicitud ${data.numerodeexpediente || actual.numerodeexpediente}`,
              {
                rolDestino: 'administrador',
                referenciaTipo: 'solicitud',
                referenciaId: id,
                expediente: data.numerodeexpediente || actual.numerodeexpediente,
                icono: 'fa-user-check',
                creadoPor: data.modificadoPor || 'Sistema'
              }
            );
          }
          
          res.json({ success: true, message: 'Solicitud actualizada correctamente' });
        }
      );
    } else if (req.files && req.files.length > 0) {
      console.log(`📎 Solo subiendo ${req.files.length} archivos para solicitud ${id}`);
      
      for (const file of req.files) {
        pool.query(
          `INSERT INTO archivos_solicitud (solicitud_id, archivo_nombre, archivo_url) VALUES (?, ?, ?)`,
          [id, file.originalname, `/uploads/${file.filename}`],
          (errArch) => {
            if (errArch) {
              console.error('❌ Error insertando archivo:', errArch);
            } else {
              console.log('✅ Archivo insertado:', file.originalname);
            }
          }
        );
      }
      
      res.json({ success: true, message: 'Archivos subidos correctamente' });
    }
  });
});

// ====== HISTORIAL ======
app.get('/api/historial', (req, res) => {
  const { q } = req.query;
  let sql = 'SELECT numerodeexpediente, accion, fecha, realizadoPor as modificadoPor, campos_modificados, motivo, detalle_eliminado FROM historial';
  let params = [];
  if (q) {
    sql += ' WHERE numerodeexpediente LIKE ? OR realizadoPor LIKE ?';
    params = [`%${q}%`, `%${q}%`];
  }
  sql += ' ORDER BY fecha DESC';
  pool.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener historial' });
    res.json(results);
  });
});

// ====== EXPEDIENTES INSPECTOR ======
app.get('/api/expedientes-inspector', (req, res) => {
  const inspector = req.query.inspector;
  pool.query(
    `SELECT id, numerodeexpediente, nombres_apellidos, riesgo_incendio, estado, fecha
     FROM solicitudes WHERE inspector_asignado = ?`,
    [inspector],
    (err, results) => {
      if (err) return res.status(500).send(err);
      res.json(results);
    }
  );
});

// ====== INFORMES INSPECTOR ======
app.get('/api/informes-inspector', (req, res) => {
  const inspector = req.query.inspector;
  pool.query(
    `SELECT s.id, s.numerodeexpediente, MIN(pf.fecha_creacion) AS fecha_inspeccion, s.estado
     FROM solicitudes s
     LEFT JOIN panel_fotografico pf ON s.id = pf.solicitud_id
     WHERE s.inspector_asignado = ?
     GROUP BY s.id, s.numerodeexpediente, s.estado
     ORDER BY fecha_inspeccion DESC`,
    [inspector],
    (err, results) => {
      if (err) {
        console.error("Error en informes-inspector:", err);
        return res.status(500).json({ error: err });
      }
      res.json(results);
    }
  );
});

// ====== PANEL FOTOGRAFICO ======
app.post('/panel-fotografico', upload.array('imagenes'), async (req, res) => {
  const { solicitud_id, evidencias } = req.body;
  let evidenciasArr = [];
  try {
    evidenciasArr = typeof evidencias === 'string' ? JSON.parse(evidencias) : evidencias;
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Error en evidencias', error });
  }
  if (!solicitud_id) {
    return res.status(400).json({ success: false, message: 'solicitud_id es requerido' });
  }
  for (let i = 0; i < evidenciasArr.length; i++) {
    const evidencia = evidenciasArr[i];
    const imagenFile = req.files[i];
    const imagen_url = imagenFile ? `/uploads/${imagenFile.filename}` : null;
    
    // ✅ Normalizar el valor de cumple: debe ser 1, 0, o NULL
    let cumpleValue = null;
    if (evidencia.cumple === true || evidencia.cumple === 'true' || evidencia.cumple === '1' || evidencia.cumple === 1 || evidencia.cumple === 'SI' || evidencia.cumple === 'Si' || evidencia.cumple === 'si' || evidencia.cumple === 'SÍ' || evidencia.cumple === 'Sí' || evidencia.cumple === 'sí') {
      cumpleValue = 1;
    } else if (evidencia.cumple === false || evidencia.cumple === 'false' || evidencia.cumple === '0' || evidencia.cumple === 0 || evidencia.cumple === 'NO' || evidencia.cumple === 'No' || evidencia.cumple === 'no') {
      cumpleValue = 0;
    }
    // Si es string vacío '' o undefined, queda como NULL
    
    await new Promise((resolve, reject) => {
      pool.query(
        'INSERT INTO panel_fotografico (solicitud_id, descripcion, imagen_url, cumple, fecha_creacion) VALUES (?, ?, ?, ?, NOW())',
        [solicitud_id, evidencia.descripcion, imagen_url, cumpleValue],
        (err, result) => {
          if (err) reject(err); else resolve(result);
        }
      );
    });
  }
  res.json({ success: true, message: 'Panel fotográfico guardado exitosamente' });
});

// ====== USUARIOS ======
app.get('/api/usuarios', (req, res) => {
  pool.query(
    `SELECT 
      u.id, 
      u.usuario AS username, 
      u.nombres_completos AS fullName, 
      u.email,
      u.dni,
      u.cargo,
      u.departamento,
      u.rol_id AS roleId,
      r.nombre AS roleName,
      u.fecha_creacion AS createdAt,
      u.estado,u.foto_perfil
     FROM usuarios u
     INNER JOIN roles r ON u.rol_id = r.id
     ORDER BY u.id ASC`,
    (err, results) => {
      if (err) {
        console.error('[GET /api/usuarios] Error:', err);
        return res.status(500).json({ error: err });
      }
      res.json(results);
    }
  );
});

app.get('/api/roles', (req, res) => {
  pool.query(`SELECT id, nombre AS name FROM roles ORDER BY id`, (err, results) => {
    if (err) {
      console.error('[GET /api/roles] Error:', err);
      return res.status(500).json({ error: err });
    }
    console.log('[GET /api/roles] Roles encontrados:', results);
    
    // Verificar que el rol de Inspector existe
    const inspectorRol = results.find(r => r.id === 3 || r.name?.toLowerCase().includes('inspector'));
    if (!inspectorRol) {
      console.warn('⚠️ [GET /api/roles] Advertencia: No se encontró el rol de Inspector (ID: 3)');
      console.warn('⚠️ [GET /api/roles] Roles disponibles:', results);
    } else {
      console.log('✅ [GET /api/roles] Rol de Inspector encontrado:', inspectorRol);
    }
    
    res.json(results);
  });
});

// 🔍 ENDPOINT DE DIAGNÓSTICO: Verificar roles y usuarios
app.get('/api/diagnostico/roles', (req, res) => {
  // Obtener todos los roles
  pool.query('SELECT id, nombre FROM roles ORDER BY id', (errRoles, roles) => {
    if (errRoles) {
      return res.status(500).json({ error: 'Error al obtener roles', detail: errRoles.message });
    }
    
    // Contar usuarios por rol
    pool.query(`
      SELECT 
        r.id,
        r.nombre,
        COUNT(u.id) as total_usuarios
      FROM roles r
      LEFT JOIN usuarios u ON r.id = u.rol_id
      GROUP BY r.id, r.nombre
      ORDER BY r.id
    `, (errCount, conteo) => {
      if (errCount) {
        return res.status(500).json({ error: 'Error al contar usuarios', detail: errCount.message });
      }
      
      res.json({
        roles: roles,
        conteoPorRol: conteo,
        totalRoles: roles.length,
        inspectorRol: roles.find(r => r.id === 3 || r.name?.toLowerCase().includes('inspector'))
      });
    });
  });
});

// 🔍 ENDPOINT DE DIAGNÓSTICO: Verificar inspector_asignado en solicitudes
app.get('/api/diagnostico/inspectores-solicitudes', (req, res) => {
  // Obtener todas las solicitudes con inspector_asignado
  pool.query(`
    SELECT 
      s.id,
      s.numerodeexpediente,
      s.inspector_asignado,
      s.razon_social,
      u.id as usuario_id,
      u.usuario as usuario_nombre,
      u.nombres_completos,
      u.rol_id
    FROM solicitudes s
    LEFT JOIN usuarios u ON (
      TRIM(s.inspector_asignado) = TRIM(u.usuario)
      OR LOWER(TRIM(s.inspector_asignado)) = LOWER(TRIM(u.usuario))
    ) AND u.rol_id = 3
    WHERE s.inspector_asignado IS NOT NULL 
    AND s.inspector_asignado != ''
    AND s.fecha IS NOT NULL
    ORDER BY s.id DESC
    LIMIT 20
  `, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener diagnósticos', detail: err.message });
    }
    
    // Obtener también todos los inspectores disponibles
    pool.query(`
      SELECT id, usuario, nombres_completos, rol_id 
      FROM usuarios 
      WHERE rol_id = 3 
      ORDER BY id
    `, (errInspectores, inspectores) => {
      if (errInspectores) {
        return res.status(500).json({ error: 'Error al obtener inspectores', detail: errInspectores.message });
      }
      
      res.json({
        solicitudes: results,
        inspectoresDisponibles: inspectores,
        totalSolicitudes: results.length,
        solicitudesConInspectorEncontrado: results.filter(r => r.usuario_id !== null).length,
        solicitudesSinInspectorEncontrado: results.filter(r => r.usuario_id === null).length
      });
    });
  });
});

// ✅ CREAR USUARIO CON BCRYPT 🔐
app.post('/api/usuarios', async (req, res) => {
  const { username, fullName, roleId, password, email, dni, telefono, cargo, departamento, fecha_ingreso, id_empleado } = req.body;
  
  console.log('[POST /api/usuarios] Creando usuario con roleId:', roleId);
  
  // 🔐 HASHEAR CONTRASEÑA ANTES DE GUARDAR
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 10);
    console.log('[POST /api/usuarios] ✅ Contraseña hasheada con bcrypt');
  } catch (bcryptError) {
    console.error('[POST /api/usuarios] ❌ Error al hashear contraseña:', bcryptError);
    return res.status(500).json({ 
      success: false, 
      error: 'Error al procesar la contraseña' 
    });
  }
  
  // Validar que el roleId sea un número válido
  const roleIdNum = parseInt(roleId);
  if (isNaN(roleIdNum) || roleIdNum < 1) {
    console.error('[POST /api/usuarios] ❌ RoleId inválido:', roleId);
    return res.status(400).json({ 
      success: false, 
      error: 'Rol no válido. El ID del rol debe ser un número válido.' 
    });
  }

  pool.query('SELECT id, nombre FROM roles WHERE id = ?', [roleIdNum], (errRol, rolesResult) => {
    if (errRol) {
      console.error('[POST /api/usuarios] ❌ Error al consultar rol:', errRol);
      return res.status(500).json({ 
        success: false, 
        error: 'Error al validar el rol',
        detail: errRol.sqlMessage || errRol.message 
      });
    }
    
    if (!rolesResult || rolesResult.length === 0) {
      console.error('[POST /api/usuarios] ❌ Rol no encontrado. RoleId:', roleIdNum);
      // Obtener todos los roles disponibles para el mensaje de error
      pool.query('SELECT id, nombre FROM roles', (errAll, allRoles) => {
        const rolesDisponibles = errAll ? [] : allRoles;
        console.error('[POST /api/usuarios] Roles disponibles en BD:', rolesDisponibles);
        return res.status(400).json({ 
          success: false, 
          error: `Rol con ID ${roleIdNum} no encontrado.`,
          rolesDisponibles: rolesDisponibles
        });
      });
      return;
    }
    
    const cargoAsignado = rolesResult[0].nombre;
    console.log('[POST /api/usuarios] ✅ Cargo asignado desde roles:', cargoAsignado, '(RoleId:', roleIdNum, ')');

    pool.query(
      `INSERT INTO usuarios (
        usuario, 
        nombres_completos, 
        rol_id, 
        contraseña, 
        email,
        dni,
        telefono,
        cargo,
        departamento,
        fecha_ingreso,
        id_empleado,
        estado,
        fecha_creacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo', NOW())`,
      [
        username, 
        fullName, 
        roleIdNum,  // Usar el número validado
        hashedPassword,  // 🔐 Ahora se guarda el hash, no la contraseña en texto plano
        email || null,
        dni || null,
        telefono || null,
        cargoAsignado,
        departamento || 'Defensa Civil',
        fecha_ingreso || null,
        id_empleado || null
      ],
      (err, result) => {
        if (err) {
          console.error('[POST /api/usuarios] Error:', err);
          return res.status(500).json({ 
            success: false, 
            error: 'Error al crear usuario',
            detail: err.sqlMessage || err.message 
          });
        }
        
        console.log('[POST /api/usuarios] ✅ Usuario creado exitosamente:', {
          id: result.insertId,
          username: username,
          rol_id: roleIdNum,
          cargo: cargoAsignado
        });
        
        res.json({ 
          success: true, 
          id: result.insertId,
          message: 'Usuario creado correctamente'
        });
      }
    );
  });
});

// ✅ ACTUALIZAR USUARIO
app.put('/api/usuarios/:id', (req, res) => {
  const id = req.params.id;
  const { username, fullName, roleId } = req.body;
  
  console.log('[PUT /api/usuarios/:id] Actualizando usuario id:', id, 'roleId:', roleId);
  
  // Validar que el roleId sea un número válido
  const roleIdNum = parseInt(roleId);
  if (isNaN(roleIdNum) || roleIdNum < 1) {
    console.error('[PUT /api/usuarios/:id] ❌ RoleId inválido:', roleId);
    return res.status(400).json({ 
      success: false, 
      error: 'Rol no válido. El ID del rol debe ser un número válido.' 
    });
  }

  pool.query('SELECT id, nombre FROM roles WHERE id = ?', [roleIdNum], (errRol, rolesResult) => {
    if (errRol) {
      console.error('[PUT /api/usuarios/:id] ❌ Error al consultar rol:', errRol);
      return res.status(500).json({ 
        success: false, 
        error: 'Error al validar el rol',
        detail: errRol.sqlMessage || errRol.message 
      });
    }
    
    if (!rolesResult || rolesResult.length === 0) {
      console.error('[PUT /api/usuarios/:id] ❌ Rol no encontrado. RoleId:', roleIdNum);
      // Obtener todos los roles disponibles para el mensaje de error
      pool.query('SELECT id, nombre FROM roles', (errAll, allRoles) => {
        const rolesDisponibles = errAll ? [] : allRoles;
        console.error('[PUT /api/usuarios/:id] Roles disponibles en BD:', rolesDisponibles);
        return res.status(400).json({ 
          success: false, 
          error: `Rol con ID ${roleIdNum} no encontrado.`,
          rolesDisponibles: rolesDisponibles
        });
      });
      return;
    }
    
    const cargoAsignado = rolesResult[0].nombre;
    console.log('[PUT /api/usuarios/:id] ✅ Cargo asignado desde roles:', cargoAsignado, '(RoleId:', roleIdNum, ')');
    
    pool.query(
      `UPDATE usuarios SET usuario=?, nombres_completos=?, rol_id=?, cargo=? WHERE id=?`,
      [username, fullName, roleIdNum, cargoAsignado, id],
      (err, result) => {
        if (err) {
          console.error('[PUT /api/usuarios/:id] Error:', err);
          return res.status(500).json({ 
            success: false,
            error: 'Error al actualizar usuario',
            detail: err.sqlMessage || err.message 
          });
        }
        
        console.log('[PUT /api/usuarios/:id] ✅ Usuario actualizado. affectedRows:', result.affectedRows, 'cargo:', cargoAsignado);
        res.json({ success: true });
      }
    );
  });
});

app.delete('/api/usuarios/:id', (req, res) => {
  const id = req.params.id;
  pool.query(`DELETE FROM usuarios WHERE id=?`, [id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true });
  });
});

// 🔐 ACTUALIZAR CONTRASEÑA CON BCRYPT
app.patch('/api/usuarios/:id/password', async (req, res) => {
  const id = req.params.id;
  const { password } = req.body;
  
  // 🔐 HASHEAR LA NUEVA CONTRASEÑA
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('[PATCH /api/usuarios/:id/password] ✅ Contraseña hasheada para usuario id:', id);
    
    pool.query(`UPDATE usuarios SET contraseña=? WHERE id=?`, [hashedPassword, id], (err) => {
      if (err) {
        console.error('[PATCH /api/usuarios/:id/password] ❌ Error:', err);
        return res.status(500).json({ error: err });
      }
      console.log('[PATCH /api/usuarios/:id/password] ✅ Contraseña actualizada exitosamente');
      res.json({ success: true });
    });
  } catch (bcryptError) {
    console.error('[PATCH /api/usuarios/:id/password] ❌ Error al hashear:', bcryptError);
    return res.status(500).json({ 
      success: false, 
      error: 'Error al procesar la contraseña' 
    });
  }
});

// ====== CAMBIO DE ESTADO ✅ CORREGIDO CON solicitud_id ======
app.put('/api/solicitud/:id/estado', (req, res) => {
  const id = req.params.id;
  const { estado, motivo_rechazo } = req.body;
  const fechaHoy = new Date();
  let query = '';
  let params = [];

  if (estado === "Aprobada") {
    const yyyy = fechaHoy.getFullYear();
    const mm = String(fechaHoy.getMonth() + 1).padStart(2, '0');
    const dd = String(fechaHoy.getDate()).padStart(2, '0');
    const fechaAprobada = `${yyyy}-${mm}-${dd}`;
    const fechaVigencia = `${yyyy + 2}-${mm}-${dd}`;
    query = 'UPDATE solicitudes SET estado = ?, fecha_aprobada = ?, vigencia = ? WHERE id = ?';
    params = [estado, fechaAprobada, fechaVigencia, id];
  } else if (estado && estado.toLowerCase() === "rechazada") {
    const yyyy = fechaHoy.getFullYear();
    const mm = String(fechaHoy.getMonth() + 1).padStart(2, '0');
    const dd = String(fechaHoy.getDate()).padStart(2, '0');
    const fechaRechazada = `${yyyy}-${mm}-${dd}`;
    query = 'UPDATE solicitudes SET estado = ?, fecha_rechazada = ?, motivo_rechazo = ? WHERE id = ?';
    params = [estado, fechaRechazada, motivo_rechazo || null, id];
  } else if (estado === "ACEPTADO") {
    query = 'UPDATE solicitudes SET estado = ?, check_inspector = 1 WHERE id = ?';
    params = [estado, id];
  } else if (estado && estado.toUpperCase() === 'FINALIZADO') {
    query = 'UPDATE solicitudes SET estado = ?, fecha_finalizado = NOW() WHERE id = ?';
    params = [estado, id];
  } else {
    query = 'UPDATE solicitudes SET estado = ? WHERE id = ?';
    params = [estado, id];
  }

  // Obtener estado anterior antes de actualizar
  pool.query('SELECT estado FROM solicitudes WHERE id = ?', [id], (errAntes, antesRows) => {
    const estadoAnterior = antesRows && antesRows.length ? antesRows[0].estado : null;

    pool.query(query, params, (err) => {
      if (err) {
        console.error('[estado] UPDATE error:', err);
        return res.status(500).json({ error: err });
      }

      // 📧 ENVIAR NOTIFICACIONES AUTOMÁTICAS
      try {
        notificacionesService.enviarNotificacionPorEstado(id, estadoAnterior, estado, motivo_rechazo);
      } catch (notifError) {
        console.error('[NOTIFICACIONES] Error al enviar notificaciones:', notifError);
        // No fallar la respuesta si las notificaciones fallan
      }

      if (estado && estado.toLowerCase() === "rechazada") {
        pool.query('SELECT numerodeexpediente, creadoPor FROM solicitudes WHERE id = ?', [id], (err2, rows) => {
          if (!err2 && rows.length) {
            pool.query(
              'INSERT INTO historial (numerodeexpediente, accion, realizadoPor, campos_modificados, motivo) VALUES (?, ?, ?, ?, ?)',
              [rows[0].numerodeexpediente, 'Rechazado', rows[0].creadoPor || 'SIN DATOS', 'estado', motivo_rechazo || null]
            );
          }
        });
      }

      if (!(estado && estado.toUpperCase() === 'FINALIZADO')) {
        return res.json({ success: true });
      }

      // ✅ PROCESO DE FINALIZACIÓN - MOVER A LOCALES CON solicitud_id
      console.log('🔄 [FINALIZADO] Iniciando proceso de finalización para solicitud ID:', id);
      
      pool.query(
        `SELECT s.id, s.numerodeexpediente, s.nombres_apellidos, s.razon_social, s.riesgo_incendio, s.tipo_tramite, s.fecha_finalizado
         FROM solicitudes s WHERE s.id = ?`,
        [id],
        (errSol, solRows) => {
        if (errSol) {
          console.error('❌ [FINALIZADO] SELECT error:', errSol);
          return res.status(500).json({ success: false, error: 'DB error leyendo solicitud', detail: errSol.message });
        }
        if (!solRows || !solRows.length) {
          console.error('❌ [FINALIZADO] Solicitud no encontrada con ID:', id);
          return res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
        }

        const sol = solRows[0];
        const solicitudId = sol.id;
        const expediente = sol.numerodeexpediente;
        
        console.log('📋 [FINALIZADO] Datos de solicitud:', {
          id: solicitudId,
          expediente,
          razon_social: sol.razon_social,
          tipo_tramite: sol.tipo_tramite
        });
        
        if (!expediente || expediente === '' || expediente === null) {
          console.error('❌ [FINALIZADO] La solicitud NO tiene número de expediente asignado');
          return res.status(400).json({ 
            success: false, 
            error: 'La solicitud debe tener un número de expediente para poder finalizarla',
            needsExpediente: true
          });
        }

        pool.query(
          'SELECT numero_resolucion, numero_certificado FROM reporte WHERE solicitud_id = ?',
          [id],
          (errRep, repRows) => {
            if (errRep) {
              console.error('❌ [FINALIZADO] SELECT reporte error:', errRep);
              return res.status(500).json({ success: false, error: 'DB error leyendo reporte', detail: errRep.message });
            }
            const rep = repRows && repRows[0] ? repRows[0] : {};
            const numero_resolucion = rep.numero_resolucion || null;
            const numero_certificado = rep.numero_certificado || null;
            
            console.log('📄 [FINALIZADO] Datos del reporte:', {
              numero_resolucion,
              numero_certificado,
              found: repRows && repRows.length > 0
            });

            pool.query('SELECT id FROM locales WHERE expediente = ? LIMIT 1', [expediente], (errLocSel, locSel) => {
              if (errLocSel) {
                console.error('❌ [FINALIZADO] SELECT locales error:', errLocSel);
                return res.status(500).json({ success: false, error: 'DB error leyendo locales', detail: errLocSel.message });
              }

              const localExiste = locSel && locSel.length > 0;
              console.log(`🔍 [FINALIZADO] ¿Local existe con expediente ${expediente}?`, localExiste);

              const riesgo = sol.tipo_tramite && (sol.tipo_tramite + '').toUpperCase() === 'ECSE'
                ? 'ECSE'
                : (sol.riesgo_incendio || '');

              const solicitante = sol.nombres_apellidos || '';
              const razon_social = sol.razon_social || '';
              const tipo = sol.tipo_tramite || null;
              
              console.log('📦 [FINALIZADO] Datos a insertar/actualizar:', {
                solicitudId,
                riesgo,
                expediente,
                solicitante,
                razon_social,
                tipo,
                numero_resolucion,
                numero_certificado
              });

              if (locSel && locSel.length > 0) {
                // ✅ ACTUALIZAR LOCAL EXISTENTE (INCLUYE solicitud_id)
                const locId = locSel[0].id;
                console.log(`🔄 [FINALIZADO] ACTUALIZANDO local existente con ID: ${locId}`);
                
                pool.query(
                  `UPDATE locales SET 
                    solicitud_id = ?, 
                    riesgo = ?, 
                    solicitante = ?, 
                    razon_social = ?, 
                    num_resolucion = ?, 
                    num_certificado = ?, 
                    vigencia = DATE_ADD(IFNULL(?, CURDATE()), INTERVAL 2 YEAR), 
                    estado_licencia = 'VIGENTE', 
                    tipo = ? 
                   WHERE id = ?`,
                  [solicitudId, riesgo, solicitante, razon_social, numero_resolucion, numero_certificado, sol.fecha_finalizado, tipo, locId],
                  (errLocUpd) => {
                    if (errLocUpd) {
                      console.error('❌ [FINALIZADO] UPDATE locales error:', errLocUpd);
                      return res.status(500).json({ success: false, error: 'DB error actualizando locales', detail: errLocUpd.message });
                    }
                    console.log(`✅ [FINALIZADO] Local ACTUALIZADO exitosamente. ID: ${locId}, Expediente: ${expediente}`);
                    return res.json({ success: true, locales_upsert: 'updated', expediente, localId: locId });
                  }
                );
              } else {
                // ✅ INSERTAR NUEVO LOCAL (INCLUYE solicitud_id)
                console.log('➕ [FINALIZADO] INSERTANDO nuevo local en la tabla');
                
                pool.query(
                 `INSERT INTO locales (
  solicitud_id, riesgo, expediente, solicitante, razon_social, 
  num_resolucion, num_certificado, vigencia, estado_licencia, tipo
) VALUES (?, ?, ?, ?, ?, ?, ?, DATE_ADD(IFNULL(?, CURDATE()), INTERVAL 2 YEAR), 'VIGENTE', ?)`,
                  [
                    solicitudId, // ✅ AGREGADO: ID de la solicitud
                    riesgo, 
                    expediente, 
                    solicitante, 
                    razon_social, 
                    numero_resolucion, 
                    numero_certificado, 
                    sol.fecha_finalizado, 
                    tipo
                  ],
                  (errLocIns, insRes) => {
                    if (errLocIns) {
                      console.error('❌ [FINALIZADO] INSERT locales error:', errLocIns);
                      console.error('❌ [FINALIZADO] SQL Message:', errLocIns.sqlMessage);
                      console.error('❌ [FINALIZADO] SQL State:', errLocIns.sqlState);
                      return res.status(500).json({ success: false, error: 'DB error insertando en locales', detail: errLocIns.message, sqlMessage: errLocIns.sqlMessage });
                    }
                    const nuevoLocalId = insRes?.insertId;
                    console.log(`✅ [FINALIZADO] Local INSERTADO exitosamente. Nuevo ID: ${nuevoLocalId}, Expediente: ${expediente}`);
                    return res.json({ 
                      success: true, 
                      locales_upsert: 'inserted', 
                      expediente, 
                      localId: nuevoLocalId 
                    });
                  }
                );
              }
            });
          }
        );
      }
      );
    }); // Cierre del pool.query('SELECT estado FROM solicitudes')
  });
});

// ====== LOCALES ======
app.get('/locales', (req, res) => {
  pool.query(
    `SELECT 
      l.id, 
      l.solicitud_id, 
      l.riesgo, 
      l.expediente, 
      l.solicitante, 
      l.razon_social, 
      l.num_resolucion, 
      l.num_certificado, 
      DATE_FORMAT(l.vigencia, "%Y-%m-%d") as vigencia, 
      l.estado_licencia, 
      l.tipo,
      s.latitud,
      s.longitud,
      s.direccion
    FROM locales l
    LEFT JOIN solicitudes s ON l.solicitud_id = s.id`,
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
    }
  );
});

// ✅ OBTENER DETALLE DE LOCAL CON DATOS DE SOLICITUD
app.get('/api/locales/:expediente/detalle', (req, res) => {
  const expediente = req.params.expediente;
  
  pool.query('SELECT * FROM locales WHERE expediente = ?', [expediente], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0) return res.status(404).json({ error: 'Local no encontrado' });
    
    const local = results[0];
    
    // ✅ SI TIENE solicitud_id, OBTENER DATOS COMPLETOS DE LA SOLICITUD
    if (local.solicitud_id) {
      pool.query('SELECT * FROM solicitudes WHERE id = ?', [local.solicitud_id], (errSol, solRows) => {
        if (errSol) {
          console.error('[locales detalle] Error obteniendo solicitud:', errSol);
          return res.json(local); // Devolver solo datos del local si falla
        }
        
        if (solRows && solRows.length > 0) {
          // ✅ COMBINAR DATOS DEL LOCAL CON DATOS DE LA SOLICITUD
          const solicitud = solRows[0];
          const detalleCompleto = {
            ...local,
            ...solicitud,
            // Preservar campos importantes del local que no deben sobrescribirse
            id: local.id,
            solicitud_id: local.solicitud_id,
            vigencia: local.vigencia,
            estado_licencia: local.estado_licencia
          };
          
          console.log('✅ [locales detalle] Datos completos encontrados para solicitud:', local.solicitud_id);
          res.json(detalleCompleto);
        } else {
          console.log('⚠️ [locales detalle] No se encontró solicitud asociada');
          res.json(local);
        }
      });
    } else {
      // ✅ NO TIENE solicitud_id, DEVOLVER SOLO DATOS DEL LOCAL
      console.log('⚠️ [locales detalle] Local sin solicitud_id asociado');
      res.json(local);
    }
  });
});

// ====== INFORME ======
app.get('/api/informe/:id', (req, res) => {
  const id = req.params.id;
  pool.query('SELECT * FROM solicitudes WHERE id = ?', [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    if (!rows.length) return res.status(404).json({ error: 'No se encontró el informe' });
    
    // ✅ MEJORADO: OBTENER ARCHIVOS CON VALIDACIÓN
    pool.query(
      'SELECT archivo_nombre, archivo_url FROM archivos_solicitud WHERE solicitud_id = ?', 
      [id], 
      (errArch, archivos) => {
        if (errArch) return res.status(500).json({ error: errArch });
        
        pool.query('SELECT * FROM panel_fotografico WHERE solicitud_id = ?', [id], (err2, panel) => {
          if (err2) return res.status(500).json({ error: err2 });
          
          const informe = rows[0];
          
          if (archivos && archivos.length > 0) {
            informe.archivos = archivos.map(a => ({
              archivo_nombre: a.archivo_nombre,
              archivoNombre: a.archivo_nombre,
              archivo_url: a.archivo_url,
              archivoUrl: a.archivo_url
            }));
          } else {
            informe.archivos = [];
          }
          
          // ✅ CONSTRUIR URLs COMPLETAS PARA IMÁGENES DEL PANEL FOTOGRÁFICO
          // ✅ NORMALIZAR CAMPO cumple PARA COMPATIBILIDAD
          const panelConUrls = (panel || []).map(foto => {
            let cumpleNormalizado = foto.cumple;
            
            // Normalizar valores de texto a números
            if (foto.cumple === 'SI' || foto.cumple === 'Si' || foto.cumple === 'si' || foto.cumple === 'SÍ' || foto.cumple === 'Sí' || foto.cumple === 'sí' || foto.cumple === 'true') {
              cumpleNormalizado = 1;
            } else if (foto.cumple === 'NO' || foto.cumple === 'No' || foto.cumple === 'no' || foto.cumple === 'false') {
              cumpleNormalizado = 0;
            }
            
            return {
              ...foto,
              cumple: cumpleNormalizado,
              imagen_url: foto.imagen_url ? `http://localhost:3000${foto.imagen_url}` : null
            };
          });
          
          console.log(`[INFORME] ✅ Informe ${id} con ${panelConUrls.length} fotos en panel`);
          
          res.json({ informe, panelFotografico: panelConUrls });
        });
      }
    );
  });
});

app.put('/api/solicitud/:id/editar-expediente', (req, res) => {
  const id = req.params.id;
  const { numerodeexpediente, modificadoPor } = req.body;
  pool.query(
    'UPDATE solicitudes SET numerodeexpediente = ?, modificadoPor = ? WHERE id = ?',
    [numerodeexpediente, modificadoPor, id],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ success: true });
    }
  );
});

// ====== OBTENER FOTOS DEL PANEL FOTOGRÁFICO ======
app.get('/api/panel-fotografico/:solicitudId', (req, res) => {
  const solicitudId = req.params.solicitudId;
  
  pool.query(
    'SELECT * FROM panel_fotografico WHERE solicitud_id = ? ORDER BY fecha_creacion DESC',
    [solicitudId],
    (err, results) => {
      if (err) {
        console.error('[PANEL FOTOGRÁFICO] Error al obtener fotos:', err);
        return res.status(500).json({ error: err.message });
      }
      
      // Construir URLs completas y normalizar cumple
      const fotosConUrl = results.map(foto => {
        let cumpleNormalizado = foto.cumple;
        
        // Normalizar valores de texto a números
        if (foto.cumple === 'SI' || foto.cumple === 'Si' || foto.cumple === 'si' || foto.cumple === 'SÍ' || foto.cumple === 'Sí' || foto.cumple === 'sí' || foto.cumple === 'true') {
          cumpleNormalizado = 1;
        } else if (foto.cumple === 'NO' || foto.cumple === 'No' || foto.cumple === 'no' || foto.cumple === 'false') {
          cumpleNormalizado = 0;
        }
        
        return {
          ...foto,
          cumple: cumpleNormalizado,
          imagen_url: foto.imagen_url ? `http://localhost:3000${foto.imagen_url}` : null
        };
      });
      
      console.log(`[PANEL FOTOGRÁFICO] ✅ ${fotosConUrl.length} fotos encontradas para solicitud ${solicitudId}`);
      
      // 🔍 DEBUG: Mostrar valores de cumple
      fotosConUrl.forEach((foto, i) => {
        console.log(`  Foto ${i} - cumple:`, foto.cumple, `(tipo: ${typeof foto.cumple})`);
      });
      
      res.json(fotosConUrl);
    }
  );
});

app.delete('/api/panel-fotografico/:panelId', (req, res) => {
  const panelId = req.params.panelId;
  pool.query('DELETE FROM panel_fotografico WHERE id = ?', [panelId], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true });
  });
});

app.put('/api/informes/:id/estado', (req, res) => {
  const id = req.params.id;
  const { estado } = req.body;
  pool.query('UPDATE solicitudes SET estado = ? WHERE id = ?', [estado, id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true });
  });
});

app.get('/api/errores-emision', (req, res) => {
  pool.query(
    "SELECT COUNT(*) AS errores FROM historial WHERE accion IN ('Edición solicitud', 'Borrado', 'Eliminada')",
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ errores: results[0].errores });
    }
  );
});

app.get('/api/errores-emision-detalle', (req, res) => {
  const sql = `
    SELECT numerodeexpediente as licencia, realizadoPor as usuario, accion as tipo, motivo as descripcion, fecha
    FROM historial WHERE accion IN ('Rechazado', 'Borrado', 'Edición solicitud')
    ORDER BY fecha DESC
  `;
  pool.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json(rows);
  });
});

app.get('/api/tiempo-promedio-registro', (req, res) => {
  pool.query(
    `SELECT AVG(TIMESTAMPDIFF(SECOND, fecha_inicio, fecha)) AS promedio_segundos
     FROM solicitudes WHERE fecha_inicio IS NOT NULL AND fecha IS NOT NULL`,
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ promedio_segundos: results[0].promedio_segundos });
    }
  );
});

app.put('/api/solicitud/:id/check_administrativo', (req, res) => {
  const id = req.params.id;
  const { check_administrativo } = req.body;
  pool.query(
    'UPDATE solicitudes SET check_administrativo = ? WHERE id = ?',
    [check_administrativo, id],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ success: true });
    }
  );
});

app.put('/api/solicitud/:id/check_administrador', (req, res) => {
  const id = req.params.id;
  const { check_administrador } = req.body;
  pool.query(
    'UPDATE solicitudes SET check_administrador = ? WHERE id = ?',
    [check_administrador, id],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ success: true });
    }
  );
});

// ====== REPORTE ======
app.post('/api/reporte', (req, res) => {
  const { solicitud_id, numero_resolucion, numero_certificado } = req.body || {};
  
  if (!solicitud_id) {
    return res.status(400).json({ error: 'solicitud_id es requerido' });
  }

  pool.query('SELECT id FROM reporte WHERE solicitud_id = ?', [solicitud_id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'DB SELECT reporte', detail: err.sqlMessage });
    }

    const existe = rows && rows.length > 0;

    if (existe) {
      pool.query(
        'UPDATE reporte SET numero_resolucion = ?, numero_certificado = ? WHERE solicitud_id = ?',
        [numero_resolucion || null, numero_certificado || null, solicitud_id],
        (err2, result2) => {
          if (err2) {
            return res.status(500).json({ error: 'DB UPDATE reporte', detail: err2.sqlMessage });
          }
          return res.json({ ok: true, action: 'updated' });
        }
      );
    } else {
      pool.query(
        'INSERT INTO reporte (solicitud_id, numero_resolucion, numero_certificado) VALUES (?, ?, ?)',
        [solicitud_id, numero_resolucion || null, numero_certificado || null],
        (err3, result3) => {
          if (err3) {
            return res.status(500).json({ error: 'DB INSERT reporte', detail: err3.sqlMessage });
          }
          return res.json({ ok: true, action: 'inserted', id: result3?.insertId });
        }
      );
    }
  });
});

app.get('/api/reporte/:solicitud_id', (req, res) => {
  const { solicitud_id } = req.params;
  pool.query(
    'SELECT solicitud_id, numero_resolucion, numero_certificado FROM reporte WHERE solicitud_id = ?',
    [solicitud_id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'DB SELECT reporte by solicitud_id', detail: err.sqlMessage });
      }
      return res.json(rows && rows[0] ? rows[0] : {});
    }
  );
});

// ============================================
// ENDPOINTS PARA PERFIL DE USUARIO
// ============================================

app.get('/api/perfil/:id', (req, res) => {
  const id = req.params.id;
  console.log('[GET /api/perfil/:id] Obteniendo perfil para usuario id:', id);
  
  pool.query(
    `SELECT id, usuario, nombres_completos, dni, telefono, fecha_nacimiento, genero, direccion, cargo, departamento, fecha_ingreso, id_empleado, foto_perfil, email, ultima_sesion, estado, rol_id
    FROM usuarios WHERE id = ?`,
    [id],
    (err, results) => {
      if (err) {
        console.error('[perfil GET] error:', err);
        return res.status(500).json({ success: false, error: 'Error al obtener perfil', detail: err.sqlMessage || err.message });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }
      
      console.log('[perfil GET] ✅ Perfil encontrado para:', results[0].nombres_completos);
      res.json({ success: true, usuario: results[0] });
    }
  );
});

app.put('/api/perfil/:id', (req, res) => {
  const id = req.params.id;
  const { nombre, dni, email, telefono, fechaNacimiento, genero, direccion } = req.body;
  
  console.log('[PUT /api/perfil/:id] Actualizando perfil usuario id:', id);
  
  pool.query(
    `UPDATE usuarios SET nombres_completos = ?, dni = ?, email = ?, telefono = ?, fecha_nacimiento = ?, genero = ?, direccion = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?`,
    [nombre, toNullIfEmpty(dni), email, toNullIfEmpty(telefono), toNullIfEmpty(fechaNacimiento), toNullIfEmpty(genero), toNullIfEmpty(direccion), id],
    (err, result) => {
      if (err) {
        console.error('[perfil UPDATE] error:', err);
        return res.status(500).json({ success: false, error: 'Error al actualizar perfil', detail: err.sqlMessage || err.message });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }
      
      console.log('[perfil UPDATE] ✅ Perfil actualizado');
      res.json({ success: true, message: 'Perfil actualizado correctamente' });
    }
  );
});

app.post('/api/perfil/:id/foto', upload.single('foto'), (req, res) => {
  const id = req.params.id;
  
  console.log('[POST /api/perfil/:id/foto] Subiendo foto para usuario id:', id);
  console.log('[POST /api/perfil/:id/foto] Archivo recibido:', req.file);
  
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No se recibió ningún archivo' });
  }
  
  const fotoUrl = `/uploads/${req.file.filename}`;
  const fotoUrlCompleta = `http://localhost:3000${fotoUrl}`;
  
  pool.query(
    `UPDATE usuarios SET foto_perfil = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?`,
    [fotoUrl, id],
    (err, result) => {
      if (err) {
        console.error('[perfil foto UPDATE] error:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Error al actualizar foto de perfil', 
          detail: err.sqlMessage || err.message 
        });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }
      
      console.log('[perfil foto UPDATE] ✅ Foto actualizada:', fotoUrl);
      console.log('[perfil foto UPDATE] ✅ URL completa:', fotoUrlCompleta);
      
      res.json({ 
        success: true, 
        message: 'Foto de perfil actualizada correctamente', 
        foto_perfil: fotoUrlCompleta
      });
    }
  );
});

app.post('/api/perfil/:id/cambiar-password', (req, res) => {
  const id = req.params.id;
  const { actual, nueva, confirmar } = req.body;
  
  console.log('[POST /api/perfil/:id/cambiar-password] Usuario id:', id);
  
  if (!actual || !nueva || !confirmar) {
    return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
  }
  
  if (nueva !== confirmar) {
    return res.status(400).json({ success: false, message: 'Las contraseñas no coinciden' });
  }
  
  if (nueva.length < 8) {
    return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 8 caracteres' });
  }
  
  pool.query('SELECT contraseña FROM usuarios WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('[password SELECT] error:', err);
      return res.status(500).json({ success: false, error: 'Error al verificar contraseña', detail: err.sqlMessage || err.message });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    
    const passwordActual = results[0].contraseña;
    
    if (passwordActual !== actual) {
      console.warn('[password] Contraseña actual incorrecta para usuario id:', id);
      return res.status(401).json({ success: false, message: 'La contraseña actual es incorrecta' });
    }
    
    pool.query(
      `UPDATE usuarios SET contraseña = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?`,
      [nueva, id],
      (err2, result2) => {
        if (err2) {
          console.error('[password UPDATE] error:', err2);
          return res.status(500).json({ success: false, error: 'Error al actualizar contraseña', detail: err2.sqlMessage || err2.message });
        }
        
        console.log('[password UPDATE] ✅ Contraseña actualizada');
        res.json({ success: true, message: 'Contraseña actualizada correctamente' });
      }
    );
  });
});

app.get('/api/perfil/:id/foto', (req, res) => {
  const id = req.params.id;
  
  pool.query('SELECT foto_perfil FROM usuarios WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('[foto GET] error:', err);
      return res.status(500).json({ success: false, error: 'Error al obtener foto', detail: err.sqlMessage || err.message });
    }
    
    if (results.length === 0 || !results[0].foto_perfil) {
      return res.json({ success: true, foto: null });
    }
    
    const fotoUrl = results[0].foto_perfil;
    
    let fotoUrlCompleta = fotoUrl;
    if (fotoUrl && !fotoUrl.startsWith('http') && !fotoUrl.startsWith('data:')) {
      fotoUrlCompleta = `http://localhost:3000${fotoUrl}`;
    }
    
    console.log('[GET foto] URL original:', fotoUrl);
    console.log('[GET foto] URL completa:', fotoUrlCompleta);
    
    res.json({ success: true, foto: fotoUrlCompleta });
  });
});

app.post('/api/perfil/:id/ultima-sesion', (req, res) => {
  const id = req.params.id;
  
  pool.query('UPDATE usuarios SET ultima_sesion = NOW() WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error('[ultima-sesion UPDATE] error:', err);
      return res.status(500).json({ success: false, error: 'Error al registrar sesión', detail: err.sqlMessage || err.message });
    }
    
    res.json({ success: true, message: 'Sesión registrada' });
  });
});

app.get('/api/perfil/:id/actividad', (req, res) => {
  const id = req.params.id;
  
  pool.query(`SELECT u.nombres_completos FROM usuarios u WHERE u.id = ?`, [id], (err, userResults) => {
    if (err || !userResults.length) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    
    const nombreUsuario = userResults[0].nombres_completos;
    
    pool.query(
      `SELECT accion, numerodeexpediente as descripcion, fecha
       FROM historial WHERE realizadoPor = ?
       ORDER BY fecha DESC LIMIT 10`,
      [nombreUsuario],
      (err2, actividadResults) => {
        if (err2) {
          console.error('[actividad GET] error:', err2);
          return res.status(500).json({ success: false, error: 'Error al obtener actividad', detail: err2.sqlMessage || err2.message });
        }
        
        const actividades = actividadResults.map(act => ({
          accion: act.accion,
          descripcion: `Expediente: ${act.descripcion || 'N/A'}`,
          fecha: act.fecha,
          tipo: act.accion === 'Rechazado' ? 'warning' : 'info',
          icono: act.accion === 'Creación solicitud' ? 'fas fa-plus-circle' :
                 act.accion === 'Rechazado' ? 'fas fa-times-circle' :
                 act.accion === 'Borrado' ? 'fas fa-trash' : 'fas fa-edit'
        }));
        
        res.json({ success: true, actividades });
      }
    );
  });
});

// ============================================
// FISCALIZACIONES CON NOTIFICACIONES AUTOMÁTICAS
// ============================================

// GET - Obtener todas las fiscalizaciones
app.get('/api/fiscalizaciones', (req, res) => {
  const query = `
    SELECT f.*, u.nombres_completos as inspector_nombre
    FROM fiscalizaciones f
    LEFT JOIN usuarios u ON f.inspector_id = u.id
    ORDER BY f.creado_en DESC
  `;
  
  pool.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener fiscalizaciones:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// GET - Obtener fiscalización por ID
app.get('/api/fiscalizaciones/:id', (req, res) => {
  const id = req.params.id;
  
  const query = `
    SELECT f.*, u.nombres_completos as inspector_nombre
    FROM fiscalizaciones f
    LEFT JOIN usuarios u ON f.inspector_id = u.id
    WHERE f.id = ?
  `;
  
  pool.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Fiscalización no encontrada' });
    }
    res.json(results[0]);
  });
});

// POST - Crear nueva fiscalización con notificaciones automáticas
app.post('/api/fiscalizaciones', (req, res) => {
  const fisc = req.body;
  
  // 🔧 Función helper para convertir fechas ISO a MySQL DATETIME
  const formatDateForMySQL = (dateValue) => {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return null;
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };
  
  // 🔧 Función helper para convertir fechas ISO a MySQL DATE (solo fecha, sin hora)
  const formatDateOnlyForMySQL = (dateValue) => {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return null;
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };
  
  // Generar número de fiscalización automático si no viene
  if (!fisc.numero_fiscalizacion) {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    fisc.numero_fiscalizacion = `FISC-${year}-${random}`;
  }
  
  const query = `
    INSERT INTO fiscalizaciones (
      numero_fiscalizacion, fecha_fiscalizacion, origen, expediente_relacionado,
      razon_social, ruc, direccion, giro, inspector_id, tipo_infraccion,
      descripcion_infraccion, codigo_infraccion, base_legal, gravedad,
      acta_numero, notificacion_numero, monto_multa, plazo_subsanacion,
      medida_adoptada, fecha_notificacion, fecha_limite_subsanacion,
      fecha_reinspeccion, estado, resultado_final, observaciones, creado_por,
      latitud, longitud
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  pool.query(query, [
    fisc.numero_fiscalizacion, formatDateForMySQL(fisc.fecha_fiscalizacion) || formatDateForMySQL(new Date()), fisc.origen || 'Oficio',
    fisc.expediente_relacionado, fisc.razon_social, fisc.ruc, fisc.direccion,
    fisc.giro, fisc.inspector_id || null, fisc.tipo_infraccion, fisc.descripcion_infraccion,
    fisc.codigo_infraccion, fisc.base_legal, fisc.gravedad || 'Leve',
    fisc.acta_numero, fisc.notificacion_numero, fisc.monto_multa || 0,
    fisc.plazo_subsanacion, fisc.medida_adoptada, 
    formatDateOnlyForMySQL(fisc.fecha_notificacion),
    formatDateOnlyForMySQL(fisc.fecha_limite_subsanacion), 
    formatDateOnlyForMySQL(fisc.fecha_reinspeccion),
    fisc.estado || 'Programada', fisc.resultado_final, fisc.observaciones,
    fisc.creado_por || 'Sistema',
    fisc.latitud || null, fisc.longitud || null
  ], (err, result) => {
    if (err) {
      console.error('Error al crear fiscalización:', err);
      return res.status(500).json({ error: err.message });
    }
    
    const fiscalizacionId = result.insertId;
    const numero = fisc.numero_fiscalizacion;
    
    // ✅ NOTIFICACIÓN 1: Siempre notificar al ADMINISTRADOR
    crearNotificacion(
      'nueva_fiscalizacion',
      'Nueva Fiscalización Creada',
      `Se ha registrado la fiscalización ${numero} para ${fisc.razon_social}`,
      {
        rolDestino: 'administrador',
        referenciaTipo: 'fiscalizacion',
        referenciaId: fiscalizacionId,
        expediente: numero,
        icono: 'fa-clipboard-check',
        creadoPor: fisc.creado_por || 'Sistema'
      }
    );
    
    // ✅ NOTIFICACIÓN 2: Si se asigna un inspector, notificar al INSPECTOR
    if (fisc.inspector_id) {
      crearNotificacion(
        'asignacion_inspeccion',
        'Nueva Inspección Asignada',
        `Se te ha asignado la fiscalización ${numero} en ${fisc.direccion}`,
        {
          rolDestino: 'inspector',
          usuarioId: fisc.inspector_id,
          referenciaTipo: 'fiscalizacion',
          referenciaId: fiscalizacionId,
          expediente: numero,
          icono: 'fa-clipboard-check',
          creadoPor: fisc.creado_por || 'Sistema'
        }
      );
    }
    
    res.status(201).json({
      id: fiscalizacionId,
      numero_fiscalizacion: numero,
      message: 'Fiscalización creada exitosamente'
    });
  });
});

// PUT - Actualizar fiscalización con notificaciones
app.put('/api/fiscalizaciones/:id', (req, res) => {
  const id = req.params.id;
  const fisc = req.body;
  
  // 🔧 Función helper para convertir fechas ISO a MySQL DATETIME
  const formatDateForMySQL = (dateValue) => {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return null;
    // Formato: YYYY-MM-DD HH:MM:SS
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };
  
  // 🔧 Función helper para convertir fechas ISO a MySQL DATE (solo fecha, sin hora)
  const formatDateOnlyForMySQL = (dateValue) => {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return null;
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };
  
  // Primero obtener el estado anterior
  pool.query('SELECT * FROM fiscalizaciones WHERE id = ?', [id], (err, oldResults) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const oldFisc = oldResults[0];
    
    const query = `
      UPDATE fiscalizaciones SET
        fecha_fiscalizacion = ?, origen = ?, expediente_relacionado = ?,
        razon_social = ?, ruc = ?, direccion = ?, giro = ?,
        inspector_id = ?, tipo_infraccion = ?, descripcion_infraccion = ?,
        codigo_infraccion = ?, base_legal = ?, gravedad = ?, acta_numero = ?,
        notificacion_numero = ?, monto_multa = ?, plazo_subsanacion = ?,
        medida_adoptada = ?, fecha_notificacion = ?, fecha_limite_subsanacion = ?,
        fecha_reinspeccion = ?, estado = ?, resultado_final = ?, observaciones = ?,
        latitud = ?, longitud = ?
      WHERE id = ?
    `;
    
    pool.query(query, [
      formatDateForMySQL(fisc.fecha_fiscalizacion), fisc.origen, fisc.expediente_relacionado,
      fisc.razon_social, fisc.ruc, fisc.direccion, fisc.giro,
      fisc.inspector_id || null, fisc.tipo_infraccion, fisc.descripcion_infraccion,
      fisc.codigo_infraccion, fisc.base_legal, fisc.gravedad,
      fisc.acta_numero, fisc.notificacion_numero, fisc.monto_multa,
      fisc.plazo_subsanacion, fisc.medida_adoptada, 
      formatDateOnlyForMySQL(fisc.fecha_notificacion),
      formatDateOnlyForMySQL(fisc.fecha_limite_subsanacion), 
      formatDateOnlyForMySQL(fisc.fecha_reinspeccion),
      fisc.estado, fisc.resultado_final, fisc.observaciones,
      fisc.latitud || null, fisc.longitud || null, id
    ], (err, result) => {
      if (err) {
        console.error('Error al actualizar fiscalización:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Fiscalización no encontrada' });
      }
      
      // Generar numero_fiscalizacion si no existe (para registros antiguos)
      const numeroFisc = oldFisc.numero_fiscalizacion || `FISC-${new Date().getFullYear()}-${id.toString().padStart(3, '0')}`;
      
      // ✅ NOTIFICAR si se asigna un inspector nuevo
      if (fisc.inspector_id && fisc.inspector_id !== oldFisc.inspector_id) {
        crearNotificacion(
          'asignacion_inspeccion',
          'Nueva Inspección Asignada',
          `Se te ha asignado la fiscalización ${numeroFisc}`,
          {
            rolDestino: 'inspector',
            usuarioId: fisc.inspector_id,
            referenciaTipo: 'fiscalizacion',
            referenciaId: id,
            expediente: numeroFisc,
            icono: 'fa-clipboard-check',
            creadoPor: 'Sistema'
          }
        );
      }
      
      // ✅ NOTIFICAR al administrador sobre cambios importantes
      if (fisc.estado !== oldFisc.estado || fisc.gravedad !== oldFisc.gravedad) {
        crearNotificacion(
          'cambio_fiscalizacion',
          'Fiscalización Actualizada',
          `La fiscalización ${numeroFisc} ha sido actualizada`,
          {
            rolDestino: 'administrador',
            referenciaTipo: 'fiscalizacion',
            referenciaId: id,
            expediente: numeroFisc,
            icono: 'fa-edit',
            creadoPor: 'Sistema'
          }
        );
      }
      
      res.json({ message: 'Fiscalización actualizada exitosamente' });
    });
  });
});

// DELETE - Eliminar fiscalización
app.delete('/api/fiscalizaciones/:id', (req, res) => {
  const id = req.params.id;
  
  // Primero obtener la info para la notificación
  pool.query('SELECT * FROM fiscalizaciones WHERE id = ?', [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const fisc = results[0];
    
    pool.query('DELETE FROM fiscalizaciones WHERE id = ?', [id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Fiscalización no encontrada' });
      }
      
      // ✅ NOTIFICAR al administrador sobre la eliminación
      if (fisc) {
        crearNotificacion(
          'eliminacion_fiscalizacion',
          'Fiscalización Eliminada',
          `La fiscalización ${fisc.numero_fiscalizacion} ha sido eliminada`,
          {
            rolDestino: 'administrador',
            expediente: fisc.numero_fiscalizacion,
            icono: 'fa-trash-alt',
            creadoPor: 'Sistema'
          }
        );
      }
      
      res.json({ message: 'Fiscalización eliminada exitosamente' });
    });
  });
});

// GET - Estadísticas de fiscalizaciones para el dashboard
app.get('/api/fiscalizaciones/estadisticas/dashboard', (req, res) => {
  console.log('[Fiscalizaciones Stats] 📊 Iniciando cálculo de estadísticas...');
  
  const hoy = new Date();
  
  // Calcular fecha límite para reinspecciones próximas (30 días)
  const fechaLimite = new Date();
  fechaLimite.setDate(hoy.getDate() + 30);
  
  const queries = {
    total: 'SELECT COUNT(*) as total FROM fiscalizaciones',
    pendientes: `SELECT COUNT(*) as pendientes FROM fiscalizaciones 
                 WHERE estado IN ('Programada', 'En Ejecución', 'Ejecutada', 'Notificada')`,
    subsanadas: `SELECT COUNT(*) as subsanadas FROM fiscalizaciones 
                 WHERE estado = 'Subsanada'`,
    montoTotal: `SELECT SUM(monto_multa) as monto FROM fiscalizaciones 
                 WHERE monto_multa > 0`,
    muyGraves: `SELECT COUNT(*) as muy_graves FROM fiscalizaciones 
                WHERE gravedad = 'Muy Grave'`,
    proximasReinspecciones: `SELECT COUNT(*) as proximas FROM fiscalizaciones 
                             WHERE fecha_reinspeccion IS NOT NULL 
                             AND fecha_reinspeccion >= CURDATE() 
                             AND fecha_reinspeccion <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)`
  };
  
  const results = {};
  
  Promise.all([
    new Promise((resolve, reject) => {
      console.log('[Fiscalizaciones Stats] 🔍 Ejecutando query: total');
      pool.query(queries.total, (err, rows) => {
        if (err) {
          console.error('[Fiscalizaciones Stats] ❌ Error en query total:', err);
          reject(err);
        } else { 
          results.total = rows[0].total;
          console.log('[Fiscalizaciones Stats] ✅ Total:', results.total);
          resolve();
        }
      });
    }),
    new Promise((resolve, reject) => {
      console.log('[Fiscalizaciones Stats] 🔍 Ejecutando query: pendientes');
      pool.query(queries.pendientes, (err, rows) => {
        if (err) {
          console.error('[Fiscalizaciones Stats] ❌ Error en query pendientes:', err);
          reject(err);
        } else { 
          results.pendientes = rows[0].pendientes;
          console.log('[Fiscalizaciones Stats] ✅ Pendientes:', results.pendientes);
          resolve();
        }
      });
    }),
    new Promise((resolve, reject) => {
      console.log('[Fiscalizaciones Stats] 🔍 Ejecutando query: subsanadas');
      pool.query(queries.subsanadas, (err, rows) => {
        if (err) {
          console.error('[Fiscalizaciones Stats] ❌ Error en query subsanadas:', err);
          reject(err);
        } else { 
          results.subsanadas = rows[0].subsanadas;
          console.log('[Fiscalizaciones Stats] ✅ Subsanadas:', results.subsanadas);
          resolve();
        }
      });
    }),
    new Promise((resolve, reject) => {
      console.log('[Fiscalizaciones Stats] 🔍 Ejecutando query: montoTotal');
      pool.query(queries.montoTotal, (err, rows) => {
        if (err) {
          console.error('[Fiscalizaciones Stats] ❌ Error en query montoTotal:', err);
          reject(err);
        } else { 
          results.montoTotal = parseFloat(rows[0].monto) || 0;
          console.log('[Fiscalizaciones Stats] ✅ Monto Total:', results.montoTotal);
          resolve();
        }
      });
    }),
    new Promise((resolve, reject) => {
      console.log('[Fiscalizaciones Stats] 🔍 Ejecutando query: muyGraves');
      pool.query(queries.muyGraves, (err, rows) => {
        if (err) {
          console.error('[Fiscalizaciones Stats] ❌ Error en query muyGraves:', err);
          reject(err);
        } else { 
          results.muyGraves = rows[0].muy_graves;
          console.log('[Fiscalizaciones Stats] ✅ Muy Graves:', results.muyGraves);
          resolve();
        }
      });
    }),
    new Promise((resolve, reject) => {
      console.log('[Fiscalizaciones Stats] 🔍 Ejecutando query: proximasReinspecciones');
      pool.query(queries.proximasReinspecciones, (err, rows) => {
        if (err) {
          console.error('[Fiscalizaciones Stats] ❌ Error en query proximasReinspecciones:', err);
          reject(err);
        } else { 
          results.proximasReinspecciones = rows[0].proximas;
          console.log('[Fiscalizaciones Stats] ✅ Próximas Reinspecciones:', results.proximasReinspecciones);
          resolve();
        }
      });
    })
  ]).then(() => {
    console.log('[Fiscalizaciones Stats] 🎉 Estadísticas calculadas exitosamente:', results);
    res.json(results);
  }).catch(err => {
    console.error('[Fiscalizaciones Stats] ❌ Error general:', err);
    res.status(500).json({ error: err.message });
  });
});

// GET - Fiscalizaciones próximas a reinspección
app.get('/api/fiscalizaciones/proximas-reinspeccion', (req, res) => {
  const diasAnticipacion = parseInt(req.query.dias) || 30;
  
  console.log(`[Próximas Reinspecciones] 📅 Buscando fiscalizaciones en los próximos ${diasAnticipacion} días`);
  
  const query = `
    SELECT f.*, 
           u.nombres_completos as inspector_nombre,
           DATEDIFF(f.fecha_reinspeccion, CURDATE()) as dias_restantes
    FROM fiscalizaciones f
    LEFT JOIN usuarios u ON f.inspector_id = u.id
    WHERE f.fecha_reinspeccion IS NOT NULL 
    AND f.fecha_reinspeccion >= CURDATE()
    AND f.fecha_reinspeccion <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
    ORDER BY f.fecha_reinspeccion ASC
  `;
  
  pool.query(query, [diasAnticipacion], (err, results) => {
    if (err) {
      console.error('[Próximas Reinspecciones] ❌ Error:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log(`[Próximas Reinspecciones] 🔍 Query ejecutada, resultados: ${results.length}`);
    
    // Agregar clasificación de urgencia
    const fiscalizaciones = results.map(f => ({
      ...f,
      estadoUrgencia: f.dias_restantes <= 7 ? 'urgente' : 
                      f.dias_restantes <= 15 ? 'proximo' : 'normal'
    }));
    
    console.log(`[Próximas Reinspecciones] ✅ ${fiscalizaciones.length} fiscalizaciones próximas encontradas`);
    console.log('[Próximas Reinspecciones] 📋 Datos:', JSON.stringify(fiscalizaciones, null, 2));
    res.json(fiscalizaciones);
  });
});

// ============================================
// CALENDARIO - EVENTOS
// ============================================

// GET - Obtener eventos del calendario
app.get('/api/calendario/eventos', async (req, res) => {
  const tipo = req.query.tipo || 'todos';
  const inspectorId = req.query.inspector || null;
  
  console.log('[Calendario] 📅 Obteniendo eventos - Tipo:', tipo, 'Inspector:', inspectorId);
  
  const eventos = [];
  const promises = [];
  
  // 1. EVENTOS DE INSPECCIONES
  if (tipo === 'todos' || tipo === 'inspecciones') {
    let queryInspecciones = `
      SELECT 
        s.id,
        s.numerodeexpediente,
        s.fecha as start,
        s.estado,
        s.inspector_asignado,
        COALESCE(NULLIF(TRIM(s.razon_social), ''), NULLIF(TRIM(s.nombre_comercial), ''), NULL) as razon_social,
        s.nombre_comercial,
        s.direccion,
        (SELECT u.nombres_completos 
         FROM usuarios u 
         WHERE u.rol_id = 3 
         AND (
           TRIM(s.inspector_asignado) = TRIM(u.usuario)
           OR LOWER(TRIM(s.inspector_asignado)) = LOWER(TRIM(u.usuario))
           OR TRIM(s.inspector_asignado) LIKE CONCAT('%', TRIM(u.usuario), '%')
           OR TRIM(u.usuario) LIKE CONCAT('%', TRIM(s.inspector_asignado), '%')
         )
         ORDER BY 
           CASE 
             WHEN TRIM(s.inspector_asignado) = TRIM(u.usuario) THEN 1
             WHEN LOWER(TRIM(s.inspector_asignado)) = LOWER(TRIM(u.usuario)) THEN 2
             ELSE 3
           END
         LIMIT 1
        ) as inspector_nombre_completo,
        'inspeccion' as tipo
      FROM solicitudes s
      WHERE s.fecha IS NOT NULL
    `;
    
    const paramsInspecciones = [];
    if (inspectorId) {
      // Si se filtra por inspector, también buscar en la subconsulta
      queryInspecciones += ` AND (
        s.inspector_asignado LIKE ? 
        OR EXISTS (
          SELECT 1 FROM usuarios u 
          WHERE u.id = ? 
          AND u.rol_id = 3
          AND (
            s.inspector_asignado = u.usuario 
            OR s.inspector_asignado LIKE CONCAT('%', u.usuario, '%')
          )
        )
      )`;
      paramsInspecciones.push(`%${inspectorId}%`, inspectorId);
    }
    
    queryInspecciones += ` ORDER BY s.fecha ASC`;
    
    promises.push(
      promise.query(queryInspecciones, paramsInspecciones)
        .then(([results]) => {
          if (results && results.length > 0) {
            return results.map(s => {
              // Construir título con razón social y expediente
              // Priorizar razón_social sobre nombre_comercial, y si no hay ninguno, usar expediente
              const razonSocialFinal = (s.razon_social && s.razon_social.trim() !== '') 
                ? s.razon_social.trim() 
                : null;
              
              const expedienteFinal = s.numerodeexpediente || s.id;
              
              // Construir título: siempre mostrar razón social si existe
              let titulo = '';
              if (razonSocialFinal) {
                titulo = `Inspección: ${razonSocialFinal}`;
                if (expedienteFinal && expedienteFinal !== s.id) {
                  titulo += ` - ${expedienteFinal}`;
                }
              } else {
                // Si no hay razón social, usar expediente o ID
                titulo = `Inspección: ${expedienteFinal}`;
              }
              
              // Obtener nombre completo del inspector
              // Priorizar nombres_completos de la tabla usuarios, si no existe usar inspector_asignado
              let inspectorNombreFinal = 'No asignado';
              
              if (s.inspector_nombre_completo && s.inspector_nombre_completo.trim() !== '' && s.inspector_nombre_completo !== null) {
                inspectorNombreFinal = s.inspector_nombre_completo.trim();
              } else if (s.inspector_asignado && s.inspector_asignado.trim() !== '' && s.inspector_asignado !== null) {
                // Si no se encontró el nombre completo, usar el inspector_asignado como fallback
                inspectorNombreFinal = s.inspector_asignado.trim();
              }
              
              console.log(`[Calendario] 📅 Inspección ${s.id}:`, {
                razon_social: razonSocialFinal,
                expediente: expedienteFinal,
                titulo: titulo,
                inspector_asignado: s.inspector_asignado || 'NULL',
                inspector_nombre_completo: s.inspector_nombre_completo || 'NULL',
                inspector_final: inspectorNombreFinal,
                tiene_razon_social: !!razonSocialFinal,
                tiene_nombre_completo: !!(s.inspector_nombre_completo && s.inspector_nombre_completo.trim() !== '')
              });
              
              return {
                id: `inspeccion-${s.id}`,
                title: titulo,
                start: s.start,
                backgroundColor: s.estado === 'EN PROCESO' ? '#3B82F6' : '#10B981',
                borderColor: s.estado === 'EN PROCESO' ? '#3B82F6' : '#10B981',
                textColor: '#FFFFFF',
                extendedProps: {
                  tipo: 'inspeccion',
                  id_original: s.id,
                  estado: s.estado,
                  inspector: inspectorNombreFinal,
                  direccion: s.direccion,
                  expediente: s.numerodeexpediente,
                  razon_social: razonSocialFinal || null
                }
              };
            });
          }
          return [];
        })
        .catch(err => {
          console.error('[Calendario] ❌ Error al cargar inspecciones:', err);
          return [];
        })
    );
  }
  
  // 2. EVENTOS DE FISCALIZACIONES
  if (tipo === 'todos' || tipo === 'fiscalizaciones') {
    let queryFiscalizaciones = `
      SELECT 
        f.id,
        CONCAT('Fiscalización: ', f.numero_fiscalizacion) as title,
        f.fecha_fiscalizacion as start,
        f.estado,
        f.gravedad,
        u.nombres_completos as inspector_nombre,
        f.razon_social,
        f.direccion,
        'fiscalizacion' as tipo
      FROM fiscalizaciones f
      LEFT JOIN usuarios u ON f.inspector_id = u.id
      WHERE f.fecha_fiscalizacion IS NOT NULL
    `;
    
    const paramsFisc = [];
    if (inspectorId) {
      queryFiscalizaciones += ` AND f.inspector_id = ?`;
      paramsFisc.push(inspectorId);
    }
    
    queryFiscalizaciones += ` ORDER BY f.fecha_fiscalizacion ASC`;
    
    promises.push(
      promise.query(queryFiscalizaciones, paramsFisc)
        .then(([results]) => {
          if (results && results.length > 0) {
            return results.map(f => ({
              id: `fiscalizacion-${f.id}`,
              title: f.title || `Fiscalización: ${f.numero_fiscalizacion || f.id}`,
              start: f.start,
              backgroundColor: f.estado === 'Programada' ? '#F59E0B' : 
                             f.gravedad === 'Muy Grave' ? '#EF4444' : '#8B5CF6',
              borderColor: f.estado === 'Programada' ? '#F59E0B' : 
                          f.gravedad === 'Muy Grave' ? '#EF4444' : '#8B5CF6',
              textColor: '#FFFFFF',
              extendedProps: {
                tipo: 'fiscalizacion',
                id_original: f.id,
                estado: f.estado,
                inspector: f.inspector_nombre,
                direccion: f.direccion,
                descripcion: f.razon_social
              }
            }));
          }
          return [];
        })
        .catch(err => {
          console.error('[Calendario] ❌ Error al cargar fiscalizaciones:', err);
          return [];
        })
    );
  }
  
  // 3. EVENTOS DE VENCIMIENTOS
  if (tipo === 'todos' || tipo === 'vencimientos') {
    const queryVencimientos = `
      SELECT 
        l.id,
        CONCAT('Vencimiento: ', l.expediente) as title,
        l.vigencia as start,
        l.razon_social,
        s.direccion,
        l.expediente,
        'vencimiento' as tipo
      FROM locales l
      LEFT JOIN solicitudes s ON l.solicitud_id = s.id
      WHERE l.vigencia IS NOT NULL
      AND l.vigencia >= CURDATE()
      AND l.vigencia <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)
      ORDER BY l.vigencia ASC
    `;
    
    promises.push(
      promise.query(queryVencimientos)
        .then(([results]) => {
          if (results && results.length > 0) {
            return results.map(l => ({
              id: `vencimiento-${l.id}`,
              title: l.title || `Vencimiento: ${l.expediente || l.id}`,
              start: l.start,
              backgroundColor: '#EF4444',
              borderColor: '#EF4444',
              textColor: '#FFFFFF',
              extendedProps: {
                tipo: 'vencimiento',
                id_original: l.id,
                direccion: l.direccion,
                expediente: l.expediente,
                descripcion: `Licencia vence: ${l.razon_social}`
              }
            }));
          }
          return [];
        })
        .catch(err => {
          console.error('[Calendario] ❌ Error al cargar vencimientos:', err);
          return [];
        })
    );
  }
  
  // 4. EVENTOS DE REINSPECCIONES
  if (tipo === 'todos' || tipo === 'reinspecciones') {
    let queryReinspecciones = `
      SELECT 
        f.id,
        CONCAT('Reinspección: ', f.numero_fiscalizacion) as title,
        f.fecha_reinspeccion as start,
        f.estado,
        u.nombres_completos as inspector_nombre,
        f.razon_social,
        f.direccion,
        'reinspeccion' as tipo
      FROM fiscalizaciones f
      LEFT JOIN usuarios u ON f.inspector_id = u.id
      WHERE f.fecha_reinspeccion IS NOT NULL
      AND f.fecha_reinspeccion >= CURDATE()
    `;
    
    const paramsReinspec = [];
    if (inspectorId) {
      queryReinspecciones += ` AND f.inspector_id = ?`;
      paramsReinspec.push(inspectorId);
    }
    
    queryReinspecciones += ` ORDER BY f.fecha_reinspeccion ASC`;
    
    promises.push(
      promise.query(queryReinspecciones, paramsReinspec)
        .then(([results]) => {
          if (results && results.length > 0) {
            return results.map(f => ({
              id: `reinspeccion-${f.id}`,
              title: f.title || `Reinspección: ${f.numero_fiscalizacion || f.id}`,
              start: f.start,
              backgroundColor: '#EC4899',
              borderColor: '#EC4899',
              textColor: '#FFFFFF',
              extendedProps: {
                tipo: 'reinspeccion',
                id_original: f.id,
                estado: f.estado,
                inspector: f.inspector_nombre,
                direccion: f.direccion,
                descripcion: `Reinspección programada: ${f.razon_social}`
              }
            }));
          }
          return [];
        })
        .catch(err => {
          console.error('[Calendario] ❌ Error al cargar reinspecciones:', err);
          return [];
        })
    );
  }
  
  // 5. EVENTOS DE NOTIFICACIONES DE FISCALIZACIONES
  if (tipo === 'todos' || tipo === 'notificaciones') {
    let queryNotificaciones = `
      SELECT 
        f.id,
        CONCAT('Notificación: ', f.numero_fiscalizacion) as title,
        f.fecha_notificacion as start,
        f.estado,
        u.nombres_completos as inspector_nombre,
        f.razon_social,
        f.direccion,
        f.gravedad,
        'notificacion' as tipo
      FROM fiscalizaciones f
      LEFT JOIN usuarios u ON f.inspector_id = u.id
      WHERE f.fecha_notificacion IS NOT NULL
      AND f.fecha_notificacion >= CURDATE()
    `;
    
    const paramsNotif = [];
    if (inspectorId) {
      queryNotificaciones += ` AND f.inspector_id = ?`;
      paramsNotif.push(inspectorId);
    }
    
    queryNotificaciones += ` ORDER BY f.fecha_notificacion ASC`;
    
    promises.push(
      promise.query(queryNotificaciones, paramsNotif)
        .then(([results]) => {
          if (results && results.length > 0) {
            return results.map(f => ({
              id: `notificacion-${f.id}`,
              title: f.title || `Notificación: ${f.numero_fiscalizacion || f.id}`,
              start: f.start,
              backgroundColor: '#8B5CF6',
              borderColor: '#8B5CF6',
              textColor: '#FFFFFF',
              extendedProps: {
                tipo: 'notificacion',
                id_original: f.id,
                estado: f.estado,
                inspector: f.inspector_nombre,
                direccion: f.direccion,
                descripcion: `Notificación de fiscalización: ${f.razon_social}`,
                gravedad: f.gravedad
              }
            }));
          }
          return [];
        })
        .catch(err => {
          console.error('[Calendario] ❌ Error al cargar notificaciones:', err);
          return [];
        })
    );
  }
  
  // 6. EVENTOS DE FECHAS LÍMITE DE SUBSANACIÓN
  if (tipo === 'todos' || tipo === 'subsanaciones') {
    let querySubsanaciones = `
      SELECT 
        f.id,
        CONCAT('Límite Subsanación: ', f.numero_fiscalizacion) as title,
        DATE(f.fecha_limite_subsanacion) as start,
        f.estado,
        u.nombres_completos as inspector_nombre,
        f.razon_social,
        f.direccion,
        f.gravedad,
        f.plazo_subsanacion,
        'subsanacion' as tipo
      FROM fiscalizaciones f
      LEFT JOIN usuarios u ON f.inspector_id = u.id
      WHERE f.fecha_limite_subsanacion IS NOT NULL
      AND DATE(f.fecha_limite_subsanacion) >= CURDATE()
    `;
    
    const paramsSubs = [];
    if (inspectorId) {
      querySubsanaciones += ` AND f.inspector_id = ?`;
      paramsSubs.push(inspectorId);
    }
    
    querySubsanaciones += ` ORDER BY f.fecha_limite_subsanacion ASC`;
    
    promises.push(
      promise.query(querySubsanaciones, paramsSubs)
        .then(([results]) => {
          if (results && results.length > 0) {
            return results.map(f => {
              // Calcular días restantes
              // Asegurar que start sea una fecha válida
              let fechaLimite;
              if (f.start) {
                fechaLimite = new Date(f.start);
              } else {
                // Si no hay start, usar fecha actual como fallback
                fechaLimite = new Date();
              }
              
              const hoy = new Date();
              hoy.setHours(0, 0, 0, 0);
              fechaLimite.setHours(0, 0, 0, 0);
              const diasRestantes = Math.ceil((fechaLimite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
              
              // Color según urgencia
              let color = '#10B981'; // Verde si hay tiempo
              if (diasRestantes <= 3) {
                color = '#EF4444'; // Rojo si está muy cerca
              } else if (diasRestantes <= 7) {
                color = '#F59E0B'; // Naranja si está cerca
              }
              
              // Formatear la fecha para el calendario (YYYY-MM-DD)
              const fechaFormateada = fechaLimite.toISOString().split('T')[0];
              
              return {
                id: `subsanacion-${f.id}`,
                title: f.title || `Límite Subsanación: ${f.numero_fiscalizacion || f.id}`,
                start: fechaFormateada,
                backgroundColor: color,
                borderColor: color,
                textColor: '#FFFFFF',
                extendedProps: {
                  tipo: 'subsanacion',
                  id_original: f.id,
                  estado: f.estado,
                  inspector: f.inspector_nombre,
                  direccion: f.direccion,
                  descripcion: `Fecha límite para subsanar: ${f.razon_social} (${diasRestantes} días restantes)`,
                  gravedad: f.gravedad,
                  dias_restantes: diasRestantes,
                  plazo_subsanacion: f.plazo_subsanacion
                }
              };
            });
          }
          return [];
        })
        .catch(err => {
          console.error('[Calendario] ❌ Error al cargar subsanaciones:', err);
          return [];
        })
    );
  }
  
  try {
    const resultados = await Promise.all(promises);
    resultados.forEach(resultado => {
      if (Array.isArray(resultado)) {
        eventos.push(...resultado);
      }
    });
    
    console.log(`[Calendario] ✅ ${eventos.length} eventos cargados`);
    res.json(eventos);
  } catch (error) {
    console.error('[Calendario] ❌ Error general:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Disponibilidad de inspectores para una fecha
app.get('/api/calendario/disponibilidad', async (req, res) => {
  const fecha = req.query.fecha;
  
  if (!fecha) {
    return res.status(400).json({ error: 'Fecha requerida' });
  }
  
  console.log('[Disponibilidad] 📅 Consultando disponibilidad para:', fecha);
  
  try {
    // Obtener todos los inspectores
    const [inspectores] = await promise.query(
      'SELECT id, usuario, nombres_completos FROM usuarios WHERE rol_id = 3'
    );
    
    const disponibilidad = [];
    
    for (const inspector of inspectores) {
      // Contar inspecciones del día
      const [inspecciones] = await promise.query(
        `SELECT 
          id,
          CONCAT('Inspección: ', numerodeexpediente) as titulo,
          DATE_FORMAT(fecha, '%H:%i') as hora,
          'inspeccion' as tipo
         FROM solicitudes 
         WHERE inspector_asignado LIKE ? 
         AND DATE(fecha) = ?`,
        [`%${inspector.usuario}%`, fecha]
      );
      
      // Contar fiscalizaciones del día
      const [fiscalizaciones] = await promise.query(
        `SELECT 
          id,
          CONCAT('Fiscalización: ', numero_fiscalizacion) as titulo,
          DATE_FORMAT(fecha_fiscalizacion, '%H:%i') as hora,
          'fiscalizacion' as tipo
         FROM fiscalizaciones 
         WHERE inspector_id = ? 
         AND DATE(fecha_fiscalizacion) = ?`,
        [inspector.id, fecha]
      );
      
      // Contar reinspecciones del día
      const [reinspecciones] = await promise.query(
        `SELECT 
          id,
          CONCAT('Reinspección: ', numero_fiscalizacion) as titulo,
          DATE_FORMAT(fecha_reinspeccion, '%H:%i') as hora,
          'reinspeccion' as tipo
         FROM fiscalizaciones 
         WHERE inspector_id = ? 
         AND DATE(fecha_reinspeccion) = ?`,
        [inspector.id, fecha]
      );
      
      // Contar notificaciones del día
      const [notificaciones] = await promise.query(
        `SELECT 
          id,
          CONCAT('Notificación: ', numero_fiscalizacion) as titulo,
          DATE_FORMAT(fecha_notificacion, '%H:%i') as hora,
          'notificacion' as tipo
         FROM fiscalizaciones 
         WHERE inspector_id = ? 
         AND DATE(fecha_notificacion) = ?`,
        [inspector.id, fecha]
      );
      
      // Contar límites de subsanación del día
      const [subsanaciones] = await promise.query(
        `SELECT 
          id,
          CONCAT('Límite Subsanación: ', numero_fiscalizacion) as titulo,
          DATE_FORMAT(fecha_limite_subsanacion, '%H:%i') as hora,
          'subsanacion' as tipo
         FROM fiscalizaciones 
         WHERE inspector_id = ? 
         AND DATE(fecha_limite_subsanacion) = ?`,
        [inspector.id, fecha]
      );
      
      // Combinar todos los eventos
      const eventos = [
        ...inspecciones,
        ...fiscalizaciones,
        ...reinspecciones,
        ...notificaciones,
        ...subsanaciones
      ];
      
      const eventosCount = eventos.length;
      
      // Determinar disponibilidad
      let disponible = eventosCount === 0;
      let carga_alta = eventosCount >= 5; // 5 o más eventos = sobrecargado
      
      disponibilidad.push({
        id: inspector.id,
        usuario: inspector.usuario,
        nombres_completos: inspector.nombres_completos,
        disponible,
        carga_alta,
        eventos_count: eventosCount,
        eventos: eventos.sort((a, b) => {
          // Ordenar por hora
          const horaA = a.hora || '00:00';
          const horaB = b.hora || '00:00';
          return horaA.localeCompare(horaB);
        })
      });
    }
    
    // Ordenar: disponibles primero, luego por carga
    disponibilidad.sort((a, b) => {
      if (a.disponible && !b.disponible) return -1;
      if (!a.disponible && b.disponible) return 1;
      if (a.carga_alta && !b.carga_alta) return -1;
      if (!a.carga_alta && b.carga_alta) return 1;
      return a.eventos_count - b.eventos_count;
    });
    
    console.log(`[Disponibilidad] ✅ Disponibilidad calculada para ${disponibilidad.length} inspectores`);
    res.json(disponibilidad);
  } catch (error) {
    console.error('[Disponibilidad] ❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// EVIDENCIAS DE FISCALIZACIONES
// ============================================

// GET - Listar evidencias de una fiscalización
app.get('/api/fiscalizaciones/:id/evidencias', (req, res) => {
  const fiscalizacionId = req.params.id;
  
  const query = `
    SELECT * FROM fiscalizacion_evidencias 
    WHERE fiscalizacion_id = ? 
    ORDER BY orden ASC, id ASC
  `;
  
  pool.query(query, [fiscalizacionId], (err, results) => {
    if (err) {
      console.error('[Evidencias] ❌ Error al listar:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // Agregar URL completa a las rutas
    const evidencias = results.map(e => ({
      ...e,
      ruta_archivo: `http://localhost:3000${e.ruta_archivo}`
    }));
    
    console.log(`[Evidencias] ✅ ${evidencias.length} evidencias encontradas para fiscalización ${fiscalizacionId}`);
    res.json(evidencias);
  });
});

// POST - Subir evidencias
app.post('/api/fiscalizaciones/:id/evidencias', upload.array('evidencias', 10), (req, res) => {
  const fiscalizacionId = req.params.id;
  const descripcion = req.body.descripcion || '';
  const subidoPor = req.body.subido_por || 'Sistema';
  
  console.log('[Evidencias] 📥 Solicitud recibida');
  console.log('[Evidencias] 📂 Files:', req.files);
  console.log('[Evidencias] 📋 Body:', req.body);
  
  if (!req.files || req.files.length === 0) {
    console.error('[Evidencias] ❌ No se recibieron archivos');
    return res.status(400).json({ error: 'No se seleccionaron archivos' });
  }
  
  console.log(`[Evidencias] 📤 Subiendo ${req.files.length} archivo(s) para fiscalización ${fiscalizacionId}`);
  
  const valores = req.files.map((file, index) => [
    fiscalizacionId,
    file.originalname,
    '/uploads/' + file.filename,
    file.mimetype,
    file.size,
    descripcion,
    index + 1,
    subidoPor
  ]);
  
  const query = `
    INSERT INTO fiscalizacion_evidencias 
    (fiscalizacion_id, nombre_archivo, ruta_archivo, tipo_archivo, tamanio_bytes, descripcion, orden, subido_por)
    VALUES ?
  `;
  
  pool.query(query, [valores], (err, result) => {
    if (err) {
      console.error('[Evidencias] ❌ Error al guardar:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log(`[Evidencias] ✅ ${req.files.length} evidencia(s) guardada(s)`);
    res.json({ 
      message: `${req.files.length} evidencia(s) subida(s) exitosamente`,
      archivos: req.files.length
    });
  });
});

// DELETE - Eliminar evidencia
app.delete('/api/fiscalizaciones/:id/evidencias/:evidenciaId', (req, res) => {
  const evidenciaId = req.params.evidenciaId;
  
  // Primero obtener la ruta del archivo para eliminarlo físicamente
  pool.query('SELECT ruta_archivo FROM fiscalizacion_evidencias WHERE id = ?', [evidenciaId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: 'Evidencia no encontrada' });
    }
    
    const rutaArchivo = results[0].ruta_archivo.replace('/uploads/', '');
    const fullPath = path.join(__dirname, 'uploads', rutaArchivo);
    
    // Eliminar archivo físicamente
    fs.unlink(fullPath, (fsErr) => {
      if (fsErr) console.error('[Evidencias] ⚠️ No se pudo eliminar archivo físico:', fsErr);
      
      // Eliminar de la base de datos
      pool.query('DELETE FROM fiscalizacion_evidencias WHERE id = ?', [evidenciaId], (err, result) => {
        if (err) {
          console.error('[Evidencias] ❌ Error al eliminar:', err);
          return res.status(500).json({ error: err.message });
        }
        
        console.log(`[Evidencias] ✅ Evidencia ${evidenciaId} eliminada`);
        res.json({ message: 'Evidencia eliminada exitosamente' });
      });
    });
  });
});

// ============================================
// GENERACIÓN DE PDFs
// ============================================

// GET - Generar PDF de Acta de Fiscalización
app.get('/api/fiscalizaciones/:id/pdf/acta', (req, res) => {
  const fiscalizacionId = req.params.id;
  
  pool.query('SELECT * FROM fiscalizaciones WHERE id = ?', [fiscalizacionId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: 'Fiscalización no encontrada' });
    }
    
    const fisc = results[0];
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=acta-${fisc.numero_fiscalizacion}.pdf`);
    
    doc.pipe(res);
    
    // Encabezado
    doc.fontSize(18).text('ACTA DE FISCALIZACIÓN', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`N° ${fisc.acta_numero || fisc.numero_fiscalizacion}`, { align: 'center' });
    doc.moveDown(2);
    
    // Datos del establecimiento
    doc.fontSize(14).text('DATOS DEL ESTABLECIMIENTO', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Razón Social: ${fisc.razon_social}`);
    doc.text(`RUC: ${fisc.ruc || 'N/A'}`);
    doc.text(`Dirección: ${fisc.direccion}`);
    doc.text(`Giro: ${fisc.giro || 'N/A'}`);
    doc.moveDown();
    
    // Datos de la fiscalización
    doc.fontSize(14).text('DATOS DE LA FISCALIZACIÓN', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Fecha: ${fisc.fecha_fiscalizacion ? new Date(fisc.fecha_fiscalizacion).toLocaleDateString() : 'N/A'}`);
    doc.text(`Origen: ${fisc.origen}`);
    doc.text(`Tipo de Infracción: ${fisc.tipo_infraccion}`);
    doc.text(`Gravedad: ${fisc.gravedad}`);
    doc.text(`Base Legal: ${fisc.base_legal || 'N/A'}`);
    doc.moveDown();
    
    // Descripción
    doc.fontSize(14).text('DESCRIPCIÓN DE LA INFRACCIÓN', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(fisc.descripcion_infraccion, { align: 'justify' });
    doc.moveDown();
    
    // Medida adoptada
    if (fisc.medida_adoptada) {
      doc.fontSize(14).text('MEDIDA ADOPTADA', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      doc.text(fisc.medida_adoptada);
      doc.moveDown();
    }
    
    // Pie de página
    doc.moveDown(3);
    doc.fontSize(10).text('_________________________', { align: 'center' });
    doc.text('Firma del Inspector', { align: 'center' });
    
    doc.end();
    
    console.log(`[PDF Acta] ✅ PDF generado para fiscalización ${fiscalizacionId}`);
  });
});

// GET - Generar PDF de Notificación
app.get('/api/fiscalizaciones/:id/pdf/notificacion', (req, res) => {
  const fiscalizacionId = req.params.id;
  
  pool.query('SELECT * FROM fiscalizaciones WHERE id = ?', [fiscalizacionId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: 'Fiscalización no encontrada' });
    }
    
    const fisc = results[0];
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=notificacion-${fisc.numero_fiscalizacion}.pdf`);
    
    doc.pipe(res);
    
    // Encabezado
    doc.fontSize(18).text('NOTIFICACIÓN DE INFRACCIÓN', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`N° ${fisc.notificacion_numero || fisc.numero_fiscalizacion}`, { align: 'center' });
    doc.moveDown(2);
    
    // Destinatario
    doc.fontSize(14).text('SEÑOR(ES):', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(fisc.razon_social);
    doc.text(`RUC: ${fisc.ruc || 'N/A'}`);
    doc.text(`Dirección: ${fisc.direccion}`);
    doc.moveDown(2);
    
    // Cuerpo
    doc.fontSize(11);
    doc.text('Por medio de la presente, se le notifica que:', { align: 'justify' });
    doc.moveDown(0.5);
    doc.text(fisc.descripcion_infraccion, { align: 'justify' });
    doc.moveDown();
    
    // Infracción y base legal
    doc.text(`Tipo de Infracción: ${fisc.tipo_infraccion}`);
    doc.text(`Gravedad: ${fisc.gravedad}`);
    doc.text(`Base Legal: ${fisc.base_legal || 'N/A'}`);
    doc.moveDown();
    
    // Sanción
    if (fisc.monto_multa) {
      doc.fontSize(14).text('SANCIÓN IMPUESTA:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      doc.text(`Monto de Multa: S/ ${parseFloat(fisc.monto_multa).toFixed(2)}`);
      doc.moveDown();
    }
    
    // Plazo de subsanación
    if (fisc.plazo_subsanacion) {
      doc.fontSize(14).text('PLAZO DE SUBSANACIÓN:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      doc.text(`${fisc.plazo_subsanacion} días hábiles a partir de la presente notificación.`);
      if (fisc.fecha_limite_subsanacion) {
        doc.text(`Fecha límite: ${new Date(fisc.fecha_limite_subsanacion).toLocaleDateString()}`);
      }
      doc.moveDown();
    }
    
    // Pie de página
    doc.moveDown(3);
    doc.fontSize(9).text('Esta es una notificación oficial de la Municipalidad.', { align: 'center' });
    
    doc.end();
    
    console.log(`[PDF Notificación] ✅ PDF generado para fiscalización ${fiscalizacionId}`);
  });
});

// ============================================
// ALERTAS POR EMAIL
// ============================================

// POST - Enviar alerta de vencimiento
app.post('/api/fiscalizaciones/:id/enviar-alerta', (req, res) => {
  const fiscalizacionId = req.params.id;
  
  pool.query('SELECT * FROM fiscalizaciones WHERE id = ?', [fiscalizacionId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: 'Fiscalización no encontrada' });
    }
    
    const fisc = results[0];
    
    console.log(`[Alerta Email] 📧 Solicitud de envío de alerta para fiscalización ${fisc.numero_fiscalizacion}`);
    console.log(`[Alerta Email] ⚠️ Funcionalidad de email está desactivada temporalmente`);
    
    // TODO: Implementar envío de email cuando nodemailer esté configurado correctamente
    // Por ahora solo simular el envío
    
    res.json({ 
      message: 'Alerta registrada (email desactivado temporalmente)',
      fiscalizacion: fisc.numero_fiscalizacion,
      razon_social: fisc.razon_social
    });
  });
});

// ============================================
// Handler 404 y Servidor
// ============================================

// ============================================
// NOTIFICACIONES
// ============================================

// Función helper para crear notificaciones según reglas de negocio
function crearNotificacion(tipo, titulo, mensaje, opciones = {}) {
  const {
    rolDestino = 'administrador',
    usuarioId = null,
    referenciaTipo = null,
    referenciaId = null,
    expediente = null,
    icono = 'fa-bell',
    creadoPor = 'Sistema'
  } = opciones;

  const query = `
    INSERT INTO notificaciones 
    (usuario_id, rol_destino, tipo, titulo, mensaje, icono, referencia_tipo, referencia_id, expediente, creado_por)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  pool.query(
    query,
    [usuarioId, rolDestino, tipo, titulo, mensaje, icono, referenciaTipo, referenciaId, expediente, creadoPor],
    (err, result) => {
      if (err) {
        console.error('❌ Error al crear notificación:', err);
      } else {
        console.log(`✅ Notificación creada: ${titulo} -> ${rolDestino}`);
      }
    }
  );
}

// GET - Obtener notificaciones del usuario actual
app.get('/api/notificaciones', (req, res) => {
  const usuarioId = req.query.usuario_id;
  const rol = req.query.rol;

  if (!rol) {
    return res.status(400).json({ error: 'Rol requerido' });
  }

  // Obtener notificaciones para el rol Y opcionalmente para el usuario específico
  const query = `
    SELECT * FROM notificaciones
    WHERE rol_destino = ? 
      AND (usuario_id IS NULL OR usuario_id = ?)
    ORDER BY creado_en DESC
    LIMIT 50
  `;

  pool.query(query, [rol, usuarioId || null], (err, results) => {
    if (err) {
      console.error('Error al obtener notificaciones:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// GET - Obtener cantidad de notificaciones no leídas
app.get('/api/notificaciones/no-leidas/count', (req, res) => {
  const usuarioId = req.query.usuario_id;
  const rol = req.query.rol;

  if (!rol) {
    return res.status(400).json({ error: 'Rol requerido' });
  }

  const query = `
    SELECT COUNT(*) as count FROM notificaciones
    WHERE rol_destino = ? 
      AND (usuario_id IS NULL OR usuario_id = ?)
      AND leida = FALSE
  `;

  pool.query(query, [rol, usuarioId || null], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ count: results[0].count });
  });
});

// ====== LOG DE NOTIFICACIONES ENVIADAS A SOLICITANTES ======
// GET - Obtener historial de notificaciones enviadas
app.get('/api/notificaciones-log', (req, res) => {
  const solicitudId = req.query.solicitud_id;
  const limit = parseInt(req.query.limit) || 50;

  let query = `
    SELECT 
      nl.id, nl.solicitud_id, nl.tipo_notificacion, nl.destino, 
      nl.mensaje, nl.estado_envio, nl.fecha_envio, nl.error_detalle,
      s.numerodeexpediente, s.razon_social
    FROM notificaciones_log nl
    LEFT JOIN solicitudes s ON nl.solicitud_id = s.id
    WHERE 1=1
  `;
  const params = [];

  if (solicitudId) {
    query += ' AND nl.solicitud_id = ?';
    params.push(solicitudId);
  }

  query += ' ORDER BY nl.fecha_envio DESC LIMIT ?';
  params.push(limit);

  pool.query(query, params, (err, results) => {
    if (err) {
      console.error('[NOTIFICACIONES-LOG] Error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// GET - Estadísticas de notificaciones
app.get('/api/notificaciones-log/estadisticas', (req, res) => {
  const query = `
    SELECT 
      tipo_notificacion,
      estado_envio,
      COUNT(*) as cantidad,
      DATE(fecha_envio) as fecha
    FROM notificaciones_log
    WHERE fecha_envio >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY tipo_notificacion, estado_envio, DATE(fecha_envio)
    ORDER BY fecha DESC, tipo_notificacion
  `;

  pool.query(query, (err, results) => {
    if (err) {
      console.error('[NOTIFICACIONES-LOG] Error estadísticas:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// POST - Crear notificación manualmente
app.post('/api/notificaciones', (req, res) => {
  const { 
    usuario_id, 
    rol_destino, 
    tipo, 
    titulo, 
    mensaje, 
    icono = 'fa-bell',
    referencia_tipo,
    referencia_id,
    expediente,
    creado_por 
  } = req.body;

  if (!rol_destino || !tipo || !titulo || !mensaje) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const query = `
    INSERT INTO notificaciones 
    (usuario_id, rol_destino, tipo, titulo, mensaje, icono, referencia_tipo, referencia_id, expediente, creado_por)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  pool.query(
    query,
    [usuario_id, rol_destino, tipo, titulo, mensaje, icono, referencia_tipo, referencia_id, expediente, creado_por],
    (err, result) => {
      if (err) {
        console.error('Error al crear notificación:', err);
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: result.insertId, message: 'Notificación creada exitosamente' });
    }
  );
});

// PUT - Marcar notificación como leída
app.put('/api/notificaciones/:id/leer', (req, res) => {
  const id = req.params.id;

  const query = `
    UPDATE notificaciones 
    SET leida = TRUE, fecha_leida = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  pool.query(query, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    res.json({ message: 'Notificación marcada como leída' });
  });
});

// PUT - Marcar todas las notificaciones como leídas
app.put('/api/notificaciones/marcar-todas-leidas', (req, res) => {
  const usuarioId = req.body.usuario_id;
  const rol = req.body.rol;

  if (!rol) {
    return res.status(400).json({ error: 'Rol requerido' });
  }

  const query = `
    UPDATE notificaciones 
    SET leida = TRUE, fecha_leida = CURRENT_TIMESTAMP
    WHERE rol_destino = ? 
      AND (usuario_id IS NULL OR usuario_id = ?)
      AND leida = FALSE
  `;

  pool.query(query, [rol, usuarioId || null], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: `${result.affectedRows} notificaciones marcadas como leídas` });
  });
});

// DELETE - Eliminar notificación
app.delete('/api/notificaciones/:id', (req, res) => {
  const id = req.params.id;

  pool.query('DELETE FROM notificaciones WHERE id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    res.json({ message: 'Notificación eliminada exitosamente' });
  });
});

// ============================================
// ERROR 404
// ============================================
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl, method: req.method });
});

// ============================================
// VERIFICAR Y CREAR TABLAS NECESARIAS
// ============================================
function verificarTablas() {
  const crearTablaEvidencias = `
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;
  
  pool.query(crearTablaEvidencias, (err) => {
    if (err) {
      console.error('⚠️ Error al verificar tabla fiscalizacion_evidencias:', err.message);
    } else {
      console.log('✅ Tabla fiscalizacion_evidencias verificada/creada');
      
      // Verificar y agregar columnas de latitud y longitud a fiscalizaciones si no existen
      // MySQL no soporta IF NOT EXISTS en ALTER TABLE ADD COLUMN en versiones antiguas,
      // por lo que verificamos primero si la columna existe
      pool.query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'fiscalizaciones' 
        AND COLUMN_NAME = 'latitud'
      `, (err, results) => {
        if (err) {
          console.error('⚠️ Error al verificar columna latitud:', err.message);
        } else {
          if (results[0].count === 0) {
            pool.query(`ALTER TABLE fiscalizaciones ADD COLUMN latitud DECIMAL(10, 8) NULL`, (err) => {
              if (err) {
                console.error('⚠️ Error al agregar columna latitud:', err.message);
              } else {
                console.log('✅ Columna latitud agregada');
              }
            });
          } else {
            console.log('✅ Columna latitud ya existe');
          }
        }
      });
      
      pool.query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'fiscalizaciones' 
        AND COLUMN_NAME = 'longitud'
      `, (err, results) => {
        if (err) {
          console.error('⚠️ Error al verificar columna longitud:', err.message);
        } else {
          if (results[0].count === 0) {
            pool.query(`ALTER TABLE fiscalizaciones ADD COLUMN longitud DECIMAL(11, 8) NULL`, (err) => {
              if (err) {
                console.error('⚠️ Error al agregar columna longitud:', err.message);
              } else {
                console.log('✅ Columna longitud agregada');
              }
            });
          } else {
            console.log('✅ Columna longitud ya existe');
          }
        }
      });
    }
  });
}

const PORT = 3000;
app.listen(PORT, () => {
  console.log('✅ Backend corriendo en http://localhost:3000');
  console.log('📅 Fecha:', new Date().toISOString());
  console.log('👤 Usuario: reynanela68-rgb');
  console.log('📂 Carpeta uploads:', path.join(__dirname, 'uploads'));
  
  // Verificar tablas al iniciar
  verificarTablas();
});