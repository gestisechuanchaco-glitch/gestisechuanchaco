import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LogService } from '../service/log.service';
import { MlService } from '../service/mi.service';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';

interface CalendarioEvento {
  id: string;
  title: string;
  start: string;
  end?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps?: {
    tipo: string;
    id_original: number;
    descripcion?: string;
    estado?: string;
    inspector?: string;
    direccion?: string;
    expediente?: string;
    gravedad?: string;
    dias_restantes?: number;
    plazo_subsanacion?: number;
    razon_social?: string;
  };
}

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule],
  templateUrl: './calendario.html',
  styleUrls: ['./calendario.css']
})
export class CalendarioComponent implements OnInit {
  private apiUrl = 'http://localhost:3000/api';
  
  eventos: CalendarioEvento[] = [];
  eventoSeleccionado: CalendarioEvento | null = null;
  mostrarModalDetalle = false;
  
  // Filtros
  filtroTipo: string = 'todos'; // todos, inspecciones, fiscalizaciones, vencimientos
  filtroInspector: string = '';
  inspectores: any[] = [];
  
  // Crear evento desde calendario
  mostrarModalCrearEvento = false;
  fechaSeleccionada: string = '';
  tipoEventoNuevo: string = 'inspeccion'; // inspeccion, fiscalizacion
  nuevoEvento: any = {
    fecha: '',
    hora: '09:00',
    inspector_id: null,
    tipo: 'inspeccion'
  };
  
  // Vista de disponibilidad
  mostrarVistaDisponibilidad = false;
  fechaConsultaDisponibilidad: string = '';
  disponibilidadInspectores: any[] = [];
  cargandoDisponibilidad = false;
  
  // Alertas de eventos próximos
  eventosProximos: any[] = [];
  mostrarAlertas = false;
  animacionActiva = false;
  
  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    locale: esLocale,
    buttonText: {
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      day: 'Día'
    },
    events: [],
    eventClick: this.handleEventClick.bind(this),
    dateClick: this.handleDateClick.bind(this),
    height: 'auto',
    editable: false,
    selectable: true,
    eventDisplay: 'block',
    eventColor: '#3788d8',
    firstDay: 1, // Lunes
    weekends: true,
    dayMaxEvents: 3,
    moreLinkClick: 'popover',
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }
  };

  constructor(private http: HttpClient, private logger: LogService, private miService: MlService) {}

  ngOnInit() {
    this.cargarInspectores();
    this.cargarEventos();
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

  cargarEventos() {
    const params: any = {};
    if (this.filtroTipo !== 'todos') {
      params.tipo = this.filtroTipo;
    }
    if (this.filtroInspector) {
      params.inspector = this.filtroInspector;
    }

    this.miService.obtenerEventosCalendario(
      this.filtroTipo !== 'todos' ? this.filtroTipo : undefined,
      this.filtroInspector || undefined
    ).subscribe({
      next: (eventos) => {
        this.eventos = eventos;
        
       
        const eventosConColores = eventos.map(evento => {
          let color = '#3788d8'; // Azul por defecto
          
          switch (evento.extendedProps?.tipo) {
            case 'inspeccion':
              color = evento.extendedProps?.estado === 'EN PROCESO' ? '#3B82F6' : '#10B981';
              break;
            case 'fiscalizacion':
              if (evento.extendedProps?.estado === 'Programada') {
                color = '#F59E0B'; // Naranja
              } else if (evento.extendedProps?.estado === 'Ejecutada') {
                color = '#10B981'; // Verde
              } else if (evento.extendedProps?.estado === 'Muy Grave') {
                color = '#EF4444'; // Rojo
              } else {
                color = '#8B5CF6'; // Púrpura
              }
              break;
            case 'vencimiento':
              color = '#EF4444'; // Rojo para vencimientos
              break;
            case 'reinspeccion':
              color = '#EC4899'; // Rosa
              break;
            case 'notificacion':
              color = '#8B5CF6'; // Púrpura
              break;
            case 'subsanacion':
              // El color ya viene del backend según urgencia
              color = evento.extendedProps?.dias_restantes <= 3 ? '#EF4444' :
                     evento.extendedProps?.dias_restantes <= 7 ? '#F59E0B' : '#10B981';
              break;
          }
          
          return {
            ...evento,
            backgroundColor: color,
            borderColor: color,
            textColor: '#FFFFFF'
          };
        });
        
        this.calendarOptions.events = eventosConColores;
        this.logger.log('✅ Eventos cargados:', eventos.length);
        
        // Cargar eventos próximos después de procesar eventos
        setTimeout(() => {
          this.cargarEventosProximos();
        }, 200);
      },
      error: (error) => {
        this.logger.error('❌ Error al cargar eventos:', error);
      }
    });
  }

  handleEventClick(clickInfo: EventClickArg) {
    const evento = this.eventos.find(e => e.id === clickInfo.event.id);
    if (evento) {
      this.eventoSeleccionado = evento;
      this.mostrarModalDetalle = true;
    }
  }

  handleDateClick(arg: any) {
    this.logger.log('Fecha clickeada:', arg.dateStr);
    this.fechaSeleccionada = arg.dateStr;
    this.nuevoEvento.fecha = arg.dateStr;
    this.mostrarModalCrearEvento = true;
  }

  aplicarFiltros() {
    this.cargarEventos();
  }

  limpiarFiltros() {
    this.filtroTipo = 'todos';
    this.filtroInspector = '';
    this.cargarEventos();
  }

  cerrarModalDetalle() {
    this.mostrarModalDetalle = false;
    this.eventoSeleccionado = null;
  }

  navegarAEvento() {
    if (!this.eventoSeleccionado) return;
    
    const tipo = this.eventoSeleccionado.extendedProps?.tipo;
    const id = this.eventoSeleccionado.extendedProps?.id_original;
    
    if (tipo === 'inspeccion' || tipo === 'vencimiento') {
      // Navegar a solicitudes o locales
      window.location.href = `/solicitudes`;
    } else if (tipo === 'fiscalizacion' || tipo === 'reinspeccion') {
      // Navegar a fiscalizaciones
      window.location.href = `/fiscalizacion`;
    }
    
    this.cerrarModalDetalle();
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-PE', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // ============================================
  // CREAR EVENTO DESDE CALENDARIO
  // ============================================

  cerrarModalCrearEvento() {
    this.mostrarModalCrearEvento = false;
    this.nuevoEvento = {
      fecha: '',
      hora: '09:00',
      inspector_id: null,
      tipo: 'inspeccion'
    };
  }

  crearEventoDesdeCalendario() {
    if (!this.nuevoEvento.fecha) {
      alert('Por favor selecciona una fecha');
      return;
    }

    // Obtener el usuario del inspector desde el ID
    let inspectorUsuario = '';
    if (this.nuevoEvento.inspector_id) {
      const inspector = this.inspectores.find(i => i.id === this.nuevoEvento.inspector_id);
      if (inspector) {
        inspectorUsuario = inspector.usuario || '';
      }
    }

    if (this.nuevoEvento.tipo === 'inspeccion') {
      // Redirigir a solicitudes con fecha prellenada
      const fechaHora = `${this.nuevoEvento.fecha}T${this.nuevoEvento.hora}:00`;
      sessionStorage.setItem('fechaPrellenada', fechaHora);
      if (inspectorUsuario) {
        sessionStorage.setItem('inspectorPrellenado', inspectorUsuario);
      }
      window.location.href = '/solicitudes';
    } else if (this.nuevoEvento.tipo === 'fiscalizacion') {
      // Redirigir a fiscalizaciones con fecha prellenada
      const fechaHora = `${this.nuevoEvento.fecha}T${this.nuevoEvento.hora}:00`;
      sessionStorage.setItem('fechaFiscalizacionPrellenada', fechaHora);
      if (this.nuevoEvento.inspector_id) {
        sessionStorage.setItem('inspectorFiscalizacionPrellenado', this.nuevoEvento.inspector_id.toString());
      }
      window.location.href = '/fiscalizacion';
    }
    
    this.cerrarModalCrearEvento();
  }

  // ============================================
  // VISTA DE DISPONIBILIDAD DE INSPECTORES
  // ============================================

  abrirVistaDisponibilidad() {
    const hoy = new Date();
    this.fechaConsultaDisponibilidad = hoy.toISOString().split('T')[0];
    this.mostrarVistaDisponibilidad = true;
    this.consultarDisponibilidad();
  }

  cerrarVistaDisponibilidad() {
    this.mostrarVistaDisponibilidad = false;
    this.disponibilidadInspectores = [];
  }

  consultarDisponibilidad() {
    if (!this.fechaConsultaDisponibilidad) {
      alert('Por favor selecciona una fecha');
      return;
    }

    this.cargandoDisponibilidad = true;
    this.http.get<any[]>(`${this.apiUrl}/calendario/disponibilidad`, {
      params: { fecha: this.fechaConsultaDisponibilidad }
    }).subscribe({
      next: (data) => {
        this.disponibilidadInspectores = data;
        this.cargandoDisponibilidad = false;
        this.logger.log('✅ Disponibilidad cargada:', data);
      },
      error: (error) => {
        this.logger.error('❌ Error al cargar disponibilidad:', error);
        this.cargandoDisponibilidad = false;
        alert('Error al cargar la disponibilidad de inspectores');
      }
    });
  }

  getDisponibilidadClase(inspector: any): string {
    if (inspector.disponible) {
      return 'disponible';
    } else if (inspector.carga_alta) {
      return 'sobrecargado';
    } else {
      return 'ocupado';
    }
  }

  getDisponibilidadTexto(inspector: any): string {
    if (inspector.disponible) {
      return 'Disponible';
    } else if (inspector.carga_alta) {
      return `Sobrecargado (${inspector.eventos_count} eventos)`;
    } else {
      return `Ocupado (${inspector.eventos_count} eventos)`;
    }
  }

  // ============================================
  // ALERTAS DE EVENTOS PRÓXIMOS
  // ============================================

  cargarEventosProximos() {
    // Usar los eventos que ya están cargados en lugar de hacer otra llamada
    if (!this.eventos || this.eventos.length === 0) {
      console.log('⚠️ No hay eventos cargados aún');
      return;
    }
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Obtener eventos en los próximos 30 días (ampliado para ver más eventos)
    const proximos30Dias = new Date();
    proximos30Dias.setDate(hoy.getDate() + 30);
    proximos30Dias.setHours(23, 59, 59, 999);
    
    console.log('🔍 Buscando eventos entre:', hoy.toLocaleDateString(), 'y', proximos30Dias.toLocaleDateString());
    
    this.eventosProximos = this.eventos
      .filter(evento => {
        if (!evento.start) {
          console.log('⚠️ Evento sin fecha:', evento);
          return false;
        }
        
        try {
          const fechaEvento = new Date(evento.start);
          if (isNaN(fechaEvento.getTime())) {
            console.log('⚠️ Fecha inválida:', evento.start);
            return false;
          }
          
          fechaEvento.setHours(0, 0, 0, 0);
          const estaEnRango = fechaEvento >= hoy && fechaEvento <= proximos30Dias;
          
          if (estaEnRango) {
            console.log('✅ Evento próximo encontrado:', evento.title, fechaEvento.toLocaleDateString());
          }
          
          return estaEnRango;
        } catch (error) {
          console.log('❌ Error al procesar fecha:', evento.start, error);
          return false;
        }
      })
      .sort((a, b) => {
        const fechaA = new Date(a.start).getTime();
        const fechaB = new Date(b.start).getTime();
        return fechaA - fechaB;
      })
      .slice(0, 5); // Mostrar máximo 5 eventos
    
    console.log('📊 Total de eventos próximos encontrados:', this.eventosProximos.length);
    
    // Activar animación si hay eventos próximos
    if (this.eventosProximos.length > 0) {
      console.log('🎯 Eventos próximos encontrados:', this.eventosProximos.length, this.eventosProximos);
      // Asegurar que se muestren las alertas
      this.mostrarAlertas = true;
      
      // Forzar detección de cambios
      setTimeout(() => {
        // Activar animación después de que el elemento se renderice
        this.animacionActiva = true;
        console.log('✨ Animación activada - mostrarAlertas:', this.mostrarAlertas, 'animacionActiva:', this.animacionActiva);
        
        // Mantener la animación por más tiempo
        setTimeout(() => {
          this.animacionActiva = false;
        }, 8000); // 8 segundos para ver mejor la animación
      }, 150);
    } else {
      this.mostrarAlertas = false;
      console.log('❌ No hay eventos próximos - Total eventos cargados:', this.eventos.length);
    }
  }

  cerrarAlertas() {
    this.mostrarAlertas = false;
  }

  obtenerClaseUrgencia(evento: any): string {
    const fechaEvento = new Date(evento.start);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaEvento.setHours(0, 0, 0, 0);
    const diasRestantes = Math.ceil((fechaEvento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes === 0) {
      return 'hoy';
    } else if (diasRestantes <= 1) {
      return 'mañana';
    } else if (diasRestantes <= 3) {
      return 'proximo';
    } else {
      return 'futuro';
    }
  }

  obtenerTextoUrgencia(evento: any): string {
    const fechaEvento = new Date(evento.start);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaEvento.setHours(0, 0, 0, 0);
    const diasRestantes = Math.ceil((fechaEvento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes === 0) {
      return 'HOY';
    } else if (diasRestantes === 1) {
      return 'MAÑANA';
    } else {
      return `En ${diasRestantes} días`;
    }
  }

  formatearFechaCorta(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-PE', { 
      weekday: 'short',
      day: 'numeric', 
      month: 'short'
    });
  }
}

