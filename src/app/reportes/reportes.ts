import { Component, OnInit } from '@angular/core';
import { MlService } from '../service/mi.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { LogService } from '../service/log.service';
import { environment } from '../../environments/environment';
import { jsPDF } from 'jspdf';

// Documentos requeridos centralizados
const documentosITSE: Record<string, string[]> = {
  'BAJO': [
    'DDJJ anexos 01, 02, 03, 04',
    'Croquis con medidas de áreas',
    'Certificado vigente de medición de resistencia del sistema de puesta a tierra',
    'Constancia de operatividad de extintores'
  ],
  'MEDIO': [
    'DDJJ anexos 01, 02, 03, 04',
    'Croquis con medidas de áreas',
    'Certificado vigente de medición de resistencia del sistema de puesta a tierra',
    'Constancia de operatividad de extintores'
  ],
  'ALTO': [
    'DDJJ anexos 01, 02, 03',
    'Croquis con medidas de áreas',
    'Plano arquitectura (distribución y cálculo de aforo)',
    'Plano de distribución de tableros eléctricos, diagramas unifilares y cuadro de cargas',
    'Certificado vigente de medición de resistencia del sistema de puesta a tierra',
    'Plan de seguridad (plano de señalización y evacuación)',
    'Memoria o protocolos de pruebas de operatividad y/o mantenimiento equipos contra incendio'
  ],
  'MUY ALTO': [
    'DDJJ anexos 01, 02, 03',
    'Croquis con medidas de áreas',
    'Plano arquitectura (distribución y cálculo de aforo)',
    'Plano de distribución de tableros eléctricos, diagramas unifilares y cuadro de cargas',
    'Certificado vigente de medición de resistencia del sistema de puesta a tierra',
    'Plan de seguridad (plano de señalización y evacuación)',
    'Memoria o protocolos de pruebas de operatividad y/o mantenimiento equipos contra incendio'
  ]
};

const documentosECSE: Record<string, Record<string, string[]>> = {
  'BAJO': {
    hasta3000: [
      'Declaración Jurada',
      'Croquis de ubicación',
      'Plano de arquitectura del escenario',
      'Memoria descriptiva y programación de actividades',
      'Protocolo de medición del sistema de puesta a tierra'
    ],
    mayor3000: [
      'Declaración Jurada RL',
      'Croquis de ubicación',
      'Plano de arquitectura del escenario',
      'Memoria descriptiva y programación de actividades',
      'Protocolo de medición del sistema de puesta a tierra',
      'Plan de seguridad para el evento'
    ]
  },
  'MEDIO': {
    hasta3000: [
      'Declaración Jurada',
      'Croquis de ubicación',
      'Plano arquitectura escenario',
      'Memoria descriptiva y programación de actividades',
      'Protocolo de medición del sistema de puesta a tierra',
      'Plan de seguridad para el evento'
    ],
    mayor3000: [
      'Declaración Jurada RL',
      'Croquis de ubicación',
      'Plano arquitectura escenario',
      'Memoria descriptiva y programación de actividades',
      'Protocolo de medición del sistema de puesta a tierra',
      'Plan de seguridad para el evento'
    ]
  },
  'ALTO': {
    hasta3000: [
      'Declaración Jurada',
      'Croquis de ubicación',
      'Plano arquitectura escenario',
      'Memoria descriptiva y programación de actividades',
      'Protocolo de medición del sistema de puesta a tierra',
      'Plan de seguridad para el evento'
    ],
    mayor3000: [
      'Declaración Jurada RL',
      'Croquis de ubicación',
      'Plano arquitectura escenario',
      'Memoria descriptiva y programación de actividades',
      'Protocolo de medición del sistema de puesta a tierra',
      'Plan de seguridad para el evento'
    ]
  },
  'MUY ALTO': {
    hasta3000: [
      'Declaración Jurada',
      'Croquis de ubicación',
      'Plano arquitectura escenario',
      'Memoria descriptiva y programación de actividades',
      'Protocolo de medición del sistema de puesta a tierra',
      'Plan de seguridad para el evento'
    ],
    mayor3000: [
      'Declaración Jurada RL',
      'Croquis de ubicación',
      'Plano arquitectura escenario',
      'Memoria descriptiva y programación de actividades',
      'Protocolo de medición del sistema de puesta a tierra',
      'Plan de seguridad para el evento'
    ]
  }
};

// LIMPIADOR Y COMPARADOR ULTRA FLEXIBLE
function limpiaNombre(nombre: string): string {
  if (!nombre) return '';
  nombre = nombre.replace(/\.[a-z0-9]+$/i, '');
  return nombre
    .toLowerCase()
    .replace(/á|â|ã¡|Ã¡|Ã¢/g, 'a')
    .replace(/é|ê|ã©|Ã©|Ãª/g, 'e')
    .replace(/í|î|ã­|Ãí|Ã®/g, 'i')
    .replace(/ó|ô|ã³|Ãó|Ã´/g, 'o')
    .replace(/ú|û|ãº|Ãº|Ã»/g, 'u')
    .replace(/ñ|Ãñ/g, 'n')
    .replace(/[\(\)\[\]\{\}_\-]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function nombresCoincidenRequeridoYSubido(requerido: string, subido: string): boolean {
  const limpioReq = limpiaNombre(requerido);
  const limpioSub = limpiaNombre(subido);

  if (limpioReq === limpioSub) return true;
  if (limpioReq.includes(limpioSub)) return true;
  if (limpioSub.includes(limpioReq)) return true;

  const palabrasReq = limpioReq.split(' ').filter(Boolean);
  const palabrasSub = limpioSub.split(' ').filter(Boolean);
  const comunes = palabrasReq.filter(p => palabrasSub.includes(p));
  return comunes.length >= 3;
}

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.html',
  styleUrls: ['./reportes.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ReportesComponent implements OnInit {
  solicitudes: any[] = [];
  filtroEstado = '';
  filtroExpediente = '';
  solicitudSeleccionada: any = null;
  logNotificaciones: any[] = [];
  mostrarTabNotificaciones = false;
  
  // ⭐ MODALES MODERNOS
  showModalDetalle = false;
  showModalEditar = false;
  showModalFinalizar = false;
  showModalCertificado = false;
  showModalEliminar = false;
  showModalMotivoRechazo = false;

  // ⭐ TABS PARA MODALES
  tabActivaDetalle: string = 'solicitante';
  tabActivaEditar: string = 'solicitante';

  solicitudCertificado: any = null;
  panelFotograficoVisible = false;
  distrito = 'HUANCHACO';
  provincia = 'TRUJILLO';
  departamento = 'LA LIBERTAD';
  inspectorAsignado = '';
  usuarioRol = '';

  horaApertura = '';
  horaCierre = '';

  localidades = [
    'CP. EL MILAGRO',
    'CP. RAMON CASTILLA',
    'CP. VICTOR RAUL',
    'HUANCHACO BALNEARIO',
    'CP. HUANCHAQUITO',
    'CP. EL TROPICO'
  ];

  horarios = [
    '',
    'Mañana',
    'Tarde',
    'Noche',
    '24 Horas',
    'Horario Especial'
  ];

  inspectores = [
    { usuario: 'Dcarranzal', nombres_completos: 'Ing. Denniz Paul Carranza Luna' },
    { usuario: 'DMmartinez', nombres_completos: 'Ing. David Martínez Reluz' },
    { usuario: 'Vmanuel', nombres_completos: 'Arq. Victor Manuel Ruiz Vásquez' }
  ];

  usuarioLogueado = '';
  editForm: any = {};
  selectedFile: File | null = null;
  finalizarChecks = { inspector: false, administrativo: false, administrador: false };

  resolucionGenerada = false;

  paginaActual = 1;
  tamanioPagina = 5;

  exportarColumnasDisponibles = [
    { key: 'solicitante', label: 'Solicitante' },
    { key: 'dni_ce', label: 'DNI/CE' },
    { key: 'correo', label: 'Correo' },
    { key: 'telefonos', label: 'Teléfonos' },
    { key: 'fecha', label: 'Fecha de Emisión' },
    { key: 'numerodeexpediente', label: 'N° Expediente' },
    { key: 'inspector', label: 'Inspector Asignado' },
    { key: 'tipo_tramite', label: 'Tipo de Trámite' },
    { key: 'tipo_itse', label: 'Tipo ITSE' },
    { key: 'riesgo_incendio', label: 'Riesgo Incendio' },
    { key: 'riesgo_detalle', label: 'Detalle de Riesgo' },
    { key: 'razon_social', label: 'Razón Social' },
    { key: 'ruc', label: 'RUC' },
    { key: 'aforo_declarado', label: 'aforo_declarado' },
    { key: 'whatsapp_consent', label: 'WhatsApp Consent' },
    { key: 'whatsapp_numero', label: 'WhatsApp Número' },
    { key: 'whatsapp_numero_alt', label: 'WhatsApp Número Alterno' }
  ];

  // Nueva API de RENIEC y SUNAT
  private tokenCodart = 'LjdZV09v9zcxuPxjg0ATLE4oL72HOmROCpPsrVF0u5qU4OFJ3OLYBIR8DF5B';
  private apiCodartBase = 'https://api.codart.cgrt.net/api/v1/consultas';
  
  // API antigua (mantener como fallback)
  private tokenApisPeru = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFudG9uaWFob3JuYTZAZ21haWwuY29tIn0.eICLNsCmEB8CYuJ-6kvnabVno6LL8ah5q0RofZi-Wbw';
  seleccionarTodos = false;

  archivosFaltantes: string[] = [];
  archivosSubidos: any[] = [];
  archivosParaSubir: { [nombre: string]: File | null } = {};

  motivoEliminar = '';
  motivoEliminarOtro = '';
  idEliminar: number | null = null;

  motivoRechazo = '';
  motivoRechazoOtro = '';

  constructor(private miService: MlService, private http: HttpClient, private logger: LogService) {}

  ngOnInit() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.usuarioLogueado = user.nombre_completo || user.nombres_apellidos || user.usuario || 'Usuario';
      } catch (e) {
        this.usuarioLogueado = localStorage.getItem('usuario') || 'Usuario';
      }
    } else {
      this.usuarioLogueado = localStorage.getItem('usuario') || 'Usuario';
    }

    this.usuarioRol = localStorage.getItem('rol') || '';
    this.logger.log('[ReportesComponent] ngOnInit -> usuario:', this.usuarioLogueado, 'rol:', this.usuarioRol);
    this.cargarSolicitudes();
  }

  toggleSeleccionTodos() {
    const solicitudesPagina = this.getSolicitudesFiltradas();
    solicitudesPagina.forEach(s => s.seleccionado = this.seleccionarTodos);
  }

  actualizarSeleccionTodos() {
    const solicitudesPagina = this.getSolicitudesFiltradas();
    this.seleccionarTodos = solicitudesPagina.every(s => s.seleccionado);
  }

  cargarSolicitudes() {
  this.logger.log('[cargarSolicitudes] solicitando /api/solicitudes ...');
  this.miService.obtenerSolicitudes().subscribe({
    next: (data: any[]) => {
      this.logger.log('[cargarSolicitudes] recibidas', data?.length, 'solicitudes');
      
      // ✅ FILTRAR: NO MOSTRAR SOLICITUDES FINALIZADAS
      const solicitudesActivas = data.filter(s => {
        const estado = String(s.estado || '').toUpperCase();
        return estado !== 'FINALIZADO';
      });
      
      this.logger.log('[cargarSolicitudes] Solicitudes activas (sin finalizadas):', solicitudesActivas.length);
      
      this.solicitudes = solicitudesActivas.map((s: any) => {
        let estadoReal = String(s.estado).toUpperCase();
        let estadoVisual = estadoReal;
        let checkInspector = !!s.check_inspector;

        if (estadoReal === 'RECHAZADA' || estadoReal === 'APROBADA') {
          // mantener
        } else if (estadoReal === 'OBSERVADO') {
          estadoVisual = 'OBSERVADO';
        } else {
          const archivosFaltantes = this.getArchivosFaltantesPorNivelYTramite(
            s.nivelRiesgoSugerido || s.riesgo_incendio,
            s.archivos || [],
            s.tipo_tramite,
            s.tipo_itse,
            s.tipo_ecse
          );
          if (archivosFaltantes.length > 0) {
            estadoReal = 'EN PROCESO';
            estadoVisual = 'EN PROCESO';
            checkInspector = false;
          } else {
            estadoReal = 'PENDIENTE';
            estadoVisual = 'PENDIENTE';
          }
        }

        return {
          ...s,
          estadoReal,
          estadoVisual,
          checkInspector,
          numerodeexpediente: s.numerodeexpediente || '',
          solicitante: s.nombres_apellidos || s.nombres || s.solicitante || 'SIN DATOS',
          nivelRiesgoSugerido: s.nivelRiesgoSugerido || s.riesgo_incendio || 'SIN_DATOS',
          fecha: s.fecha || new Date().toISOString().split('T')[0],
          creadoPor: s.creadoPor || 'SIN DATOS',
          inspector: s.inspector_asignado || s.inspector || '',
          tipo_tramite: s.tipo_tramite || '',
          tipo_itse: s.tipo_itse || '',
          tipo_ecse: s.tipo_ecse || '',
          aforo: s.aforo_declarado || '',
          aforo_declarado: s.aforo_declarado || '',
          riesgo_incendio: s.riesgo_incendio || '',
          riesgo_detalle: s.riesgo_detalle || '',
          razon_social: s.razon_social || '',
          ruc: s.ruc || '',
          nombre_comercial: s.nombre_comercial || '',
          direccion: s.direccion || '',
          localidad: s.localidad || '',
          provincia: s.provincia || '',
          departamento: s.departamento || '',
          whatsapp_consent: s.whatsapp_consent ?? 0,
          whatsapp_numero: s.whatsapp_numero || '',
          whatsapp_numero_alt: s.whatsapp_numero_alt || '',
          giro_actividades: s.giro_actividades || '',
          horario_atencion: s.horario_atencion || '',
          area_ocupada: s.area_ocupada || '',
          num_pisos: s.num_pisos || '',
          piso_ubicado: s.piso_ubicado || '',
          area_terreno: s.area_terreno || '',
          area_techada_por_nivel: s.area_techada_por_nivel || '',
          area_libre: s.area_libre || '',
          latitud: s.latitud || '',
          longitud: s.longitud || '',
          archivos: s.archivos || [],
          expedienteGuardado: !!s.numerodeexpediente,
          seleccionado: false
        };
      });

      this.solicitudes.forEach(s => {
        if (!s.numerodeexpediente || s.numerodeexpediente === 'SIN DATOS') {
          s.numerodeexpediente = '';
          s.expedienteGuardado = false;
          s.expedienteEditado = false;
        } else {
          s.expedienteGuardado = true;
          s.expedienteEditado = false;
        }
      });

      this.seleccionarTodos = false;
    },
    error: (err) => {
      this.logger.error('[cargarSolicitudes] ERROR:', err);
    }
  });
}
  buscarDni(dni: string) {
    if (!/^\d{8}$/.test(dni)) {
      Swal.fire('Error', 'Ingrese un DNI válido de 8 dígitos', 'error');
      return;
    }
    
    // Nueva API de RENIEC
    const url = `${this.apiCodartBase}/reniec/dni/${dni}`;
    const headers = { 
      'Authorization': `Bearer ${this.tokenCodart}`,
      'Content-Type': 'application/json'
    };
    
    this.logger.log('[buscarDni] url:', url);
    this.http.get<any>(url, { headers }).subscribe({
      next: (resp) => {
        this.logger.log('[buscarDni] Respuesta completa de la API:', resp);
        
        // Verificar si hay error en la respuesta
        if (!resp.success || resp.error || (resp.message && resp.message.toLowerCase().includes('error'))) {
          console.warn('[buscarDni] respuesta con error:', resp);
          Swal.fire('Error', 'La API devolvió un error: ' + (resp.message || resp.error || 'DNI no encontrado'), 'error');
          this.editForm.nombres_apellidos = '';
          return;
        }
        
        // La API de Codart devuelve los datos en resp.result
        const result = resp.result;
        if (!result) {
          this.logger.warn('[buscarDni] No hay objeto result en la respuesta');
          Swal.fire('Advertencia', 'No se encontraron datos para ese DNI. Verifica que el DNI sea correcto.', 'warning');
          this.editForm.nombres_apellidos = '';
          return;
        }
        
        // Mapear campos según la documentación de la API Codart
        // first_name, first_last_name, second_last_name, full_name
        const nombres = result.first_name || '';
        const apellidoPaterno = result.first_last_name || '';
        const apellidoMaterno = result.second_last_name || '';
        const nombreCompleto = result.full_name || '';
        
        this.logger.log('[buscarDni] Datos extraídos:', { nombres, apellidoPaterno, apellidoMaterno, nombreCompleto });
        
        // Construir nombre completo
        if (nombreCompleto) {
          // Usar full_name si está disponible
          this.editForm.nombres_apellidos = nombreCompleto.trim();
        } else if (nombres && apellidoPaterno && apellidoMaterno) {
          // Construir desde los campos individuales
          this.editForm.nombres_apellidos = `${nombres} ${apellidoPaterno} ${apellidoMaterno}`.trim();
        } else if (nombres && apellidoPaterno) {
          // Si solo hay nombres y apellido paterno
          this.editForm.nombres_apellidos = `${nombres} ${apellidoPaterno}`.trim();
        } else {
          this.logger.warn('[buscarDni] No se encontraron campos de nombre en result');
          Swal.fire('Advertencia', 'No se encontraron datos para ese DNI. Verifica que el DNI sea correcto.', 'warning');
          this.editForm.nombres_apellidos = '';
        }
      },
      error: (e) => {
        this.logger.error('[buscarDni] ERROR:', e);
        Swal.fire('Error', 'Error consultando el DNI. Verifica tu token y conexión a internet.', 'error');
        this.editForm.nombres_apellidos = '';
      }
    });
  }

  buscarRuc(ruc: string) {
    if (!/^\d{11}$/.test(ruc)) {
      Swal.fire('Error', 'Ingrese un RUC válido de 11 dígitos', 'error');
      return;
    }
    
    // Nueva API de SUNAT
    const url = `${this.apiCodartBase}/sunat/ruc/${ruc}`;
    const headers = { 
      'Authorization': `Bearer ${this.tokenCodart}`,
      'Content-Type': 'application/json'
    };
    
    this.logger.log('[buscarRuc] url:', url);
    this.http.get<any>(url, { headers }).subscribe({
      next: (resp) => {
        this.logger.log('[buscarRuc] Respuesta completa de la API:', resp);
        
        // Verificar si hay error en la respuesta
        if (!resp.success || resp.error || (resp.message && resp.message.toLowerCase().includes('error'))) {
          Swal.fire('Error', 'La API devolvió un error: ' + (resp.message || resp.error || 'RUC no encontrado'), 'error');
          this.editForm.razon_social = '';
          this.editForm.nombre_comercial = '';
          this.editForm.direccion = '';
          return;
        }
        
        // La API de Codart devuelve los datos en resp.result
        const result = resp.result;
        if (!result) {
          this.logger.warn('[buscarRuc] No hay objeto result en la respuesta');
          Swal.fire('Advertencia', 'No se encontraron datos para ese RUC. Verifica que el RUC sea correcto.', 'warning');
          this.editForm.razon_social = '';
          this.editForm.nombre_comercial = '';
          this.editForm.direccion = '';
          return;
        }
        
        // Mapear campos según la documentación de la API Codart
        const razonSocial = result.razon_social || '';
        const direccion = result.direccion || '';
        // Nota: La API de Codart para RUC no parece tener nombre_comercial en el ejemplo
        
        this.logger.log('[buscarRuc] Datos extraídos:', { razonSocial, direccion });
        
        if (razonSocial) {
          this.editForm.razon_social = razonSocial;
        } else {
          this.editForm.razon_social = '';
        }
        
        // nombre_comercial no está en la respuesta de la API, dejarlo vacío
        this.editForm.nombre_comercial = '';
        
        if (direccion) {
          this.editForm.direccion = direccion;
        } else {
          this.editForm.direccion = '';
        }
      },
      error: (e) => {
        this.logger.error('[buscarRuc] ERROR:', e);
        Swal.fire('Error', 'Error consultando el RUC. Verifica tu token y conexión.', 'error');
        this.editForm.razon_social = '';
        this.editForm.nombre_comercial = '';
        this.editForm.direccion = '';
      }
    });
  }

  verSolicitud(solicitud: any) {
    this.logger.log('[verSolicitud] id:', solicitud?.id);
    this.miService.obtenerInforme(solicitud.id).subscribe({
      next: (res: any) => {
        this.logger.log('[verSolicitud] informe recibido:', res);
        
        // ✅ AGREGAR TIMESTAMP A LAS URLs DEL PANEL FOTOGRÁFICO PARA EVITAR CACHÉ
        let panelFotografico = res.panelFotografico || [];
        if (panelFotografico.length > 0) {
          const timestamp = new Date().getTime();
          panelFotografico = panelFotografico.map((foto: any) => ({
            ...foto,
            imagen_url: foto.imagen_url ? `${foto.imagen_url}${foto.imagen_url.includes('?') ? '&' : '?'}t=${timestamp}` : ''
          }));
        }
        
        this.solicitudSeleccionada = { ...res.informe, panelFotografico };
        
        // 📧 CARGAR LOG DE NOTIFICACIONES
        this.cargarLogNotificaciones(solicitud.id);
        
        this.logger.log('🗺️ Coordenadas:', {
          latitud: this.solicitudSeleccionada.latitud,
          longitud: this.solicitudSeleccionada.longitud
        });
        
        this.showModalDetalle = true;
        this.tabActivaDetalle = 'solicitante';
      },
      error: (err) => {
        this.logger.error('[verSolicitud] ERROR obtenerInforme:', err);
      }
    });
  }

  // 📧 CARGAR LOG DE NOTIFICACIONES
  cargarLogNotificaciones(solicitudId: number) {
    this.miService.obtenerLogNotificaciones(solicitudId).subscribe({
      next: (log: any[]) => {
        this.logNotificaciones = log || [];
        this.logger.log('[cargarLogNotificaciones] Log cargado:', this.logNotificaciones.length, 'notificaciones');
      },
      error: (err) => {
        this.logger.error('[cargarLogNotificaciones] Error:', err);
        this.logNotificaciones = [];
      }
    });
  }

  getIconoNotificacion(tipo: string): string {
    switch (tipo) {
      case 'WHATSAPP': return 'fab fa-whatsapp';
      case 'EMAIL': return 'fas fa-envelope';
      case 'SMS': return 'fas fa-sms';
      default: return 'fas fa-bell';
    }
  }

  getColorEstadoNotificacion(estado: string): string {
    switch (estado) {
      case 'ENVIADO': return '#4CAF50';
      case 'ERROR': return '#F44336';
      case 'PENDIENTE': return '#FF9800';
      default: return '#9E9E9E';
    }
  }

  cerrarModalDetalle() {
    this.showModalDetalle = false;
    this.solicitudSeleccionada = null;
    this.panelFotograficoVisible = false;
    this.tabActivaDetalle = 'solicitante';
  }

  cambiarTabDetalle(tab: string) {
    this.tabActivaDetalle = tab;
  }

  editarSolicitud(solicitud: any) {
    this.logger.log('[editarSolicitud] id:', solicitud?.id);
    this.miService.obtenerSolicitudPorId(solicitud.id).subscribe({
      next: (s: any) => {
        this.solicitudSeleccionada = { ...solicitud, ...s };
        this.editForm = { ...this.solicitudSeleccionada };
        this.editForm.modificadoPor = this.usuarioLogueado;
        this.showModalEditar = true;
        this.tabActivaEditar = 'solicitante';
        this.selectedFile = null;

        if (this.editForm.horario_atencion) {
          const partes = String(this.editForm.horario_atencion).split(' a ');
          this.horaApertura = (partes[0] || '').trim();
          this.horaCierre = (partes[1] || '').trim();
        } else {
          this.horaApertura = '';
          this.horaCierre = '';
        }

        this.archivosSubidos = (this.solicitudSeleccionada.archivos || []);
        
        this.logger.log('📂 Archivos cargados:', this.archivosSubidos);
        this.archivosSubidos.forEach((archivo, index) => {
          this.logger.log(`📎 Archivo ${index}:`, {
            nombre: archivo.archivo_nombre || archivo.archivoNombre,
            url: archivo.archivo_url || archivo.archivoUrl,
            completo: archivo
          });
        });

        this.archivosFaltantes = this.getArchivosFaltantesPorNivelYTramite(
          this.editForm.nivelRiesgoSugerido || this.editForm.riesgo_incendio,
          this.archivosSubidos,
          this.editForm.tipo_tramite,
          this.editForm.tipo_itse,
          this.editForm.tipo_ecse
        );
        
        this.archivosParaSubir = {};
        this.archivosFaltantes.forEach((nombre: string) => this.archivosParaSubir[nombre] = null);

        this.logger.log('[editarSolicitud] editForm inicial:', this.editForm);
      },
      error: (err) => this.logger.error('[editarSolicitud] ERROR obtenerSolicitudPorId:', err)
    });
  }

  cerrarModalEditar() {
    this.showModalEditar = false;
    this.solicitudSeleccionada = null;
    this.editForm = {};
    this.selectedFile = null;
    this.archivosFaltantes = [];
    this.archivosSubidos = [];
    this.archivosParaSubir = {};
    this.tabActivaEditar = 'solicitante';
  }

  cambiarTabEditar(tab: string) {
    this.tabActivaEditar = tab;
  }

  guardarEdicion(): void {
    const formData = new FormData();

    formData.append('id', this.editForm.id.toString());
    formData.append('numerodeexpediente', this.editForm.numerodeexpediente || '');
    formData.append('nombres_apellidos', this.editForm.nombres_apellidos || '');
    formData.append('dni_ce', this.editForm.dni_ce || '');
    formData.append('domicilio', this.editForm.domicilio || '');
    formData.append('correo', this.editForm.correo || '');
    formData.append('telefonos', this.editForm.telefonos || '');
    formData.append('razon_social', this.editForm.razon_social || '');
    formData.append('ruc', this.editForm.ruc || '');
    formData.append('nombre_comercial', this.editForm.nombre_comercial || '');
    formData.append('telefonos_establecimiento', this.editForm.telefonos_establecimiento || '');
    formData.append('direccion', this.editForm.direccion || '');
    formData.append('referencia', this.editForm.referencia || '');
    formData.append('localidad', this.editForm.localidad || '');
    formData.append('distrito', this.editForm.distrito || '');
    formData.append('provincia', this.editForm.provincia || '');
    formData.append('departamento', this.editForm.departamento || '');
    
    if (this.editForm.latitud && this.editForm.latitud !== '') {
      formData.append('latitud', this.editForm.latitud);
    }
    if (this.editForm.longitud && this.editForm.longitud !== '') {
      formData.append('longitud', this.editForm.longitud);
    }
    
    formData.append('aforo_declarado', this.editForm.aforo_declarado?.toString() || '');
    formData.append('inspector_asignado', this.editForm.inspector_asignado || '');
    formData.append('numero_resolucion', this.editForm.numero_resolucion || '');
    formData.append('numero_certificado', this.editForm.numero_certificado || '');
    formData.append('modificadoPor', this.usuarioLogueado);

    if (this.horaApertura && this.horaCierre) {
      formData.append('horario_atencion', `${this.horaApertura} a ${this.horaCierre}`);
    }

    if (this.archivosParaSubir && Object.keys(this.archivosParaSubir).length > 0) {
      Object.values(this.archivosParaSubir).forEach((file: File | null) => {
        if (file) {
          this.logger.log('📎 Agregando archivo al FormData:', file.name);
          formData.append('archivos', file, file.name);
        }
      });
    }

    this.logger.log('📤 Enviando FormData para edición');

    const archivosFaltantes = this.getArchivosFaltantesPorNivelYTramite(
      this.editForm.nivelRiesgoSugerido || this.editForm.riesgo_incendio,
      this.archivosSubidos.concat(
        Object.keys(this.archivosParaSubir)
          .filter(nombre => this.archivosParaSubir[nombre])
          .map(nombre => ({ archivo_nombre: nombre }))
      ),
      this.editForm.tipo_tramite,
      this.editForm.tipo_itse,
      this.editForm.tipo_ecse
    );

    const nuevoEstado = archivosFaltantes.length === 0 ? 'PENDIENTE' : 'EN PROCESO';
    formData.append('estado', nuevoEstado);

    const solicitudIdEditada = this.editForm.id;

    this.miService.editarSolicitudConArchivo(this.editForm.id, formData).subscribe({
      next: () => {
        this.logger.log('✅ Solicitud actualizada correctamente');

        const reportePayload = {
          solicitud_id: this.editForm.id,
          numero_resolucion: this.editForm.numero_resolucion || null,
          numero_certificado: this.editForm.numero_certificado || null
        };

        this.miService.guardarNumeroResolucionYCertificado(reportePayload).subscribe({
          next: (resp: any) => this.logger.log('✅ Resolución/certificado guardado:', resp),
          error: (err: any) => this.logger.error('❌ Error guardando resolución/certificado:', err)
        });

        // ✅ SI HAY UN MODAL DE DETALLE ABIERTO CON ESTA SOLICITUD, RECARGARLO
        if (this.showModalDetalle && this.solicitudSeleccionada?.id === solicitudIdEditada) {
          this.logger.log('♻️ Recargando datos del modal de detalle');
          this.miService.obtenerInforme(solicitudIdEditada).subscribe({
            next: (res: any) => {
              // ✅ AGREGAR TIMESTAMP PARA EVITAR CACHÉ
              const timestamp = new Date().getTime();
              let panelFotografico = res.panelFotografico || [];
              if (panelFotografico.length > 0) {
                panelFotografico = panelFotografico.map((foto: any) => ({
                  ...foto,
                  imagen_url: foto.imagen_url ? `${foto.imagen_url}${foto.imagen_url.includes('?') ? '&' : '?'}t=${timestamp}` : ''
                }));
              }
              this.solicitudSeleccionada = { ...res.informe, panelFotografico };
              this.logger.log('✅ Modal de detalle actualizado con nuevos archivos');
            },
            error: (err) => {
              this.logger.error('❌ Error al recargar modal de detalle:', err);
            }
          });
        }

        this.cerrarModalEditar();
        this.cargarSolicitudes();
        Swal.fire('Éxito', 'Solicitud actualizada correctamente', 'success');
      },
      error: (err: any) => {
        this.logger.error('❌ Error al guardar:', err);
        Swal.fire('Error', 'No se pudo actualizar la solicitud', 'error');
      }
    });
  }

  getArchivosFaltantesPorNivelYTramite(
    nivelRiesgo: string, archivosActuales: any[], tipoTramite: string, tipoItse: string, tipoEcse: string
  ): string[] {
    let obligatorios: string[] = [];
    if ((tipoTramite || '').toLowerCase() === 'itse') {
      obligatorios = documentosITSE[(nivelRiesgo || '').toUpperCase()] || [];
    } else if ((tipoTramite || '').toLowerCase() === 'ecse') {
      const riesgo = (nivelRiesgo || '').toUpperCase();
      const modalidad = (tipoEcse || '').toLowerCase();
      obligatorios = (documentosECSE as any)[riesgo]?.[modalidad] || [];
    }
    const nombresSubidos = (archivosActuales || []).map(a => a.archivo_nombre || a.archivoNombre || '');
    return obligatorios.filter(nombreReq =>
      !nombresSubidos.some(nombreSub =>
        nombresCoincidenRequeridoYSubido(nombreReq, nombreSub)
      )
    );
  }

  onFileFaltanteSelected(nombre: string, event: any) {
    const file = event.target.files[0];
    if (file) {
      this.archivosParaSubir[nombre] = file;
      this.logger.log('📎 Archivo seleccionado:', nombre, '->', file.name);
    }
  }

  getArchivoUrl(archivo: any): string {
    const baseUrl = environment.apiUrl;
    
    let url = archivo.archivo_url || archivo.archivoUrl || archivo.url || '';
    
    if (!url || url === 'undefined' || url === '/uploads/undefined') {
      if (archivo.archivo_nombre || archivo.archivoNombre) {
        url = `/uploads/${archivo.archivo_nombre || archivo.archivoNombre}`;
      }
    }
    
    if (url && !url.startsWith('http')) {
      url = baseUrl + url;
    }
    
    this.logger.log('📎 URL del archivo construida:', url, 'Archivo original:', archivo);
    
    return url;
  }

  eliminarArchivoSubido(archivo: any) {
    Swal.fire({
      title: '¿Eliminar este archivo?',
      text: archivo.archivo_nombre || archivo.archivoNombre,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.logger.log('[eliminarArchivoSubido] archivo:', archivo);
        this.miService.eliminarArchivoSolicitud(this.editForm.id, archivo.archivo_nombre || archivo.archivoNombre).subscribe({
          next: () => {
            this.miService.obtenerSolicitudPorId(this.editForm.id).subscribe({
              next: (s: any) => {
                this.archivosSubidos = s.archivos || [];
                this.archivosFaltantes = this.getArchivosFaltantesPorNivelYTramite(
                  this.editForm.nivelRiesgoSugerido || this.editForm.riesgo_incendio,
                  this.archivosSubidos,
                  this.editForm.tipo_tramite,
                  this.editForm.tipo_itse,
                  this.editForm.tipo_ecse
                );
                if (this.archivosFaltantes.length === 0) {
                  this.miService.actualizarEstadoSolicitud(this.editForm.id, 'PENDIENTE').subscribe({
                    next: () => this.editForm.estado = 'PENDIENTE',
                    error: (err: any) => this.logger.error('[eliminarArchivoSubido] ERROR actualizar estado PENDIENTE:', err)
                  });
                } else {
                  this.miService.actualizarEstadoSolicitud(this.editForm.id, 'EN PROCESO').subscribe({
                    next: () => this.editForm.estado = 'EN PROCESO',
                    error: (err: any) => this.logger.error('[eliminarArchivoSubido] ERROR actualizar estado EN PROCESO:', err)
                  });
                }
                Swal.fire('Eliminado', 'El archivo ha sido eliminado', 'success');
              },
              error: (err: any) => this.logger.error('[eliminarArchivoSubido] ERROR obtenerSolicitudPorId:', err)
            });
          },
          error: (err: any) => {
            this.logger.error('[eliminarArchivoSubido] ERROR eliminarArchivoSolicitud:', err);
            Swal.fire('Error', 'No se pudo eliminar el archivo', 'error');
          }
        });
      }
    });
  }

  getSolicitudesFiltradasCompleto() {
    return this.solicitudes
      // Estado
      .filter(s => !this.filtroEstado || s.estadoVisual === this.filtroEstado)
      // Expediente
      .filter(s => !this.filtroExpediente || `${s.numerodeexpediente}`.toLowerCase().includes(this.filtroExpediente.toLowerCase()))
      .sort((a, b) => {
        if (!a.fecha && !b.fecha) return 0;
        if (!a.fecha) return 1;
        if (!b.fecha) return -1;
        return b.fecha.localeCompare(a.fecha);
      });
  }

  esCumple(valor: any): boolean {
    if (valor === true || valor === 1) return true;
    if (typeof valor === 'string') {
      const v = valor.trim().toLowerCase();
      return v === 'true' || v === '1' || v === 'si' || v === 'sí' || v === 'cumple' || v === 'x';
    }
    return false;
  }

  esNoCumple(valor: any): boolean {
    if (valor === false || valor === 0) return true;
    if (typeof valor === 'string') {
      const v = valor.trim().toLowerCase();
      return v === 'false' || v === '0' || v === 'no' || v === 'no cumple';
    }
    return false;
  }

  getSolicitudesFiltradas() {
    const filtradas = this.getSolicitudesFiltradasCompleto();
    const inicio = (this.paginaActual - 1) * this.tamanioPagina;
    const fin = inicio + this.tamanioPagina;
    return filtradas.slice(inicio, fin);
  }

  getTotalPaginas() {
    return Math.ceil(this.getSolicitudesFiltradasCompleto().length / this.tamanioPagina);
  }

  irAPagina(pag: number) {
    this.paginaActual = pag;
  }

  guardarExpediente(s: any) {
    if (s.numerodeexpediente && !s.expedienteGuardado) {
      const datos = {
        id: s.id,
        numerodeexpediente: s.numerodeexpediente,
        modificadoPor: this.usuarioLogueado
      };
      this.logger.log('[guardarExpediente] payload:', datos);
      this.miService.editarSolicitudExpediente(datos).subscribe({
        next: () => {
          s.expedienteGuardado = true;
          s.expedienteEditado = false;
          Swal.fire('Éxito', 'N° Expediente guardado correctamente', 'success');
        },
        error: (err: any) => {
          this.logger.error('[guardarExpediente] ERROR:', err);
          Swal.fire('Error', 'Error al guardar el expediente', 'error');
        }
      });
    }
  }

  eliminarSolicitud(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.logger.log('[eliminarSolicitud] id:', id);
        this.miService.eliminarSolicitud(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'Solicitud eliminada correctamente', 'success');
            this.cargarSolicitudes();
          },
          error: (err: any) => {
            this.logger.error('[eliminarSolicitud] ERROR:', err);
            Swal.fire('Error', 'Error al eliminar la solicitud', 'error');
          }
        });
      }
    });
  }

  abrirModalEliminar(id: number) {
    this.idEliminar = id;
    this.motivoEliminar = '';
    this.motivoEliminarOtro = '';
    this.showModalEliminar = true;
  }

  confirmarEliminar() {
    let motivo = this.motivoEliminar === 'Otro' ? this.motivoEliminarOtro : this.motivoEliminar;
    if (this.idEliminar !== null) {
      this.logger.log('[confirmarEliminar] id:', this.idEliminar, 'motivo:', motivo);
      this.miService.eliminarSolicitud(this.idEliminar).subscribe({
        next: () => {
          this.showModalEliminar = false;
          this.idEliminar = null;
          this.cargarSolicitudes();
          Swal.fire('Eliminado', 'Solicitud eliminada. Motivo: ' + motivo, 'success');
        },
        error: (err: any) => {
          this.logger.error('[confirmarEliminar] ERROR:', err);
          Swal.fire('Error', 'No se pudo eliminar la solicitud', 'error');
        }
      });
    }
  }

  exportar() {
    // Exportar a CSV (método original)
    const columnas = this.exportarColumnasDisponibles;
    const encabezados = columnas.map(c => c.label);

    const seleccionados = this.getSolicitudesFiltradasCompleto().filter(s => s.seleccionado);

    const filas = (seleccionados.length > 0 ? seleccionados : this.getSolicitudesFiltradasCompleto())
      .map(s =>
        columnas.map(col => {
          if (col.key === 'fecha') {
            return s.fecha ? this.formatFechaExport(s.fecha) : '';
          }
          return s[col.key] !== undefined ? s[col.key] : '';
        })
      );

    let csvContent = encabezados.join(',') + '\n' + filas.map(f => f.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'reportes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async exportarExcel() {
    try {
      this.logger.log('[exportarExcel] Iniciando exportación a Excel...');
      
      const xlsx = await import('xlsx');
      const columnas = this.exportarColumnasDisponibles;
      const seleccionados = this.getSolicitudesFiltradasCompleto().filter(s => s.seleccionado);
      const datosParaExportar = (seleccionados.length > 0 ? seleccionados : this.getSolicitudesFiltradasCompleto());

      // Preparar datos para exportar
      const datosExportar = datosParaExportar.map((solicitud, index) => {
        const objeto: any = { '#': index + 1 };
        columnas.forEach(col => {
          if (col.key === 'fecha') {
            objeto[col.label] = solicitud.fecha ? this.formatFechaExport(solicitud.fecha) : '';
          } else {
            objeto[col.label] = solicitud[col.key] !== undefined ? solicitud[col.key] : '';
          }
        });
        return objeto;
      });

      // Crear hoja de trabajo
      const worksheet = xlsx.utils.json_to_sheet(datosExportar);
      
      // Ajustar anchos de columna
      const anchos = [{ wch: 5 }]; // Ancho para la columna #
      columnas.forEach(() => {
        anchos.push({ wch: 20 }); // Ancho predeterminado para cada columna
      });
      worksheet['!cols'] = anchos;
      
      // Crear libro de trabajo
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Solicitudes');
      
      // Agregar hoja de estadísticas
      const estadisticas = [
        { 'Métrica': 'Total Solicitudes', 'Valor': datosParaExportar.length },
        { 'Métrica': 'Solicitudes Seleccionadas', 'Valor': seleccionados.length },
        { 'Métrica': 'Fecha Exportación', 'Valor': new Date().toLocaleString('es-PE') }
      ];
      const worksheetStats = xlsx.utils.json_to_sheet(estadisticas);
      worksheetStats['!cols'] = [
        { wch: 30 },  // Métrica
        { wch: 30 }   // Valor
      ];
      xlsx.utils.book_append_sheet(workbook, worksheetStats, 'Estadísticas');
      
      // Exportar archivo
      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = `Reportes_Solicitudes_${fecha}.xlsx`;
      xlsx.writeFile(workbook, nombreArchivo);
      
      this.logger.log('[exportarExcel] ✅ Archivo Excel exportado:', nombreArchivo);
    } catch (error) {
      this.logger.error('[exportarExcel] Error al exportar:', error);
      alert('Error al exportar a Excel. Por favor, intenta de nuevo.');
    }
  }

  formatFechaExport(fecha: string | Date): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'numeric', year: 'numeric' }) +
      ', ' + d.toLocaleTimeString('es-PE');
  }

  async generarExcelDetalle() {
    const s = this.solicitudSeleccionada;
    if (!s) return;
    const xlsx = await import('xlsx');
    const FileSaver = await import('file-saver');
    const bold = { font: { bold: true } };
    const title = { font: { bold: true, color: { rgb: 'FF8000' }, sz: 14 } };
    const borderAll = { border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };
    const ws_data: any[][] = [];

    ws_data.push([{ v: 'DETALLE DE INSPECCIÓN', s: title }]);
    ws_data.push([{ v: 'Datos del Solicitante e Inspección', s: title }]);

    const datosSolicitante = [
      ['Solicitante', s.solicitante || s.nombres_apellidos || s.nombres || ''],
      ['DNI/CE', s.dni_ce || ''],
      ['Correo', s.correo || ''],
      ['Teléfonos', s.telefonos || ''],
      ['Fecha de Emisión', this.formatFechaExport(s.fecha)],
      ['N° Expediente', s.numerodeexpediente || ''],
      ['Inspector Asignado', s.inspector || s.inspector_asignado || ''],
      ['Tipo de Trámite', s.tipo_tramite || ''],
      ['Tipo ITSE', s.tipo_itse || '']
    ];
    datosSolicitante.forEach(fila => ws_data.push([{ v: fila[0], s: bold }, { v: fila[1], s: {} }]));

    ws_data.push([]);
    ws_data.push([{ v: 'Riesgos', s: title }]);

    const riesgos = [
      ['Riesgo Incendio', s.riesgo_incendio || ''],
      ['Detalle de Riesgo', s.riesgo_detalle || '']
    ];
    riesgos.forEach(fila => ws_data.push([{ v: fila[0], s: bold }, { v: fila[1], s: {} }]));

    ws_data.push([]);
    ws_data.push([{ v: 'Datos del Establecimiento', s: title }]);

    const establecimiento = [
      ['Razón Social', s.razon_social || ''],
      ['RUC', s.ruc || ''],
      ['Nombre Comercial', s.nombre_comercial || ''],
      ['Tel. Establecimiento', s.telefonos_establecimiento || ''],
      ['Dirección', s.direccion || ''],
      ['Referencia', s.referencia || ''],
      ['Localidad', s.localidad || ''],
      ['Distrito', s.distrito || ''],
      ['Provincia', s.provincia || ''],
      ['Departamento', s.departamento || ''],
      ['Giro/Actividades', s.giro_actividades || ''],
      ['Horario Atención', s.horario_atencion || ''],
      ['Área Ocupada', s.area_ocupada || ''],
      ['Número de Pisos', s.num_pisos || ''],
      ['Piso Ubicado', s.piso_ubicado || ''],
      ['Área Terreno', s.area_terreno || ''],
      ['Área Techada por Nivel', s.area_techada_por_nivel || ''],
      ['Área Libre', s.area_libre || ''],
      ['Latitud', s.latitud || ''],
      ['Longitud', s.longitud || '']
    ];
    establecimiento.forEach(fila => ws_data.push([{ v: fila[0], s: bold }, { v: fila[1], s: {} }]));

    if (s.archivos && s.archivos.length > 0) {
      ws_data.push([]);
      ws_data.push([{ v: 'Archivos Adjuntos', s: title }]);
      s.archivos.forEach((archivo: any, i: number) => {
        ws_data.push([{ v: `Archivo ${i + 1}`, s: bold }, { v: archivo.archivo_nombre || archivo.archivo_url || '', s: {} }]);
      });
    }

    const ws = xlsx.utils.aoa_to_sheet(ws_data);
    const maxWidth = ws_data.reduce((max, row) => Math.max(max, (row[1]?.v || '').toString().length), 20);
    // @ts-ignore
    ws['!cols'] = [{ wch: 24 }, { wch: maxWidth + 10 }];

    Object.keys(ws)
      .filter(cell => cell[0] !== '!' && (ws as any)[cell].v !== undefined)
      .forEach(cell => {
        (ws as any)[cell].s = { ...((ws as any)[cell].s || {}), ...borderAll };
      });

    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Detalle');
    const excelBuffer: any = xlsx.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
    const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(data, `DETALLE_INSPECCION_${s.numerodeexpediente || 'SIN_DATO'}.xlsx`);
  }

  abrirModalFinalizar(solicitud: any) {
    this.logger.log('[abrirModalFinalizar] id:', solicitud?.id);
    this.miService.obtenerSolicitudPorId(solicitud.id).subscribe({
      next: (solicitudActualizada: any) => {
        this.solicitudSeleccionada = solicitudActualizada;
        this.showModalFinalizar = true;
        this.finalizarChecks = {
          inspector: solicitudActualizada.check_inspector == 1,
          administrativo: solicitudActualizada.check_administrativo == 1,
          administrador: solicitudActualizada.check_administrador == 1
        };
        this.logger.log('[abrirModalFinalizar] finalizarChecks:', this.finalizarChecks);
        this.resolucionGenerada = false;
      },
      error: (err: any) => this.logger.error('[abrirModalFinalizar] ERROR obtenerSolicitudPorId:', err)
    });
  }

  cerrarModalFinalizar() {
    this.showModalFinalizar = false;
    this.solicitudSeleccionada = null;
    this.resolucionGenerada = false;
    this.finalizarChecks = { inspector: false, administrativo: false, administrador: false };
  }

  guardarCheckAdministrativo() {
    this.logger.log('[guardarCheckAdministrativo] seleccionada.id:', this.solicitudSeleccionada?.id, 'valor:', this.finalizarChecks.administrativo);
    this.miService.actualizarCheckAdministrativo(
      this.solicitudSeleccionada.id,
      this.finalizarChecks.administrativo ? 1 : 0
    ).subscribe({
      next: () => this.solicitudSeleccionada.check_administrativo = this.finalizarChecks.administrativo ? 1 : 0,
      error: (err: any) => this.logger.error('[guardarCheckAdministrativo] ERROR:', err)
    });
  }

  puedeFinalizar() {
    return this.finalizarChecks.inspector &&
      this.finalizarChecks.administrativo &&
      this.finalizarChecks.administrador;
  }

  aceptarMiCheck() {
    this.logger.log('[aceptarMiCheck] rol:', this.usuarioRol, 'checks:', this.finalizarChecks);
    
    // ✅ VALIDAR ORDEN SECUENCIAL
    if (this.usuarioRol === 'Administrativo') {
      // El Administrativo solo puede marcar si el Inspector ya marcó
      if (!this.finalizarChecks.inspector) {
        Swal.fire({
          icon: 'warning',
          title: 'Orden Secuencial',
          text: 'El Inspector debe aprobar primero antes de que puedas marcar tu check.',
          confirmButtonText: 'Entendido'
        });
        return;
      }
      
      this.miService.actualizarCheckAdministrativo(
        this.solicitudSeleccionada.id,
        this.finalizarChecks.administrativo ? 1 : 0
      ).subscribe({
        next: () => {
          this.cargarSolicitudes();
          this.showModalFinalizar = false;
          Swal.fire('Éxito', 'Check actualizado correctamente', 'success');
        },
        error: (err: any) => this.logger.error('[aceptarMiCheck] ERROR actualizarCheckAdministrativo:', err)
      });
    }
    
    if (this.usuarioRol === 'Administrador') {
      // El Administrador solo puede marcar si TANTO Inspector COMO Administrativo ya marcaron
      if (!this.finalizarChecks.inspector || !this.finalizarChecks.administrativo) {
        Swal.fire({
          icon: 'warning',
          title: 'Orden Secuencial',
          text: 'El Inspector y el Administrativo deben aprobar primero antes de que puedas marcar tu check.',
          confirmButtonText: 'Entendido'
        });
        return;
      }
      
      this.miService.actualizarCheckAdministrador(
        this.solicitudSeleccionada.id,
        this.finalizarChecks.administrador ? 1 : 0
      ).subscribe({
        next: () => {
          this.cargarSolicitudes();
          this.showModalFinalizar = false;
          Swal.fire('Éxito', 'Check actualizado correctamente', 'success');
        },
        error: (err: any) => this.logger.error('[aceptarMiCheck] ERROR actualizarCheckAdministrador:', err)
      });
    }
  }

  // ✅ FINALIZAR PROCESO - EL BACKEND MUEVE AUTOMÁTICAMENTE A LOCALES
  finalizarProceso() {
    if (!this.puedeFinalizar()) {
      Swal.fire('Error', 'Debes completar los tres checks para finalizar la solicitud', 'error');
      return;
    }
    
    // ✅ VALIDACIÓN: Verificar que tenga número de expediente
    if (!this.solicitudSeleccionada.numerodeexpediente || this.solicitudSeleccionada.numerodeexpediente === '') {
      Swal.fire({
        icon: 'error',
        title: 'Falta Número de Expediente',
        text: 'La solicitud debe tener un número de expediente asignado antes de poder finalizarla.',
        confirmButtonText: 'Entendido'
      });
      return;
    }
    
    this.logger.log('[finalizarProceso] Finalizando solicitud:', {
      id: this.solicitudSeleccionada.id,
      expediente: this.solicitudSeleccionada.numerodeexpediente
    });
    
    // Finalizar la solicitud (el backend se encarga de mover a locales automáticamente)
    this.miService.finalizarSolicitud(this.solicitudSeleccionada.id).subscribe({
      next: (response: any) => {
        this.logger.log('✅ [finalizarProceso] Respuesta del servidor:', response);
        
        this.resolucionGenerada = true;
        this.solicitudCertificado = { ...this.solicitudSeleccionada };
        this.showModalCertificado = true;
        this.cargarSolicitudes();
        this.showModalFinalizar = false;
        
        const mensaje = response.locales_upsert === 'inserted' 
          ? `Solicitud finalizada y registrada en Locales (Expediente: ${response.expediente})`
          : response.locales_upsert === 'updated'
          ? `Solicitud finalizada y actualizada en Locales (Expediente: ${response.expediente})`
          : 'Solicitud finalizada correctamente';
        
        Swal.fire('Éxito', mensaje, 'success');
      },
      error: (err: any) => {
        this.logger.error('[finalizarProceso] ERROR:', err);
        
        // Manejo específico del error de expediente
        if (err.error && err.error.needsExpediente) {
          Swal.fire({
            icon: 'error',
            title: 'Falta Número de Expediente',
            text: err.error.error || 'La solicitud debe tener un número de expediente para poder finalizarla.',
            confirmButtonText: 'Entendido'
          });
        } else {
          const errorMsg = err.error?.error || err.error?.detail || 'Error al finalizar la solicitud';
          Swal.fire('Error', errorMsg, 'error');
        }
      }
    });
  }

  cerrarModalCertificado() {
    this.showModalCertificado = false;
    this.solicitudCertificado = null;
  }

  async imprimirCertificado() {
    try {
      const certificado = this.solicitudCertificado;
      if (!certificado) {
        Swal.fire('Error', 'No hay información del certificado', 'error');
        return;
      }

      // Determinar la imagen de fondo según el nivel de riesgo
      const riesgo = (certificado.riesgo_incendio || certificado.nivelRiesgoSugerido || '').toUpperCase();
      let imagenFondo = 'assets/riesgo_medio_bajo.jpg'; // Por defecto
      
      if (riesgo === 'ALTO' || riesgo === 'MUY ALTO') {
        imagenFondo = 'assets/riesgo_alto_muyalto.jpg';
      }

      // Calcular fechas
      const fechaExpedicion = new Date();
      const fechaCaducidad = new Date(fechaExpedicion);
      fechaCaducidad.setFullYear(fechaCaducidad.getFullYear() + 2); // Vigencia de 2 años
      const fechaRenovacion = new Date(fechaCaducidad);
      fechaRenovacion.setDate(fechaRenovacion.getDate() - 60); // 2 meses antes

      const formatearFecha = (fecha: Date) => {
        const dia = String(fecha.getDate()).padStart(2, '0');
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const anio = fecha.getFullYear();
        return `${dia}/${mes}/${anio}`;
      };

      // Crear el PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Cargar la imagen de fondo
      const img = new Image();
      img.src = imagenFondo;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Agregar la imagen de fondo
      pdf.addImage(img, 'JPEG', 0, 0, 210, 297);

      // Configurar fuente
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);

      // NÚMERO DE CERTIFICADO (N° ___ N-20 ___)
      if (certificado.numero_certificado) {
        const partes = certificado.numero_certificado.split(' ');
        if (partes.length > 0) {
          pdf.text(partes[0] || '', 53, 53.5); // Primer número
        }
        if (partes.length > 1) {
          pdf.text(partes[1] || '', 118, 53.5); // Segundo número (N-20)
        }
        if (partes.length > 2) {
          pdf.text(partes[2] || '', 143, 53.5); // Tercer número
        }
      }

      // DIRECCIÓN COMPLETA DEL ÓRGANO (segunda línea del encabezado)
      const direccionOrganismo = 'AV. LA RIVERA NRO. 165 LA LIBERTAD TRUJILLO HUANCHACO';
      pdf.setFontSize(7);
      pdf.text(direccionOrganismo, 42, 71);

      // NOMBRE COMERCIAL
      pdf.setFontSize(8.5);
      const nombreComercial = (certificado.nombre_comercial || '').toUpperCase();
      pdf.text(nombreComercial, 42, 82.5);

      // DIRECCIÓN COMPLETA (Ubicado en)
      const direccionCompleta = `${certificado.direccion || ''} ${certificado.referencia || ''}`.trim().toUpperCase();
      pdf.text(direccionCompleta, 42, 92);

      // DISTRITO
      pdf.text((certificado.distrito || 'HUANCHACO').toUpperCase(), 42, 102.5);

      // PROVINCIA
      pdf.text((certificado.provincia || 'TRUJILLO').toUpperCase(), 42, 113);

      // DEPARTAMENTO
      pdf.text((certificado.departamento || 'LA LIBERTAD').toUpperCase(), 105, 113);

      // SOLICITANTE
      const solicitante = (certificado.solicitante || certificado.nombres_apellidos || '').toUpperCase();
      pdf.text(solicitante, 42, 123.5);

      // TIPO DE ESTABLECIMIENTO (después de "CERTIFICA que el Establecimiento...")
      const tipoEstablecimiento = (certificado.tipo_establecimiento || certificado.giro_actividades || '').toUpperCase();
      pdf.text(tipoEstablecimiento, 42, 141);

      // CAPACIDAD MÁXIMA (AFORO) - En número
      if (certificado.aforo_declarado) {
        pdf.text(`${certificado.aforo_declarado}`, 95, 150);
      }

      // GIRO O ACTIVIDAD
      const giro = (certificado.giro_actividades || '').toUpperCase();
      pdf.text(giro, 42, 163.5);

      // EXPEDIENTE N°
      if (certificado.numerodeexpediente) {
        pdf.text(certificado.numerodeexpediente, 42, 172.5);
      }

      // RESOLUCIÓN N°
      if (certificado.numero_resolucion) {
        pdf.text(certificado.numero_resolucion, 105, 172.5);
      }

      // LUGAR (después de VIGENCIA: 2 AÑOS)
      pdf.text('HUANCHACO', 105, 185);

      // ÁREA DE LA EDIFICACIÓN (m2)
      if (certificado.area_ocupada) {
        pdf.text(`${certificado.area_ocupada}`, 42, 195);
      }

      // FECHA DE EXPEDICIÓN
      pdf.text(formatearFecha(fechaExpedicion), 105, 195);

      // FECHA DE SOLICITUD DE RENOVACIÓN
      pdf.text(formatearFecha(fechaRenovacion), 105, 208);

      // FECHA DE CADUCIDAD
      pdf.text(formatearFecha(fechaCaducidad), 105, 220.5);

      // Guardar el PDF
      const nombreArchivo = `CERTIFICADO_ITSE_${certificado.numerodeexpediente || 'SIN_EXPEDIENTE'}.pdf`;
      pdf.save(nombreArchivo);

      Swal.fire({
        icon: 'success',
        title: 'Certificado Generado',
        text: `El certificado se ha descargado correctamente: ${nombreArchivo}`,
        confirmButtonText: 'Aceptar'
      });

    } catch (error) {
      this.logger.error('Error al generar certificado:', error);
      Swal.fire('Error', 'No se pudo generar el certificado. Verifica que las imágenes estén disponibles.', 'error');
    }
  }

  rechazarSolicitud() {
    if (this.solicitudSeleccionada) {
      this.logger.log('[rechazarSolicitud] id:', this.solicitudSeleccionada.id);
      this.miService.actualizarEstadoSolicitud(this.solicitudSeleccionada.id, 'Rechazada')
        .subscribe({
          next: () => {
            this.solicitudSeleccionada.estadoVisual = 'RECHAZADA';
            this.solicitudSeleccionada.estado = 'Rechazada';
            this.cerrarModalFinalizar();
            this.cargarSolicitudes();
            Swal.fire('Rechazada', 'La solicitud ha sido rechazada', 'info');
          },
          error: (err: any) => {
            this.logger.error('[rechazarSolicitud] ERROR:', err);
            Swal.fire('Error', 'No se pudo actualizar el estado en el servidor', 'error');
          }
        });
    }
  }

  abrirModalMotivoRechazo() {
    this.motivoRechazo = '';
    this.motivoRechazoOtro = '';
    this.showModalMotivoRechazo = true;
  }

  confirmarRechazo() {
    let motivofinal = this.motivoRechazo === 'Otro' ? this.motivoRechazoOtro : this.motivoRechazo;
    if (this.solicitudSeleccionada) {
      this.logger.log('[confirmarRechazo] id:', this.solicitudSeleccionada.id, 'motivo:', motivofinal);
      this.miService.actualizarEstadoSolicitud(
        this.solicitudSeleccionada.id,
        'Rechazada',
        motivofinal
      ).subscribe({
        next: () => {
          this.solicitudSeleccionada.estadoVisual = 'RECHAZADA';
          this.solicitudSeleccionada.estado = 'Rechazada';
          this.showModalMotivoRechazo = false;
          this.showModalFinalizar = false;
          this.cargarSolicitudes();
          Swal.fire('Rechazada', 'Solicitud rechazada. Motivo: ' + motivofinal, 'info');
        },
        error: (err: any) => {
          this.logger.error('[confirmarRechazo] ERROR:', err);
          Swal.fire('Error', 'No se pudo actualizar el estado en el servidor', 'error');
          this.showModalMotivoRechazo = false;
          this.showModalFinalizar = false;
        }
      });
    } else {
      this.showModalMotivoRechazo = false;
      this.showModalFinalizar = false;
    }
  }

  getEstadoClass(estado: string): string {
    if (!estado) return 'estado-default';
    const e = estado.toLowerCase();
    if (e.includes('proceso')) return 'estado-proceso';
    if (e.includes('finalizado')) return 'estado-finalizado';
    if (e.includes('rechaz')) return 'estado-rechazado';
    if (e.includes('aprob')) return 'estado-aprobado';
    if (e.includes('pendiente')) return 'estado-pendiente';
    return 'estado-default';
  }

  getRiesgoClass(riesgo: string): string {
    if (!riesgo) return '';
    const r = riesgo.toUpperCase();
    if (r.includes('BAJO')) return 'riesgo-bajo';
    if (r.includes('MEDIO')) return 'riesgo-medio';
    if (r.includes('ALTO') || r.includes('MUY ALTO')) return 'riesgo-alto';
    return '';
  }

  private formDataToObject(fd: FormData) {
    const obj: any = {};
    fd.forEach((value, key) => {
      if (obj[key] !== undefined) {
        if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
        obj[key].push(value instanceof File ? `File(name=${value.name}, size=${value.size})` : value);
      } else {
        obj[key] = value instanceof File ? `File(name=${value.name}, size=${value.size})` : value;
      }
    });
    return obj;
  }
}