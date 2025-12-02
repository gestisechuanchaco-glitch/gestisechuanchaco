import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, retry, map } from 'rxjs/operators';
import { LogService } from './log.service';

// ============================================
// INTERFACES
// ============================================

export interface User {
  id: number;
  username: string;
  fullName: string;
  roleId: number;
  createdAt: string;
  password?: string;
}

export interface Role {
  id: number;
  name: string;
}

export interface Solicitud {
  id: number;
  rol?: string;
  nombres_apellidos?: string;
  dni_ce?: string;
  estado?: string;
  numerodeexpediente?: string;
  razon_social?: string;
  inspector_asignado?: string;
  [key: string]: any;
}

export interface RiesgoPrediccion {
  nivelRiesgo: string;
  anexosFaltantes: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class MlService {
  private apiUrl = 'http://localhost:3000';
  
  // Estado de carga para mostrar loaders
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient, private logger: LogService) {}

  // ============================================
  // MÉTODOS AUXILIARES
  // ============================================

  /**
   * Muestra el estado de carga
   */
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  /**
   * Maneja errores HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error ${error.status}: ${error.error?.message || error.message}`;
    }

    this.logger.error('Error en la petición:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Obtiene el estado de carga actual
   */
  isLoading(): boolean {
    return this.loadingSubject.value;
  }

  /**
   * Verifica si el servicio está disponible
   */
  checkHealth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`).pipe(
      catchError(() => throwError(() => new Error('Servicio no disponible')))
    );
  }

  // ============================================
  // USUARIOS Y ROLES (TU LÓGICA ORIGINAL)
  // ============================================

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/api/usuarios`);
  }

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/api/roles`);
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/api/usuarios`, user);
  }

  updateUser(user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/api/usuarios/${user.id}`, user);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/usuarios/${id}`);
  }

  changePassword(id: number, newPassword: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/api/usuarios/${id}/password`, { password: newPassword });
  }

  // ============================================
  // SOLICITUDES (TU LÓGICA ORIGINAL)
  // ============================================

  enviarSolicitud(solicitud: any, archivos: File[], usuarioLogueado: string): Observable<any> {
    const datos: { [key: string]: any } = {
      rol: solicitud.rol,
      nombres_apellidos: solicitud.nombres_apellidos,
      dni_ce: solicitud.dni_ce,
      domicilio: solicitud.domicilio,
      correo: solicitud.correo,
      telefonos: solicitud.telefonos,
      tipo_tramite: solicitud.tipo_tramite,
      tipo_itse: solicitud.tipo_itse,
      tipo_ecse: solicitud.tipo_ecse,
      razon_social: solicitud.razon_social,
      ruc: solicitud.ruc,
      nombre_comercial: solicitud.nombre_comercial,
      telefonos_establecimiento: solicitud.telefonos_establecimiento,
      direccion: solicitud.direccion,
      referencia: solicitud.referencia,
      localidad: solicitud.localidad,
      distrito: solicitud.distrito,
      provincia: solicitud.provincia,
      departamento: solicitud.departamento,
      giro_actividades: solicitud.giro_actividades,
      horario_atencion: solicitud.horario_atencion,
      area_ocupada: solicitud.area_ocupada,
      num_pisos: solicitud.num_pisos,
      piso_ubicado: solicitud.piso_ubicado,
      area_terreno: solicitud.area_terreno,
      area_techada_por_nivel: solicitud.area_techada_por_nivel,
      area_libre: solicitud.area_libre,
      riesgo_incendio: solicitud.riesgo_incendio,
      riesgo_detalle: solicitud.riesgo_detalle,
      inspector_asignado: solicitud.inspector_asignado,
      latitud: solicitud.latitud,
      longitud: solicitud.longitud,
      creadoPor: usuarioLogueado
    };

    const formData = new FormData();
    Object.keys(datos).forEach(key => {
      if (datos[key] !== undefined && datos[key] !== null) formData.append(key, datos[key]);
    });
    archivos.forEach(file => formData.append('archivos', file));
    if (solicitud.docsSeleccionados) {
      formData.append('docsSeleccionados', JSON.stringify(solicitud.docsSeleccionados));
    }
    return this.http.post(`${this.apiUrl}/api/solicitud`, formData);
  }

  predecirRiesgo(datos: any, anexosSubidos: string[]): Observable<{ nivelRiesgo: string; anexosFaltantes: string[] }> {
    return this.http.post<{ nivelRiesgo: string; anexosFaltantes: string[] }>(
      `${this.apiUrl}/api/predict-riesgo`,
      { datos, anexosSubidos }
    );
  }

  guardarSolicitud(datos: any): Observable<any> {
    if (datos.archivos && datos.archivos.length > 0 && datos.archivos[0] instanceof File) {
      const formData = new FormData();
      for (let key in datos) {
        if (key !== 'archivos' && datos[key] !== undefined && datos[key] !== null) {
          formData.append(key, datos[key]);
        }
      }
      for (let i = 0; i < datos.archivos.length; i++) {
        formData.append('archivos', datos.archivos[i]);
      }
      if (datos.docsSeleccionados) {
        formData.append('docsSeleccionados', JSON.stringify(datos.docsSeleccionados));
      }
      return this.http.post(`${this.apiUrl}/api/solicitud`, formData);
    }
    return this.http.post(`${this.apiUrl}/api/solicitud`, datos);
  }

  obtenerSolicitudes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/solicitudes`);
  }

  aprobarSolicitud(id: number, modificadoPor: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/solicitud/${id}/aprobar`, { modificadoPor });
  }

  editarExpediente(datos: any): Observable<any> {
    if (datos instanceof FormData) {
      return this.http.put(`${this.apiUrl}/api/solicitud/${datos.get('id')}/editar`, datos);
    }
    return this.http.put(`${this.apiUrl}/api/solicitud/${datos.id}/editar`, datos);
  }

  editarSolicitud(datos: any): Observable<any> {
    if (datos.archivo && datos.archivo instanceof File) {
      const formData = new FormData();
      for (let key in datos) {
        if (key !== 'archivo' && datos[key] !== undefined && datos[key] !== null) {
          formData.append(key, datos[key]);
        }
      }
      formData.append('archivo', datos.archivo);
      return this.http.put(`${this.apiUrl}/api/solicitud/${datos.id}/editar`, formData);
    }
    return this.http.put(`${this.apiUrl}/api/solicitud/${datos.id}/editar`, datos);
  }

  editarSolicitudConArchivo(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/solicitud/${id}/editar`, formData);
  }

  marcarPendiente(id: number, modificadoPor: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/solicitud/${id}/estado`, { estado: 'PENDIENTE', modificadoPor });
  }

  actualizarEstadoSolicitud(id: number, estado: string, motivo_rechazo?: string) {
    return this.http.put(`${this.apiUrl}/api/solicitud/${id}/estado`, { estado, motivo_rechazo });
  }

  obtenerHistorial(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/historial`);
  }

  subirArchivosSolicitud(id: number, archivos: File[]): Observable<any> {
    const formData = new FormData();
    archivos.forEach(file => formData.append('archivos', file));
    return this.http.post(`${this.apiUrl}/api/solicitud/${id}/archivos`, formData);
  }

  eliminarSolicitud(id: number) {
    return this.http.delete(`${this.apiUrl}/api/solicitud/${id}`);
  }

  obtenerSolicitudPorId(id: number | string) {
    return this.http.get(`${this.apiUrl}/api/solicitud/${id}`);
  }

  obtenerInspeccionesPorInspector(inspector: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/inspecciones?inspector=${encodeURIComponent(inspector || '')}`);
  }

  obtenerExpedientesPorInspector(inspector: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/expedientes-inspector?inspector=${encodeURIComponent(inspector || '')}`);
  }

  subirEvidenciaInspeccion(formData: FormData) {
    return this.http.post(`${this.apiUrl}/api/evidencia-inspeccion`, formData);
  }

  guardarPanelFotografico(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/panel-fotografico`, formData);
  }

  getSolicitudPorNumeroExpediente(numerodeexpediente: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/solicitud-expediente/${encodeURIComponent(numerodeexpediente)}`);
  }

  obtenerInforme(solicitudId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/informe/${solicitudId}`);
  }

  obtenerInformesInspector(inspector: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/informes-inspector?inspector=${encodeURIComponent(inspector || '')}`);
  }

  obtenerLocales(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/locales`);
  }

  eliminarArchivoSolicitud(idSolicitud: number, archivoNombre: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/solicitud/${idSolicitud}/archivo`, {
      params: { archivoNombre }
    });
  }

  obtenerDetalleSolicitud(id: number | string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/solicitud/${id}`);
  }

  // ✅ CORREGIDO: BUSCAR SOLICITUD POR EXPEDIENTE (PARA LOCALES)
  obtenerDetallePorExpediente(expediente: string): Observable<any> {
    this.logger.log('[obtenerDetallePorExpediente] Buscando expediente:', expediente);
    return this.http.get(`${this.apiUrl}/api/solicitud/expediente/${encodeURIComponent(expediente)}`).pipe(
      tap(response => this.logger.log('[obtenerDetallePorExpediente] Respuesta:', response)),
      catchError(error => {
        this.logger.error('[obtenerDetallePorExpediente] Error:', error);
        return throwError(() => error);
      })
    );
  }

  cambiarEstado(id: number, estado: string) {
    return this.actualizarEstadoSolicitud(id, estado);
  }

  editarSolicitudExpediente(datos: any) {
    return this.http.put(`${this.apiUrl}/api/solicitud/${datos.id}/editar-expediente`, datos);
  }

  eliminarPanelFotografico(panelId: number) {
    return this.http.delete(`${this.apiUrl}/api/panel-fotografico/${panelId}`);
  }

  // Métodos para Panel Fotográfico actualizado
  subirFotoPanelFotografico(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/panel-fotografico`, formData);
  }

  obtenerFotosPanelFotografico(solicitudId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/panel-fotografico/${solicitudId}`);
  }

  eliminarFotoPanelFotografico(fotoId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/panel-fotografico/${fotoId}`);
  }

  getErroresEmision() {
    return this.http.get<{ errores: number }>(`${this.apiUrl}/api/errores-emision`);
  }

  getErroresEmisionDetalle(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/errores-emision-detalle`);
  }

  actualizarCheckAdministrativo(id: number, check: number) {
    return this.http.put(`${this.apiUrl}/api/solicitud/${id}/check_administrativo`, { check_administrativo: check });
  }

  actualizarCheckAdministrador(id: number, valor: number) {
    return this.http.put(`${this.apiUrl}/api/solicitud/${id}/check_administrador`, { check_administrador: valor });
  }

  finalizarSolicitud(id: number) {
    return this.http.put(`${this.apiUrl}/api/solicitud/${id}/estado`, { estado: 'FINALIZADO' });
  }

  guardarNumeroResolucionYCertificado(payload: { solicitud_id: number; numero_resolucion?: string; numero_certificado?: string; }) {
    return this.http.post<any>(`${this.apiUrl}/api/reporte`, payload);
  }

  obtenerDetalleLocalPorExpediente(expediente: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/locales/${encodeURIComponent(expediente)}/detalle`);
  }

  registrarSesion(usuarioId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/perfil/${usuarioId}/ultima-sesion`, {});
  }
  // ✅ OBTENER DETALLE COMPLETO DEL LOCAL (CON DATOS DE SOLICITUD)
obtenerDetalleLocal(expediente: string): Observable<any> {
  this.logger.log('[obtenerDetalleLocal] Expediente:', expediente);
  return this.http.get<any>(`${this.apiUrl}/api/locales/${expediente}/detalle`).pipe(
    tap(response => this.logger.log('[obtenerDetalleLocal] Respuesta:', response)),
    catchError(error => {
      this.logger.error('[obtenerDetalleLocal] Error:', error);
      return throwError(() => error);
    })
  );
}

  // ✅ MÉTODO PARA OBTENER REPORTE POR SOLICITUD_ID
  obtenerReportePorSolicitudId(solicitudId: number): Observable<any> {
    this.logger.log('[obtenerReportePorSolicitudId] Buscando reporte para solicitud:', solicitudId);
    return this.http.get(`${this.apiUrl}/api/reporte/${solicitudId}`).pipe(
      tap(response => this.logger.log('[obtenerReportePorSolicitudId] Respuesta:', response)),
      catchError(error => {
        this.logger.error('[obtenerReportePorSolicitudId] Error:', error);
        return throwError(() => error);
      })
    );
  }

  // 📧 OBTENER LOG DE NOTIFICACIONES ENVIADAS
  obtenerLogNotificaciones(solicitudId?: number, limit: number = 50): Observable<any[]> {
    let url = `${this.apiUrl}/api/notificaciones-log?limit=${limit}`;
    if (solicitudId) {
      url += `&solicitud_id=${solicitudId}`;
    }
    return this.http.get<any[]>(url);
  }

  // 📊 OBTENER ESTADÍSTICAS DE NOTIFICACIONES
  obtenerEstadisticasNotificaciones(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/notificaciones-log/estadisticas`);
  }

  // 📅 OBTENER EVENTOS DEL CALENDARIO
  obtenerEventosCalendario(tipo?: string, inspectorId?: string): Observable<any[]> {
    let url = `${this.apiUrl}/api/calendario/eventos`;
    const params: any = {};
    if (tipo && tipo !== 'todos') {
      params.tipo = tipo;
    }
    if (inspectorId) {
      params.inspector = inspectorId;
    }
    return this.http.get<any[]>(url, { params });
  }
}