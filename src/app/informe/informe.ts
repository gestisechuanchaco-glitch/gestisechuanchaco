import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MlService } from '../service/mi.service'; 
import html2pdf from 'html2pdf.js';
import { LogService } from '../service/log.service';

export interface Informe {
  id: number;
  numerodeexpediente: string;
  fecha: string;
  estado: string;
}

@Component({
  selector: 'app-informe',
  templateUrl: './informe.html',
  styleUrls: ['./informe.css'],
  imports: [CommonModule, FormsModule],
})
export class InformeComponent implements OnInit {
  informe: any = {};
  panelFotografico: any[] = [];
  informes: Informe[] = [];
  mostrarModal = false;
  informeSeleccionado: any = null;
  panelFotograficoSeleccionado: any[] = [];
  cargando = false;
  errorMsg = '';

  modalPanelFotograficoVisible = false;
  solicitudActualId: number | null = null;

  constructor(private mlService: MlService, private logger: LogService) {}

  ngOnInit() {
    this.logger.log('ngOnInit llamado');
    this.cargarInformes();
  }

  cargarInformes() {
    const usuario = localStorage.getItem('usuario') || '';
    this.cargando = true;
    this.informes = [];
    this.logger.log('[cargarInformes] usuario:', usuario);

    this.mlService.obtenerExpedientesPorInspector(usuario).subscribe(
      (expedientes: any[]) => {
        this.logger.log('[cargarInformes] expedientes recibidos:', expedientes);
        this.mlService.obtenerInformesInspector(usuario).subscribe(
          (informesAPI: any[]) => {
            this.logger.log('[cargarInformes] informesAPI:', informesAPI);
            this.informes = informesAPI
              .map((info: any) => {
                const expediente = expedientes.find(e => e.numerodeexpediente === info.numerodeexpediente);
                if (expediente) {
                  return {
                    id: expediente.id,
                    numerodeexpediente: info.numerodeexpediente,
                    fecha: info.fecha_inspeccion || expediente.fecha,
                    estado: info.estado
                  } as Informe;
                }
                return null;
              })
              .filter((i): i is Informe => !!i)
              .filter(i => {
                // ✅ FILTRAR: Solo mostrar informes EN PROCESO (no completados)
                // Excluir estados completados: FINALIZADO y ACEPTADO (van al historial)
                const estado = i.estado?.toUpperCase() || '';
                return estado !== 'FINALIZADO' && estado !== 'ACEPTADO';
              });
            this.cargando = false;
            this.logger.log('[cargarInformes] ✅ Informes activos (no completados):', this.informes.length, this.informes);
          },
          error => {
            this.cargando = false;
            this.errorMsg = 'No se pudieron cargar los informes';
            this.informes = [];
            this.logger.error('[cargarInformes] Error al obtener informes:', error);
          }
        );
      },
      error => {
        this.cargando = false;
        this.errorMsg = 'No se pudieron cargar los expedientes';
        this.informes = [];
        this.logger.error('[cargarInformes] Error al obtener expedientes:', error);
      }
    );
  }

  marcarObservado(informe: Informe) {
    if (!informe?.id) {
      console.warn('[marcarObservado] Informe sin id:', informe);
      return;
    }
    if (confirm('¿Desea marcar el informe como OBSERVADO?')) {
      this.logger.log('[marcarObservado] Llamando actualizarEstadoSolicitud con id:', informe.id, 'estado: OBSERVADO');
      this.mlService.actualizarEstadoSolicitud(informe.id, 'OBSERVADO').subscribe({
        next: (resp: any) => {
          this.logger.log('[marcarObservado] Respuesta backend:', resp);
          informe.estado = 'OBSERVADO';
          this.cargarInformes();
        },
        error: (err: any) => {
          this.logger.error('[marcarObservado] Error al actualizar estado:', err);
        }
      });
    }
  }

  marcarAceptado(informe: Informe) {
    if (!informe?.id) {
      console.warn('[marcarAceptado] Informe sin id:', informe);
      return;
    }
    if (confirm('¿Seguro que deseas aceptar este informe?')) {
      this.logger.log('[marcarAceptado] Llamando actualizarEstadoSolicitud con id:', informe.id, 'estado: ACEPTADO');
      this.mlService.actualizarEstadoSolicitud(informe.id, 'ACEPTADO').subscribe({
        next: (resp: any) => {
          this.logger.log('[marcarAceptado] Respuesta backend:', resp);
          informe.estado = 'ACEPTADO';
          this.cargarInformes();
        },
        error: (err: any) => {
          this.logger.error('[marcarAceptado] Error al actualizar estado:', err);
        }
      });
    }
  }

  verInforme(informe: Informe) {
    if (!informe?.id) {
      alert('No se pudo encontrar el ID de la solicitud para este informe.');
      console.warn('[verInforme] Informe sin id:', informe);
      return;
    }
    this.cargando = true;
    this.logger.log('[verInforme] Llamando obtenerInforme con id:', informe.id);
    this.mlService.obtenerInforme(informe.id).subscribe({
      next: (data: any) => {
        this.logger.log('[verInforme] Data recibida:', data);
        this.informeSeleccionado = data?.informe || {};
        this.panelFotograficoSeleccionado = data?.panelFotografico || [];
        
        // ✅ AGREGAR TIMESTAMP A TODAS LAS URLs PARA EVITAR CACHÉ DEL NAVEGADOR
        this.panelFotograficoSeleccionado = this.panelFotograficoSeleccionado.map(foto => ({
          ...foto,
          imagen_url: this.agregarTimestampAUrl(foto.imagen_url)
        }));
        
        // 🔍 DEBUG: Ver valores de cumple
        this.logger.log('[verInforme] Panel fotográfico con valores de cumple:');
        this.panelFotograficoSeleccionado.forEach((foto, i) => {
          this.logger.log(`  Foto ${i}:`, {
            id: foto.id,
            descripcion: foto.descripcion,
            cumple: foto.cumple,
            cumple_tipo: typeof foto.cumple,
            cumple_es_null: foto.cumple === null,
            cumple_es_undefined: foto.cumple === undefined
          });
        });
        
        this.mostrarModal = true;
        this.cargando = false;
      },
      error: (err) => {
        this.errorMsg = 'No se pudo cargar el informe';
        this.informeSeleccionado = null;
        this.panelFotograficoSeleccionado = [];
        this.mostrarModal = false;
        this.cargando = false;
        this.logger.error('[verInforme] Error:', err);
      }
    });
  }

  cerrarModal() {
    this.logger.log('[cerrarModal]');
    this.mostrarModal = false;
    this.informeSeleccionado = null;
    this.panelFotograficoSeleccionado = [];
  }

  verDetalle(informe: Informe) {
    this.logger.log('[verDetalle] informe:', informe);
    this.verInforme(informe);
  }

  descargarPDF() {
    const modalElement = document.querySelector('.modal-content.ficha-modal') as HTMLElement;
    if (!modalElement) {
      console.warn('[descargarPDF] No se encontró el modal');
      return;
    }
    const images = modalElement.querySelectorAll('img.img-foto');
    let loaded = 0;
    this.logger.log('[descargarPDF] images:', images.length);
    if (images.length === 0) {
      this._exportarPDF(modalElement);
      return;
    }
    images.forEach((img: any) => {
      if (img.complete) {
        loaded++;
        if (loaded === images.length) this._exportarPDF(modalElement);
      } else {
        img.onload = () => {
          loaded++;
          if (loaded === images.length) this._exportarPDF(modalElement);
        };
        img.onerror = () => {
          loaded++;
          if (loaded === images.length) this._exportarPDF(modalElement);
        };
      }
    });
  }

  private _exportarPDF(modalElement: HTMLElement) {
    modalElement.classList.add('pdf-export');
    this.logger.log('[_exportarPDF] Exportando PDF...');
    html2pdf().set({
      margin: 10,
      filename: 'informe-ITSE.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    } as any).from(modalElement).save().then(() => {
      modalElement.classList.remove('pdf-export');
      this.logger.log('[_exportarPDF] PDF exportado');
    });
  }

  guardarPanelFotografico() {
    const formData = new FormData();
    const solicitudId = this.solicitudActualId || this.informeSeleccionado?.id;
    if (!solicitudId) {
      console.warn('[guardarPanelFotografico] Sin solicitudId');
      return;
    }
    formData.append('solicitud_id', solicitudId);

    const evidenciasSinArchivo = this.panelFotografico.map(pf => ({
      descripcion: pf.descripcion,
      cumple: pf.cumple
    }));

    formData.append('evidencias', JSON.stringify(evidenciasSinArchivo));

    this.panelFotografico.forEach((pf, idx) => {
      if (pf.imgFile) {
        formData.append('imagenes', pf.imgFile);
      }
    });

    this.logger.log('[guardarPanelFotografico] Enviando panel fotográfico para solicitudId:', solicitudId, formData);

    this.mlService.guardarPanelFotografico(formData).subscribe({
      next: () => {
        this.logger.log('[guardarPanelFotografico] Panel fotográfico guardado');
        this.panelFotografico = [];
        this.solicitudActualId = null;
        this.modalPanelFotograficoVisible = false;
        if (this.informeSeleccionado && this.informeSeleccionado.id === solicitudId) {
          this.mlService.obtenerInforme(solicitudId).subscribe((data: any) => {
            this.panelFotograficoSeleccionado = data?.panelFotografico || [];
          });
        }
        this.cargarInformes();
      },
      error: (err) => {
        alert('Hubo un error al guardar el panel fotográfico');
        this.logger.error('[guardarPanelFotografico] Error:', err);
      }
    });
  }

  abrirPanelFotografico(informe: any) {
    this.logger.log('[abrirPanelFotografico] informe:', informe);
    this.solicitudActualId = informe.id;
    this.mostrarModalPanel = true;
    this.filasPanelNuevo = [{
      archivo: null,
      nombreArchivo: '',
      descripcion: '',
      cumple: null
    }];
  }

  cerrarModalPanelFotografico() {
    this.logger.log('[cerrarModalPanelFotografico]');
    this.modalPanelFotograficoVisible = false;
    this.panelFotografico = [
      { imgFile: null, imgUrl: '', descripcion: '', cumple: null }
    ];
    this.solicitudActualId = null;
  }

  onFileChangePanel(event: any, idx: number) {
    const file = event.target.files[0];
    this.logger.log('[onFileChangePanel] idx:', idx, 'file:', file);
    if (file) {
      this.panelFotografico[idx].imgFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.panelFotografico[idx].imgUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  agregarEvidenciaPanel() {
    this.logger.log('[agregarEvidenciaPanel]');
    this.panelFotografico.push({ imgFile: null, imgUrl: '', descripcion: '', cumple: null });
  }

  eliminarEvidenciaPanel(idx: number) {
    this.logger.log('[eliminarEvidenciaPanel] idx:', idx);
    if (this.panelFotografico.length > 1) {
      this.panelFotografico.splice(idx, 1);
    }
  }

  eliminarPanelFotografico(panel: any) {
    if (!panel?.id) {
      console.warn('[eliminarPanelFotografico] panel sin id:', panel);
      return;
    }
    if (confirm('¿Seguro que deseas eliminar esta evidencia fotográfica?')) {
      this.logger.log('[eliminarPanelFotografico] Llamando eliminarPanelFotografico con id:', panel.id);
      this.mlService.eliminarPanelFotografico(panel.id).subscribe({
        next: () => {
          this.panelFotograficoSeleccionado = this.panelFotograficoSeleccionado.filter(p => p.id !== panel.id);
          this.logger.log('[eliminarPanelFotografico] Evidencia eliminada');
        },
        error: (err) => {
          this.logger.error('[eliminarPanelFotografico] Error:', err);
        }
      });
    }
  }

  // ========== MÉTODOS ADICIONALES PARA EL NUEVO DISEÑO ==========
  
  async exportarExcel() {
    try {
      this.logger.log('[exportarExcel] Iniciando exportación...');
      
      if (this.informes.length === 0) {
        alert('No hay informes para exportar');
        return;
      }
      
      const xlsx = await import('xlsx');
      
      // Preparar datos para exportar
      const datosExportar = this.informes.map((informe, index) => ({
        '#': index + 1,
        'N° Expediente': informe.numerodeexpediente || 'N/A',
        'Fecha de Inspección': informe.fecha ? new Date(informe.fecha).toLocaleDateString('es-PE') : 'N/A',
        'Estado': informe.estado || 'N/A'
      }));
      
      // Crear hoja de trabajo
      const worksheet = xlsx.utils.json_to_sheet(datosExportar);
      
      // Ajustar anchos de columna
      worksheet['!cols'] = [
        { wch: 5 },   // #
        { wch: 20 },  // N° Expediente
        { wch: 20 },  // Fecha de Inspección
        { wch: 15 }   // Estado
      ];
      
      // Crear libro de trabajo
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Informes');
      
      // Agregar hoja de estadísticas
      const estadisticas = [
        { 'Métrica': 'Total Informes', 'Valor': this.informes.length },
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
      const nombreArchivo = `Informes_${fecha}.xlsx`;
      xlsx.writeFile(workbook, nombreArchivo);
      
      this.logger.log('[exportarExcel] ✅ Archivo Excel exportado:', nombreArchivo);
    } catch (error) {
      this.logger.error('[exportarExcel] Error al exportar:', error);
      alert('Error al exportar a Excel. Por favor, intenta de nuevo.');
    }
  }

  imprimirInforme() {
    this.logger.log('[imprimirInforme] Imprimiendo...');
    window.print();
  }


  verFotoCompleta(foto: any) {
    if (foto && foto.imagen_url) {
      window.open(foto.imagen_url, '_blank');
    }
  }

  // Adaptadores para el nuevo HTML
  mostrarModalPanel = false;
  filasPanelNuevo: any[] = [];

  cerrarModalPanel() {
    this.mostrarModalPanel = false;
    this.modalPanelFotograficoVisible = false;
    this.filasPanelNuevo = [];
  }

  onSelectFoto(event: any, idx: number) {
    const file = event.target.files?.[0];
    if (file) {
      this.filasPanelNuevo[idx].archivo = file;
      this.filasPanelNuevo[idx].nombreArchivo = file.name;
    }
  }

  agregarFilaPanel() {
    this.filasPanelNuevo.push({
      archivo: null,
      nombreArchivo: '',
      descripcion: '',
      cumple: null
    });
  }

  eliminarFilaPanel(idx: number) {
    if (this.filasPanelNuevo.length > 1) {
      this.filasPanelNuevo.splice(idx, 1);
    }
  }

  guardarPanel() {
    this.logger.log('[guardarPanel] Guardando panel...');
    this.logger.log('[guardarPanel] filasPanelNuevo:', this.filasPanelNuevo);
    this.logger.log('[guardarPanel] solicitudActualId:', this.solicitudActualId);
    
    if (!this.solicitudActualId) {
      alert('No se encontró el ID de la solicitud');
      return;
    }

    const formData = new FormData();
    formData.append('solicitud_id', this.solicitudActualId.toString());

    const evidencias: any[] = [];
    let archivoCount = 0;
    
    this.filasPanelNuevo.forEach((fila, i) => {
      this.logger.log(`[guardarPanel] Fila ${i}:`, {
        archivo: fila.archivo ? fila.archivo.name : 'null',
        descripcion: fila.descripcion,
        cumple: fila.cumple
      });
      
      if (fila.archivo) {
        formData.append('imagenes', fila.archivo);
        archivoCount++;
        
        // ✅ Enviar 1, 0 o null para cumple
        let cumpleValue = null;
        if (fila.cumple === true) {
          cumpleValue = 1;
        } else if (fila.cumple === false) {
          cumpleValue = 0;
        }
        
        evidencias.push({
          descripcion: fila.descripcion || '',
          cumple: cumpleValue
        });
      }
    });

    formData.append('evidencias', JSON.stringify(evidencias));
    
    this.logger.log('[guardarPanel] Total archivos:', archivoCount);
    this.logger.log('[guardarPanel] Evidencias a enviar:', evidencias);
    this.logger.log('[guardarPanel] solicitud_id:', this.solicitudActualId);

    if (archivoCount === 0) {
      alert('Debe seleccionar al menos una foto');
      return;
    }

    const solicitudIdGuardada = this.solicitudActualId;

    this.mlService.guardarPanelFotografico(formData).subscribe({
      next: () => {
        this.logger.log('[guardarPanel] ✅ Panel fotográfico guardado');
        alert('Panel fotográfico guardado exitosamente');
        this.cerrarModalPanel();
        
        // ✅ RECARGAR EL PANEL FOTOGRÁFICO SI HAY UN INFORME ABIERTO
        if (this.informeSeleccionado && this.informeSeleccionado.id === solicitudIdGuardada) {
          this.logger.log('[guardarPanel] ♻️ Recargando panel fotográfico del informe abierto');
          this.mlService.obtenerInforme(solicitudIdGuardada).subscribe({
            next: (data: any) => {
              this.logger.log('[guardarPanel] ✅ Panel fotográfico actualizado:', data?.panelFotografico?.length, 'fotos');
              this.panelFotograficoSeleccionado = data?.panelFotografico || [];
              
              // ✅ AGREGAR TIMESTAMP PARA FORZAR RECARGA DE IMÁGENES
              this.panelFotograficoSeleccionado = this.panelFotograficoSeleccionado.map(foto => ({
                ...foto,
                imagen_url: this.agregarTimestampAUrl(foto.imagen_url)
              }));
            },
            error: (err) => {
              this.logger.error('[guardarPanel] ❌ Error al recargar panel:', err);
            }
          });
        }
        
        this.cargarInformes();
      },
      error: (err) => {
        this.logger.error('[guardarPanel] Error:', err);
        alert('Error al guardar el panel fotográfico');
      }
    });
  }

  // ✅ AGREGAR TIMESTAMP A LAS URLs PARA EVITAR CACHÉ
  agregarTimestampAUrl(url: string): string {
    if (!url) return '';
    const timestamp = new Date().getTime();
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${timestamp}`;
  }
}