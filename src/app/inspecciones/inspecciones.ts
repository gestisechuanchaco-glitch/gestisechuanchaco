import { Component, OnInit, OnDestroy } from '@angular/core';
import { MlService } from '../service/mi.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jsPDF } from "jspdf";
import { LogService } from '../service/log.service';

@Component({
  selector: 'app-mis-inspecciones',
  templateUrl: './inspecciones.html',
  styleUrls: ['./inspecciones.css'],
  imports: [CommonModule, FormsModule]
})
export class InspeccionesComponent implements OnInit, OnDestroy {
  inspecciones: any[] = [];
  inspeccionesFiltradas: any[] = [];
  inspeccionesPaginadas: any[] = [];
  paginaActual: number = 1;
  totalPaginas: number = 1;
  itemsPorPagina: number = 10;
  pageSize: number = 10;
  Math = Math;

  // Filtros
  filtroExpediente: string = '';
  filtroRiesgo: string = '';
  filtroEstado: string = '';

  modalDetalleVisible = false;
  inspeccionSeleccionada: any = null;
  modalEvidenciaVisible = false;
  detalleSeleccionado: any = null;
  detalleEvidencia: string = '';
  archivoEvidencia: File | null = null;
  expedienteActualId: number | null = null;
  archivoEvidenciaUrl: string | null = null;
  cumpleEvidencia: boolean | null = null;

  // Panel Fotográfico con Filas Dinámicas
  modalPanelVisible = false;
  modalPanelFotograficoVisible = false;
  inspeccionActual: any = null;
  fotosSeleccionadas: any[] = [];
  fotosSubidas: any[] = [];
  filasPanel: {
    archivos: File[],
    nombresArchivos: string[],
    previews: string[],
    descripcion: string,
    cumple: boolean | null
  }[] = [];

  solicitudActualId: number | null = null;
  private intervalId: any = null;

  constructor(private mlService: MlService, private logger: LogService) {}

  ngOnInit() {
    this.cargarInspecciones();
    // Refresca automáticamente cada 30 segundos
    this.intervalId = setInterval(() => {
      this.cargarInspecciones();
    }, 30000); // 30000ms = 30s
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  cargarInspecciones() {
    const inspector = localStorage.getItem('usuario') || '';
    this.mlService.obtenerExpedientesPorInspector(inspector)
      .subscribe({
        next: (data: any[]) => {
          // ✅ FILTRAR: Solo mostrar inspecciones EN PROCESO (no finalizadas)
          // Excluir estados completados: FINALIZADO y ACEPTADO (van al historial)
          this.inspecciones = data
            .filter(insp => {
              const estado = insp.estado?.toUpperCase() || '';
              return estado !== 'FINALIZADO' && estado !== 'ACEPTADO';
            })
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
          
          this.logger.log(`[Inspecciones] ✅ Cargadas ${this.inspecciones.length} inspecciones activas`);
          this.inspeccionesFiltradas = [...this.inspecciones];
          this.actualizarPaginacion();
        },
        error: (err: any) => this.logger.error('Error al cargar inspecciones asignadas:', err)
      });
  }

  filtrarInspecciones() {
    this.inspeccionesFiltradas = this.inspecciones.filter(insp => {
      const cumpleExpediente = !this.filtroExpediente || 
        (insp.numerodeexpediente && insp.numerodeexpediente.toLowerCase().includes(this.filtroExpediente.toLowerCase()));
      
      const cumpleRiesgo = !this.filtroRiesgo || insp.riesgo_incendio === this.filtroRiesgo;
      
      const cumpleEstado = !this.filtroEstado || insp.estado === this.filtroEstado;

      return cumpleExpediente && cumpleRiesgo && cumpleEstado;
    });

    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  limpiarFiltros() {
    this.filtroExpediente = '';
    this.filtroRiesgo = '';
    this.filtroEstado = '';
    this.filtrarInspecciones();
  }

  actualizarPaginacion() {
    this.totalPaginas = Math.max(1, Math.ceil(this.inspeccionesFiltradas.length / this.itemsPorPagina));
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    this.inspeccionesPaginadas = this.inspeccionesFiltradas.slice(inicio, inicio + this.itemsPorPagina);
  }

  getPaginasArray(): number[] {
    const paginas: number[] = [];
    const maxPaginas = 5;
    let inicio = Math.max(1, this.paginaActual - Math.floor(maxPaginas / 2));
    let fin = Math.min(this.totalPaginas, inicio + maxPaginas - 1);

    if (fin - inicio + 1 < maxPaginas) {
      inicio = Math.max(1, fin - maxPaginas + 1);
    }

    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }

    return paginas;
  }

  irAPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.actualizarPaginacion();
    }
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
    if (inspeccion.id) {
      this.mlService.obtenerDetalleSolicitud(inspeccion.id).subscribe({
        next: (detalle: any) => {
          this.detalleSeleccionado = detalle;
          this.inspeccionSeleccionada = detalle;
          this.modalDetalleVisible = true;
        },
        error: (err: any) => {
          alert('No se pudo cargar el detalle');
          this.modalDetalleVisible = false;
        }
      });
    } else if (inspeccion.numerodeexpediente) {
      this.mlService.obtenerDetallePorExpediente(inspeccion.numerodeexpediente).subscribe({
        next: (detalle: any) => {
          this.detalleSeleccionado = detalle;
          this.inspeccionSeleccionada = detalle;
          this.modalDetalleVisible = true;
        },
        error: (err: any) => {
          alert('No se pudo cargar el detalle');
          this.modalDetalleVisible = false;
        }
      });
    } else {
      alert('No se pudo encontrar el identificador para el detalle');
    }
  }

  cerrarModalDetalle() {
    this.modalDetalleVisible = false;
    this.detalleSeleccionado = null;
    this.inspeccionSeleccionada = null;
  }

  abrirEvidencia(inspeccion: any) {
    this.expedienteActualId = inspeccion.id;
    this.modalEvidenciaVisible = true;
    this.detalleEvidencia = '';
    this.archivoEvidencia = null;
    this.archivoEvidenciaUrl = null;
    this.cumpleEvidencia = null;
  }

  cerrarModalEvidencia() {
    this.modalEvidenciaVisible = false;
    this.detalleEvidencia = '';
    this.archivoEvidencia = null;
    this.archivoEvidenciaUrl = null;
    this.expedienteActualId = null;
    this.cumpleEvidencia = null;
  }

  onFileEvidencia(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.archivoEvidencia = files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.archivoEvidenciaUrl = e.target.result;
      };
      if (this.archivoEvidencia) {
        reader.readAsDataURL(this.archivoEvidencia);
      }
    }
  }

  subirEvidencia(event: Event) {
    event.preventDefault();
    if (!this.archivoEvidencia || !this.detalleEvidencia || !this.expedienteActualId) return;

    const formData = new FormData();
    formData.append('expedienteId', this.expedienteActualId.toString());
    formData.append('detalle', this.detalleEvidencia);
    if (this.archivoEvidencia) {
      formData.append('archivo', this.archivoEvidencia);
    }
    formData.append('cumple', this.cumpleEvidencia ? 'SI' : 'NO');

    this.mlService.subirEvidenciaInspeccion(formData)
      .subscribe({
        next: (resp: any) => {
          alert('¡Evidencia subida exitosamente!');
          this.cerrarModalEvidencia();
        },
        error: (err: any) => {
          alert('Error al subir evidencia');
          this.cerrarModalEvidencia();
        }
      });
  }

  abrirPanelFotografico(inspeccion: any) {
    this.inspeccionActual = inspeccion;
    this.solicitudActualId = inspeccion.id;
    this.modalPanelVisible = true;
    this.modalPanelFotograficoVisible = true;
    this.fotosSeleccionadas = [];
    this.filasPanel = []; // Inicializar array vacío
    this.cargarFotosSubidas(inspeccion.id);
  }

  agregarFilaPanel() {
    this.filasPanel.push({
      archivos: [],
      nombresArchivos: [],
      previews: [],
      descripcion: '',
      cumple: null
    });
  }

  eliminarFilaPanel(idx: number) {
    this.filasPanel.splice(idx, 1);
  }

  eliminarFotoDeGrid(filaIdx: number, fotoIdx: number) {
    this.filasPanel[filaIdx].archivos.splice(fotoIdx, 1);
    this.filasPanel[filaIdx].nombresArchivos.splice(fotoIdx, 1);
    this.filasPanel[filaIdx].previews.splice(fotoIdx, 1);
  }

  seleccionarFotoFila(event: any, idx: number) {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Limpiar arrays anteriores
      this.filasPanel[idx].archivos = [];
      this.filasPanel[idx].nombresArchivos = [];
      this.filasPanel[idx].previews = [];

      // Agregar todos los archivos seleccionados
      for (let i = 0; i < files.length; i++) {
        const archivo = files[i];
        this.filasPanel[idx].archivos.push(archivo);
        this.filasPanel[idx].nombresArchivos.push(archivo.name);

        // Generar preview para cada archivo
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.filasPanel[idx].previews.push(e.target.result);
        };
        reader.readAsDataURL(archivo);
      }

      // Resetear el input
      event.target.value = '';
    }
  }

  guardarPanelFotografico() {
    if (!this.solicitudActualId) {
      alert('No se encontró el ID de solicitud');
      return;
    }

    if (this.filasPanel.length === 0) {
      alert('Debe agregar al menos una fila con fotos');
      return;
    }

    const formData = new FormData();
    formData.append('solicitud_id', this.solicitudActualId.toString());

    // Crear array de evidencias (una por cada foto)
    const evidenciasArr: any[] = [];
    
    this.filasPanel.forEach(fila => {
      fila.archivos.forEach(archivo => {
        evidenciasArr.push({
          descripcion: fila.descripcion || '',
          cumple: fila.cumple === true ? 'SI' : (fila.cumple === false ? 'NO' : '')
        });
      });
    });

    formData.append('evidencias', JSON.stringify(evidenciasArr));

    // Agregar todas las imágenes
    this.filasPanel.forEach(fila => {
      fila.archivos.forEach(archivo => {
        formData.append('imagenes', archivo);
      });
    });

    this.mlService.guardarPanelFotografico(formData).subscribe({
      next: (resp: any) => {
        alert('Panel fotográfico guardado exitosamente');
        this.cerrarPanelFotografico();
      },
      error: (err: any) => {
        alert('Error al guardar panel fotográfico');
        console.error(err);
      }
    });
  }

  getBase64ImageFromURL(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      };
      img.onerror = error => reject(error);
    });
  }

  exportarPDF() {
    this.getBase64ImageFromURL('assets/muni_logo.png').then((fondoBase64: string) => {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      doc.addImage(
        fondoBase64,
        'PNG',
        0,
        0,
        210,
        297
      );

      doc.setFont('arial', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(255,120,0);
      doc.text('DETALLE DE INSPECCIÓN', 105, 37, {align: 'center'});

      doc.setFontSize(12);
      doc.text(`N° Expediente: ${this.detalleSeleccionado?.numerodeexpediente || 'SIN DATO'}`, 105, 46, {align: 'center'});

      let lineSpacing = 10;
      const col1 = 22;
      const col2 = 110;

      doc.setFont('arial', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(255,120,0);
      doc.text('Datos del Solicitante', col1, 60);

      doc.setFont('arial', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(0,0,0);

      let y = 72;
      doc.text(`Solicitante: ${this.detalleSeleccionado?.nombres_apellidos || 'SIN DATO'}`, col1, y);
      doc.text(`DNI/CE: ${this.detalleSeleccionado?.dni_ce || 'SIN DATO'}`, col2, y);
      y += lineSpacing;
      doc.text(`Teléfonos: ${this.detalleSeleccionado?.telefonos || 'SIN DATO'}`, col1, y);
      doc.text(`Correo: ${this.detalleSeleccionado?.correo || 'SIN DATO'}`, col2, y);

      y += lineSpacing + 2;
      doc.setFont('arial', 'bold');
      doc.setTextColor(255,120,0);
      doc.text('Datos del Establecimiento:', col1, y);

      doc.setFont('arial', 'normal');
      doc.setTextColor(0,0,0);
      y += lineSpacing;

      doc.text(`Razón Social: ${this.detalleSeleccionado?.razon_social || 'SIN DATO'}`, col1, y);
      doc.text(`RUC: ${this.detalleSeleccionado?.ruc || 'SIN DATO'}`, col2, y);
      y += lineSpacing;
      doc.text(`Nombre Comercial: ${this.detalleSeleccionado?.nombre_comercial || 'SIN DATO'}`, col1, y);
      doc.text(`Tel. Establecimiento: ${this.detalleSeleccionado?.telefonos_establecimiento || 'SIN DATO'}`, col2, y);

      y += lineSpacing;
      doc.text(`Localidad: ${this.detalleSeleccionado?.localidad || 'SIN DATO'}`, col1, y);
      doc.text(`Distrito: ${this.detalleSeleccionado?.distrito || 'SIN DATO'}`, col2, y);

      y += lineSpacing;
      doc.text(`Provincia: ${this.detalleSeleccionado?.provincia || 'SIN DATO'}`, col1, y);
      doc.text(`Departamento: ${this.detalleSeleccionado?.departamento || 'SIN DATO'}`, col2, y);

      y += lineSpacing;
      doc.text(`Referencia: ${this.detalleSeleccionado?.referencia || 'SIN DATO'}`, col1, y);
      doc.text(`Giro/Actividades: ${this.detalleSeleccionado?.giro_actividades || 'SIN DATO'}`, col2, y);

      y += lineSpacing;
      doc.text(`Horario Atención: ${this.detalleSeleccionado?.horario_atencion || 'SIN DATO'}`, col1, y);
      doc.text(`Área Ocupada: ${this.detalleSeleccionado?.area_ocupada || 'SIN DATO'}`, col2, y);

      y += lineSpacing;
      doc.text(`Número de Pisos: ${this.detalleSeleccionado?.num_pisos || 'SIN DATO'}`, col1, y);
      doc.text(`Piso Ubicado: ${this.detalleSeleccionado?.piso_ubicado || 'SIN DATO'}`, col2, y);

      y += lineSpacing;
      doc.text(`Área Terreno: ${this.detalleSeleccionado?.area_terreno || 'SIN DATO'}`, col1, y);
      doc.text(`Área Techada por Nivel: ${this.detalleSeleccionado?.area_techada_por_nivel || 'SIN DATO'}`, col2, y);

      y += lineSpacing;
      doc.text(`Área Libre: ${this.detalleSeleccionado?.area_libre || 'SIN DATO'}`, col1, y);
      doc.text(`Tipo ITSE: ${this.detalleSeleccionado?.tipo_itse || 'SIN DATO'}`, col2, y);

      y += lineSpacing + 2;
      doc.setFont('arial', 'bold');
      doc.setTextColor(255,120,0);
      doc.text('Riesgos:', col1, y);

      doc.setFont('arial', 'normal');
      doc.setTextColor(0,0,0);
      y += lineSpacing;
      doc.text(`Riesgo Incendio: ${this.detalleSeleccionado?.riesgo_incendio || 'SIN DATO'}`, col1, y);
      doc.text(`Riesgo Colapso: ${this.detalleSeleccionado?.riesgo_colapso || 'SIN DATO'}`, col2, y);

      y += lineSpacing;
      doc.text(`Detalle de Riesgo: ${this.detalleSeleccionado?.riesgo_detalle || 'SIN DATO'}`, col1, y);

      doc.save("detalle-inspeccion.pdf");
    });
  }

  // Funciones helper para clases CSS de badges
  getRiesgoClass(riesgo: string): string {
    if (!riesgo) return '';
    const riesgoUpper = riesgo.toUpperCase();
    if (riesgoUpper === 'BAJO') return 'riesgo-bajo';
    if (riesgoUpper === 'MEDIO') return 'riesgo-medio';
    if (riesgoUpper === 'ALTO') return 'riesgo-alto';
    if (riesgoUpper === 'MUY ALTO') return 'riesgo-muy-alto';
    return '';
  }

  getEstadoClass(estado: string): string {
    if (!estado) return '';
    const estadoUpper = estado.toUpperCase();
    if (estadoUpper === 'PENDIENTE') return 'estado-pendiente';
    if (estadoUpper === 'EN PROCESO') return 'estado-en-proceso';
    if (estadoUpper === 'FINALIZADO') return 'estado-finalizado';
    if (estadoUpper === 'ACEPTADO') return 'estado-aceptado';
    if (estadoUpper === 'OBSERVADO') return 'estado-observado';
    return '';
  }

  async exportarExcel() {
    try {
      this.logger.log('[exportarExcel] Iniciando exportación...');
      
      if (this.inspeccionesFiltradas.length === 0) {
        alert('No hay inspecciones para exportar');
        return;
      }
      
      const xlsx = await import('xlsx');
      
      // Preparar datos para exportar
      const datosExportar = this.inspeccionesFiltradas.map((inspeccion, index) => ({
        '#': index + 1,
        'N° Expediente': inspeccion.numerodeexpediente || 'N/A',
        'Solicitante': inspeccion.nombres_apellidos || inspeccion.solicitante || 'N/A',
        'Razón Social': inspeccion.razon_social || 'N/A',
        'RUC': inspeccion.ruc || 'N/A',
        'Tipo de Trámite': inspeccion.tipo_tramite || 'N/A',
        'Riesgo': inspeccion.riesgo_incendio || 'N/A',
        'Estado': inspeccion.estado || 'N/A',
        'Fecha': inspeccion.fecha ? new Date(inspeccion.fecha).toLocaleDateString('es-PE') : 'N/A',
        'Inspector Asignado': inspeccion.inspector_asignado || 'N/A',
        'Dirección': inspeccion.direccion || 'N/A',
        'Localidad': inspeccion.localidad || 'N/A'
      }));
      
      // Crear hoja de trabajo
      const worksheet = xlsx.utils.json_to_sheet(datosExportar);
      
      // Ajustar anchos de columna
      worksheet['!cols'] = [
        { wch: 5 },   // #
        { wch: 18 },  // N° Expediente
        { wch: 25 },  // Solicitante
        { wch: 30 },  // Razón Social
        { wch: 12 },  // RUC
        { wch: 15 },  // Tipo de Trámite
        { wch: 12 },  // Riesgo
        { wch: 15 },  // Estado
        { wch: 15 },  // Fecha
        { wch: 25 },  // Inspector Asignado
        { wch: 35 },  // Dirección
        { wch: 20 }   // Localidad
      ];
      
      // Crear libro de trabajo
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Inspecciones');
      
      // Agregar hoja de estadísticas
      const estadisticas = [
        { 'Métrica': 'Total Inspecciones', 'Valor': this.inspeccionesFiltradas.length },
        { 'Métrica': 'Fecha Exportación', 'Valor': new Date().toLocaleString('es-PE') }
      ];
      const worksheetStats = xlsx.utils.json_to_sheet(estadisticas);
      worksheetStats['!cols'] = [
        { wch: 25 },  // Métrica
        { wch: 30 }   // Valor
      ];
      xlsx.utils.book_append_sheet(workbook, worksheetStats, 'Estadísticas');
      
      // Exportar archivo
      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = `Inspecciones_${fecha}.xlsx`;
      xlsx.writeFile(workbook, nombreArchivo);
      
      this.logger.log('[exportarExcel] ✅ Archivo Excel exportado:', nombreArchivo);
    } catch (error) {
      this.logger.error('[exportarExcel] Error al exportar:', error);
      alert('Error al exportar a Excel. Por favor, intenta de nuevo.');
    }
  }

  // Funciones del Panel Fotográfico
  seleccionarFotos(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.fotosSeleccionadas.push({
            file: file,
            preview: e.target.result
          });
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removerFotoSeleccionada(index: number) {
    this.fotosSeleccionadas.splice(index, 1);
  }

  subirFotos() {
    if (this.fotosSeleccionadas.length === 0) {
      alert('No hay fotos seleccionadas');
      return;
    }

    if (!this.inspeccionActual?.id) {
      alert('No se pudo identificar la inspección');
      return;
    }

    const formData = new FormData();
    formData.append('solicitud_id', this.inspeccionActual.id.toString());
    
    this.fotosSeleccionadas.forEach((foto, index) => {
      formData.append('fotos', foto.file);
    });

    this.mlService.subirFotoPanelFotografico(formData).subscribe({
      next: (response: any) => {
        alert('Fotos subidas exitosamente');
        this.fotosSeleccionadas = [];
        this.cargarFotosSubidas(this.inspeccionActual.id);
      },
      error: (err: any) => {
        console.error('Error al subir fotos:', err);
        alert('Error al subir las fotos');
      }
    });
  }

  cargarFotosSubidas(solicitudId: number) {
    this.mlService.obtenerFotosPanelFotografico(solicitudId).subscribe({
      next: (fotos: any[]) => {
        this.fotosSubidas = fotos;
      },
      error: (err: any) => {
        console.error('Error al cargar fotos:', err);
        this.fotosSubidas = [];
      }
    });
  }

  eliminarFoto(fotoId: number) {
    if (confirm('¿Estás seguro de eliminar esta foto?')) {
      this.mlService.eliminarFotoPanelFotografico(fotoId).subscribe({
        next: () => {
          alert('Foto eliminada');
          this.cargarFotosSubidas(this.inspeccionActual.id);
        },
        error: (err: any) => {
          console.error('Error al eliminar foto:', err);
          alert('Error al eliminar la foto');
        }
      });
    }
  }

  cerrarPanelFotografico() {
    this.modalPanelVisible = false;
    this.modalPanelFotograficoVisible = false;
    this.inspeccionActual = null;
    this.fotosSeleccionadas = [];
    this.fotosSubidas = [];
  }
}