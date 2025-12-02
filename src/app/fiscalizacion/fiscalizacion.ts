import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LogService } from '../service/log.service';
import { environment } from '../../environments/environment';

interface Fiscalizacion {
  id: number;
  numero_fiscalizacion: string;
  fecha_fiscalizacion: string;
  origen: string;
  expediente_relacionado?: string;
  razon_social: string;
  ruc?: string;
  direccion: string;
  giro?: string;
  inspector_id?: number;
  inspector_nombre?: string;
  tipo_infraccion: string;
  descripcion_infraccion: string;
  codigo_infraccion?: string;
  base_legal?: string;
  gravedad: string;
  acta_numero?: string;
  notificacion_numero?: string;
  monto_multa?: number;
  plazo_subsanacion?: number;
  medida_adoptada?: string;
  fecha_notificacion?: string;
  fecha_limite_subsanacion?: string;
  fecha_reinspeccion?: string;
  estado: string;
  resultado_final?: string;
  observaciones?: string;
  creado_por?: string;
  creado_en?: string;
  actualizado_en?: string;
  latitud?: number;
  longitud?: number;
}

interface Evidencia {
  id: number;
  fiscalizacion_id: number;
  nombre_archivo: string;
  ruta_archivo: string;
  tipo_archivo: string;
  tamanio_bytes: number;
  descripcion?: string;
  orden: number;
  subido_por?: string;
  subido_en: string;
}

@Component({
  selector: 'app-fiscalizacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fiscalizacion.html',
  styleUrls: ['./fiscalizacion.css']
})
export class FiscalizacionComponent implements OnInit {
  private apiUrl = `${environment.apiUrl}/api`;

  fiscalizaciones: Fiscalizacion[] = [];
  fiscalizacionesFiltradas: Fiscalizacion[] = [];
  fiscalizacionSeleccionada: Fiscalizacion | null = null;
  evidencias: Evidencia[] = [];
  
  mostrarModalCrear = false;
  mostrarModalDetalle = false;
  mostrarModalEditar = false;
  
  // Filtros
  filtroEstado = '';
  filtroOrigen = '';
  filtroInspector = '';
  filtroBusqueda = '';
  
  // Paginación
  paginaActual = 1;
  itemsPorPagina = 10;
  
  // Nueva fiscalización
  nuevaFiscalizacion: Partial<Fiscalizacion> = {};
  
  // Upload de evidencias
  archivosSeleccionados: FileList | null = null;
  
  // Estados y orígenes disponibles
  estados = ['Programada', 'En Ejecución', 'Ejecutada', 'Notificada', 'Subsanada', 'Multada', 'Cerrado'];
  origenes = ['Oficio', 'Denuncia', 'Post-ITSE', 'Operativo', 'Reinspección'];
  
  // Mapa y ubicación
  map: any;
  marker: any;
  selectedLat: number | null = null;
  selectedLng: number | null = null;
  mostrarMapa = false;
  gravedades = ['Leve', 'Grave', 'Muy Grave'];
  inspectores: any[] = [];

  // API de SUNAT
  // Nueva API de RENIEC y SUNAT
  private tokenCodart = 'LjdZV09v9zcxuPxjg0ATLE4oL72HOmROCpPsrVF0u5qU4OFJ3OLYBIR8DF5B';
  private apiCodartBase = 'https://api.codart.cgrt.net/api/v1/consultas';
  
  // API antigua (mantener como fallback)
  private tokenApisPeru = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFudG9uaWFob3JuYTZAZ21haWwuY29tIn0.eICLNsCmEB8CYuJ-6kvnabVno6LL8ah5q0RofZi-Wbw';
  
  // Selector de Locales Existentes
  mostrarSelectorLocales = false;
  localesDisponibles: any[] = [];
  busquedaLocal = '';
  
  // Mapa de Recorrido
  mostrarMapaRecorrido = false;
  fiscalizacionesSeleccionadas: number[] = [];
  mapaRecorrido: any = null;
  direccionesService: any = null;
  marcadoresRecorrido: any[] = [];
  polylineRecorrido: any = null;
  rutaCalculada = false; // Ahora solo indica que el mapa está listo
  distanciaTotal: number = 0; // Distancia total en km
  tiempoTotal: number = 0; // Tiempo total en minutos

  constructor(private http: HttpClient, private logger: LogService) {}

  ngOnInit() {
    // Verificar si viene desde el calendario con fecha prellenada
    const fechaPrellenada = sessionStorage.getItem('fechaFiscalizacionPrellenada');
    const inspectorPrellenado = sessionStorage.getItem('inspectorFiscalizacionPrellenado');
    
    if (fechaPrellenada) {
      // Si hay fecha prellenada, abrir modal de crear con fecha
      const fecha = new Date(fechaPrellenada);
      const fechaStr = fecha.toISOString().split('T')[0];
      const horaStr = fecha.toTimeString().split(' ')[0].substring(0, 5);
      
      this.nuevaFiscalizacion = {
        fecha_fiscalizacion: `${fechaStr}T${horaStr}`,
        origen: 'Oficio',
        gravedad: 'Leve',
        estado: 'Programada'
      };
      
      if (inspectorPrellenado) {
        this.nuevaFiscalizacion.inspector_id = parseInt(inspectorPrellenado);
      }
      
      this.mostrarModalCrear = true;
      sessionStorage.removeItem('fechaFiscalizacionPrellenada');
      sessionStorage.removeItem('inspectorFiscalizacionPrellenado');
    }
    
    this.cargarFiscalizaciones();
    this.cargarInspectores();
  }

  cargarFiscalizaciones() {
    this.http.get<Fiscalizacion[]>(`${this.apiUrl}/fiscalizaciones`).subscribe({
      next: (data) => {
        this.logger.log('Fiscalizaciones cargadas:', data);
        this.fiscalizaciones = data;
        this.aplicarFiltros();
      },
      error: (error) => {
        this.logger.error('Error al cargar fiscalizaciones:', error);
        alert('Error al cargar las fiscalizaciones');
      }
    });
  }

  cargarInspectores() {
    this.http.get<any[]>(`${this.apiUrl}/usuarios`).subscribe({
      next: (usuarios) => {
        this.inspectores = usuarios.filter(u => u.rol_id === 3); // Solo inspectores
      },
      error: (error) => {
        this.logger.error('Error al cargar inspectores:', error);
        }
      });
  }

  aplicarFiltros() {
    this.fiscalizacionesFiltradas = this.fiscalizaciones.filter(f => {
      const coincideEstado = !this.filtroEstado || f.estado === this.filtroEstado;
      const coincideOrigen = !this.filtroOrigen || f.origen === this.filtroOrigen;
      const coincideBusqueda = !this.filtroBusqueda || 
        f.razon_social?.toLowerCase().includes(this.filtroBusqueda.toLowerCase()) ||
        f.expediente_relacionado?.toLowerCase().includes(this.filtroBusqueda.toLowerCase()) ||
        f.ruc?.includes(this.filtroBusqueda) ||
        f.numero_fiscalizacion?.toLowerCase().includes(this.filtroBusqueda.toLowerCase());
      
      return coincideEstado && coincideOrigen && coincideBusqueda;
    });
    this.paginaActual = 1;
  }

  get fiscalizacionesPaginadas() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.fiscalizacionesFiltradas.slice(inicio, fin);
  }

  get totalPaginas() {
    return Math.ceil(this.fiscalizacionesFiltradas.length / this.itemsPorPagina);
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  abrirModalCrear() {
    this.nuevaFiscalizacion = {
      fecha_fiscalizacion: new Date().toISOString().split('T')[0],
      origen: 'Oficio',
      gravedad: 'Leve',
      estado: 'Programada'
    };
    this.mostrarModalCrear = true;
  }

  cerrarModalCrear() {
    this.mostrarModalCrear = false;
    this.nuevaFiscalizacion = {};
  }

  crearFiscalizacion() {
    if (!this.nuevaFiscalizacion.razon_social || !this.nuevaFiscalizacion.direccion || !this.nuevaFiscalizacion.tipo_infraccion || !this.nuevaFiscalizacion.descripcion_infraccion) {
      alert('Por favor complete los campos obligatorios: Razón Social, Dirección, Tipo de Infracción y Descripción');
      return;
    }

    const usuario = localStorage.getItem('usuario') || 'Sistema';
    this.nuevaFiscalizacion.creado_por = usuario;

    this.http.post<any>(`${this.apiUrl}/fiscalizaciones`, this.nuevaFiscalizacion).subscribe({
      next: () => {
        alert('Fiscalización creada exitosamente');
        this.cerrarModalCrear();
        this.cargarFiscalizaciones();
        
        // Si el mapa está abierto, actualizarlo
        if (this.mostrarMapaRecorrido) {
          setTimeout(() => {
            this.inicializarMapaRecorrido();
          }, 500);
        }
      },
      error: (error) => {
        this.logger.error('Error al crear fiscalización:', error);
        alert('Error al crear la fiscalización');
      }
    });
  }

  abrirModalDetalle(fiscalizacion: Fiscalizacion) {
    this.fiscalizacionSeleccionada = { ...fiscalizacion };
    
    // Convertir latitud y longitud a números si son strings
    if (this.fiscalizacionSeleccionada.latitud) {
      this.fiscalizacionSeleccionada.latitud = typeof this.fiscalizacionSeleccionada.latitud === 'string' 
        ? parseFloat(this.fiscalizacionSeleccionada.latitud) 
        : this.fiscalizacionSeleccionada.latitud;
    }
    if (this.fiscalizacionSeleccionada.longitud) {
      this.fiscalizacionSeleccionada.longitud = typeof this.fiscalizacionSeleccionada.longitud === 'string'
        ? parseFloat(this.fiscalizacionSeleccionada.longitud)
        : this.fiscalizacionSeleccionada.longitud;
    }
    
    this.logger.log('[abrirModalDetalle] Coordenadas:', {
      lat: this.fiscalizacionSeleccionada.latitud,
      lng: this.fiscalizacionSeleccionada.longitud,
      tipoLat: typeof this.fiscalizacionSeleccionada.latitud,
      tipoLng: typeof this.fiscalizacionSeleccionada.longitud
    });
    
    this.cargarEvidencias(fiscalizacion.id);
    this.mostrarModalDetalle = true;
  }

  cerrarModalDetalle() {
    this.mostrarModalDetalle = false;
    this.fiscalizacionSeleccionada = null;
    this.evidencias = [];
    this.archivosSeleccionados = null;
  }

  cargarEvidencias(fiscalizacionId: number) {
    this.http.get<Evidencia[]>(`${this.apiUrl}/fiscalizaciones/${fiscalizacionId}/evidencias`).subscribe({
      next: (data) => {
        this.evidencias = data;
      },
      error: (error) => {
        this.logger.error('Error al cargar evidencias:', error);
      }
    });
  }

  onFileSelected(event: any) {
    this.archivosSeleccionados = event.target.files;
    this.logger.log('[Frontend] Archivos seleccionados:', this.archivosSeleccionados);
    this.logger.log('[Frontend] Cantidad de archivos:', this.archivosSeleccionados?.length);
  }

  subirEvidencias() {
    this.logger.log('[Frontend] 🚀 Iniciando subida de evidencias');
    this.logger.log('[Frontend] fiscalizacionSeleccionada:', this.fiscalizacionSeleccionada);
    this.logger.log('[Frontend] archivosSeleccionados:', this.archivosSeleccionados);
    
    if (!this.fiscalizacionSeleccionada || !this.archivosSeleccionados || this.archivosSeleccionados.length === 0) {
      this.logger.error('[Frontend] ❌ Validación falló');
      alert('Por favor seleccione al menos un archivo');
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < this.archivosSeleccionados.length; i++) {
      this.logger.log(`[Frontend] 📎 Agregando archivo ${i + 1}:`, this.archivosSeleccionados[i].name);
      formData.append('evidencias', this.archivosSeleccionados[i], this.archivosSeleccionados[i].name);
    }

    const usuario = localStorage.getItem('usuario') || 'Sistema';
    formData.append('subido_por', usuario);
    
    this.logger.log('[Frontend] 📤 Enviando FormData al servidor');

    this.http.post(`${this.apiUrl}/fiscalizaciones/${this.fiscalizacionSeleccionada.id}/evidencias`, formData).subscribe({
      next: (response) => {
        this.logger.log('[Frontend] ✅ Respuesta del servidor:', response);
        alert('Evidencias subidas exitosamente');
        this.archivosSeleccionados = null;
        
        // Resetear el input file
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        if (this.fiscalizacionSeleccionada) {
          this.cargarEvidencias(this.fiscalizacionSeleccionada.id);
        }
      },
      error: (error) => {
        this.logger.error('[Frontend] ❌ Error completo:', error);
        this.logger.error('[Frontend] ❌ Error.error:', error.error);
        this.logger.error('[Frontend] ❌ Error.message:', error.message);
        alert('Error al subir las evidencias: ' + (error.error?.error || error.message));
      }
    });
  }

  eliminarEvidencia(evidenciaId: number) {
    if (!this.fiscalizacionSeleccionada || !confirm('¿Está seguro de eliminar esta evidencia?')) {
      return;
    }

    this.http.delete(`${this.apiUrl}/fiscalizaciones/${this.fiscalizacionSeleccionada.id}/evidencias/${evidenciaId}`).subscribe({
      next: () => {
        alert('Evidencia eliminada');
        if (this.fiscalizacionSeleccionada) {
          this.cargarEvidencias(this.fiscalizacionSeleccionada.id);
        }
      },
      error: (error) => {
        this.logger.error('Error al eliminar evidencia:', error);
        alert('Error al eliminar la evidencia');
      }
    });
  }

  generarActaPDF(fiscalizacion: Fiscalizacion) {
    window.open(`${this.apiUrl}/fiscalizaciones/${fiscalizacion.id}/pdf/acta`, '_blank');
  }

  generarNotificacionPDF(fiscalizacion: Fiscalizacion) {
    window.open(`${this.apiUrl}/fiscalizaciones/${fiscalizacion.id}/pdf/notificacion`, '_blank');
  }

  enviarAlerta(fiscalizacion: Fiscalizacion) {
    if (!confirm(`¿Enviar alerta de vencimiento para ${fiscalizacion.numero_fiscalizacion}?`)) {
      return;
    }

    this.http.post(`${this.apiUrl}/fiscalizaciones/${fiscalizacion.id}/enviar-alerta`, {}).subscribe({
      next: () => {
        alert('Alerta enviada exitosamente');
      },
      error: (error) => {
        this.logger.error('Error al enviar alerta:', error);
        alert('Error al enviar la alerta. La funcionalidad de email está temporalmente desactivada.');
      }
    });
  }

  abrirModalEditar(fiscalizacion: Fiscalizacion) {
    this.fiscalizacionSeleccionada = { ...fiscalizacion };
    this.mostrarModalEditar = true;
  }

  cerrarModalEditar() {
    this.mostrarModalEditar = false;
    this.fiscalizacionSeleccionada = null;
  }

  guardarFiscalizacion() {
    if (!this.fiscalizacionSeleccionada) {
      return;
    }

    this.http.put(`${this.apiUrl}/fiscalizaciones/${this.fiscalizacionSeleccionada.id}`, this.fiscalizacionSeleccionada).subscribe({
      next: () => {
        alert('Fiscalización actualizada exitosamente');
        this.cerrarModalEditar();
        this.cargarFiscalizaciones();
        
        // Si el mapa está abierto, actualizarlo
        if (this.mostrarMapaRecorrido) {
          setTimeout(() => {
            this.inicializarMapaRecorrido();
          }, 500);
        }
      },
      error: (error) => {
        this.logger.error('Error al actualizar fiscalización:', error);
        alert('Error al actualizar la fiscalización');
      }
    });
  }

  eliminarFiscalizacion(fiscalizacion: Fiscalizacion) {
    if (!confirm(`¿Está seguro de eliminar la fiscalización ${fiscalizacion.numero_fiscalizacion}?`)) {
      return;
    }

    this.http.delete(`${this.apiUrl}/fiscalizaciones/${fiscalizacion.id}`).subscribe({
      next: () => {
        alert('Fiscalización eliminada exitosamente');
        this.cargarFiscalizaciones();
      },
      error: (error) => {
        this.logger.error('Error al eliminar fiscalización:', error);
        alert('Error al eliminar la fiscalización');
      }
    });
  }

  // Utilidades de formato
  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return '-';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  formatearMoneda(monto: number | string | undefined): string {
    if (!monto) return 'S/ 0.00';
    const montoNum = typeof monto === 'string' ? parseFloat(monto) : monto;
    if (isNaN(montoNum)) return 'S/ 0.00';
    return `S/ ${montoNum.toFixed(2)}`;
  }

  getClaseGravedad(gravedad: string): string {
    switch (gravedad) {
      case 'Leve': return 'badge-leve';
      case 'Grave': return 'badge-grave';
      case 'Muy Grave': return 'badge-muy-grave';
      default: return 'badge-leve';
    }
  }

  getClaseEstado(estado: string): string {
    switch (estado) {
      case 'Programada': return 'badge-programada';
      case 'En Ejecución': return 'badge-ejecucion';
      case 'Ejecutada': return 'badge-ejecutada';
      case 'Notificada': return 'badge-notificada';
      case 'Subsanada': return 'badge-subsanada';
      case 'Multada': return 'badge-multada';
      case 'Cerrado': return 'badge-cerrado';
      default: return 'badge-programada';
    }
  }

  // ============================================
  // FUNCIONES DEL MAPA
  // ============================================
  
  abrirMapa() {
    this.logger.log('[abrirMapa] ========== INICIO ==========');
    this.logger.log('[abrirMapa] Estado actual - mostrarMapa:', this.mostrarMapa);
    this.logger.log('[abrirMapa] Abriendo modal del mapa...');
    
    this.mostrarMapa = true;
    this.logger.log('[abrirMapa] mostrarMapa cambiado a:', this.mostrarMapa);
    
    setTimeout(() => {
      this.logger.log('[abrirMapa] Timeout ejecutándose después de 300ms...');
      this.logger.log('[abrirMapa] Llamando a initMap()...');
      try {
        this.initMap();
      } catch (error) {
        this.logger.error('[abrirMapa] ❌ ERROR al inicializar mapa:', error);
        alert('Error al abrir el mapa: ' + error);
      }
    }, 300);
    
    this.logger.log('[abrirMapa] ========== FIN ==========');
  }

  cerrarMapa() {
    this.logger.log('[cerrarMapa] Cerrando modal del mapa');
    this.mostrarMapa = false;
  }

  initMap() {
    this.logger.log('[initMap] Iniciando inicialización del mapa...');
    
    // Verificar si Google Maps está disponible
    if (typeof (window as any).google === 'undefined' || typeof (window as any).google.maps === 'undefined') {
      this.logger.error('[initMap] ❌ Google Maps API no está cargada');
      alert('Error: Google Maps no está disponible. Recarga la página.');
      return;
    }
    
    this.logger.log('[initMap] ✓ Google Maps API está disponible');
    
    const center = { lat: -7.944536, lng: -79.145630 }; // Huanchaco
    this.logger.log('[initMap] Centro inicial:', center);
    
    // Si ya hay coordenadas guardadas, usar esas
    if (this.selectedLat && this.selectedLng) {
      center.lat = Number(this.selectedLat);
      center.lng = Number(this.selectedLng);
    } else if (this.nuevaFiscalizacion.latitud && this.nuevaFiscalizacion.longitud) {
      center.lat = Number(this.nuevaFiscalizacion.latitud);
      center.lng = Number(this.nuevaFiscalizacion.longitud);
      this.selectedLat = Number(this.nuevaFiscalizacion.latitud);
      this.selectedLng = Number(this.nuevaFiscalizacion.longitud);
    } else if (this.fiscalizacionSeleccionada?.latitud && this.fiscalizacionSeleccionada?.longitud) {
      center.lat = Number(this.fiscalizacionSeleccionada.latitud);
      center.lng = Number(this.fiscalizacionSeleccionada.longitud);
      this.selectedLat = Number(this.fiscalizacionSeleccionada.latitud);
      this.selectedLng = Number(this.fiscalizacionSeleccionada.longitud);
    }

    const mapElement = document.getElementById('mapa-fiscalizacion');
    this.logger.log('[initMap] Elemento del mapa:', mapElement);
    
    if (!mapElement) {
      this.logger.error('[initMap] ❌ No se encontró el elemento #mapa-fiscalizacion');
      alert('Error: No se encontró el contenedor del mapa');
      return;
    }
    
    try {
      this.logger.log('[initMap] Creando instancia de Google Maps...');
      this.map = new (window as any).google.maps.Map(mapElement, {
        center,
        zoom: 15
      });
      this.logger.log('[initMap] ✓ Mapa creado exitosamente');
    } catch (error) {
      this.logger.error('[initMap] ❌ Error al crear el mapa:', error);
      alert('Error al inicializar el mapa: ' + error);
      return;
    }

    // Agregar marcador si ya hay coordenadas
    if (this.selectedLat && this.selectedLng) {
      this.logger.log('[initMap] Agregando marcador en coordenadas guardadas:', this.selectedLat, this.selectedLng);
      this.marker = new (window as any).google.maps.Marker({
        position: { lat: this.selectedLat, lng: this.selectedLng },
        map: this.map,
        title: 'Ubicación seleccionada',
        draggable: true
      });

      // Actualizar coordenadas al arrastrar el marcador
      this.marker.addListener('dragend', (event: any) => {
        this.selectedLat = Number(event.latLng.lat());
        this.selectedLng = Number(event.latLng.lng());
      });
    }

    // Agregar marcador al hacer clic en el mapa
    this.logger.log('[initMap] Agregando listener de click al mapa...');
    this.map.addListener('click', (event: any) => {
      this.logger.log('[mapa click] Click en el mapa, coordenadas:', event.latLng.lat(), event.latLng.lng());
      this.selectedLat = Number(event.latLng.lat());
      this.selectedLng = Number(event.latLng.lng());

      if (this.marker) {
        this.logger.log('[mapa click] Marcador existente, actualizando posición');
        this.marker.setPosition(event.latLng);
      } else {
        this.logger.log('[mapa click] Creando nuevo marcador');
        this.marker = new (window as any).google.maps.Marker({
          position: event.latLng,
          map: this.map,
          title: 'Ubicación seleccionada',
          draggable: true,
          animation: (window as any).google.maps.Animation.DROP,
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
          }
        });
        this.logger.log('[mapa click] ✓ Marcador creado');

        this.marker.addListener('dragend', (e: any) => {
          this.logger.log('[marcador dragend] Nueva posición:', e.latLng.lat(), e.latLng.lng());
          this.selectedLat = Number(e.latLng.lat());
          this.selectedLng = Number(e.latLng.lng());
        });
      }
    });
    
    this.logger.log('[initMap] ✅ Mapa inicializado completamente');
  }

  guardarUbicacion() {
    this.logger.log('[guardarUbicacion] Guardando ubicación:', this.selectedLat, this.selectedLng);
    if (this.selectedLat !== null && this.selectedLng !== null) {
      this.nuevaFiscalizacion.latitud = Number(this.selectedLat);
      this.nuevaFiscalizacion.longitud = Number(this.selectedLng);
      
      if (this.fiscalizacionSeleccionada) {
        this.fiscalizacionSeleccionada.latitud = Number(this.selectedLat);
        this.fiscalizacionSeleccionada.longitud = Number(this.selectedLng);
      }
      
      this.cerrarMapa();
      alert(`Ubicación guardada:\nLatitud: ${this.selectedLat.toFixed(6)}\nLongitud: ${this.selectedLng.toFixed(6)}`);
    } else {
      alert('Por favor selecciona una ubicación en el mapa');
    }
  }

  obtenerEnlaceGoogleMaps(lat: number | undefined, lng: number | undefined): string {
    this.logger.log('[obtenerEnlaceGoogleMaps] Recibido:', { lat, lng, tipoLat: typeof lat, tipoLng: typeof lng });
    
    if (!lat || !lng) {
      this.logger.log('[obtenerEnlaceGoogleMaps] Coordenadas inválidas, retornando #');
      return '#';
    }
    
    // Convertir a número si es string
    const latNum = typeof lat === 'string' ? parseFloat(lat) : lat;
    const lngNum = typeof lng === 'string' ? parseFloat(lng) : lng;
    
    if (isNaN(latNum) || isNaN(lngNum)) {
      this.logger.log('[obtenerEnlaceGoogleMaps] Conversión a número falló');
      return '#';
    }
    
    const url = `https://www.google.com/maps?q=${latNum},${lngNum}`;
    this.logger.log('[obtenerEnlaceGoogleMaps] URL generada:', url);
    return url;
  }

  // ============================================
  // API DE SUNAT PARA RUC
  // ============================================
  
  consultarSunatPorRuc() {
    const ruc = this.nuevaFiscalizacion.ruc || this.fiscalizacionSeleccionada?.ruc;
    
    if (!ruc || !/^\d{11}$/.test(ruc)) {
      alert('Ingrese un RUC válido de 11 dígitos');
      return;
    }

    // Nueva API de SUNAT
    const url = `${this.apiCodartBase}/sunat/ruc/${ruc}`;
    const headers = { 'Authorization': `Bearer ${this.tokenCodart}` };
    
    this.logger.log('[consultarSunatPorRuc] Consultando:', ruc);
    
    this.http.get<any>(url, { headers }).subscribe({
      next: (resp) => {
        this.logger.log('[consultarSunatPorRuc] Respuesta:', resp);
        
        // Mapear respuesta de la nueva API
        let razonSocial = resp.razonSocial || resp.razon_social || resp.razonSocial || '';
        let direccion = resp.direccion || resp.direccionCompleta || resp.direccion_completa || '';
        
        // Si viene en un formato diferente
        if (resp.data) {
          razonSocial = resp.data.razonSocial || resp.data.razon_social || resp.data.razonSocial || '';
          direccion = resp.data.direccion || resp.data.direccionCompleta || resp.data.direccion_completa || '';
        }
        
        if (this.mostrarModalCrear) {
          // Estamos en el modal de crear
          if (razonSocial) this.nuevaFiscalizacion.razon_social = razonSocial;
          if (direccion) this.nuevaFiscalizacion.direccion = direccion;
          alert(`✓ Datos encontrados:\n${razonSocial || ''}`);
        } else if (this.mostrarModalEditar && this.fiscalizacionSeleccionada) {
          // Estamos en el modal de editar
          if (razonSocial) this.fiscalizacionSeleccionada.razon_social = razonSocial;
          if (direccion) this.fiscalizacionSeleccionada.direccion = direccion;
          alert(`✓ Datos encontrados:\n${razonSocial || ''}`);
        }
      },
      error: (error) => {
        this.logger.error('[consultarSunatPorRuc] Error:', error);
        alert('Error consultando el RUC. Verifica tu conexión.');
      }
    });
  }

  // ============================================
  // SELECTOR DE LOCALES EXISTENTES
  // ============================================
  
  abrirSelectorLocales() {
    this.mostrarSelectorLocales = true;
    this.busquedaLocal = '';
    this.cargarLocalesDisponibles();
  }

  cerrarSelectorLocales() {
    this.mostrarSelectorLocales = false;
    this.busquedaLocal = '';
  }

  cargarLocalesDisponibles() {
    this.http.get<any[]>(`${environment.apiUrl}/locales`).subscribe({
      next: (data) => {
        this.localesDisponibles = data;
        this.logger.log('Locales disponibles:', this.localesDisponibles.length);
      },
      error: (error) => {
        this.logger.error('Error al cargar locales:', error);
        alert('Error al cargar la lista de locales');
      }
    });
  }

  get localesFiltrados() {
    if (!this.busquedaLocal) return this.localesDisponibles;
    
    const termino = this.busquedaLocal.toLowerCase();
    return this.localesDisponibles.filter(local => 
      (local.expediente && local.expediente.toLowerCase().includes(termino)) ||
      (local.razon_social && local.razon_social.toLowerCase().includes(termino)) ||
      (local.ruc && local.ruc.includes(termino)) ||
      (local.direccion && local.direccion.toLowerCase().includes(termino))
    );
  }

  seleccionarLocal(local: any) {
    this.logger.log('Local seleccionado:', local);
    
    if (this.mostrarModalCrear) {
      // Copiar datos al formulario de nueva fiscalización
      this.nuevaFiscalizacion.razon_social = local.razon_social || '';
      this.nuevaFiscalizacion.ruc = local.ruc || '';
      this.nuevaFiscalizacion.direccion = local.direccion || '';
      this.nuevaFiscalizacion.giro = local.giro_negocio || '';
      
      // Si el local tiene coordenadas, copiarlas también
      if (local.latitud && local.longitud) {
        this.nuevaFiscalizacion.latitud = Number(parseFloat(local.latitud));
        this.nuevaFiscalizacion.longitud = Number(parseFloat(local.longitud));
        this.selectedLat = Number(this.nuevaFiscalizacion.latitud);
        this.selectedLng = Number(this.nuevaFiscalizacion.longitud);
      }
    } else if (this.mostrarModalEditar && this.fiscalizacionSeleccionada) {
      // Copiar datos al formulario de edición
      this.fiscalizacionSeleccionada.razon_social = local.razon_social || '';
      this.fiscalizacionSeleccionada.ruc = local.ruc || '';
      this.fiscalizacionSeleccionada.direccion = local.direccion || '';
      this.fiscalizacionSeleccionada.giro = local.giro_negocio || '';
      
      // Si el local tiene coordenadas, copiarlas también
      if (local.latitud && local.longitud) {
        this.fiscalizacionSeleccionada.latitud = Number(parseFloat(local.latitud));
        this.fiscalizacionSeleccionada.longitud = Number(parseFloat(local.longitud));
        this.selectedLat = Number(this.fiscalizacionSeleccionada.latitud);
        this.selectedLng = Number(this.fiscalizacionSeleccionada.longitud);
      }
    }
    
    this.cerrarSelectorLocales();
    alert(`✓ Datos copiados del local:\n${local.razon_social || local.expediente}`);
  }

  // ============================================
  // MAPA DE RECORRIDO OPTIMIZADO
  // ============================================

  toggleSeleccionFiscalizacion(fiscalizacionId: number) {
    const index = this.fiscalizacionesSeleccionadas.indexOf(fiscalizacionId);
    if (index > -1) {
      this.fiscalizacionesSeleccionadas.splice(index, 1);
    } else {
      this.fiscalizacionesSeleccionadas.push(fiscalizacionId);
    }
  }

  estaSeleccionada(fiscalizacionId: number): boolean {
    return this.fiscalizacionesSeleccionadas.includes(fiscalizacionId);
  }

  abrirMapaRecorrido() {
    this.mostrarMapaRecorrido = true;
    this.rutaCalculada = false;

    setTimeout(() => {
      this.inicializarMapaRecorrido();
    }, 300);
  }

  cerrarMapaRecorrido() {
    this.mostrarMapaRecorrido = false;
    this.mapaRecorrido = null;
    this.marcadoresRecorrido = [];
    if (this.polylineRecorrido) {
      this.polylineRecorrido.setMap(null);
    }
    this.polylineRecorrido = null;
    this.rutaCalculada = false;
  }

  inicializarMapaRecorrido() {
    if (typeof (window as any).google === 'undefined' || typeof (window as any).google.maps === 'undefined') {
      alert('Error: Google Maps no está disponible. Recarga la página.');
      return;
    }

    // Obtener TODAS las fiscalizaciones que tienen coordenadas (sin necesidad de seleccionar)
    const fiscalizacionesConCoordenadas = this.fiscalizaciones.filter(f => 
      f.latitud && 
      f.longitud
    );

    if (fiscalizacionesConCoordenadas.length === 0) {
      let mensaje = 'No hay fiscalizaciones con coordenadas GPS para mostrar.\n\n';
      mensaje += `Total de fiscalizaciones: ${this.fiscalizaciones.length}\n`;
      mensaje += `Con coordenadas: 0\n\n`;
      mensaje += 'Las fiscalizaciones deben tener coordenadas GPS (latitud y longitud) para aparecer en el mapa.\n';
      mensaje += 'Puedes agregar coordenadas al crear o editar una fiscalización usando el mapa.';
      
      alert(mensaje);
      return;
    }

    // Crear el mapa directamente con todas las que tienen coordenadas
    this.crearMapaConFiscalizaciones(fiscalizacionesConCoordenadas);
  }

  // Las fiscalizaciones deben tener coordenadas GPS previamente guardadas
  // No se geocodifica automáticamente - solo se usan las que ya tienen coordenadas

  actualizarCoordenadasFiscalizacion(fiscalizacionId: number, lat: number, lng: number) {
    // Primero obtener la fiscalización completa
    this.http.get(`${this.apiUrl}/fiscalizaciones/${fiscalizacionId}`).subscribe({
      next: (fisc: any) => {
        // Actualizar solo las coordenadas manteniendo todos los demás campos
        const fiscalizacionActualizada = {
          ...fisc,
          latitud: lat,
          longitud: lng
        };
        
        // Actualizar en la base de datos
        this.http.put(`${this.apiUrl}/fiscalizaciones/${fiscalizacionId}`, fiscalizacionActualizada).subscribe({
          next: () => {
            this.logger.log(`✅ Coordenadas actualizadas para fiscalización ${fiscalizacionId}`);
            // Actualizar también en el array local
            const index = this.fiscalizaciones.findIndex(f => f.id === fiscalizacionId);
            if (index !== -1) {
              this.fiscalizaciones[index].latitud = lat;
              this.fiscalizaciones[index].longitud = lng;
            }
          },
          error: (error) => {
            this.logger.error(`❌ Error al actualizar coordenadas:`, error);
            // No mostrar error al usuario, solo loguear
          }
        });
      },
      error: (error) => {
        this.logger.error(`❌ Error al obtener fiscalización para actualizar coordenadas:`, error);
      }
    });
  }

  crearMapaConFiscalizaciones(fiscalizacionesParaRecorrido: Fiscalizacion[]) {
    // Filtrar solo las que tienen coordenadas (ya deberían estar todas con coordenadas en este punto)
    const fiscalizacionesConCoordenadas = fiscalizacionesParaRecorrido.filter(f => f.latitud && f.longitud);

    if (fiscalizacionesConCoordenadas.length === 0) {
      alert('No hay fiscalizaciones con coordenadas para mostrar en el mapa.');
      this.cerrarMapaRecorrido();
      return;
    }

    // Calcular centro del mapa
    const latitudes = fiscalizacionesConCoordenadas.map(f => Number(f.latitud));
    const longitudes = fiscalizacionesConCoordenadas.map(f => Number(f.longitud));
    const centroLat = latitudes.reduce((a, b) => a + b, 0) / latitudes.length;
    const centroLng = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;

    // Crear mapa
    const mapElement = document.getElementById('mapa-recorrido');
    if (!mapElement) {
      alert('Error: No se encontró el contenedor del mapa');
      return;
    }

    // Limpiar marcadores anteriores si existen
    if (this.marcadoresRecorrido.length > 0) {
      this.marcadoresRecorrido.forEach(item => {
        item.marker.setMap(null);
      });
      this.marcadoresRecorrido = [];
    }

    this.mapaRecorrido = new (window as any).google.maps.Map(mapElement, {
      center: { lat: centroLat, lng: centroLng },
      zoom: fiscalizacionesConCoordenadas.length === 1 ? 15 : 12, // Zoom más cercano si solo hay una
      mapTypeId: 'roadmap',
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    // Crear marcadores
    this.marcadoresRecorrido = [];
    fiscalizacionesConCoordenadas.forEach((fisc, index) => {
      const marker = new (window as any).google.maps.Marker({
        position: { lat: Number(fisc.latitud), lng: Number(fisc.longitud) },
        map: this.mapaRecorrido,
        label: {
          text: (index + 1).toString(),
          color: 'white',
          fontWeight: 'bold'
        },
        title: `${fisc.numero_fiscalizacion} - ${fisc.razon_social}`,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new (window as any).google.maps.Size(40, 40)
        }
      });

      // Info window
      const infoWindow = new (window as any).google.maps.InfoWindow({
        content: `
          <div style="padding: 10px;">
            <h3 style="margin: 0 0 10px 0; color: #1B5E5E;">${fisc.numero_fiscalizacion}</h3>
            <p style="margin: 5px 0;"><strong>Razón Social:</strong> ${fisc.razon_social}</p>
            <p style="margin: 5px 0;"><strong>Dirección:</strong> ${fisc.direccion}</p>
            <p style="margin: 5px 0;"><strong>Estado:</strong> ${fisc.estado}</p>
            <p style="margin: 5px 0;"><strong>Gravedad:</strong> ${fisc.gravedad}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(this.mapaRecorrido, marker);
      });

      this.marcadoresRecorrido.push({ marker, fiscalizacion: fisc });
    });

    // Ajustar el zoom para mostrar todos los marcadores
    if (this.marcadoresRecorrido.length > 0) {
      const bounds = new (window as any).google.maps.LatLngBounds();
      this.marcadoresRecorrido.forEach(item => {
        bounds.extend(item.marker.getPosition());
      });
      this.mapaRecorrido.fitBounds(bounds);
    }

    // Marcar como completado (sin ruta, solo marcadores)
    this.rutaCalculada = true;
    // Calcular distancia y tiempo estimado (aproximado basado en cantidad de puntos)
    this.distanciaTotal = 0; // No se calcula ruta real, se mantiene en 0
    this.tiempoTotal = 0; // No se calcula tiempo real, se mantiene en 0
  }

  // Función removida - ya no se calcula ruta, solo se muestran los marcadores

  limpiarSeleccion() {
    this.fiscalizacionesSeleccionadas = [];
  }

  seleccionarTodas() {
    if (this.fiscalizacionesSeleccionadas.length === this.fiscalizacionesFiltradas.length) {
      this.limpiarSeleccion();
    } else {
      this.fiscalizacionesSeleccionadas = this.fiscalizacionesFiltradas.map(f => f.id);
    }
  }

  get todasSeleccionadas(): boolean {
    return this.fiscalizacionesFiltradas.length > 0 && 
           this.fiscalizacionesSeleccionadas.length === this.fiscalizacionesFiltradas.length;
  }

  // Métodos helper para formatear coordenadas
  formatearCoordenada(valor: number | null | undefined): string {
    if (valor == null) return 'N/A';
    return valor.toFixed(6);
  }

  get latitudFormateada(): string {
    if (!this.fiscalizacionSeleccionada || this.fiscalizacionSeleccionada.latitud == null) {
      return 'N/A';
    }
    return this.fiscalizacionSeleccionada.latitud.toFixed(6);
  }

  get longitudFormateada(): string {
    if (!this.fiscalizacionSeleccionada || this.fiscalizacionSeleccionada.longitud == null) {
      return 'N/A';
    }
    return this.fiscalizacionSeleccionada.longitud.toFixed(6);
  }
}
