import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions, Chart } from 'chart.js';
import { FormsModule } from '@angular/forms';
import { MlService } from '../service/mi.service';
import { HttpClient } from '@angular/common/http';
import { LogService } from '../service/log.service';
import { environment } from '../../environments/environment';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  standalone: true,
  imports: [CommonModule, NgChartsModule, FormsModule]
})
export class DashboardComponent implements OnInit, AfterViewInit {
  
  // FILTROS
  filtroAnio: string = '';
  filtroMes: string = '';
  filtroDia: string = '';
  aniosDisponibles: number[] = [];
  showFilters: boolean = false; // ⭐ PANEL LATERAL
  
  // KPIs
  erroresEmision = 0;
  erroresEmisionPorcentaje = 0;
  erroresDetalle: any[] = [];
  mostrarModalErrores = false;
  tiempoPromedioRegistrosTexto: string = '0 segundos';
  licenciasVencidas = 0;
  porcentajeLicenciasVencidas = 0;
  mostrarModalVencidas = false;
  tiempoPromedioEmisionITSE = 0; // Tiempo Promedio de Emisión en días
  tiempoPromedioEmisionITSETexto = '0 días';
  mostrarModalTPEITSE = false;
  licenciasITSEConTiempo: any[] = []; // Lista de licencias ITSE con sus tiempos de emisión
  
  // NUEVOS KPIs para vencimientos
  licenciasVencenEsteMes = 0;
  localesProximosVencer: any[] = [];
  localesVencidos: any[] = [];
  filtroVencimientoMes: string = '';
  filtroVencimientoEstado: string = 'todos'; // todos, proximos, vencidos
  diasAnticipacion: number = 30; // Días de anticipación por defecto

  // KPIs FISCALIZACIONES
  fiscTotal = 0;
  fiscPendientes = 0;
  fiscSubsanadas = 0;
  fiscMontoTotal = 0;
  fiscMuyGraves = 0;
  fiscProximasReinsp = 0;
  fiscProximasLista: any[] = [];
  fiscFiltroMes: string = '';
  fiscFiltroEstado: string = 'todos'; // 🔧 Predeterminado: mostrar todos
  fiscDiasAnticipacion: number = 30;
  
  // PANEL DE ALERTAS (CONSOLIDADO)
  alertas: any[] = [];
  mostrarAlertas = true;
  alertasAtendidas: Set<string> = new Set(); // IDs de alertas marcadas como atendidas
  
  // ALERTAS DE EVENTOS PRÓXIMOS
  eventosProximos: any[] = [];
  mostrarAlertasEventos = true;
  animacionActiva = false;

  solicitudesOriginal: any[] = [];
  solicitudesFiltradas: any[] = [];
  locales: any[] = [];

  // GRAFICOS
  barRiesgoData: ChartData<'bar', number[], string> = { labels: [], datasets: [] };
  totalPorRiesgo: number = 0;
  riesgoLegends = [
    { label: 'Muy Alto', color: '#EF4444' },
    { label: 'Alto', color: '#F59E0B' },
    { label: 'Medio', color: '#10B981' },
    { label: 'ECSE', color: '#3B82F6' }
  ];

  barLocalidadData: ChartData<'bar', number[], string> = { labels: [], datasets: [] };
  totalPorLocalidad: number = 0;
  localidadLegends: { label: string, color: string }[] = [];

  barTiempoPorTramite: ChartData<'bar', number[], string> = { labels: [], datasets: [] };
  promedioTiempoTramite: number = 0;
  tramiteLegends = [
    { label: 'ITSE', color: '#8B5CF6' },
    { label: 'ECSE', color: '#06B6D4' }
  ];

  barAccionesData: ChartData<'bar', number[], string> = { labels: [], datasets: [] };
  totalAcciones: number = 0;
  accionesLegends = [
    { label: 'Creadas', color: '#3B82F6' },
    { label: 'Modificadas', color: '#10B981' },
    { label: 'Rechazadas', color: '#EF4444' },
    { label: 'Borradas', color: '#F59E0B' }
  ];

  // Referencias a los gráficos para exportación
  @ViewChild('chartRiesgo') chartRiesgo?: BaseChartDirective;
  @ViewChild('chartLocalidad') chartLocalidad?: BaseChartDirective;
  @ViewChild('chartTiempoTramite') chartTiempoTramite?: BaseChartDirective;
  @ViewChild('chartAcciones') chartAcciones?: BaseChartDirective;

  barCategoriasOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    },
    plugins: { 
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(26, 32, 44, 0.95)',
        titleColor: '#FFFFFF',
        bodyColor: '#E2E8F0',
        padding: 14,
        cornerRadius: 10,
        displayColors: true,
        boxWidth: 12,
        boxHeight: 12,
        boxPadding: 6,
        titleFont: {
          size: 14,
          weight: 'bold',
          family: 'Inter, Segoe UI, Arial'
        },
        bodyFont: {
          size: 13,
          family: 'Inter, Segoe UI, Arial'
        },
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        caretSize: 8,
        caretPadding: 12
      }
    },
    scales: {
      x: { 
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.08)',
          lineWidth: 1
        },
        ticks: { 
          color: '#475569', 
          font: { 
            family: 'Inter, Segoe UI, Arial', 
            size: 12, 
            weight: 'bold' as const 
          },
          padding: 10
        },
        border: {
          display: true,
          color: 'rgba(0, 0, 0, 0.12)',
          width: 2
        }
      },
      y: { 
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          lineWidth: 1
        },
        ticks: { 
          color: '#64748B', 
          font: { 
            family: 'Inter, Segoe UI, Arial', 
            size: 11,
            weight: 'normal' as const
          },
          padding: 12,
          stepSize: undefined
        },
        border: {
          display: true,
          color: 'rgba(0, 0, 0, 0.12)',
          width: 2
        }
      }
    }
  };

  constructor(
    private miService: MlService, 
    private http: HttpClient, 
    private logger: LogService,
    private router: Router
  ) {
    // Registrar plugin personalizado para mostrar valores encima de las barras
    Chart.register({
      id: 'customLabels',
      afterDatasetsDraw: (chart: any) => {
        const ctx = chart.ctx;
        chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
          const meta = chart.getDatasetMeta(datasetIndex);
          if (!meta.hidden) {
            meta.data.forEach((bar: any, index: number) => {
              const value = dataset.data[index];
              if (value && value > 0) {
                ctx.save();
                
                const x = bar.x;
                const y = bar.y - 10; // 10px encima de la barra
                const text = value.toString();
                
                // Configurar fuente para medir el texto
                ctx.font = 'bold 14px Inter, Segoe UI, Arial';
                const textWidth = ctx.measureText(text).width;
                
                // Dibujar fondo semi-transparente para mejor legibilidad
                const padding = 6;
                const bgX = x - (textWidth / 2) - padding;
                const bgY = y - 18;
                const bgWidth = textWidth + (padding * 2);
                const bgHeight = 20;
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
                ctx.shadowBlur = 8;
                ctx.shadowOffsetY = 2;
                
                // Dibujar rectángulo con bordes redondeados
                this.roundRect(ctx, bgX, bgY, bgWidth, bgHeight, 6);
                ctx.fill();
                
                // Resetear sombra
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetY = 0;
                
                // Dibujar el texto
                ctx.fillStyle = '#1E293B';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(text, x, y - 8);
                
                ctx.restore();
              }
            });
          }
        });
      }
    });
  }
  
  // Función auxiliar para dibujar rectángulos con bordes redondeados
  private roundRect(ctx: any, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  ngOnInit() {
    // Cargar estado de alertas desde localStorage
    this.cargarEstadoAlertas();

    this.miService.obtenerSolicitudes().subscribe((solicitudes: any[]) => {
      this.solicitudesOriginal = solicitudes;
      this.solicitudesFiltradas = [...solicitudes];
      this.generarAniosDisponibles();
      this.calcularKPIs(); // Esto incluye calcularTiempoPromedioEmisionITSE()
      this.cargarGraficos();
      this.generarAlertas(); // Generar alertas consolidadas
    });

    this.miService.obtenerLocales().subscribe((locales: any[]) => {
      this.locales = locales;
      this.calcularLicenciasVencidasLocales();
      // No es necesario recalcular TPE aquí, ya se calcula en calcularKPIs() después de cargar solicitudes
      this.generarAlertas(); // Generar alertas después de calcular vencimientos
      
      // Inicializar mapa después de cargar locales
      setTimeout(() => {
        this.inicializarMapaInteractivo();
      }, 1000);
    });

    this.miService.getErroresEmisionDetalle().subscribe((data: any[]) => {
      this.erroresDetalle = (data || []);
      this.erroresEmision = this.erroresDetalle.length;
      this.calcularErroresEmision();
      this.cargarGraficoAcciones();
    });

    this.cargarTiempoPromedioRegistro();
    this.cargarFiscalizaciones().then(() => {
      this.generarAlertas(); // Regenerar alertas después de cargar fiscalizaciones
      // Actualizar mapa después de cargar fiscalizaciones
      if (this.mapaInteractivo) {
        this.cargarDatosMapa();
      }
    });
  }

  cargarEstadoAlertas() {
    // Cargar si las alertas fueron cerradas
    const alertasCerradas = localStorage.getItem('alertas_criticas_cerradas');
    if (alertasCerradas === 'true') {
      this.mostrarAlertas = false;
    }

    // Cargar alertas atendidas
    const alertasAtendidasStr = localStorage.getItem('alertas_atendidas');
    if (alertasAtendidasStr) {
      try {
        const alertasAtendidasArray = JSON.parse(alertasAtendidasStr);
        this.alertasAtendidas = new Set(alertasAtendidasArray);
      } catch (e) {
        this.alertasAtendidas = new Set();
      }
    }
  }

  guardarEstadoAlertas() {
    localStorage.setItem('alertas_criticas_cerradas', this.mostrarAlertas ? 'false' : 'true');
    localStorage.setItem('alertas_atendidas', JSON.stringify(Array.from(this.alertasAtendidas)));
  }

  // ⭐ TOGGLE PANEL LATERAL
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  // GENERAR AÑOS DISPONIBLES
  generarAniosDisponibles() {
    const years = this.solicitudesOriginal
      .filter(s => s.fecha)
      .map(s => new Date(s.fecha).getFullYear())
      .filter((v, i, a) => a.indexOf(v) === i && !isNaN(v))
      .sort((a, b) => b - a);
    this.aniosDisponibles = years;
  }

  // APLICAR FILTROS
  aplicarFiltros() {
    this.solicitudesFiltradas = this.solicitudesOriginal.filter(s => {
      if (!s.fecha) return false;
      
      const fecha = new Date(s.fecha);
      
      if (isNaN(fecha.getTime())) return false;
      
      // Filtro por año
      if (this.filtroAnio && fecha.getFullYear() !== parseInt(this.filtroAnio)) {
        return false;
      }
      
      // Filtro por mes
      if (this.filtroMes && (fecha.getMonth() + 1) !== parseInt(this.filtroMes)) {
        return false;
      }
      
      // Filtro por día específico
      if (this.filtroDia) {
        const diaSeleccionado = new Date(this.filtroDia);
        if (
          fecha.getDate() !== diaSeleccionado.getDate() ||
          fecha.getMonth() !== diaSeleccionado.getMonth() ||
          fecha.getFullYear() !== diaSeleccionado.getFullYear()
        ) {
          return false;
        }
      }
      
      return true;
    });

    this.calcularKPIs();
    this.cargarGraficos();
  }

  // LIMPIAR FILTROS
  limpiarFiltros() {
    this.filtroAnio = '';
    this.filtroMes = '';
    this.filtroDia = '';
    this.solicitudesFiltradas = [...this.solicitudesOriginal];
    this.calcularKPIs();
    this.cargarGraficos();
  }

  calcularKPIs() {
    this.calcularErroresEmision();
    this.calcularSolicitudesPorLocalidad();
    this.calcularGraficoRiesgo();
    this.calcularGraficoTiempoPorTramite();
    this.calcularTiempoPromedioEmisionITSE();
  }

  cargarGraficos() {
    this.calcularSolicitudesPorLocalidad();
    this.calcularGraficoRiesgo();
    this.calcularGraficoTiempoPorTramite();
    this.cargarGraficoAcciones();
  }

  cargarTiempoPromedioRegistro() {
    this.http.get<any>(`${environment.apiUrl}/api/tiempo-promedio-registro`).subscribe(resp => {
      const segundos = resp.promedio_segundos ?? 0;
      this.tiempoPromedioRegistrosTexto = this.formatearSegundos(segundos);
    });
  }

  formatearSegundos(segundos: number): string {
    if (!segundos || segundos < 60) return `${Math.round(segundos)} seg`;
    const min = Math.floor(segundos / 60);
    const seg = Math.round(segundos % 60);
    return seg > 0 ? `${min} min ${seg} seg` : `${min} min`;
  }

  calcularErroresEmision() {
    const EL = this.erroresDetalle.length;
    const TL = this.solicitudesFiltradas.length;
    this.erroresEmisionPorcentaje = TL ? Math.round((EL / TL) * 1000) / 10 : 0;
  }

  calcularLicenciasVencidasLocales() {
    const TRL = this.locales.length;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas
    
    // Calcular licencias REALMENTE vencidas basándose en la fecha de vigencia
    this.localesVencidos = this.locales.filter((x: any) => {
      if (!x.vigencia) return false;
      const fechaVencimiento = new Date(x.vigencia);
      return fechaVencimiento < hoy;
    });
    
    const NLV = this.localesVencidos.length;
    this.licenciasVencidas = NLV;
    this.porcentajeLicenciasVencidas = TRL ? Math.round((NLV / TRL) * 1000) / 10 : 0;
    
    // Calcular locales próximos a vencer (según días de anticipación)
    const fechaLimite = new Date();
    fechaLimite.setDate(hoy.getDate() + this.diasAnticipacion);
    
    this.localesProximosVencer = this.locales.filter((x: any) => {
      if (!x.vigencia) return false;
      const fechaVencimiento = new Date(x.vigencia);
      return fechaVencimiento >= hoy && fechaVencimiento <= fechaLimite;
    }).map((local: any) => {
      const fechaVencimiento = new Date(local.vigencia);
      const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      return {
        ...local,
        diasRestantes,
        estadoVencimiento: diasRestantes <= 7 ? 'urgente' : (diasRestantes <= 15 ? 'proximo' : 'normal')
      };
    });
    
    // Calcular cuántos vencen este mes
    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();
    
    this.licenciasVencenEsteMes = this.locales.filter((x: any) => {
      if (!x.vigencia) return false;
      const fechaVencimiento = new Date(x.vigencia);
      return fechaVencimiento.getMonth() === mesActual && 
             fechaVencimiento.getFullYear() === anioActual &&
             fechaVencimiento >= hoy;
    }).length;
    
    this.logger.log('📅 Vencimientos calculados:', {
      vencidas: NLV,
      proximasVencer: this.localesProximosVencer.length,
      vencenEsteMes: this.licenciasVencenEsteMes
    });
  }

  calcularTiempoPromedioEmisionITSE() {
    // ⭐ Filtrar solo licencias ITSE que estén FINALIZADAS y tengan fecha_finalizado
    // TI = fecha_inicio (o fecha si no hay fecha_inicio) = Fecha de ingreso de Licencias
    // TF = fecha_finalizado = Fecha de fin de Expedición
    const licenciasITSE = this.solicitudesFiltradas.filter((s: any) => {
      const esITSE = (s.tipo_tramite || '').toUpperCase() === 'ITSE';
      const tieneFechaInicio = s.fecha_inicio || s.fecha; // Usar fecha_inicio, o fecha si no existe
      const tieneFechaFinalizado = s.fecha_finalizado && s.fecha_finalizado !== null;
      const estaFinalizada = (s.estado || '').toUpperCase() === 'FINALIZADO' || tieneFechaFinalizado;
      
      return esITSE && tieneFechaInicio && tieneFechaFinalizado && estaFinalizada;
    });
    
    if (licenciasITSE.length === 0) {
      this.tiempoPromedioEmisionITSE = 0;
      this.tiempoPromedioEmisionITSETexto = '0 días';
      this.licenciasITSEConTiempo = [];
      return;
    }
    
    // Calcular tiempo de emisión para cada licencia ITSE y guardar datos completos
    const licenciasConTiempo: any[] = [];
    
    licenciasITSE.forEach((s: any) => {
      try {
        // ⭐ TI = Fecha de ingreso (fecha_inicio, o fecha si no existe)
        const fechaInicioStr = s.fecha_inicio || s.fecha;
        // ⭐ TF = Fecha de fin de expedición (fecha_finalizado)
        const fechaFinStr = s.fecha_finalizado;
        
        if (!fechaInicioStr || !fechaFinStr) {
          return;
        }
        
        const fechaInicio = new Date(fechaInicioStr);
        const fechaFin = new Date(fechaFinStr);
        
        // Verificar que las fechas sean válidas
        if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
          return;
        }
        
        // Calcular diferencia en milisegundos
        const diferenciaMs = fechaFin.getTime() - fechaInicio.getTime();
        
        // Convertir a días (1 día = 24 * 60 * 60 * 1000 ms)
        const dias = diferenciaMs / (1000 * 60 * 60 * 24);
        
        // Solo considerar tiempos positivos (fecha fin después de fecha inicio)
        if (dias > 0) {
          licenciasConTiempo.push({
            ...s,
            tiempoEmisionDias: Math.round(dias * 10) / 10,
            fechaInicio: fechaInicioStr,
            fechaFin: fechaFinStr
          });
        }
      } catch (error) {
        this.logger.error('Error al calcular tiempo de emisión:', error);
      }
    });
    
    this.licenciasITSEConTiempo = licenciasConTiempo.sort((a, b) => b.tiempoEmisionDias - a.tiempoEmisionDias);
    
    if (licenciasConTiempo.length === 0) {
      this.tiempoPromedioEmisionITSE = 0;
      this.tiempoPromedioEmisionITSETexto = '0 días';
      return;
    }
    
    // ⭐ Calcular promedio: TPE = Promedio de (TF - TI) para todas las licencias ITSE
    const tiemposEmision = licenciasConTiempo.map(l => l.tiempoEmisionDias);
    const promedioDias = tiemposEmision.reduce((suma, dias) => suma + dias, 0) / tiemposEmision.length;
    this.tiempoPromedioEmisionITSE = Math.round(promedioDias * 10) / 10; // Redondear a 1 decimal
    
    // Formatear texto
    if (this.tiempoPromedioEmisionITSE < 1) {
      // Si es menos de 1 día, mostrar en horas
      const horas = Math.round(promedioDias * 24);
      this.tiempoPromedioEmisionITSETexto = horas === 1 ? '1 hora' : `${horas} horas`;
    } else if (this.tiempoPromedioEmisionITSE === 1) {
      this.tiempoPromedioEmisionITSETexto = '1 día';
    } else {
      this.tiempoPromedioEmisionITSETexto = `${this.tiempoPromedioEmisionITSE} días`;
    }
    
    this.logger.log('📊 [TPE ITSE] Tiempo Promedio de Emisión calculado:', {
      promedioDias: this.tiempoPromedioEmisionITSE,
      texto: this.tiempoPromedioEmisionITSETexto,
      totalLicenciasITSE: this.solicitudesFiltradas.filter((s: any) => (s.tipo_tramite || '').toUpperCase() === 'ITSE').length,
      licenciasFinalizadas: licenciasITSE.length,
      licenciasConTiempo: licenciasConTiempo.length,
      formula: 'TPE = Promedio(TF - TI) donde TI = fecha_inicio, TF = fecha_finalizado'
    });
  }
  
  abrirModalTPEITSE() {
    this.mostrarModalTPEITSE = true;
  }
  
  cerrarModalTPEITSE() {
    this.mostrarModalTPEITSE = false;
  }
  
  formatearTiempoEmision(dias: number): string {
    if (dias < 1) {
      const horas = Math.round(dias * 24);
      return horas === 1 ? '1 hora' : `${horas} horas`;
    } else if (dias === 1) {
      return '1 día';
    } else {
      return `${Math.round(dias * 10) / 10} días`;
    }
  }
  
  // ========================================
  // EXPORTAR A EXCEL
  // ========================================
  
  exportarErroresExcel() {
    if (this.erroresDetalle.length === 0) {
      alert('No hay errores para exportar');
      return;
    }
    
    const datos = this.erroresDetalle.map((error: any, index: number) => ({
      '#': index + 1,
      'Licencia': error.licencia || error.numerodeexpediente || 'N/A',
      'Tipo': error.tipo || error.accion || 'N/A',
      'Descripción': error.descripcion || error.motivo || 'Sin descripción',
      'Fecha': error.fecha ? new Date(error.fecha).toLocaleString('es-PE') : 'N/A'
    }));
    
    // Agregar estadísticas como hoja adicional
    const estadisticas = [
      { 'Métrica': 'Porcentaje de Errores', 'Valor': `${this.erroresEmisionPorcentaje}%` },
      { 'Métrica': 'Total de Errores', 'Valor': this.erroresDetalle.length },
      { 'Métrica': 'Locales Registrados', 'Valor': this.solicitudesFiltradas.length }
    ];
    
    const workbook = XLSX.utils.book_new();
    const worksheetErrores = XLSX.utils.json_to_sheet(datos);
    const worksheetStats = XLSX.utils.json_to_sheet(estadisticas);
    
    // Ajustar anchos de columna
    worksheetErrores['!cols'] = [
      { wch: 5 },  // #
      { wch: 15 }, // Licencia
      { wch: 25 }, // Tipo
      { wch: 40 }, // Descripción
      { wch: 20 }  // Fecha
    ];
    
    worksheetStats['!cols'] = [
      { wch: 25 }, // Métrica
      { wch: 15 }  // Valor
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheetErrores, 'Errores');
    XLSX.utils.book_append_sheet(workbook, worksheetStats, 'Estadísticas');
    
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Errores_Emision_${fecha}.xlsx`;
    XLSX.writeFile(workbook, nombreArchivo);
    
    this.logger.log('✅ Archivo Excel exportado:', nombreArchivo);
  }
  
  exportarTPEITSEExcel() {
    if (this.licenciasITSEConTiempo.length === 0) {
      alert('No hay licencias ITSE para exportar');
      return;
    }
    
    const datos = this.licenciasITSEConTiempo.map((licencia: any, index: number) => ({
      '#': index + 1,
      'Razón Social': licencia.razon_social || 'N/A',
      'Solicitante': licencia.nombres_apellidos || licencia.solicitante || 'N/A',
      'Expediente': licencia.numerodeexpediente || licencia.expediente || 'N/A',
      'Fecha Inicio (TI)': licencia.fechaInicio ? new Date(licencia.fechaInicio).toLocaleDateString('es-PE') : 'N/A',
      'Fecha Fin (TF)': licencia.fechaFin ? new Date(licencia.fechaFin).toLocaleDateString('es-PE') : 'N/A',
      'Tiempo Emisión (Días)': licencia.tiempoEmisionDias,
      'Tiempo Emisión (Texto)': this.formatearTiempoEmision(licencia.tiempoEmisionDias)
    }));
    
    // Agregar estadísticas como hoja adicional
    const estadisticas = [
      { 'Métrica': 'Tiempo Promedio de Emisión', 'Valor': this.tiempoPromedioEmisionITSETexto },
      { 'Métrica': 'Total Licencias ITSE', 'Valor': this.licenciasITSEConTiempo.length },
      { 'Métrica': 'Con Tiempo Calculado', 'Valor': this.licenciasITSEConTiempo.length },
      { 'Métrica': 'Fórmula', 'Valor': 'TPE = Promedio(TF - TI)' },
      { 'Métrica': 'TI', 'Valor': 'Fecha de ingreso de Licencias (fecha_inicio o fecha de creación)' },
      { 'Métrica': 'TF', 'Valor': 'Fecha de fin de Expedición (fecha_finalizado)' }
    ];
    
    const workbook = XLSX.utils.book_new();
    const worksheetLicencias = XLSX.utils.json_to_sheet(datos);
    const worksheetStats = XLSX.utils.json_to_sheet(estadisticas);
    
    // Ajustar anchos de columna
    worksheetLicencias['!cols'] = [
      { wch: 5 },  // #
      { wch: 30 }, // Razón Social
      { wch: 25 }, // Solicitante
      { wch: 15 }, // Expediente
      { wch: 18 }, // Fecha Inicio
      { wch: 18 }, // Fecha Fin
      { wch: 18 }, // Tiempo (Días)
      { wch: 20 }  // Tiempo (Texto)
    ];
    
    worksheetStats['!cols'] = [
      { wch: 40 }, // Métrica
      { wch: 50 }  // Valor
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheetLicencias, 'Licencias ITSE');
    XLSX.utils.book_append_sheet(workbook, worksheetStats, 'Estadísticas');
    
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `TPE_ITSE_${fecha}.xlsx`;
    XLSX.writeFile(workbook, nombreArchivo);
    
    this.logger.log('✅ Archivo Excel exportado:', nombreArchivo);
  }
  
  exportarLicenciasVencidasExcel() {
    if (this.localesVencidos.length === 0) {
      alert('No hay licencias vencidas para exportar');
      return;
    }
    
    const datos = this.localesVencidos.map((local: any, index: number) => ({
      '#': index + 1,
      'Razón Social': local.razon_social || 'N/A',
      'Solicitante': local.solicitante || 'N/A',
      'Expediente': local.expediente || 'N/A',
      'Tipo': (local.tipo || 'N/A').toUpperCase(),
      'Fecha Vencimiento': local.vigencia ? this.formatearFecha(local.vigencia) : 'N/A',
      'Estado': 'VENCIDO'
    }));
    
    // Agregar estadísticas como hoja adicional
    const estadisticas = [
      { 'Métrica': '% Licencias Vencidas', 'Valor': `${this.porcentajeLicenciasVencidas}%` },
      { 'Métrica': 'Total Vencidas', 'Valor': this.licenciasVencidas },
      { 'Métrica': 'Total Registradas', 'Valor': this.locales.length },
      { 'Métrica': 'Fórmula', 'Valor': `LV(%) = (${this.licenciasVencidas} / ${this.locales.length}) * 100 = ${this.porcentajeLicenciasVencidas}%` }
    ];
    
    const workbook = XLSX.utils.book_new();
    const worksheetLicencias = XLSX.utils.json_to_sheet(datos);
    const worksheetStats = XLSX.utils.json_to_sheet(estadisticas);
    
    // Ajustar anchos de columna
    worksheetLicencias['!cols'] = [
      { wch: 5 },  // #
      { wch: 30 }, // Razón Social
      { wch: 25 }, // Solicitante
      { wch: 15 }, // Expediente
      { wch: 10 }, // Tipo
      { wch: 18 }, // Fecha Vencimiento
      { wch: 12 }  // Estado
    ];
    
    worksheetStats['!cols'] = [
      { wch: 25 }, // Métrica
      { wch: 50 }  // Valor
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheetLicencias, 'Licencias Vencidas');
    XLSX.utils.book_append_sheet(workbook, worksheetStats, 'Estadísticas');
    
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Licencias_Vencidas_${fecha}.xlsx`;
    XLSX.writeFile(workbook, nombreArchivo);
    
    this.logger.log('✅ Archivo Excel exportado:', nombreArchivo);
  }

  calcularGraficoRiesgo() {
    const riesgos = ['Muy Alto', 'Alto', 'Medio', 'ECSE'];
    const colores = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6']; // Rojo, Amarillo, Verde, Azul modernos
    const counts = riesgos.map(r =>
      this.solicitudesFiltradas.filter((x: any) => 
        (x.riesgo_incendio || '').toLowerCase() === r.toLowerCase()
      ).length
    );
    this.totalPorRiesgo = counts.reduce((acc, val) => acc + val, 0);
    this.barRiesgoData = {
      labels: riesgos,
      datasets: [{ 
        data: counts, 
        backgroundColor: colores,
        borderWidth: 0,
        borderRadius: 10,
        borderSkipped: false,
        barThickness: 'flex',
        maxBarThickness: 80
      }]
    };
  }

  calcularSolicitudesPorLocalidad() {
    // Contar SOLO las localidades de las solicitudes filtradas
    const counts: {[key: string]: number} = {};
    
    this.solicitudesFiltradas.forEach(s => {
      if (s.localidad) {
        // Normalizar: trim, convertir a mayúsculas
        let localidadNormalizada = s.localidad.toString().trim().toUpperCase();
        
        // Limpiar prefijos comunes (CP., C.P., CENTRO POBLADO, BALNEARIO, etc.)
        localidadNormalizada = localidadNormalizada
          .replace(/^CP\.\s*/gi, '')
          .replace(/^C\.P\.\s*/gi, '')
          .replace(/^CENTRO POBLADO\s*/gi, '')
          .replace(/\s+BALNEARIO$/gi, '')
          .replace(/\s+BAJA$/gi, '')
          .trim();
        
        // Normalizar nombres similares para agruparlos
        if (localidadNormalizada.includes('MILAGRO')) {
          localidadNormalizada = 'EL MILAGRO';
        } else if (localidadNormalizada.includes('VALDIVIA') || localidadNormalizada.includes('VLADIVIA')) {
          localidadNormalizada = 'VALDIVIA';
        } else if (localidadNormalizada.includes('HUANCHACO')) {
          localidadNormalizada = 'HUANCHACO';
        } else if (localidadNormalizada.includes('VICTOR') && localidadNormalizada.includes('RAUL')) {
          localidadNormalizada = 'VICTOR RAUL';
        } else if (localidadNormalizada.includes('RAMON') && localidadNormalizada.includes('CASTILLA')) {
          localidadNormalizada = 'RAMON CASTILLA';
        } else if (localidadNormalizada.includes('VILLA') && localidadNormalizada.includes('MAR')) {
          localidadNormalizada = 'VILLA DEL MAR';
        } else if (localidadNormalizada.includes('LOMAS')) {
          localidadNormalizada = 'LAS LOMAS';
        } else if (localidadNormalizada.includes('HUANCHAQUITO')) {
          localidadNormalizada = 'HUANCHAQUITO';
        } else if (localidadNormalizada.includes('TROPICO')) {
          localidadNormalizada = 'EL TROPICO';
        }
        
        if (localidadNormalizada !== '') {
          counts[localidadNormalizada] = (counts[localidadNormalizada] || 0) + 1;
        }
      }
    });
    
    // Convertir a array y ordenar por cantidad (mayor a menor)
    const localidadesOrdenadas = Object.entries(counts)
      .map(([localidad, cantidad]) => ({ localidad, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
    
    // Extraer solo las localidades que tienen solicitudes
    const labels = localidadesOrdenadas.map(item => item.localidad);
    const data = localidadesOrdenadas.map(item => item.cantidad);
    this.totalPorLocalidad = data.reduce((a, b) => a + b, 0);
    
    // Paleta de colores profesional y moderna
    const colorPalette = [
      '#06B6D4', '#F59E0B', '#8B5CF6', '#10B981', 
      '#EF4444', '#3B82F6', '#EC4899', '#14B8A6',
      '#F97316', '#6366F1', '#84CC16', '#F43F5E'
    ];
    const colors = labels.map((_, i) => colorPalette[i % colorPalette.length]);
    
    // Crear el gráfico SOLO con las localidades que tienen solicitudes
    this.barLocalidadData = {
      labels: labels,
      datasets: [{ 
        data: data, 
        backgroundColor: colors,
        borderWidth: 0,
        borderRadius: 10,
        borderSkipped: false,
        barThickness: 'flex',
        maxBarThickness: 60
      }]
    };
    
    // Generar leyendas SOLO para las localidades que aparecen en el gráfico
    this.localidadLegends = labels.map((label, i) => ({
      label: label, 
      color: colors[i]
    }));
    
    this.logger.log('📊 GRÁFICO FINAL:', {
      'Total solicitudes': this.totalPorLocalidad,
      'Localidades únicas': labels.length,
      'Localidades': labels,
      'Cantidades': data
    });
  }

  calcularGraficoTiempoPorTramite() {
    const tipos = ['ITSE', 'ECSE'];
    const colors = ['#8B5CF6', '#06B6D4']; // Púrpura y Cyan modernos
    
    const result = tipos.map(tipo => {
      const registros = this.solicitudesFiltradas.filter(s => 
        s.tipo_tramite && s.tipo_tramite.toUpperCase() === tipo &&
        s.fecha_inicio && s.fecha
      );
      
      if (registros.length === 0) return 0;
      
      const tiempos = registros.map(s => {
        try {
          const inicio = new Date(s.fecha_inicio).getTime();
          const fin = new Date(s.fecha).getTime();
          const diferencia = (fin - inicio) / 1000;
          return diferencia > 0 ? diferencia : 0;
        } catch {
          return 0;
        }
      }).filter(t => t > 0);
      
      if (tiempos.length === 0) return 0;
      
      const promedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
      return Math.round(promedio);
    });
    
    const totalPromedio = result.reduce((a, b) => a + b, 0);
    const countNonZero = result.filter(r => r > 0).length;
    this.promedioTiempoTramite = countNonZero > 0 ? Math.round(totalPromedio / countNonZero) : 0;
    
    this.barTiempoPorTramite = {
      labels: tipos,
      datasets: [{ 
        data: result, 
        backgroundColor: colors,
        borderWidth: 0,
        borderRadius: 10,
        borderSkipped: false,
        barThickness: 'flex',
        maxBarThickness: 100
      }]
    };
  }

  cargarGraficoAcciones() {
    const acciones = ['Creadas', 'Modificadas', 'Rechazadas', 'Borradas'];
    const colores = ['#3B82F6', '#10B981', '#EF4444', '#F59E0B']; // Azul, Verde, Rojo, Naranja modernos
    
    const historial = this.erroresDetalle || [];
    
    const creadas = this.solicitudesFiltradas.length;
    
    const modificadas = historial.filter((h: any) => {
      const texto = (h.tipo || h.accion || '').toLowerCase();
      return texto.includes('edición') || 
             texto.includes('edicion') || 
             texto.includes('modificad') ||
             texto.includes('actualiz');
    }).length;
    
    const rechazadas = historial.filter((h: any) => {
      const texto = (h.tipo || h.accion || '').toLowerCase();
      return texto.includes('rechaz');
    }).length;
    
    const borradas = historial.filter((h: any) => {
      const texto = (h.tipo || h.accion || '').toLowerCase();
      return texto.includes('borrad') || 
             texto.includes('eliminad') ||
             texto === 'borrado';
    }).length;
    
    this.totalAcciones = creadas + modificadas + rechazadas + borradas;
    
    this.barAccionesData = {
      labels: acciones,
      datasets: [{
        data: [creadas, modificadas, rechazadas, borradas],
        backgroundColor: colores,
        borderWidth: 0,
        borderRadius: 10,
        borderSkipped: false,
        barThickness: 'flex',
        maxBarThickness: 80
      }]
    };
  }

  abrirModalErrores() { this.mostrarModalErrores = true; }
  cerrarModalErrores() { this.mostrarModalErrores = false; }
  abrirModalVencidas() { this.mostrarModalVencidas = true; }
  cerrarModalVencidas() { this.mostrarModalVencidas = false; }
  
  // MÉTODOS PARA TABLA DE VENCIMIENTOS
  get localesFiltradosVencimiento(): any[] {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    let lista: any[] = [];
    
    // Filtrar por estado (vencidos, próximos o todos)
    if (this.filtroVencimientoEstado === 'vencidos') {
      lista = this.localesVencidos;
    } else if (this.filtroVencimientoEstado === 'proximos') {
      lista = this.localesProximosVencer;
    } else {
      // Todos: vencidos + próximos a vencer
      lista = [
        ...this.localesVencidos.map(l => ({ ...l, diasRestantes: -1, estadoVencimiento: 'vencido' })),
        ...this.localesProximosVencer
      ];
    }
    
    // Filtrar por mes de vencimiento si está seleccionado
    if (this.filtroVencimientoMes) {
      const mesSeleccionado = parseInt(this.filtroVencimientoMes);
      lista = lista.filter((local: any) => {
        if (!local.vigencia) return false;
        const fechaVencimiento = new Date(local.vigencia);
        return fechaVencimiento.getMonth() + 1 === mesSeleccionado;
      });
    }
    
    // Ordenar por fecha de vencimiento (más próximo primero)
    return lista.sort((a: any, b: any) => {
      const fechaA = new Date(a.vigencia).getTime();
      const fechaB = new Date(b.vigencia).getTime();
      return fechaA - fechaB;
    });
  }
  
  aplicarFiltrosVencimiento() {
    // Re-calcular para actualizar la vista
    this.calcularLicenciasVencidasLocales();
  }
  
  limpiarFiltrosVencimiento() {
    this.filtroVencimientoMes = '';
    this.filtroVencimientoEstado = 'todos';
    this.diasAnticipacion = 30;
    this.calcularLicenciasVencidasLocales();
  }
  
  formatearFecha(fecha: string): string {
    if (!fecha) return 'N/A';
    const f = new Date(fecha);
    const dia = f.getDate().toString().padStart(2, '0');
    const mes = (f.getMonth() + 1).toString().padStart(2, '0');
    const anio = f.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }
  
  obtenerNombreMes(numeroMes: number): string {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[numeroMes] || '';
  }
  
  // ========================================
  // FISCALIZACIONES
  // ========================================
  
  cargarFiscalizaciones(): Promise<void> {
    return new Promise((resolve) => {
    // Cargar estadísticas
    this.http.get<any>(`${environment.apiUrl}/api/fiscalizaciones/estadisticas/dashboard`)
      .subscribe({
        next: (stats) => {
          this.fiscTotal = stats.total || 0;
          this.fiscPendientes = stats.pendientes || 0;
          this.fiscSubsanadas = stats.subsanadas || 0;
          this.fiscMontoTotal = stats.montoTotal || 0;
          this.fiscMuyGraves = stats.muyGraves || 0;
          this.fiscProximasReinsp = stats.proximasReinspecciones || 0;
          this.logger.log('[Fiscalizaciones] ✅ Stats cargadas:', stats);
          this.generarAlertas(); // Re-generar alertas con datos de fiscalizaciones
        },
        error: (err) => {
          this.logger.error('[Fiscalizaciones] ❌ Error al cargar stats:', err);
        }
      });
    
    // Cargar lista de próximas reinspecciones
    this.http.get<any[]>(`${environment.apiUrl}/api/fiscalizaciones/proximas-reinspeccion?dias=${this.fiscDiasAnticipacion}`)
      .subscribe({
        next: (fiscalizaciones) => {
          this.fiscProximasLista = fiscalizaciones;
          this.logger.log('[Fiscalizaciones] ✅ Próximas reinspecciones:', fiscalizaciones.length);
            resolve();
        },
        error: (err) => {
          this.logger.error('[Fiscalizaciones] ❌ Error al cargar próximas:', err);
            resolve();
        }
        });
      });
  }
  
  get fiscProximasFiltradas(): any[] {
    let lista = [...this.fiscProximasLista];
    
    // Filtrar por mes
    if (this.fiscFiltroMes) {
      const mesSeleccionado = parseInt(this.fiscFiltroMes);
      lista = lista.filter((f: any) => {
        if (!f.fecha_reinspeccion) return false;
        const fecha = new Date(f.fecha_reinspeccion);
        return fecha.getMonth() + 1 === mesSeleccionado;
      });
    }
    
    // Filtrar por estado
    if (this.fiscFiltroEstado !== 'todos') {
      lista = lista.filter((f: any) => f.estadoUrgencia === this.fiscFiltroEstado);
    }
    
    return lista;
  }
  
  aplicarFiltrosFiscalizaciones() {
    this.cargarFiscalizaciones();
  }
  
  limpiarFiltrosFiscalizaciones() {
    this.fiscFiltroMes = '';
    this.fiscFiltroEstado = 'todos';
    this.fiscDiasAnticipacion = 30;
    this.cargarFiscalizaciones();
  }
  
  formatearMoneda(monto: number): string {
    return 'S/ ' + monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  
  // ========================================
  // ALERTAS CRÍTICAS
  // ========================================
  
  generarAlertas() {
    this.alertas = [];
    
    // Alerta 1: Licencias vencidas (CRÍTICA)
    if (this.licenciasVencidas > 0) {
      this.alertas.push({
        id: 'alerta_licencias_vencidas',
        tipo: 'error',
        icono: 'fa-times-circle',
        mensaje: `${this.licenciasVencidas} licencia${this.licenciasVencidas > 1 ? 's' : ''} vencida${this.licenciasVencidas > 1 ? 's' : ''}`,
        prioridad: 3,
        accion: 'Ver licencias',
        accionCallback: () => this.router.navigate(['/locales'])
      });
    }
    
    // Alerta 2: Licencias próximas a vencer (< 7 días) (URGENTE)
    const urgentes = this.localesProximosVencer.filter(l => l.diasRestantes <= 7 && l.diasRestantes >= 0).length;
    if (urgentes > 0) {
      this.alertas.push({
        id: 'alerta_licencias_urgentes',
        tipo: 'warning',
        icono: 'fa-exclamation-triangle',
        mensaje: `${urgentes} licencia${urgentes > 1 ? 's' : ''} vence${urgentes === 1 ? '' : 'n'} en menos de 7 días`,
        prioridad: 2,
        accion: 'Ver locales',
        accionCallback: () => this.router.navigate(['/locales'])
      });
    }
    
    // Alerta 3: Fiscalizaciones muy graves (CRÍTICA)
    if (this.fiscMuyGraves > 0) {
      this.alertas.push({
        id: 'alerta_fisc_muy_graves',
        tipo: 'error',
        icono: 'fa-exclamation-circle',
        mensaje: `${this.fiscMuyGraves} fiscalizaci${this.fiscMuyGraves === 1 ? 'ón MUY GRAVE' : 'ones MUY GRAVES'} requiere atención inmediata`,
        prioridad: 3,
        accion: 'Ver fiscalizaciones',
        accionCallback: () => this.router.navigate(['/fiscalizacion'])
      });
    }
    
    // Alerta 4: Fiscalizaciones pendientes de subsanar
    if (this.fiscPendientes > 0) {
      this.alertas.push({
        id: 'alerta_fisc_pendientes',
        tipo: 'warning',
        icono: 'fa-clipboard-check',
        mensaje: `${this.fiscPendientes} fiscalizaci${this.fiscPendientes === 1 ? 'ón pendiente' : 'ones pendientes'} de subsanar`,
        prioridad: 2,
        accion: 'Ver fiscalizaciones',
        accionCallback: () => this.router.navigate(['/fiscalizacion'])
      });
    }
    
    // Alerta 5: Plazos de subsanación próximos a vencer
    const fiscPendientesUrgentes = this.fiscProximasLista.filter((f: any) => {
      if (!f.fecha_limite_subsanacion) return false;
      const fechaLimite = new Date(f.fecha_limite_subsanacion);
      const hoy = new Date();
      const diasRestantes = Math.ceil((fechaLimite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      return diasRestantes >= 0 && diasRestantes <= 7;
    });
    
    if (fiscPendientesUrgentes.length > 0) {
      this.alertas.push({
        id: 'alerta_fisc_plazos_urgentes',
        tipo: 'warning',
        icono: 'fa-hourglass-half',
        mensaje: `${fiscPendientesUrgentes.length} fiscalizaci${fiscPendientesUrgentes.length === 1 ? 'ón' : 'ones'} cerca del plazo de subsanación (menos de 7 días)`,
        prioridad: 2,
        accion: 'Ver fiscalizaciones',
        accionCallback: () => this.router.navigate(['/fiscalizacion'])
      });
    }
    
    // Alerta 6: Solicitudes sin inspector asignado
    const solicitudesSinInspector = this.solicitudesFiltradas.filter((s: any) => 
      !s.inspector_asignado || s.inspector_asignado === '' || s.inspector_asignado === null
    );
    
    if (solicitudesSinInspector.length > 5) {
      this.alertas.push({
        id: 'alerta_sin_inspector',
        tipo: 'info',
        icono: 'fa-user-check',
        mensaje: `${solicitudesSinInspector.length} solicitudes sin inspector asignado`,
        prioridad: 1,
        accion: 'Asignar inspectores',
        accionCallback: () => this.router.navigate(['/solicitudes'])
      });
    }
    
    // Alerta 7: Alto número de solicitudes pendientes (cuello de botella)
    const solicitudesPendientes = this.solicitudesFiltradas.filter((s: any) => 
      s.estado === 'PENDIENTE' || s.estado === 'EN PROCESO'
    );
    
    if (solicitudesPendientes.length > 20) {
      this.alertas.push({
        id: 'alerta_cuello_botella',
        tipo: 'warning',
        icono: 'fa-exclamation-triangle',
        mensaje: `Alto número de solicitudes pendientes (${solicitudesPendientes.length}) - Posible cuello de botella`,
        prioridad: 2,
        accion: 'Revisar solicitudes',
        accionCallback: () => this.router.navigate(['/reportes'])
      });
    }
    
    // Alerta 8: Errores en emisión
    if (this.erroresEmisionPorcentaje > 10) {
      this.alertas.push({
        id: 'alerta_errores_emision',
        tipo: 'warning',
        icono: 'fa-exclamation-triangle',
        mensaje: `${this.erroresEmisionPorcentaje}% de errores en emisión`,
        prioridad: 2,
        accion: 'Ver detalles',
        accionCallback: () => this.abrirModalErrores()
      });
    }
    
    // Alerta 9: Próximas reinspecciones
    if (this.fiscProximasReinsp > 0) {
      this.alertas.push({
        id: 'alerta_reinspecciones',
        tipo: 'info',
        icono: 'fa-calendar-check',
        mensaje: `${this.fiscProximasReinsp} reinspecci${this.fiscProximasReinsp === 1 ? 'ón programada' : 'ones programadas'} en los próximos 30 días`,
        prioridad: 1,
        accion: 'Ver fiscalizaciones',
        accionCallback: () => this.router.navigate(['/fiscalizacion'])
      });
    }
    
    // Filtrar alertas atendidas
    this.alertas = this.alertas.filter(alerta => !this.alertasAtendidas.has(alerta.id));
    
    // Ordenar por prioridad (3 = crítico, 2 = urgente, 1 = info)
    this.alertas.sort((a, b) => b.prioridad - a.prioridad);
    
    this.logger.log('[Alertas] ✅ Generadas:', this.alertas.length);
  }
  
  cerrarAlertas() {
    this.mostrarAlertas = false;
    this.guardarEstadoAlertas();
  }

  marcarAlertaComoAtendida(alerta: any) {
    if (alerta.id) {
      this.alertasAtendidas.add(alerta.id);
      this.alertas = this.alertas.filter(a => a.id !== alerta.id);
      this.guardarEstadoAlertas();
      this.logger.log('[Alertas] Alerta marcada como atendida:', alerta.id);
    }
  }

  // ============================================
  // ALERTAS DE EVENTOS PRÓXIMOS
  // ============================================

  cargarEventosProximos() {
    this.miService.obtenerEventosCalendario().subscribe({
      next: (eventos) => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        // Obtener eventos en los próximos 30 días
        const proximos30Dias = new Date();
        proximos30Dias.setDate(hoy.getDate() + 30);
        proximos30Dias.setHours(23, 59, 59, 999);
        
        this.eventosProximos = eventos
          .filter(evento => {
            if (!evento.start) return false;
            try {
              const fechaEvento = new Date(evento.start);
              if (isNaN(fechaEvento.getTime())) return false;
              fechaEvento.setHours(0, 0, 0, 0);
              return fechaEvento >= hoy && fechaEvento <= proximos30Dias;
            } catch {
              return false;
            }
          })
          .sort((a, b) => {
            const fechaA = new Date(a.start).getTime();
            const fechaB = new Date(b.start).getTime();
            return fechaA - fechaB;
          })
          .slice(0, 5); // Mostrar máximo 5 eventos
        
        // Activar animación si hay eventos próximos
        if (this.eventosProximos.length > 0) {
          this.mostrarAlertasEventos = true;
          setTimeout(() => {
            this.animacionActiva = true;
            setTimeout(() => {
              this.animacionActiva = false;
            }, 8000);
          }, 200);
        }
      },
      error: (error) => {
        this.logger.error('Error al cargar eventos próximos:', error);
      }
    });
  }

  cerrarAlertasEventos() {
    this.mostrarAlertasEventos = false;
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

  // ============================================
  // ALERTAS INTELIGENTES
  // ============================================
  

  // ============================================
  // MAPA INTERACTIVO
  // ============================================
  
  mostrarMapaInteractivo = true;
  mapaInteractivo: any = null;
  marcadoresMapa: any[] = [];
  heatmapData: any[] = [];
  tipoMapaSeleccionado: 'locales' | 'fiscalizaciones' | 'ambos' = 'ambos';
  filtroZona: string = 'todas';
  zonasDisponibles: string[] = [];

  inicializarMapaInteractivo() {
    if (typeof (window as any).google === 'undefined' || typeof (window as any).google.maps === 'undefined') {
      setTimeout(() => this.inicializarMapaInteractivo(), 500);
      return;
    }

    const mapElement = document.getElementById('mapa-interactivo-dashboard');
    if (!mapElement) {
      setTimeout(() => this.inicializarMapaInteractivo(), 500);
      return;
    }

    // Coordenadas de Huanchaco (centro por defecto)
    const huanchacoCenter = { lat: -8.0794, lng: -79.1214 };

    this.mapaInteractivo = new (window as any).google.maps.Map(mapElement, {
      center: huanchacoCenter,
      zoom: 13,
      mapTypeId: 'roadmap',
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    this.cargarDatosMapa();
  }

  cargarDatosMapa() {
    if (!this.mapaInteractivo) {
      // Si el mapa no está inicializado, intentar inicializarlo
      setTimeout(() => this.inicializarMapaInteractivo(), 500);
      return;
    }

    // Limpiar marcadores anteriores
    this.marcadoresMapa.forEach(marker => {
      if (marker && marker.setMap) {
        marker.setMap(null);
      }
    });
    this.marcadoresMapa = [];
    this.heatmapData = [];

    // Obtener locales con coordenadas
    const localesConCoordenadas = (this.locales || []).filter((l: any) => 
      l.latitud && l.longitud && 
      !isNaN(parseFloat(l.latitud)) && 
      !isNaN(parseFloat(l.longitud))
    );

    // Obtener fiscalizaciones con coordenadas
    this.http.get<any[]>(`${environment.apiUrl}/api/fiscalizaciones`)
      .subscribe({
        next: (fiscalizaciones) => {
          const fiscConCoordenadas = (fiscalizaciones || []).filter((f: any) => 
            f.latitud && f.longitud &&
            !isNaN(parseFloat(f.latitud)) &&
            !isNaN(parseFloat(f.longitud))
          );

          // Filtrar por zona si está seleccionada
          let localesFiltrados = localesConCoordenadas;
          let fiscFiltrados = fiscConCoordenadas;

          if (this.filtroZona !== 'todas') {
            // Filtrar por localidad (simplificado)
            localesFiltrados = localesConCoordenadas.filter((l: any) => 
              (l.localidad || '').toUpperCase().includes(this.filtroZona.toUpperCase())
            );
            fiscFiltrados = fiscConCoordenadas.filter((f: any) =>
              (f.direccion || '').toUpperCase().includes(this.filtroZona.toUpperCase())
            );
          }

          // Agregar marcadores según tipo seleccionado
          if (this.tipoMapaSeleccionado === 'locales' || this.tipoMapaSeleccionado === 'ambos') {
            this.agregarMarcadoresLocales(localesFiltrados);
          }

          if (this.tipoMapaSeleccionado === 'fiscalizaciones' || this.tipoMapaSeleccionado === 'ambos') {
            this.agregarMarcadoresFiscalizaciones(fiscFiltrados);
          }

          // Ajustar zoom para mostrar todos los marcadores
          if (this.marcadoresMapa.length > 0) {
            const bounds = new (window as any).google.maps.LatLngBounds();
            this.marcadoresMapa.forEach((marker: any) => {
              if (marker && marker.getPosition) {
                bounds.extend(marker.getPosition());
              }
            });
            if (!bounds.isEmpty()) {
              this.mapaInteractivo.fitBounds(bounds);
            }
          } else {
            // Si no hay marcadores, mantener el centro en Huanchaco
            this.mapaInteractivo.setCenter({ lat: -8.0794, lng: -79.1214 });
            this.mapaInteractivo.setZoom(13);
          }

          // Generar zonas disponibles
          this.generarZonasDisponibles(localesConCoordenadas, fiscConCoordenadas);
        },
        error: (err) => {
          this.logger.error('[Mapa Interactivo] Error al cargar fiscalizaciones:', err);
          // Continuar solo con locales
          if (this.tipoMapaSeleccionado === 'locales' || this.tipoMapaSeleccionado === 'ambos') {
            this.agregarMarcadoresLocales(localesConCoordenadas);
            
            if (this.marcadoresMapa.length > 0) {
              const bounds = new (window as any).google.maps.LatLngBounds();
              this.marcadoresMapa.forEach((marker: any) => {
                if (marker && marker.getPosition) {
                  bounds.extend(marker.getPosition());
                }
              });
              if (!bounds.isEmpty()) {
                this.mapaInteractivo.fitBounds(bounds);
              }
            }
          }
        }
      });
  }

  agregarMarcadoresLocales(locales: any[]) {
    locales.forEach((local: any) => {
      const marker = new (window as any).google.maps.Marker({
        position: { lat: parseFloat(local.latitud), lng: parseFloat(local.longitud) },
        map: this.mapaInteractivo,
        title: local.razon_social || local.expediente,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          scaledSize: new (window as any).google.maps.Size(32, 32)
        },
        zIndex: 1
      });

      // Info window
      const infoWindow = new (window as any).google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #1B5E5E; font-size: 14px;">
              ${local.razon_social || 'N/A'}
            </h3>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">
              <strong>Expediente:</strong> ${local.expediente || 'N/A'}<br>
              <strong>Tipo:</strong> ${local.tipo || 'N/A'}<br>
              <strong>Estado:</strong> ${local.estado_licencia || 'N/A'}
            </p>
            <button onclick="window.verDetalleLocal('${local.id}')" 
                    style="margin-top: 8px; padding: 6px 12px; background: #1B5E5E; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
              Ver Detalles
            </button>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(this.mapaInteractivo, marker);
      });

      this.marcadoresMapa.push(marker);
      this.heatmapData.push({
        location: new (window as any).google.maps.LatLng(parseFloat(local.latitud), parseFloat(local.longitud)),
        weight: 1
      });
    });

    // Exponer función global para ver detalles
    (window as any).verDetalleLocal = (id: string) => {
      this.router.navigate(['/locales'], { queryParams: { id } });
    };
  }

  agregarMarcadoresFiscalizaciones(fiscalizaciones: any[]) {
    fiscalizaciones.forEach((fisc: any) => {
      const color = fisc.gravedad === 'Muy Grave' ? 'red' : 
                    fisc.gravedad === 'Grave' ? 'orange' : 'yellow';

      const marker = new (window as any).google.maps.Marker({
        position: { lat: parseFloat(fisc.latitud), lng: parseFloat(fisc.longitud) },
        map: this.mapaInteractivo,
        title: fisc.razon_social || fisc.numero_fiscalizacion,
        icon: {
          url: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
          scaledSize: new (window as any).google.maps.Size(32, 32)
        },
        zIndex: 2
      });

      // Info window
      const infoWindow = new (window as any).google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #1B5E5E; font-size: 14px;">
              ${fisc.razon_social || 'N/A'}
            </h3>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">
              <strong>N° Fiscalización:</strong> ${fisc.numero_fiscalizacion || 'N/A'}<br>
              <strong>Gravedad:</strong> ${fisc.gravedad || 'N/A'}<br>
              <strong>Estado:</strong> ${fisc.estado || 'N/A'}<br>
              <strong>Multa:</strong> ${fisc.monto_multa ? 'S/ ' + fisc.monto_multa : 'N/A'}
            </p>
            <button onclick="window.verDetalleFiscalizacion('${fisc.id}')" 
                    style="margin-top: 8px; padding: 6px 12px; background: #EF4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
              Ver Detalles
            </button>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(this.mapaInteractivo, marker);
      });

      this.marcadoresMapa.push(marker);
      this.heatmapData.push({
        location: new (window as any).google.maps.LatLng(parseFloat(fisc.latitud), parseFloat(fisc.longitud)),
        weight: fisc.gravedad === 'Muy Grave' ? 3 : fisc.gravedad === 'Grave' ? 2 : 1
      });
    });

    // Exponer función global para ver detalles
    (window as any).verDetalleFiscalizacion = (id: string) => {
      this.router.navigate(['/fiscalizacion'], { queryParams: { id } });
    };
  }

  generarZonasDisponibles(locales: any[], fiscalizaciones: any[]) {
    const zonasSet = new Set<string>();
    
    locales.forEach((l: any) => {
      if (l.localidad) {
        const zona = l.localidad.toUpperCase().replace(/^CP\.\s*/gi, '').trim();
        if (zona) zonasSet.add(zona);
      }
    });

    fiscalizaciones.forEach((f: any) => {
      if (f.direccion) {
        // Extraer zona de dirección (simplificado)
        const partes = f.direccion.toUpperCase().split(',');
        if (partes.length > 0) {
          zonasSet.add(partes[0].trim());
        }
      }
    });

    this.zonasDisponibles = Array.from(zonasSet).sort();
  }

  cambiarTipoMapa(tipo: 'locales' | 'fiscalizaciones' | 'ambos') {
    this.tipoMapaSeleccionado = tipo;
    this.cargarDatosMapa();
  }

  cambiarFiltroZona(zona: string) {
    this.filtroZona = zona;
    this.cargarDatosMapa();
  }

  // ========================================
  // AFTER VIEW INIT - Asegurar que los gráficos estén listos
  // ========================================
  
  ngAfterViewInit() {
    // Los gráficos deberían estar disponibles después de que la vista se inicialice
    // Agregar un delay para asegurar que Chart.js haya renderizado completamente
    setTimeout(() => {
      this.logger.log('✅ Vista inicializada, gráficos listos para exportar');
      
      // Verificar que los canvas estén disponibles
      const canvases = document.querySelectorAll('canvas[data-chart]');
      this.logger.log(`📊 Canvas encontrados: ${canvases.length}`);
      canvases.forEach((canvas, index) => {
        const chartType = canvas.getAttribute('data-chart');
        this.logger.log(`  - Canvas ${index + 1}: ${chartType}`);
      });
    }, 1000);
  }

  // ========================================
  // EXPORTAR GRÁFICOS COMO IMAGEN
  // ========================================

  exportarGraficoComoImagen(chartType: string, nombreArchivo: string, chartRef?: BaseChartDirective) {
    // Función auxiliar para obtener el canvas con reintentos
    const obtenerCanvas = (intentos: number = 0): Promise<HTMLCanvasElement | null> => {
      return new Promise((resolve) => {
        let canvas: HTMLCanvasElement | null = null;
        
        // Método 1: Intentar desde ViewChild si está disponible
        if (chartRef && chartRef.chart && chartRef.chart.canvas) {
          canvas = chartRef.chart.canvas;
          this.logger.log(`✅ Canvas obtenido desde ViewChild: ${nombreArchivo}`);
          resolve(canvas);
          return;
        }
        
        // Método 2: Buscar el canvas por el atributo data-chart
        try {
          const foundCanvas = document.querySelector(`canvas[data-chart="${chartType}"]`) as HTMLCanvasElement;
          if (foundCanvas) {
            canvas = foundCanvas;
            this.logger.log(`✅ Canvas encontrado por atributo data-chart: ${nombreArchivo}`);
            resolve(canvas);
            return;
          }
        } catch (error) {
          this.logger.error(`❌ Error al buscar canvas por data-chart:`, error);
        }
        
        // Método 3: Buscar todos los canvas y encontrar el correcto
        if (!canvas && intentos < 2) {
          try {
            const allCanvases = document.querySelectorAll('canvas');
            for (const c of Array.from(allCanvases)) {
              const chartAttr = c.getAttribute('data-chart');
              if (chartAttr === chartType) {
                canvas = c as HTMLCanvasElement;
                this.logger.log(`✅ Canvas encontrado buscando en todos: ${nombreArchivo}`);
                resolve(canvas);
                return;
              }
            }
          } catch (error) {
            this.logger.error(`❌ Error al buscar en todos los canvas:`, error);
          }
        }
        
        // Si no se encontró y aún hay intentos, esperar y reintentar
        if (!canvas && intentos < 3) {
          this.logger.warn(`⚠️ Canvas no encontrado (intento ${intentos + 1}/3), reintentando...`);
          setTimeout(() => resolve(obtenerCanvas(intentos + 1)), 300);
        } else {
          resolve(null);
        }
      });
    };
    
    // Intentar obtener el canvas y exportar
    obtenerCanvas().then(canvas => {
      if (!canvas) {
        this.logger.error(`❌ No se pudo obtener el canvas después de varios intentos: ${nombreArchivo}`);
        alert('Error: El gráfico no está disponible. Por favor, asegúrate de que los gráficos se hayan cargado completamente e intenta de nuevo.');
        return;
      }
      
      try {
        // Obtener las dimensiones reales del canvas
        const width = canvas.width || canvas.offsetWidth * (window.devicePixelRatio || 1) || 800;
        const height = canvas.height || canvas.offsetHeight * (window.devicePixelRatio || 1) || 400;
        
        // Crear un canvas temporal con fondo blanco
        const canvasTemp = document.createElement('canvas');
        canvasTemp.width = width;
        canvasTemp.height = height;
        const ctxTemp = canvasTemp.getContext('2d');
        
        if (!ctxTemp) {
          this.logger.error('❌ No se pudo obtener el contexto 2D del canvas temporal');
          alert('Error: No se pudo crear el canvas temporal para la exportación.');
          return;
        }
        
        // Dibujar fondo blanco sólido primero
        ctxTemp.fillStyle = '#FFFFFF';
        ctxTemp.fillRect(0, 0, canvasTemp.width, canvasTemp.height);
        
        // Dibujar el canvas original sobre el fondo blanco
        ctxTemp.drawImage(canvas, 0, 0, canvas.width, canvas.height, 
                         0, 0, canvasTemp.width, canvasTemp.height);
        
        // Procesar los píxeles para reemplazar el fondo oscuro con blanco
        // Leer los píxeles del canvas temporal
        const imageData = ctxTemp.getImageData(0, 0, canvasTemp.width, canvasTemp.height);
        const data = imageData.data;
        
        // Reemplazar píxeles oscuros del fondo con blanco
        // El fondo oscuro generalmente tiene una luminosidad muy baja
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          
          // Calcular la luminosidad del píxel (fórmula estándar)
          const luminosidad = (r * 0.299 + g * 0.587 + b * 0.114);
          
          // Si el píxel es muy oscuro (luminosidad < 80) y tiene alta opacidad (a > 150),
          // probablemente es parte del fondo oscuro. Reemplazarlo con blanco.
          // Ajustamos el umbral para ser más agresivo en la detección del fondo oscuro
          if (luminosidad < 80 && a > 150) {
            // Verificar si es realmente un color oscuro (gris/negro) y no un color del gráfico
            // Los colores del gráfico (rojo, naranja, verde, azul) tienen mayor saturación
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const saturacion = max === 0 ? 0 : (max - min) / max;
            
            // Si la saturación es baja (color grisáceo/negro) y es oscuro, es probablemente fondo
            if (saturacion < 0.3) {
              // Reemplazar con blanco
              data[i] = 255;     // R
              data[i + 1] = 255; // G
              data[i + 2] = 255; // B
              data[i + 3] = 255; // A (opaco)
            }
          }
        }
        
        // Escribir los píxeles procesados de vuelta al canvas temporal
        ctxTemp.putImageData(imageData, 0, 0);
        
        // Exportar el canvas temporal como imagen PNG
        const url = canvasTemp.toDataURL('image/png', 1.0);
        
        if (!url || url === 'data:,' || url.length < 100) {
          this.logger.error(`❌ URL de imagen inválida para: ${nombreArchivo}, longitud: ${url?.length || 0}`);
          alert('Error: No se pudo generar la imagen del gráfico. Por favor, intenta de nuevo.');
          return;
        }
        
        // Crear un elemento <a> temporal para descargar
        const link = document.createElement('a');
        const fecha = new Date().toISOString().split('T')[0];
        link.download = `${nombreArchivo}_${fecha}.png`;
        link.href = url;
        link.style.display = 'none';
        
        // Agregar al DOM, hacer click y remover
        document.body.appendChild(link);
        link.click();
        
        // Esperar un momento antes de remover para asegurar que la descarga inicie
        setTimeout(() => {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
          this.logger.log(`✅ Gráfico "${nombreArchivo}" exportado exitosamente con fondo blanco`);
        }, 100);
        
      } catch (error) {
        this.logger.error('Error al exportar gráfico:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        alert(`Error al exportar el gráfico: ${errorMessage}. Por favor, intenta de nuevo.`);
      }
    });
  }

  exportarGraficoRiesgo() {
    this.exportarGraficoComoImagen('riesgo', 'Solicitudes_por_Riesgo', this.chartRiesgo);
  }

  exportarGraficoLocalidad() {
    this.exportarGraficoComoImagen('localidad', 'Solicitudes_por_Localidad', this.chartLocalidad);
  }

  exportarGraficoTiempoTramite() {
    this.exportarGraficoComoImagen('tiempo', 'Tiempo_Registro_por_Tramite', this.chartTiempoTramite);
  }

  exportarGraficoAcciones() {
    this.exportarGraficoComoImagen('acciones', 'Acciones_sobre_Solicitudes', this.chartAcciones);
  }
}
