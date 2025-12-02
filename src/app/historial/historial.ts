import { Component, OnInit } from '@angular/core';
import { MlService } from '../service/mi.service'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogService } from '../service/log.service';

@Component({
  selector: 'app-historial-cambios',
  templateUrl: './historial.html',
  styleUrls: ['./historial.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class HistorialComponent implements OnInit {
  historial: any[] = [];
  cambiosFiltrados: any[] = [];
  cambiosPaginados: any[] = [];
  searchTerm: string = '';
  paginaActual: number = 1;
  totalPaginas: number = 1;
  pageSize: number = 10;

  // Modal para detalle eliminado
  detalleEliminadoSeleccionado: any = null;
  showModalDetalleEliminado: boolean = false;

  // Modal para detalle flotante tipo inspección (usando la misma estructura que reportes)
  solicitudSeleccionada: any = null;
  showModalDetalle: boolean = false;

  // Para el botón de panel fotográfico en el modal
  panelFotograficoVisible: boolean = false;

  // Acción del historial actual (Creado, Modificado, Borrado)
  accionHistorialActual: string = '';

  constructor(private miService: MlService, private logger: LogService) {}

  ngOnInit() {
    this.cargarCambios();
  }

  cargarCambios() {
    this.miService.obtenerHistorial().subscribe((data: any[]) => {
      // Ordena DESC por fecha
      this.historial = data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      this.filtrarCambios();
    });
  }

  // Soporta "Borrado" además de Creado y Modificado
  mostrarAccionSimple(accion: string): string {
    if (!accion) return '';
    const acc = accion.toLowerCase();
    if (acc.includes('creación')) return 'Creado';
    if (acc.includes('edición')) return 'Modificado';
    if (acc.includes('elimin') || acc.includes('borrado')) return 'Borrado';
    return accion.charAt(0).toUpperCase() + accion.slice(1);
  }

  filtrarCambios() {
    const term = this.searchTerm.trim().toLowerCase();
    this.cambiosFiltrados = this.historial.filter(cambio => {
      const accionSimple = this.mostrarAccionSimple(cambio.accion).toLowerCase();
      return (
        !term ||
        (cambio.numerodeexpediente && cambio.numerodeexpediente.toLowerCase().includes(term)) ||
        (cambio.modificadoPor && cambio.modificadoPor.toLowerCase().includes(term)) ||
        (cambio.realizadoPor && cambio.realizadoPor.toLowerCase().includes(term)) ||
        accionSimple.includes(term)
      );
    });
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion() {
    this.totalPaginas = Math.max(1, Math.ceil(this.cambiosFiltrados.length / this.pageSize));
    const inicio = (this.paginaActual - 1) * this.pageSize;
    this.cambiosPaginados = this.cambiosFiltrados.slice(inicio, inicio + this.pageSize);
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

  contarEdiciones(expediente: string): number {
    // Ahora cuenta solo los "Modificado"
    return this.historial.filter(h =>
      h.numerodeexpediente === expediente &&
      this.mostrarAccionSimple(h.accion) === 'Modificado'
    ).length;
  }

  volverASolicitudes() {
    window.history.back();
  }

  // Muestra los campos modificados de forma amigable y solo si existen
  mostrarDetalleCampos(cambio: any): string {
    if (!cambio.campos_modificados || cambio.campos_modificados.trim() === "" || cambio.campos_modificados === "-") {
      return "-";
    }
    // Quita espacios extra y muestra separados por coma y espacio
    return cambio.campos_modificados
      .split(',')
      .map((c: string) => c.trim())
      .filter((c: string) => !!c)
      .join(', ');
  }

  // MODAL DETALLE ELIMINADO (tipo ficha completa)
  verDetalleEliminado(cambio: any) {
    this.logger.log('📋 Ver Detalle Eliminado:', cambio);
    this.logger.log('📋 detalle_eliminado raw:', cambio.detalle_eliminado);
    
    try {
      if (!cambio.detalle_eliminado) {
        console.warn('⚠️ No hay detalle_eliminado en este cambio');
        this.solicitudSeleccionada = {
          numerodeexpediente: cambio.numerodeexpediente || 'SIN DATO',
          estado: 'Eliminado',
          mensaje: 'No se guardaron los detalles de esta solicitud eliminada'
        };
      } else {
        this.solicitudSeleccionada = typeof cambio.detalle_eliminado === 'string'
          ? JSON.parse(cambio.detalle_eliminado)
          : cambio.detalle_eliminado;
        
        this.logger.log('✅ solicitudSeleccionada parseada:', this.solicitudSeleccionada);
      }
    } catch (error) {
      this.logger.error('❌ Error al parsear detalle_eliminado:', error);
      this.solicitudSeleccionada = {
        numerodeexpediente: cambio.numerodeexpediente || 'SIN DATO',
        estado: 'Eliminado',
        error: 'Error al cargar los detalles'
      };
    }
    
    this.accionHistorialActual = this.mostrarAccionSimple(cambio.accion);
    this.showModalDetalle = true;
  }

  cerrarModalDetalle() {
    this.showModalDetalle = false;
    this.solicitudSeleccionada = null;
    this.panelFotograficoVisible = false;
  }
}