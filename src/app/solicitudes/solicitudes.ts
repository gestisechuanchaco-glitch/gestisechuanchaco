import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { LogService } from '../service/log.service';
import { environment } from '../../environments/environment';

declare var google: any;

type RiesgoIncendio = 'BAJO' | 'MEDIO' | 'ALTO' | 'MUY ALTO' | 'NO CLASIFICADO';
type ModalidadEcse = 'hasta3000' | 'mayor3000';

@Component({
  selector: 'app-solicitudes',
  templateUrl: './solicitudes.html',
  styleUrls: ['./solicitudes.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class SolicitudesComponent implements AfterViewInit {
  @ViewChild('mapaContainer') mapaContainer!: ElementRef;
  
  paginaActual: number = 1;

  // Página 1
  fechaInicioRegistro: Date | null = null;
  rolSeleccionado: string = '';
  nombres_apellidos: string = '';
  dni_ce: string = '';
  domicilio: string = '';
  correo: string = '';
  telefonos: string = '';
  errorPagina1: string = '';
  // Consentimiento notificación WhatsApp
  whatsappConsent: boolean = false;
  whatsappAlternate: string = '';
  whatsappUse: 'solicitante' | 'alterno' = 'solicitante';

  // Página 2
  tipoTramite: string = '';
  tipoItse: string = '';
  tipoEcse: string = '';
  razon_social: string = '';
  ruc: string = '';
  nombre_comercial: string = '';
  telefonos_establecimiento: string = '';
  direccion: string = '';
  referencia: string = '';
  localidad: string = '';
  distrito: string = 'HUANCHACO';
  provincia: string = 'TRUJILLO';
  departamento: string = 'LA LIBERTAD';
  errorPagina2: string = '';
  horaApertura: string = '';
  horaCierre: string = '';

  // COORDENADAS DEL MAPA
  latitud: number | null = null;
  longitud: number | null = null;
  latitudTemp: number | null = null;
  longitudTemp: number | null = null;
  showModalMapa: boolean = false;
  mapaGoogle: any = null;
  marcador: any = null;

  // RENOVACIÓN
  busquedaRenovacion: string = '';
  solicitudesEncontradas: any[] = [];
  solicitudSeleccionadaRenovacion: any = null;
  private searchTimeout: any;

  // Página 3 (técnicos)
  giroSeleccionado: string = '';
  actividadEspecifica: string = '';
  horarioAtencion: string = '';
  areaOcupada: number | null = null;
  numPisos: number | null = null;
  pisoUbicado: string = '';
  areaTerreno: number | null = null;
  areasTechadasPorNivel: number[] = [];
  areaLibre: number | null = null;
  antiguedadEdificacion: number | null = null;
  antiguedadActividad: number | null = null;
  errorPagina3: string = '';
  pisosUbicados: number[] = [];
  totalAreaTechada: number = 0;

  // Página 4
  nivelRiesgo: { riesgoIncendio: RiesgoIncendio; riesgoColapso: string; detalle: string } | null = null;
  nivelRiesgoPredicho: string = '';
  docsSeleccionados: { [doc: string]: boolean } = {};
  archivosPagina3: File[] = [];
  inspectorAsignado: string = '';
  errorPagina4: string = '';
  aforo_declarado: number | null = null;
  confiabilidad_ml: number | null = null;

  inspectores = [
    { usuario: 'Dcarranzal', nombres_completos: 'Ing. Denniz Paul Carranza Luna' },
    { usuario: 'DMmartinez', nombres_completos: 'Ing. David Martínez Reluz' },
    { usuario: 'Vmanuel', nombres_completos: 'Arq. Victor Manuel Ruiz Vásquez' }
  ];

  giros = [
    { value: '', label: '-- Selecciona --' },
    { value: 'salud', label: 'Salud' },
    { value: 'encuentro', label: 'Encuentro' },
    { value: 'hospedaje', label: 'Hospedaje' },
    { value: 'educacion', label: 'Educación' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'oficinas', label: 'Oficinas Administrativas' },
    { value: 'comercio', label: 'Comercio' },
    { value: 'almacen', label: 'Almacén' }
  ];

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

  showModalCertificado: boolean = false;
  solicitudCertificado: any = null;

  // Nueva API de RENIEC y SUNAT
  private tokenCodart = 'LjdZV09v9zcxuPxjg0ATLE4oL72HOmROCpPsrVF0u5qU4OFJ3OLYBIR8DF5B';
  private apiCodartBase = 'https://api.codart.cgrt.net/api/v1/consultas';
  
  // API antigua (mantener como fallback)
  private tokenApisPeru = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFudG9uaWFob3JuYTZAZ21haWwuY29tIn0.eICLNsCmEB8CYuJ-6kvnabVno6LL8ah5q0RofZi-Wbw';

  constructor(private http: HttpClient, private router: Router, private logger: LogService) {}

  ngOnInit() {
    // Verificar si viene desde el calendario con fecha prellenada
    const fechaPrellenada = sessionStorage.getItem('fechaPrellenada');
    const inspectorPrellenado = sessionStorage.getItem('inspectorPrellenado');
    
    if (fechaPrellenada) {
      this.fechaInicioRegistro = new Date(fechaPrellenada);
      sessionStorage.removeItem('fechaPrellenada'); // Limpiar después de usar
    } else if (!this.fechaInicioRegistro) {
      this.fechaInicioRegistro = new Date();
    }
    
    if (inspectorPrellenado) {
      // Buscar el inspector en la lista y asignarlo
      // El inspectorPrellenado puede ser un ID o un usuario
      const inspector = this.inspectores.find(i => i.usuario === inspectorPrellenado);
      if (inspector) {
        this.inspectorAsignado = inspector.nombres_completos || inspector.usuario;
      }
      sessionStorage.removeItem('inspectorPrellenado'); // Limpiar después de usar
    }
    
    this.cargarGoogleMaps();
  }

  ngAfterViewInit() {}

  // CARGAR GOOGLE MAPS API
  cargarGoogleMaps() {
    if (typeof google === 'undefined') {
      const script = document.createElement('script');
      script.src ='https://maps.googleapis.com/maps/api/js?key=AIzaSyDYNYcGvDFqLEXafXfP45G5ApLdvgdbm_o&callback=initMap';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }

  // ABRIR MODAL DEL MAPA
  abrirModalMapa() {
    this.showModalMapa = true;
    this.latitudTemp = this.latitud;
    this.longitudTemp = this.longitud;
    
    this.logger.log('🗺️ Abriendo modal del mapa...');
    this.logger.log('📍 Dirección ingresada:', this.direccion);
    this.logger.log('📍 Coordenadas previas:', this.latitud, this.longitud);
    
    setTimeout(() => {
      this.inicializarMapa();
    }, 500);
  }

  // INICIALIZAR GOOGLE MAPS
  inicializarMapa() {
    const lat = this.latitudTemp || -8.0833;
    const lng = this.longitudTemp || -79.0333;

    const mapOptions = {
      center: { lat, lng },
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      streetViewControl: false,
      mapTypeControl: true
    };

    this.mapaGoogle = new google.maps.Map(
      document.getElementById('mapa-container'),
      mapOptions
    );

    if (this.latitudTemp && this.longitudTemp) {
      this.logger.log('✅ Usando coordenadas guardadas:', this.latitudTemp, this.longitudTemp);
      this.marcador = new google.maps.Marker({
        position: { lat: this.latitudTemp, lng: this.longitudTemp },
        map: this.mapaGoogle,
        draggable: true
      });

      google.maps.event.addListener(this.marcador, 'dragend', (event: any) => {
        this.latitudTemp = event.latLng.lat();
        this.longitudTemp = event.latLng.lng();
      });
    } else if (this.direccion && this.direccion.trim() !== '') {
      // Si hay dirección pero no coordenadas, geocodificar la dirección
      this.logger.log('🔍 Geocodificando dirección:', this.direccion);
      setTimeout(() => {
        this.geocodificarDireccion();
      }, 500);
    } else {
      this.logger.log('ℹ️ No hay dirección ni coordenadas, mostrando mapa de Trujillo');
    }

    google.maps.event.addListener(this.mapaGoogle, 'click', (event: any) => {
      this.latitudTemp = event.latLng.lat();
      this.longitudTemp = event.latLng.lng();

      if (this.marcador) {
        this.marcador.setPosition(event.latLng);
      } else {
        this.marcador = new google.maps.Marker({
          position: event.latLng,
          map: this.mapaGoogle,
          draggable: true
        });

        google.maps.event.addListener(this.marcador, 'dragend', (e: any) => {
          this.latitudTemp = e.latLng.lat();
          this.longitudTemp = e.latLng.lng();
        });
      }
    });
  }

  // GEOCODIFICAR DIRECCIÓN (Buscar en el mapa)
  geocodificarDireccion() {
    if (!this.direccion || this.direccion.trim() === '') {
      return;
    }

    const geocoder = new google.maps.Geocoder();
    
    // Agregar "Trujillo, La Libertad, Perú" para mejor precisión
    const direccionCompleta = `${this.direccion}, Trujillo, La Libertad, Perú`;

    geocoder.geocode({ address: direccionCompleta }, (results: any, status: any) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        
        // Centrar el mapa en la ubicación encontrada
        this.mapaGoogle.setCenter(location);
        this.mapaGoogle.setZoom(17);

        // Actualizar coordenadas temporales
        this.latitudTemp = location.lat();
        this.longitudTemp = location.lng();

        // Crear o mover el marcador
        if (this.marcador) {
          this.marcador.setPosition(location);
        } else {
          this.marcador = new google.maps.Marker({
            position: location,
            map: this.mapaGoogle,
            draggable: true,
            animation: google.maps.Animation.DROP
          });

          google.maps.event.addListener(this.marcador, 'dragend', (e: any) => {
            this.latitudTemp = e.latLng.lat();
            this.longitudTemp = e.latLng.lng();
          });
        }

        // Mostrar un InfoWindow con la dirección encontrada
        const infoWindow = new google.maps.InfoWindow({
          content: `<div style="padding: 10px; font-family: 'Inter', sans-serif;">
                      <strong style="color: #1B5E5E;">📍 Ubicación Encontrada</strong><br/>
                      <span style="color: #64748B; font-size: 13px;">${results[0].formatted_address}</span>
                    </div>`
        });
        infoWindow.open(this.mapaGoogle, this.marcador);

        this.logger.log('✅ Dirección geocodificada:', results[0].formatted_address);
      } else {
        console.warn('⚠️ No se pudo geocodificar la dirección:', status);
        
        // Si no encuentra la dirección exacta, intentar solo con Trujillo
        geocoder.geocode({ address: 'Trujillo, La Libertad, Perú' }, (fallbackResults: any, fallbackStatus: any) => {
          if (fallbackStatus === 'OK' && fallbackResults && fallbackResults[0]) {
            const location = fallbackResults[0].geometry.location;
            this.mapaGoogle.setCenter(location);
            this.mapaGoogle.setZoom(13);
            this.logger.log('ℹ️ Centrando en Trujillo por defecto');
          }
        });
      }
    });
  }

  // GUARDAR UBICACIÓN DEL MAPA
  guardarUbicacion() {
    if (!this.latitudTemp || !this.longitudTemp) {
      alert('Por favor, marca una ubicación en el mapa');
      return;
    }

    this.latitud = this.latitudTemp;
    this.longitud = this.longitudTemp;
    this.logger.log('✅ Coordenadas guardadas:', this.latitud, this.longitud);
    this.cerrarModalMapa();
    alert('Ubicación guardada correctamente');
  }

  // CERRAR MODAL DEL MAPA
  cerrarModalMapa() {
    this.showModalMapa = false;
    this.latitudTemp = null;
    this.longitudTemp = null;
    this.mapaGoogle = null;
    this.marcador = null;
  }

  // BUSCAR SOLICITUDES ANTERIORES
  buscarSolicitudesAnteriores() {
    clearTimeout(this.searchTimeout);
    
    if (!this.busquedaRenovacion || this.busquedaRenovacion.trim().length < 3) {
      this.solicitudesEncontradas = [];
      return;
    }
    
    this.searchTimeout = setTimeout(() => {
      const query = this.busquedaRenovacion.trim().toLowerCase();
      
      this.http.get<any[]>(`${environment.apiUrl}/api/solicitudes`).subscribe({
        next: (solicitudes) => {
          this.solicitudesEncontradas = solicitudes.filter(s => 
            (s.razon_social && s.razon_social.toLowerCase().includes(query)) ||
            (s.numerodeexpediente && s.numerodeexpediente.toLowerCase().includes(query)) ||
            (s.ruc && s.ruc.includes(query))
          ).slice(0, 5);
        },
        error: (err) => {
          this.logger.error('Error buscando solicitudes:', err);
          this.solicitudesEncontradas = [];
        }
      });
    }, 300);
  }

  // SELECCIONAR SOLICITUD PARA RENOVAR
  seleccionarSolicitudRenovacion(solicitud: any) {
    this.solicitudSeleccionadaRenovacion = solicitud;
    this.solicitudesEncontradas = [];
    this.busquedaRenovacion = '';
    
    this.razon_social = solicitud.razon_social || '';
    this.ruc = solicitud.ruc || '';
    this.nombre_comercial = solicitud.nombre_comercial || '';
    this.telefonos_establecimiento = solicitud.telefonos_establecimiento || '';
    this.direccion = solicitud.direccion || '';
    this.referencia = solicitud.referencia || '';
    this.localidad = solicitud.localidad || '';
    this.distrito = solicitud.distrito || 'HUANCHACO';
    this.provincia = solicitud.provincia || 'TRUJILLO';
    this.departamento = solicitud.departamento || 'LA LIBERTAD';
    
    if (solicitud.latitud && solicitud.longitud) {
      this.latitud = parseFloat(solicitud.latitud);
      this.longitud = parseFloat(solicitud.longitud);
    }
    
    if (solicitud.horario_atencion) {
      const horarioMatch = solicitud.horario_atencion.match(/(\d{2}:\d{2})\s*a\s*(\d{2}:\d{2})/i);
      if (horarioMatch) {
        this.horaApertura = horarioMatch[1];
        this.horaCierre = horarioMatch[2];
      }
    }
    
    alert('✅ Datos del establecimiento cargados correctamente. Completa los datos del solicitante y técnicos.');
  }

  // LIMPIAR BÚSQUEDA Y EMPEZAR DESDE CERO
  limpiarBusqueda() {
    if (confirm('¿Estás seguro de empezar desde cero? Se borrarán los datos cargados.')) {
      this.solicitudSeleccionadaRenovacion = null;
      this.busquedaRenovacion = '';
      this.solicitudesEncontradas = [];
      
      this.razon_social = '';
      this.ruc = '';
      this.nombre_comercial = '';
      this.telefonos_establecimiento = '';
      this.direccion = '';
      this.referencia = '';
      this.localidad = '';
      this.latitud = null;
      this.longitud = null;
      this.horaApertura = '';
      this.horaCierre = '';
    }
  }

  consultarReniecPorDni() {
    if (!/^\d{8}$/.test(this.dni_ce)) {
      alert('Ingrese un DNI válido de 8 dígitos');
      return;
    }
    
    // Nueva API de RENIEC
    const url = `${this.apiCodartBase}/reniec/dni/${this.dni_ce}`;
    const headers = { 'Authorization': `Bearer ${this.tokenCodart}` };
    
    this.http.get<any>(url, { headers }).subscribe({
      next: (resp) => {
        // Mapear respuesta de la nueva API
        if (resp.error || resp.message) {
          alert('La API devolvió un error: ' + (resp.message || resp.error));
          this.nombres_apellidos = '';
          return;
        }
        
        // Intentar diferentes formatos de respuesta
        let nombres = resp.nombres || resp.nombre || resp.nombres_completos || '';
        let apellidoPaterno = resp.apellidoPaterno || resp.apellido_paterno || resp.paterno || '';
        let apellidoMaterno = resp.apellidoMaterno || resp.apellido_materno || resp.materno || '';
        
        // Si viene en un formato diferente
        if (resp.data) {
          nombres = resp.data.nombres || resp.data.nombre || '';
          apellidoPaterno = resp.data.apellidoPaterno || resp.data.apellido_paterno || resp.data.paterno || '';
          apellidoMaterno = resp.data.apellidoMaterno || resp.data.apellido_materno || resp.data.materno || '';
        }
        
        if (nombres && apellidoPaterno && apellidoMaterno) {
          this.nombres_apellidos = `${nombres} ${apellidoPaterno} ${apellidoMaterno}`;
        } else if (resp.nombreCompleto || resp.nombre_completo) {
          this.nombres_apellidos = resp.nombreCompleto || resp.nombre_completo;
        } else {
          alert('No se encontraron datos para ese DNI');
          this.nombres_apellidos = '';
        }
      },
      error: (err) => {
        console.error('Error consultando DNI:', err);
        alert('Error consultando el DNI. Verifica tu token y conexión a internet.');
        this.nombres_apellidos = '';
      }
    });
  }

  consultarSunatPorRuc() {
    if (!/^\d{11}$/.test(this.ruc)) {
      alert('Ingrese un RUC válido de 11 dígitos');
      return;
    }
    
    // Nueva API de SUNAT
    const url = `${this.apiCodartBase}/sunat/ruc/${this.ruc}`;
    const headers = { 'Authorization': `Bearer ${this.tokenCodart}` };
    
    this.http.get<any>(url, { headers }).subscribe({
      next: (resp) => {
        // Mapear respuesta de la nueva API
        let razonSocial = resp.razonSocial || resp.razon_social || resp.razonSocial || '';
        let nombreComercial = resp.nombreComercial || resp.nombre_comercial || resp.nombreComercial || '';
        let direccion = resp.direccion || resp.direccionCompleta || resp.direccion_completa || '';
        
        // Si viene en un formato diferente
        if (resp.data) {
          razonSocial = resp.data.razonSocial || resp.data.razon_social || resp.data.razonSocial || '';
          nombreComercial = resp.data.nombreComercial || resp.data.nombre_comercial || resp.data.nombreComercial || '';
          direccion = resp.data.direccion || resp.data.direccionCompleta || resp.data.direccion_completa || '';
        }
        
        if (razonSocial) this.razon_social = razonSocial;
        if (nombreComercial) this.nombre_comercial = nombreComercial;
        else this.nombre_comercial = '';
        if (direccion) this.direccion = direccion;
      },
      error: (err) => {
        console.error('Error consultando RUC:', err);
        alert('Error consultando el RUC. Verifica tu token y conexión.');
        this.razon_social = '';
        this.nombre_comercial = '';
        this.direccion = '';
      }
    });
  }

  onPisoUbicadoChange() {
    if (this.pisoUbicado && this.pisoUbicado.trim() !== '') {
      const items = this.pisoUbicado.split(',')
        .map(p => parseInt(p.trim(), 10))
        .filter((n, idx, arr) => !isNaN(n) && arr.indexOf(n) === idx);
      this.pisosUbicados = items;
      this.areasTechadasPorNivel = this.pisosUbicados.map((_, idx) =>
        typeof this.areasTechadasPorNivel[idx] === 'number' ? this.areasTechadasPorNivel[idx] : 0
      );
      this.calcularTotalAreaTechada();
    } else {
      this.pisosUbicados = [];
      this.areasTechadasPorNivel = [];
      this.totalAreaTechada = 0;
    }
  }

  onAreaTechadaChange() {
    this.calcularTotalAreaTechada();
  }

  calcularTotalAreaTechada() {
    this.totalAreaTechada = this.areasTechadasPorNivel.reduce((sum, val) => sum + (val || 0), 0);
  }

  onAntiguedadChange(tipo: 'edificacion' | 'actividad', valor: any) {
    const n = valor === '' || valor === null || valor === undefined ? null : Number(valor);
    if (n === null || Number.isNaN(n)) {
      if (tipo === 'edificacion') this.antiguedadEdificacion = null;
      else this.antiguedadActividad = null;
      return;
    }
    if (tipo === 'edificacion') this.antiguedadEdificacion = Math.max(0, Math.min(200, n));
    else this.antiguedadActividad = Math.max(0, Math.min(100, n));
  }

  validarPagina1(): boolean {
    if (!this.rolSeleccionado) { this.errorPagina1 = 'Selecciona el rol.'; return false; }
    if (!this.nombres_apellidos.trim()) { this.errorPagina1 = 'Nombres y apellidos son obligatorios.'; return false; }
    if (!/^\d{8}$/.test(this.dni_ce)) { this.errorPagina1 = 'DNI debe tener exactamente 8 números.'; return false; }
    if (!this.domicilio.trim()) { this.errorPagina1 = 'El domicilio es obligatorio.'; return false; }
    if (!this.correo.trim() || !this.correo.includes('@')) { this.errorPagina1 = 'Correo válido es obligatorio.'; return false; }
    if (!/^\d{9}$/.test(this.telefonos)) { this.errorPagina1 = 'Teléfono debe tener exactamente 9 números y solo números.'; return false; }
    this.errorPagina1 = '';
    return true;
  }

  validarPagina2(): boolean {
    if (!this.tipoTramite) { this.errorPagina2 = 'Selecciona el tipo de trámite.'; return false; }
    if (this.tipoTramite === 'itse' && !this.tipoItse) { this.errorPagina2 = 'Selecciona la modalidad ITSE.'; return false; }
    if (this.tipoTramite === 'ecse' && !this.tipoEcse) { this.errorPagina2 = 'Selecciona la modalidad ECSE.'; return false; }
    if (!this.razon_social.trim() || !this.ruc.trim() || !this.nombre_comercial.trim() || !this.telefonos_establecimiento.trim()) {
      this.errorPagina2 = 'Completa todos los campos obligatorios.'; return false;
    }
    if (!this.direccion.trim() || !this.referencia.trim()) { this.errorPagina2 = 'Completa todos los campos de ubicación.'; return false; }
    if (!this.localidad) { this.errorPagina2 = 'Selecciona la localidad.'; return false; }
    if (!this.horaApertura || !this.horaCierre) {
      this.errorPagina2 = 'Selecciona el horario de atención de inicio y fin.';  return false;
    }
    this.errorPagina2 = '';
    return true;
  }

  validarPagina3(): boolean {
    const tieneGiroOActividad = (!!this.giroSeleccionado && this.giroSeleccionado.trim() !== '') ||
                                (!!this.actividadEspecifica && this.actividadEspecifica.trim() !== '');
    if (!tieneGiroOActividad) {
      this.errorPagina3 = 'Indique el giro o la actividad específica del establecimiento.';
      return false;
    }

    if (!this.areaOcupada || !this.numPisos || !this.pisoUbicado.trim() ||
        !this.areaTerreno || !this.areaLibre) {
      this.errorPagina3 = 'Completa todos los campos obligatorios de la página.';
      return false;
    }

    if (!this.pisosUbicados.length ||
        this.areasTechadasPorNivel.length !== this.pisosUbicados.length ||
        this.areasTechadasPorNivel.some(area => area == null || area === undefined)) {
      this.errorPagina3 = 'Debes ingresar el área techada para cada piso ubicado.';
      return false;
    }

    if (this.antiguedadEdificacion != null && (this.antiguedadEdificacion < 0 || this.antiguedadEdificacion > 200)) {
      this.errorPagina3 = 'Antigüedad de la edificación debe estar entre 0 y 200 años.';
      return false;
    }
    if (this.antiguedadActividad != null && (this.antiguedadActividad < 0 || this.antiguedadActividad > 100)) {
      this.errorPagina3 = 'Antigüedad de la actividad comercial debe estar entre 0 y 100 años.';
      return false;
    }

    this.errorPagina3 = '';
    return true;
  }

  validarPagina4(): boolean {
    if (!this.inspectorAsignado) {
      this.errorPagina4 = 'Debes asignar un inspector.';
      return false;
    }
    this.errorPagina4 = '';
    return true;
  }

  siguientePagina() {
    if (this.paginaActual === 1 && !this.validarPagina1()) return;
    if (this.paginaActual === 2 && !this.validarPagina2()) return;
    if (this.paginaActual === 3 && !this.validarPagina3()) return;

    if (this.paginaActual === 3) {
      const body: any = {
        giro: this.giroSeleccionado || this.actividadEspecifica || '',
        area_ocupada: this.areaOcupada,
        num_pisos: this.numPisos,
        horario_atencion: this.horarioAtencion || (this.horaApertura && this.horaCierre ? `${this.horaApertura} a ${this.horaCierre}` : ''),
        area_terreno: this.areaTerreno,
        area_libre: this.areaLibre,
        antiguedad_edificacion: this.antiguedadEdificacion,
        antiguedad_actividad: this.antiguedadActividad
      };

      this.http.post<any>(`${environment.predictApiUrl}/predict/predict_riesgo`, body)
        .subscribe(resp => {
          this.nivelRiesgoPredicho = resp.nivel_riesgo;
          this.confiabilidad_ml = resp.confiabilidad_ml;
          this.nivelRiesgo = { riesgoIncendio: resp.nivel_riesgo, riesgoColapso: '', detalle: '' };
          this.paginaActual++;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, () => {
          alert('No se pudo predecir el riesgo automáticamente. Intenta más tarde.');
        });
    } else {
      if (this.paginaActual < 4) {
        this.paginaActual++;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  anteriorPagina() {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onFileChange(event: any, campo: string, origen: string) {
    const files = event.target.files;
    if (origen === 'pagina3') {
      this.archivosPagina3 = Array.from(files);
    }
  }

  onNumPisosChange() {
    if (this.numPisos && this.numPisos > 0) {
      this.areasTechadasPorNivel = Array(this.numPisos).fill(0).map((_, idx) =>
        typeof this.areasTechadasPorNivel[idx] === 'number'
          ? this.areasTechadasPorNivel[idx]
          : 0
      );
    } else {
      this.areasTechadasPorNivel = [];
    }
    this.pisoUbicado = '';
    this.pisosUbicados = [];
    this.totalAreaTechada = 0;
  }

  resetFormulario() {
    this.paginaActual = 1;
    this.rolSeleccionado = '';
    this.nombres_apellidos = '';
    this.dni_ce = '';
    this.domicilio = '';
    this.correo = '';
    this.telefonos = '';
    this.errorPagina1 = '';
    this.tipoTramite = '';
    this.tipoItse = '';
    this.tipoEcse = '';
    this.razon_social = '';
    this.ruc = '';
    this.nombre_comercial = '';
    this.telefonos_establecimiento = '';
    this.direccion = '';
    this.referencia = '';
    this.localidad = '';
    this.distrito = 'HUANCHACO';
    this.provincia = 'TRUJILLO';
    this.departamento = 'LA LIBERTAD';
    this.errorPagina2 = '';
    this.giroSeleccionado = '';
    this.actividadEspecifica = '';
    this.horarioAtencion = '';
    this.areaOcupada = null;
    this.numPisos = null;
    this.pisoUbicado = '';
    this.areasTechadasPorNivel = [];
    this.pisosUbicados = [];
    this.areaTerreno = null;
    this.areaLibre = null;
    this.antiguedadEdificacion = null;
    this.antiguedadActividad = null;
    this.errorPagina3 = '';
    this.totalAreaTechada = 0;
    this.nivelRiesgo = null;
    this.nivelRiesgoPredicho = '';
    this.docsSeleccionados = {};
    this.archivosPagina3 = [];
    this.inspectorAsignado = '';
    this.errorPagina4 = '';
    this.showModalCertificado = false;
    this.solicitudCertificado = null;
    this.fechaInicioRegistro = new Date();
    this.horaApertura = '';
    this.horaCierre = '';
    this.latitud = null;
    this.longitud = null;
    this.busquedaRenovacion = '';
    this.solicitudesEncontradas = [];
    this.solicitudSeleccionadaRenovacion = null;
  }

  onSubmit() {
    if (!this.validarPagina4()) return;

    if (this.horaApertura && this.horaCierre) {
      this.horarioAtencion = `${this.horaApertura} a ${this.horaCierre}`;
    }
    
    const formData = new FormData();

    // Página 1
    formData.append('rol', this.rolSeleccionado);
    formData.append('nombres_apellidos', this.nombres_apellidos);
    formData.append('dni_ce', this.dni_ce);
    formData.append('domicilio', this.domicilio);
    formData.append('correo', this.correo);
    formData.append('telefonos', this.telefonos);
    // Consentimiento WhatsApp (0/1)
    formData.append('whatsapp_consent', this.whatsappConsent ? '1' : '0');
    // Número de WhatsApp elegido y alterno (si lo indicó)
    const telefonoSolicitante = (this.telefonos || '').trim();
    const telefonoAlterno = (this.whatsappAlternate || '').trim();
    const elegido = this.whatsappUse === 'alterno' && /^\d{9}$/.test(telefonoAlterno)
      ? telefonoAlterno
      : telefonoSolicitante;
    formData.append('whatsapp_numero', elegido);
    if (telefonoAlterno) {
      formData.append('whatsapp_numero_alt', telefonoAlterno);
    }

    // Página 2
    formData.append('tipoTramite', this.tipoTramite);
    formData.append('tipoItse', this.tipoItse);
    formData.append('tipoEcse', this.tipoEcse);
    formData.append('razon_social', this.razon_social);
    formData.append('ruc', this.ruc);
    formData.append('nombre_comercial', this.nombre_comercial);
    formData.append('telefonos_establecimiento', this.telefonos_establecimiento);
    formData.append('direccion', this.direccion);
    formData.append('referencia', this.referencia);
    formData.append('localidad', this.localidad);
    formData.append('distrito', this.distrito);
    formData.append('provincia', this.provincia);
    formData.append('departamento', this.departamento);

    // ⭐ COORDENADAS - ENVÍO CORRECTO
    if (this.latitud !== null && this.latitud !== undefined) {
      const latStr = this.latitud.toString();
      formData.append('latitud', latStr);
      this.logger.log('📍 Agregando latitud al FormData:', latStr);
    } else {
      console.warn('⚠️ latitud es null o undefined, no se enviará');
    }

    if (this.longitud !== null && this.longitud !== undefined) {
      const lngStr = this.longitud.toString();
      formData.append('longitud', lngStr);
      this.logger.log('📍 Agregando longitud al FormData:', lngStr);
    } else {
      console.warn('⚠️ longitud es null o undefined, no se enviará');
    }

    // Página 3
    formData.append('giro_actividades', this.giroSeleccionado);
    formData.append('actividad_especifica', this.actividadEspecifica.trim());
    formData.append('horario_atencion', this.horarioAtencion);
    formData.append('area_ocupada', this.areaOcupada?.toString() || '');
    formData.append('num_pisos', this.numPisos?.toString() || '');
    formData.append('piso_ubicado', this.pisoUbicado);
    formData.append('area_terreno', this.areaTerreno?.toString() || '');
    formData.append('area_techada_por_nivel', this.totalAreaTechada.toString());
    formData.append('area_libre', this.areaLibre?.toString() || '');
    formData.append('antiguedad_edificacion_anios', this.antiguedadEdificacion?.toString() || '');
    formData.append('antiguedad_actividad_anios', this.antiguedadActividad?.toString() || '');

    // Página 4
    if (this.nivelRiesgo) {
      formData.append('riesgo_incendio', this.nivelRiesgo.riesgoIncendio);
      formData.append('riesgo_colapso', this.nivelRiesgo.riesgoColapso);
      formData.append('riesgo_detalle', this.nivelRiesgo.detalle);
    }
    formData.append('inspector_asignado', this.inspectorAsignado);
    formData.append('aforo_declarado', this.aforo_declarado?.toString() || '');

    // Confiabilidad ML
    if (this.confiabilidad_ml !== null) {
      formData.append('confiabilidad_ml', this.confiabilidad_ml.toString());
    }

    // Estado y fechas
    formData.append('estado', 'En Proceso');
    if (this.fechaInicioRegistro) {
      const yyyy = this.fechaInicioRegistro.getFullYear();
      const mm = String(this.fechaInicioRegistro.getMonth() + 1).padStart(2, '0');
      const dd = String(this.fechaInicioRegistro.getDate()).padStart(2, '0');
      const HH = String(this.fechaInicioRegistro.getHours()).padStart(2, '0');
      const MM = String(this.fechaInicioRegistro.getMinutes()).padStart(2, '0');
      const SS = String(this.fechaInicioRegistro.getSeconds()).padStart(2, '0');
      formData.append('fecha_inicio', `${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}`);
    }

    // ⭐ USUARIO QUE CREA LA SOLICITUD - CORREGIDO
    let usuarioLogueado = 'SIN DATOS';
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        usuarioLogueado = user.nombre_completo || user.nombres_apellidos || user.usuario || 'SIN DATOS';
      } catch (e) {
        this.logger.error('Error parseando user:', e);
        usuarioLogueado = localStorage.getItem('usuario') || 'SIN DATOS';
      }
    } else {
      usuarioLogueado = localStorage.getItem('usuario') || 'SIN DATOS';
    }

    this.logger.log('👤 Usuario que creó la solicitud:', usuarioLogueado);
    formData.append('creadoPor', usuarioLogueado);

    // Documentos seleccionados
    formData.append('docsSeleccionados', JSON.stringify(this.docsSeleccionados));

    // Archivos adjuntos
    for (const file of this.archivosPagina3) {
      formData.append('archivos', file, file.name);
    }

    // ⭐ DEBUG: Ver todo lo que se está enviando
    this.logger.log('📦 FormData completo:');
    formData.forEach((value, key) => {
      this.logger.log(`  ${key}:`, value);
    });

    // Enviar al backend
    this.http.post(`${environment.apiUrl}/api/solicitud`, formData).subscribe({
      next: (response: any) => {
        if (response.success) {
          alert('Solicitud guardada exitosamente');
          this.resetFormulario();
          this.router.navigate(['/reportes']);
        } else {
          alert('Error al guardar la solicitud: ' + (response.message || 'Error desconocido'));
        }
      },
      error: (err) => {
        this.logger.error('Error al guardar solicitud:', err);
        alert('Error al guardar la solicitud. Verifica la consola para más detalles.');
      }
    });
  }

  getNivelRiesgoClass(): string {
    if (!this.nivelRiesgo) return '';
    const nivel = this.nivelRiesgo.riesgoIncendio.toUpperCase();
    if (nivel.includes('BAJO')) return 'nivel-bajo';
    if (nivel.includes('MEDIO')) return 'nivel-medio';
    if (nivel.includes('ALTO')) return 'nivel-alto';
    if (nivel.includes('MUY ALTO')) return 'nivel-alto';
    return '';
  }

  getDocsRequeridos(): string[] {
    if (!this.nivelRiesgo) return [];
    const riesgo = this.nivelRiesgo.riesgoIncendio;
    if (this.tipoTramite === 'itse') {
      return this.getDocumentosITSE(riesgo);
    } else if (this.tipoTramite === 'ecse') {
      const modalidad: ModalidadEcse = this.tipoEcse === 'hasta3000' ? 'hasta3000' : 'mayor3000';
      return this.getDocumentosECSE(riesgo, modalidad);
    }
    return [];
  }

  getDocumentosITSE(riesgo: RiesgoIncendio): string[] {
    return this.documentosITSE[riesgo] || [];
  }

  getDocumentosECSE(riesgo: RiesgoIncendio, modalidad: ModalidadEcse): string[] {
    return this.documentosECSE[riesgo][modalidad] || [];
  }

  documentosITSE: Record<RiesgoIncendio, string[]> = {
    BAJO: [
      'DDJJ anexos 01, 02, 03, 04',
      'Croquis con medidas de áreas',
      'Certificado vigente de medición de resistencia del sistema de puesta a tierra',
      'Constancia de operatividad de extintores'
    ],
    MEDIO: [
      'DDJJ anexos 01, 02, 03, 04',
      'Croquis con medidas de áreas',
      'Certificado vigente de medición de resistencia del sistema de puesta a tierra',
      'Constancia de operatividad de extintores'
    ],
    ALTO: [
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
    ],
    'NO CLASIFICADO': [
      'Consultar con Defensa Civil para requisitos específicos'
    ]
  };

  documentosECSE: Record<RiesgoIncendio, Record<ModalidadEcse, string[]>> = {
    BAJO: {
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
    MEDIO: {
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
    ALTO: {
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
    },
    'NO CLASIFICADO': {
      hasta3000: [
        'Consultar con Defensa Civil para requisitos específicos'
      ],
      mayor3000: [
        'Consultar con Defensa Civil para requisitos específicos'
      ]
    }
  };
}