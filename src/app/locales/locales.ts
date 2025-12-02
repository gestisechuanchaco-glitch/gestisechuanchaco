import { Component, OnInit } from '@angular/core';
import { MlService } from '../service/mi.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { LogService } from '../service/log.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-locales',
  templateUrl: './locales.html',
  styleUrls: ['./locales.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class LocalesComponent implements OnInit {
  locales: any[] = [];
  localesFiltrados: any[] = [];
  paginados: any[] = [];
  
  // ⭐ FILTROS
  filtroExpediente = '';
  filtroAnio = '';
  filtroTipo = '';
  filtroRiesgo = '';
  filtroEstadoLicencia = '';
  filtroMes = '';

  // ⭐ PAGINACIÓN
  paginaActual = 1;
  itemsPorPagina = 5;
  totalPaginas = 1;

  // ⭐ MODAL DETALLE
  showModalDetalle = false;
  detalle: any = null;
  cargandoDetalle = false;
  errorDetalle = '';

  // ⭐ TABS DEL MODAL
  tabActiva: string = 'solicitante';
  Math = Math;

  // ⭐ MAPA DE LOCALES
  mostrarMapaLocales = false;
  mapaRecorrido: any = null;
  marcadoresRecorrido: any[] = [];
  rutaCalculada = false; // Indica que el mapa está listo

  constructor(private mlService: MlService, private logger: LogService) {}

  ngOnInit(): void {
    this.cargarLocales();
  }

  cargarLocales(): void {
    this.logger.log('[cargarLocales] Cargando locales...');
    this.mlService.obtenerLocales().subscribe({
      next: (data: any[]) => {
        this.logger.log('[cargarLocales] Locales recibidos:', data.length);
        this.locales = data.map((local: any) => ({
          ...local,
          // Asegurar que tipo_tramite esté disponible
          tipo_tramite: local.tipo || local.tipo_tramite || (local.riesgo === 'ECSE' ? 'ECSE' : 'ITSE'),
          // Formatear fecha de vigencia
          vigencia: local.vigencia ? this.formatearFecha(local.vigencia) : '',
          // Determinar si está vencido
          estado_licencia: this.calcularEstadoLicencia(local.vigencia, local.estado_licencia)
        }));
        this.filtrarLocales();
        
        // Si el mapa está abierto, actualizarlo
        if (this.mostrarMapaLocales) {
          setTimeout(() => {
            this.inicializarMapaLocales();
          }, 500);
        }
      },
      error: (err) => {
        this.logger.error('[cargarLocales] ERROR:', err);
        Swal.fire('Error', 'No se pudieron cargar los locales', 'error');
      }
    });
  }

  calcularEstadoLicencia(vigencia: string, estadoActual: string): string {
    if (!vigencia) return estadoActual || 'VIGENTE';
    
    const fechaVigencia = new Date(vigencia);
    const hoy = new Date();
    
    if (fechaVigencia < hoy) {
      return 'VENCIDO';
    }
    
    return estadoActual || 'VIGENTE';
  }

  formatearFecha(fecha: string | Date): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  // ⭐ FILTRAR LOCALES
  filtrarLocales(): void {
    this.localesFiltrados = this.locales.filter(local => {
      // Filtro por expediente
      if (this.filtroExpediente && !local.expediente?.toLowerCase().includes(this.filtroExpediente.toLowerCase())) {
        return false;
      }

      // Filtro por año
      if (this.filtroAnio && !local.expediente?.includes(this.filtroAnio)) {
        return false;
      }

      // Filtro por tipo
      if (this.filtroTipo && local.tipo_tramite?.toUpperCase() !== this.filtroTipo.toUpperCase()) {
        return false;
      }

      // Filtro por riesgo
      if (this.filtroRiesgo && local.riesgo?.toUpperCase() !== this.filtroRiesgo.toUpperCase()) {
        return false;
      }

      // Filtro por estado de licencia
      if (this.filtroEstadoLicencia && local.estado_licencia?.toUpperCase() !== this.filtroEstadoLicencia.toUpperCase()) {
        return false;
      }

      // Filtro por mes (extrae mes de vigencia)
      if (this.filtroMes && local.vigencia) {
        const mes = local.vigencia.split('-')[1];
        if (mes !== this.filtroMes) {
          return false;
        }
      }

      return true;
    });

    // Ordenar por fecha de vigencia descendente
    this.localesFiltrados.sort((a, b) => {
      if (!a.vigencia && !b.vigencia) return 0;
      if (!a.vigencia) return 1;
      if (!b.vigencia) return -1;
      return b.vigencia.localeCompare(a.vigencia);
    });

    this.calcularPaginacion();
    this.paginaActual = 1;
    this.paginar();
  }

  calcularPaginacion(): void {
    this.totalPaginas = Math.ceil(this.localesFiltrados.length / this.itemsPorPagina);
    if (this.totalPaginas === 0) this.totalPaginas = 1;
  }

  paginar(): void {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.paginados = this.localesFiltrados.slice(inicio, fin);
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.paginar();
  }

  irAPagina(pagina: number): void {
    this.cambiarPagina(pagina);
  }

  getPaginasArray(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  // ⭐ VER DETALLE (USA EL ENDPOINT CORREGIDO DEL BACKEND)
verDetalle(local: any): void {
  this.logger.log('[verDetalle] Buscando expediente:', local.expediente);
  
  if (!local.expediente) {
    Swal.fire('Error', 'Este local no tiene número de expediente', 'error');
    return;
  }

  this.cargandoDetalle = true;
  this.errorDetalle = '';
  this.showModalDetalle = true;
  this.tabActiva = 'solicitante';

  // ✅ USAR EL ENDPOINT QUE BUSCA AUTOMÁTICAMENTE LA SOLICITUD
  this.mlService.obtenerDetalleLocal(local.expediente).subscribe({
    next: (detalle: any) => {
      this.logger.log('[verDetalle] Detalle completo recibido:', detalle);
      
      // Si tiene archivos, procesarlos
      if (detalle.archivos && Array.isArray(detalle.archivos)) {
        detalle.archivos = detalle.archivos.map((archivo: any) => ({
          archivo_nombre: archivo.archivo_nombre || archivo.archivoNombre,
          archivo_url: archivo.archivo_url || archivo.archivoUrl
        }));
      }

      this.detalle = detalle;
      this.cargandoDetalle = false;
    },
    error: (err) => {
      this.logger.error('[verDetalle] ERROR:', err);
      this.errorDetalle = 'No se pudo cargar el detalle';
      this.cargandoDetalle = false;
      
      if (err.status === 404) {
        Swal.fire('Error', 'No se encontró la solicitud asociada a este local', 'error');
      } else {
        Swal.fire('Error', 'Error al cargar el detalle del local', 'error');
      }
    }
  });
}
  cerrarModalDetalle(): void {
    this.showModalDetalle = false;
    this.detalle = null;
    this.cargandoDetalle = false;
    this.errorDetalle = '';
    this.tabActiva = 'solicitante';
  }

  cambiarTab(tab: string): void {
    this.tabActiva = tab;
  }

  // ⭐ OBTENER URL DE ARCHIVO
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
    
    return url;
  }

  // ⭐ ENVIAR WHATSAPP
// Reemplaza únicamente el método enviarWhatsApp(local: any): void { ... } por este método mejorado.

enviarWhatsApp(local: any): void {
  this.logger.log('[enviarWhatsApp] inicio - local:', local);

  if (!local) {
    this.logger.error('[enviarWhatsApp] local es undefined');
    Swal.fire('Error', 'Registro inválido (local indefinido)', 'error');
    return;
  }

  const expediente = local.expediente;
  if (!expediente) {
    this.logger.error('[enviarWhatsApp] local.expediente es undefined', local);
    Swal.fire('Error', 'Este local no tiene número de expediente', 'warning');
    return;
  }

  this.logger.log('[enviarWhatsApp] expediente a consultar:', expediente);

  const handleSolicitud = (solicitud: any | null) => {
    try {
      this.logger.log('[enviarWhatsApp] procesando solicitud:', solicitud);

      // Prioridad: telefonos_establecimiento -> telefonos -> telefono
      const getRawPhone = (): string => {
        if (solicitud && typeof solicitud === 'object') {
          if (solicitud.telefonos_establecimiento && String(solicitud.telefonos_establecimiento).trim()) {
            return String(solicitud.telefonos_establecimiento).trim();
          }
          if (solicitud.telefonos && String(solicitud.telefonos).trim()) {
            return String(solicitud.telefonos).trim();
          }
          if (solicitud.telefono && String(solicitud.telefono).trim()) {
            return String(solicitud.telefono).trim();
          }
        }
        // fallback a local
        if (local && typeof local === 'object') {
          if ((local as any).telefonos_establecimiento && String((local as any).telefonos_establecimiento).trim()) {
            return String((local as any).telefonos_establecimiento).trim();
          }
          if ((local as any).telefonos && String((local as any).telefonos).trim()) {
            return String((local as any).telefonos).trim();
          }
          if ((local as any).telefono && String((local as any).telefono).trim()) {
            return String((local as any).telefono).trim();
          }
        }
        return '';
      };

      const rawPhone = getRawPhone();
      this.logger.log('[enviarWhatsApp] rawPhone obtenido:', rawPhone);

      if (!rawPhone) {
        this.logger.error('[enviarWhatsApp] No se encontró telefonos_establecimiento/telefonos en solicitud ni en local');
        Swal.fire('Error', 'No se pudo obtener el teléfono de contacto para esta solicitud', 'warning');
        return;
      }

      // Extraer secuencias de dígitos (7..15 dígitos)
      const matches = String(rawPhone).match(/\d{7,15}/g) ?? [];
      this.logger.log('[enviarWhatsApp] secuencias numéricas extraídas:', matches);

      if (matches.length === 0) {
        this.logger.error('[enviarWhatsApp] No se encontraron secuencias numéricas válidas en rawPhone:', rawPhone);
        Swal.fire('Número inválido', `No se encontraron números válidos en: "${rawPhone}"`, 'error');
        return;
      }

      // Tomar el PRIMERO (pides aceptar un solo número)
      const selectedRaw = matches[0];
      this.logger.log('[enviarWhatsApp] seleccionado (primer match):', selectedRaw);

      // Normalizar
      let digits = String(selectedRaw).replace(/\D+/g, '').replace(/^0+/, '');
      this.logger.log('[enviarWhatsApp] digits tras normalizar y quitar ceros:', digits);

      // Añadir prefijo por defecto si tiene 9 dígitos (Perú)
      const defaultCountry = '51';
      if (digits.length === 9) {
        digits = defaultCountry + digits;
        this.logger.log('[enviarWhatsApp] añadido prefijo por defecto ->', digits);
      }

      if (digits.length < 9) {
        this.logger.error('[enviarWhatsApp] número inválido después de normalizar:', digits);
        Swal.fire('Número inválido', `El teléfono seleccionado "${selectedRaw}" no es válido después de normalizar.`, 'error');
        return;
      }

      this.logger.log('[enviarWhatsApp] número final a usar:', digits);

      // Construir mensaje
      const solicitante = (solicitud && (solicitud.solicitante ?? solicitud.nombres_apellidos)) ?? (local.solicitante ?? '');
      const razonSocial = (solicitud && (solicitud.razon_social ?? null)) ?? (local.razon_social ?? '');
      const numCert = (solicitud && (solicitud.num_certificado ?? null)) ?? (local.num_certificado ?? '');
      const vigencia = (solicitud && (solicitud.vigencia ?? null)) ?? (local.vigencia ?? '');
      const estado = (solicitud && (solicitud.estado_licencia ?? null)) ?? (local.estado_licencia ?? '');

      const mensaje = [
        'Hola 👋',
        solicitante ? `Nombre: ${solicitante}` : null,
        expediente ? `Expediente: ${expediente}` : null,
        razonSocial ? `Razón social: ${razonSocial}` : null,
        numCert ? `N° Certificado: ${numCert}` : null,
        vigencia ? `Vigencia: ${vigencia}` : null,
        estado ? `Estado: ${estado}` : null,
        '',
        'Le escribimos desde Defensa Civil. Por favor confirmar la recepción de esta comunicación. Gracias.'
      ].filter(Boolean).join('\n');

      const mensajeCodificado = encodeURIComponent(mensaje);
      const url = `https://api.whatsapp.com/send?phone=${digits}&text=${mensajeCodificado}`;
      this.logger.log('[enviarWhatsApp] abriendo URL:', url);
      window.open(url, '_blank');

    } catch (procErr) {
      this.logger.error('[enviarWhatsApp] Error al procesar solicitud:', procErr);
      Swal.fire('Error', 'Ocurrió un error al preparar el mensaje de WhatsApp', 'error');
    }
  }; // end handleSolicitud

  // --------------- SECUENCIA DE LLAMADAS (intentos) ----------------
  // 1) Intentar obtenerDetalleLocal (el endpoint que usas en verDetalle)
  this.logger.log('[enviarWhatsApp] intentando obtenerDetalleLocal...');
  this.mlService.obtenerDetalleLocal(expediente).subscribe({
    next: (detalle) => {
      this.logger.log('[enviarWhatsApp] obtenerDetalleLocal SUCCESS');
      handleSolicitud(detalle);
    },
    error: (err1) => {
      this.logger.error('[enviarWhatsApp] obtenerDetalleLocal ERROR:', err1);

      // 2) Si falla, intentar obtenerDetallePorExpediente (otro endpoint que quizás exista)
      this.logger.log('[enviarWhatsApp] intentando obtenerDetallePorExpediente como fallback...');
      this.mlService.obtenerDetallePorExpediente(expediente).subscribe({
        next: (detalle2) => {
          this.logger.log('[enviarWhatsApp] obtenerDetallePorExpediente SUCCESS');
          handleSolicitud(detalle2);
        },
        error: (err2) => {
          this.logger.error('[enviarWhatsApp] obtenerDetallePorExpediente ERROR:', err2);

          // 3) Fallback final: usar los datos ya presentes en 'local'
          console.warn('[enviarWhatsApp] ambos endpoints fallaron. Usando datos del objeto local como fallback.');
          handleSolicitud(null); // handleSolicitud leerá desde local en ausencia de 'solicitud'
        }
      });
    }
  });
}
  // ⭐ VERIFICAR SI CUMPLE (PARA PANEL FOTOGRÁFICO)
  esCumple(valor: any): boolean {
    if (valor === true || valor === 1) return true;
    if (typeof valor === 'string') {
      const v = valor.trim().toLowerCase();
      return v === 'true' || v === '1' || v === 'si' || v === 'sí' || v === 'cumple' || v === 'x';
    }
    return false;
  }

  // ⭐ EXPORTAR A EXCEL
  async exportarExcel(): Promise<void> {
    const xlsx = await import('xlsx');
    const FileSaver = await import('file-saver');

    const datosExportar = this.localesFiltrados.map(local => ({
      'TIPO': local.tipo_tramite || local.tipo,
      'RIESGO': local.riesgo,
      'EXPEDIENTE': local.expediente,
      'SOLICITANTE': local.solicitante,
      'RAZÓN SOCIAL': local.razon_social,
      'N° RESOLUCIÓN': local.num_resolucion,
      'N° CERTIFICADO': local.num_certificado,
      'VIGENCIA': local.vigencia,
      'ESTADO LICENCIA': local.estado_licencia
    }));

    const ws = xlsx.utils.json_to_sheet(datosExportar);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Locales');

    const excelBuffer = xlsx.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(data, `Locales_${new Date().getTime()}.xlsx`);

    Swal.fire('Éxito', 'Excel exportado correctamente', 'success');
  }

  // ⭐ LIMPIAR FILTROS
  limpiarFiltros(): void {
    this.filtroExpediente = '';
    this.filtroAnio = '';
    this.filtroTipo = '';
    this.filtroRiesgo = '';
    this.filtroEstadoLicencia = '';
    this.filtroMes = '';
    this.filtrarLocales();
  }

  // ⭐ OBTENER AÑOS DISPONIBLES
  getAniosDisponibles(): string[] {
    const anios = new Set<string>();
    const anioActual = new Date().getFullYear();
    
    this.locales.forEach(local => {
      if (local.expediente) {
        // Buscar TODOS los números de 4 dígitos en el expediente
        const matches = local.expediente.match(/\d{4}/g);
        if (matches) {
          matches.forEach((match: string) => {
            const anio = parseInt(match, 10);
            // Solo agregar si es un año válido (entre 1900 y año actual + 10)
            if (anio >= 1900 && anio <= anioActual + 10) {
              anios.add(match);
            }
          });
        }
      }
    });
    
    return Array.from(anios).sort().reverse();
  }

  // ⭐ ESTILOS DINÁMICOS
  getEstadoClass(estado: string): string {
    if (!estado) return '';
    const e = estado.toLowerCase();
    if (e.includes('vigente') || e.includes('activo')) return 'estado-vigente';
    if (e.includes('vencido') || e.includes('expirado')) return 'estado-vencido';
    return '';
  }

  getRiesgoClass(riesgo: string): string {
    if (!riesgo) return '';
    const r = riesgo.toUpperCase();
    if (r.includes('BAJO')) return 'riesgo-bajo';
    if (r.includes('MEDIO')) return 'riesgo-medio';
    if (r.includes('ALTO') || r.includes('MUY ALTO')) return 'riesgo-alto';
    if (r === 'ECSE') return 'riesgo-ecse';
    return '';
  }

  // ============================================
  // MAPA DE LOCALES
  // ============================================

  abrirMapaLocales() {
    this.mostrarMapaLocales = true;
    this.rutaCalculada = false;

    // Esperar a que el modal se renderice completamente y Angular actualice la vista
    setTimeout(() => {
      // Verificar que el elemento existe antes de inicializar
      const mapElement = document.getElementById('mapa-locales');
      if (!mapElement) {
        this.logger.error('[abrirMapaLocales] El elemento mapa-locales no existe aún, esperando más...');
        setTimeout(() => {
          this.inicializarMapaLocales();
        }, 500);
      } else {
        this.inicializarMapaLocales();
      }
    }, 100);
  }

  cerrarMapaLocales() {
    this.mostrarMapaLocales = false;
    this.mapaRecorrido = null;
    this.marcadoresRecorrido = [];
    this.rutaCalculada = false;
  }

  inicializarMapaLocales() {
    this.logger.log('[inicializarMapaLocales] Iniciando...');
    
    // Verificar que el elemento existe
    const mapElement = document.getElementById('mapa-locales');
    if (!mapElement) {
      this.logger.error('[inicializarMapaLocales] El elemento mapa-locales no existe');
      alert('Error: No se encontró el contenedor del mapa. Intenta de nuevo.');
      return;
    }
    
    this.logger.log('[inicializarMapaLocales] Elemento encontrado:', mapElement);
    
    // Verificar Google Maps
    if (typeof (window as any).google === 'undefined' || typeof (window as any).google.maps === 'undefined') {
      this.logger.error('[inicializarMapaLocales] Google Maps no está disponible');
      alert('Error: Google Maps no está disponible. Recarga la página.');
      return;
    }

    this.logger.log('[inicializarMapaLocales] Google Maps disponible');
    this.logger.log('[inicializarMapaLocales] Total de locales:', this.locales.length);

    // Obtener TODOS los locales que tienen coordenadas
    const localesConCoordenadas = this.locales.filter(l => {
      const tieneCoords = l.latitud && l.longitud;
      if (tieneCoords) {
        this.logger.log(`[inicializarMapaLocales] Local con coordenadas: ${l.expediente} - Lat: ${l.latitud}, Lng: ${l.longitud}`);
      }
      return tieneCoords;
    });

    this.logger.log('[inicializarMapaLocales] Locales con coordenadas:', localesConCoordenadas.length);

    if (localesConCoordenadas.length === 0) {
      let mensaje = 'No hay locales con coordenadas GPS para mostrar.\n\n';
      mensaje += `Total de locales: ${this.locales.length}\n`;
      mensaje += `Con coordenadas: 0\n\n`;
      mensaje += 'Los locales deben tener coordenadas GPS (latitud y longitud) para aparecer en el mapa.\n';
      mensaje += 'Las coordenadas se obtienen de la solicitud asociada al local.';
      
      alert(mensaje);
      return;
    }

    // Crear el mapa directamente con todos los que tienen coordenadas
    this.crearMapaConLocales(localesConCoordenadas);
  }

  crearMapaConLocales(localesParaMapa: any[]) {
    this.logger.log('[crearMapaConLocales] Iniciando creación del mapa...');
    
    // Filtrar solo las que tienen coordenadas
    const localesConCoordenadas = localesParaMapa.filter(l => l.latitud && l.longitud);

    if (localesConCoordenadas.length === 0) {
      alert('No hay locales con coordenadas para mostrar en el mapa.');
      this.cerrarMapaLocales();
      return;
    }

    this.logger.log('[crearMapaConLocales] Locales a mostrar:', localesConCoordenadas.length);

    // Calcular centro del mapa
    const latitudes = localesConCoordenadas.map(l => Number(l.latitud));
    const longitudes = localesConCoordenadas.map(l => Number(l.longitud));
    const centroLat = latitudes.reduce((a, b) => a + b, 0) / latitudes.length;
    const centroLng = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;

    this.logger.log('[crearMapaConLocales] Centro calculado:', centroLat, centroLng);

    // Crear mapa - intentar varias veces si es necesario
    let mapElement = document.getElementById('mapa-locales');
    if (!mapElement) {
      this.logger.error('[crearMapaConLocales] No se encontró el elemento, intentando de nuevo...');
      // Esperar un poco más y volver a intentar
      setTimeout(() => {
        mapElement = document.getElementById('mapa-locales');
        if (!mapElement) {
          alert('Error: No se encontró el contenedor del mapa. Asegúrate de que el modal esté completamente cargado.');
          return;
        }
        this.continuarCreacionMapa(mapElement, localesConCoordenadas, centroLat, centroLng);
      }, 200);
      return;
    }

    this.continuarCreacionMapa(mapElement, localesConCoordenadas, centroLat, centroLng);
  }

  continuarCreacionMapa(mapElement: HTMLElement, localesConCoordenadas: any[], centroLat: number, centroLng: number) {
    this.logger.log('[continuarCreacionMapa] Creando mapa en elemento:', mapElement);
    this.logger.log('[continuarCreacionMapa] Dimensiones del elemento:', mapElement.offsetWidth, 'x', mapElement.offsetHeight);

    // Asegurar que el elemento tenga dimensiones
    if (mapElement.offsetWidth === 0 || mapElement.offsetHeight === 0) {
      this.logger.error('[continuarCreacionMapa] El elemento no tiene dimensiones, esperando...');
      setTimeout(() => {
        this.continuarCreacionMapa(mapElement, localesConCoordenadas, centroLat, centroLng);
      }, 300);
      return;
    }

    // Limpiar marcadores anteriores si existen
    if (this.marcadoresRecorrido.length > 0) {
      this.marcadoresRecorrido.forEach(item => {
        item.marker.setMap(null);
      });
      this.marcadoresRecorrido = [];
    }

    try {
      this.logger.log('[continuarCreacionMapa] Creando instancia de Google Map...');
      this.logger.log('[continuarCreacionMapa] Centro:', centroLat, centroLng);
      this.logger.log('[continuarCreacionMapa] Locales a mostrar:', localesConCoordenadas.length);
      
      // Forzar dimensiones del elemento
      mapElement.style.width = '100%';
      mapElement.style.height = '600px';
      mapElement.style.display = 'block';
      mapElement.style.visibility = 'visible';
      
      this.mapaRecorrido = new (window as any).google.maps.Map(mapElement, {
        center: { lat: centroLat, lng: centroLng },
        zoom: localesConCoordenadas.length === 1 ? 15 : 12,
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });
      
      this.logger.log('[continuarCreacionMapa] Mapa creado exitosamente');
      
      // Forzar resize después de un pequeño delay para asegurar que se renderice
      setTimeout(() => {
        if (this.mapaRecorrido) {
          (window as any).google.maps.event.trigger(this.mapaRecorrido, 'resize');
          this.logger.log('[continuarCreacionMapa] Resize del mapa activado');
        }
      }, 100);

      // Crear marcadores
      this.marcadoresRecorrido = [];
      localesConCoordenadas.forEach((local, index) => {
        // Obtener nombre del local (razón social o expediente)
        const nombreLocal = local.razon_social || local.expediente || `Local ${index + 1}`;
        // Limitar el nombre a 20 caracteres para que quepa en el label
        const nombreCorto = nombreLocal.length > 20 ? nombreLocal.substring(0, 17) + '...' : nombreLocal;
        
        const marker = new (window as any).google.maps.Marker({
          position: { lat: Number(local.latitud), lng: Number(local.longitud) },
          map: this.mapaRecorrido,
          label: {
            text: nombreCorto,
            color: '#1B5E5E',
            fontWeight: 'bold',
            fontSize: '12px'
          },
          title: `${local.expediente} - ${local.razon_social}`,
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new (window as any).google.maps.Size(40, 40)
          }
        });

      // Info window
      const infoWindow = new (window as any).google.maps.InfoWindow({
        content: `
          <div style="padding: 10px;">
            <h3 style="margin: 0 0 10px 0; color: #1B5E5E;">${local.expediente}</h3>
            <p style="margin: 5px 0;"><strong>Razón Social:</strong> ${local.razon_social || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Dirección:</strong> ${local.direccion || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Tipo:</strong> ${local.tipo || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Riesgo:</strong> ${local.riesgo || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Estado:</strong> ${local.estado_licencia || 'N/A'}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(this.mapaRecorrido, marker);
      });

      this.marcadoresRecorrido.push({ marker, local });
      this.logger.log(`[continuarCreacionMapa] Marcador ${index + 1} creado para ${local.expediente}`);
    });

    // Ajustar el zoom para mostrar todos los marcadores
    if (this.marcadoresRecorrido.length > 0) {
      const bounds = new (window as any).google.maps.LatLngBounds();
      this.marcadoresRecorrido.forEach(item => {
        bounds.extend(item.marker.getPosition());
      });
      this.mapaRecorrido.fitBounds(bounds);
      this.logger.log('[continuarCreacionMapa] Bounds ajustados');
    }

    // Marcar como completado
    this.rutaCalculada = true;
    this.logger.log('[continuarCreacionMapa] Mapa completado exitosamente');
    } catch (error) {
      this.logger.error('[continuarCreacionMapa] Error al crear el mapa:', error);
      alert('Error al crear el mapa. Revisa la consola para más detalles.');
    }
  }

  // ⭐ GENERAR EXCEL DETALLE
  async generarExcelDetalle(): Promise<void> {
    const s = this.detalle;
    if (!s) return;

    const xlsx = await import('xlsx');
    const FileSaver = await import('file-saver');
    
    const bold = { font: { bold: true } };
    const title = { font: { bold: true, color: { rgb: 'FF8000' }, sz: 14 } };
    const borderAll = { 
      border: { 
        top: { style: 'thin' }, 
        bottom: { style: 'thin' }, 
        left: { style: 'thin' }, 
        right: { style: 'thin' } 
      } 
    };
    
    const ws_data: any[][] = [];

    ws_data.push([{ v: 'DETALLE COMPLETO DEL LOCAL', s: title }]);
    ws_data.push([]);
    ws_data.push([{ v: 'Datos del Solicitante', s: title }]);

    const datosSolicitante = [
      ['Solicitante', s.nombres_apellidos || s.solicitante || ''],
      ['DNI/CE', s.dni_ce || ''],
      ['Correo', s.correo || ''],
      ['Teléfonos', s.telefonos || ''],
      ['N° Expediente', s.numerodeexpediente || s.expediente || ''],
      ['Inspector Asignado', s.inspector_asignado || s.inspector || '']
    ];
    datosSolicitante.forEach(fila => ws_data.push([{ v: fila[0], s: bold }, { v: fila[1], s: {} }]));

    ws_data.push([]);
    ws_data.push([{ v: 'Datos del Establecimiento', s: title }]);

    const establecimiento = [
      ['Razón Social', s.razon_social || ''],
      ['RUC', s.ruc || ''],
      ['Nombre Comercial', s.nombre_comercial || ''],
      ['Dirección', s.direccion || ''],
      ['Referencia', s.referencia || ''],
      ['Localidad', s.localidad || ''],
      ['Distrito', s.distrito || ''],
      ['Provincia', s.provincia || ''],
      ['Departamento', s.departamento || ''],
      ['Giro/Actividades', s.giro_actividades || ''],
      ['Horario Atención', s.horario_atencion || ''],
      ['Aforo Declarado', s.aforo_declarado || '']
    ];
    establecimiento.forEach(fila => ws_data.push([{ v: fila[0], s: bold }, { v: fila[1], s: {} }]));

    ws_data.push([]);
    ws_data.push([{ v: 'Certificación', s: title }]);

    const certificacion = [
      ['Tipo de Trámite', s.tipo_tramite || ''],
      ['Riesgo', s.riesgo_incendio || s.riesgo || ''],
      ['N° Resolución', s.num_resolucion || ''],
      ['N° Certificado', s.num_certificado || ''],
      ['Vigencia', s.vigencia || ''],
      ['Estado Licencia', s.estado_licencia || '']
    ];
    certificacion.forEach(fila => ws_data.push([{ v: fila[0], s: bold }, { v: fila[1], s: {} }]));

    const ws = xlsx.utils.aoa_to_sheet(ws_data);
    const maxWidth = ws_data.reduce((max, row) => Math.max(max, (row[1]?.v || '').toString().length), 20);
    // @ts-ignore
    ws['!cols'] = [{ wch: 30 }, { wch: maxWidth + 10 }];

    Object.keys(ws)
      .filter(cell => cell[0] !== '!' && (ws as any)[cell].v !== undefined)
      .forEach(cell => {
        (ws as any)[cell].s = { ...((ws as any)[cell].s || {}), ...borderAll };
      });

    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Detalle');
    const excelBuffer: any = xlsx.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
    const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(data, `DETALLE_LOCAL_${s.expediente || 'SIN_DATO'}.xlsx`);
  }
}