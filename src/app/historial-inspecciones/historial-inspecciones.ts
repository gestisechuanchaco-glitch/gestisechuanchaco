import { Component, OnInit } from '@angular/core';
import { MlService } from '../service/mi.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogService } from '../service/log.service';

@Component({
  selector: 'app-historial-inspecciones',
  templateUrl: './historial-inspecciones.html',
  styleUrls: ['./historial-inspecciones.css'],
  imports: [CommonModule, FormsModule]
})
export class HistorialInspeccionesComponent implements OnInit {
  inspecciones: any[] = [];
  inspeccionesFiltradas: any[] = [];
  inspeccionesPaginadas: any[] = [];
  paginaActual: number = 1;
  totalPaginas: number = 1;
  itemsPorPagina: number = 10;
  pageSize: number = 10;

  filtroExpediente: string = '';
  filtroEstablecimiento: string = '';
  filtroEstado: string = '';

  mostrarModalDetalle = false;
  inspeccionSeleccionada: any = null;
  
  // Panel Fotográfico
  panelFotografico: any[] = [];
  modalPanelFotograficoVisible = false;

  constructor(
    private mlService: MlService,
    private logger: LogService
  ) {}

  ngOnInit() {
    this.cargarHistorial();
  }

  cargarHistorial() {
    const inspector = localStorage.getItem('usuario') || '';
    this.logger.log('[Historial] Cargando inspecciones finalizadas para:', inspector);
    
    this.mlService.obtenerExpedientesPorInspector(inspector)
      .subscribe({
        next: (data: any[]) => {
          this.logger.log('[Historial] Total expedientes recibidos:', data.length);
          
          // ✅ FILTRAR: Solo mostrar inspecciones COMPLETADAS
          const inspeccionesCompletadas = data.filter(insp => {
            const estado = insp.estado?.toUpperCase() || '';
            return estado === 'FINALIZADO' || estado === 'ACEPTADO';
          });
          
          this.logger.log('[Historial] ✅ Inspecciones completadas (FINALIZADO/ACEPTADO):', inspeccionesCompletadas.length);
          
          // 📋 Cargar datos completos de cada inspección (incluyendo razón social)
          this.cargarDatosCompletos(inspeccionesCompletadas);
        },
        error: (err: any) => {
          this.logger.error('[Historial] ❌ Error al cargar historial:', err);
        }
      });
  }

  cargarDatosCompletos(inspeccionesBase: any[]) {
    this.inspecciones = [];
    let cargadas = 0;
    
    if (inspeccionesBase.length === 0) {
      this.inspeccionesFiltradas = [];
      this.actualizarPaginacion();
      return;
    }
    
    inspeccionesBase.forEach(insp => {
      if (insp.id) {
        // Cargar el detalle completo para obtener razon_social
        this.mlService.obtenerDetalleSolicitud(insp.id).subscribe({
          next: (detalle: any) => {
            // Combinar datos básicos con datos completos
            const inspeccionCompleta = {
              ...insp,
              razon_social: detalle.razon_social,
              nombre_comercial: detalle.nombre_comercial,
              direccion: detalle.direccion,
              ruc: detalle.ruc,
              giro_actividades: detalle.giro_actividades,
              total_fotos: 0 // Se cargará después
            };
            
            this.inspecciones.push(inspeccionCompleta);
            cargadas++;
            
            this.logger.log(`[Historial] ✅ Cargado ${insp.numerodeexpediente} - Razón Social: ${detalle.razon_social}`);
            
            // Cuando termine de cargar todas, ordenar y actualizar
            if (cargadas === inspeccionesBase.length) {
              this.inspecciones.sort((a, b) => 
                new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
              );
              this.cargarContadoresFotos();
              this.inspeccionesFiltradas = [...this.inspecciones];
              this.actualizarPaginacion();
              this.logger.log('[Historial] 🎉 Todas las inspecciones cargadas con razón social');
            }
          },
          error: (err: any) => {
            // Si falla, usar los datos básicos
            this.logger.log(`[Historial] ⚠️ No se pudo cargar detalle de ${insp.numerodeexpediente}, usando datos básicos`);
            this.inspecciones.push({ ...insp, total_fotos: 0 });
            cargadas++;
            
            if (cargadas === inspeccionesBase.length) {
              this.inspecciones.sort((a, b) => 
                new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
              );
              this.cargarContadoresFotos();
              this.inspeccionesFiltradas = [...this.inspecciones];
              this.actualizarPaginacion();
            }
          }
        });
      } else {
        cargadas++;
        this.inspecciones.push({ ...insp, total_fotos: 0 });
        
        if (cargadas === inspeccionesBase.length) {
          this.inspecciones.sort((a, b) => 
            new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
          );
          this.cargarContadoresFotos();
          this.inspeccionesFiltradas = [...this.inspecciones];
          this.actualizarPaginacion();
        }
      }
    });
  }

  cargarContadoresFotos() {
    this.inspecciones.forEach(insp => {
      if (insp.id) {
        this.mlService.obtenerFotosPanelFotografico(insp.id).subscribe({
          next: (fotos: any[]) => {
            insp.total_fotos = fotos.length;
            this.logger.log(`[Historial] Expediente ${insp.numerodeexpediente} tiene ${fotos.length} fotos`);
          },
          error: (err: any) => {
            insp.total_fotos = 0;
            this.logger.log(`[Historial] No se pudieron cargar fotos para ${insp.numerodeexpediente}`);
          }
        });
      } else {
        insp.total_fotos = 0;
      }
    });
  }

  filtrarInspecciones() {
    this.inspeccionesFiltradas = this.inspecciones.filter(insp => {
      const cumpleExpediente = !this.filtroExpediente || 
        (insp.numerodeexpediente && insp.numerodeexpediente.toLowerCase().includes(this.filtroExpediente.toLowerCase()));
      
      const cumpleEstablecimiento = !this.filtroEstablecimiento || 
        (insp.razon_social && insp.razon_social.toLowerCase().includes(this.filtroEstablecimiento.toLowerCase()));
      
      const cumpleEstado = !this.filtroEstado || insp.estado === this.filtroEstado;
      
      return cumpleExpediente && cumpleEstablecimiento && cumpleEstado;
    });
    
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  limpiarFiltros() {
    this.filtroExpediente = '';
    this.filtroEstablecimiento = '';
    this.filtroEstado = '';
    this.inspeccionesFiltradas = [...this.inspecciones];
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion() {
    this.totalPaginas = Math.ceil(this.inspeccionesFiltradas.length / this.itemsPorPagina);
    if (this.paginaActual > this.totalPaginas) this.paginaActual = 1;
    
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.inspeccionesPaginadas = this.inspeccionesFiltradas.slice(inicio, fin);
  }

  paginaAnterior() {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.actualizarPaginacion();
    }
  }

  paginaSiguiente() {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
      this.actualizarPaginacion();
    }
  }

  verDetalle(inspeccion: any) {
    this.logger.log('[Historial] Ver detalle de:', inspeccion.numerodeexpediente);
    
    if (!inspeccion?.id) {
      alert('No se pudo encontrar el ID de la inspección');
      return;
    }

    // Cargar el informe completo con todos los datos (igual que en el módulo Informe)
    this.mlService.obtenerInforme(inspeccion.id).subscribe({
      next: (data: any) => {
        this.logger.log('[Historial] Data completa recibida:', data);
        
        // Asignar el informe completo
        this.inspeccionSeleccionada = data?.informe || inspeccion;
        
        // Asignar el panel fotográfico
        this.panelFotografico = data?.panelFotografico || [];
        
        this.logger.log('[Historial] Inspección seleccionada:', this.inspeccionSeleccionada);
        this.logger.log('[Historial] Panel fotográfico:', this.panelFotografico.length, 'fotos');
        
        this.mostrarModalDetalle = true;
      },
      error: (err: any) => {
        this.logger.error('[Historial] Error al cargar detalle:', err);
        alert('No se pudo cargar el detalle completo');
        
        // Fallback: mostrar con datos básicos
        this.inspeccionSeleccionada = { ...inspeccion };
        this.cargarPanelFotografico(inspeccion.id);
        this.mostrarModalDetalle = true;
      }
    });
  }

  cerrarModalDetalle() {
    this.mostrarModalDetalle = false;
    this.inspeccionSeleccionada = null;
    this.panelFotografico = [];
  }

  cargarPanelFotografico(solicitudId: number) {
    this.mlService.obtenerFotosPanelFotografico(solicitudId).subscribe({
      next: (data: any[]) => {
        this.panelFotografico = data;
        this.logger.log('[Historial] Panel fotográfico cargado:', data.length, 'fotos');
      },
      error: (err: any) => {
        this.logger.error('[Historial] Error al cargar panel fotográfico:', err);
        this.panelFotografico = [];
      }
    });
  }

  abrirPanelFotografico() {
    if (this.panelFotografico.length > 0) {
      this.modalPanelFotograficoVisible = true;
    }
  }

  cerrarPanelFotografico() {
    this.modalPanelFotograficoVisible = false;
  }

  imprimirDetalle() {
    window.print();
  }

  // Método helper para obtener clase CSS del badge de estado
  getEstadoBadgeClass(estado: string): string {
    const classes: any = {
      'ACEPTADO': 'badge-success',
      'FINALIZADO': 'badge-success',
      'COMPLETADO': 'badge-success',
      'EN PROCESO': 'badge-warning',
      'PENDIENTE': 'badge-info',
      'OBSERVADO': 'badge-danger'
    };
    return classes[estado?.toUpperCase()] || 'badge-secondary';
  }
}

