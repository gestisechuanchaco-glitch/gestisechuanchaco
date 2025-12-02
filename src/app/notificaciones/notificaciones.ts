import { Component, OnInit, OnDestroy } from '@angular/core';
import { MlService } from '../service/mi.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { LogService } from '../service/log.service';

@Component({
  selector: 'app-notificaciones',
  templateUrl: './notificaciones.html',
  styleUrls: ['./notificaciones.css'],
  imports: [CommonModule, FormsModule]
})
export class NotificacionesComponent implements OnInit, OnDestroy {
  notificaciones: any[] = [];
  showNotifications: boolean = false;
  usuarioActual = {
    id: 123,
    nombre: 'JUAN PEREZ',
    username: 'juanperez',
    rol: 'inspector' // 'inspector' | 'administrativo' | 'administrador'
  };

  // Polling / snapshot
  private pollIntervalMs = 15000; // 15s (ajusta si quieres)
  private pollHandle: any = null;
  private snapshotKey = 'noti_snapshot';
  private leidasKey = 'notificacionesLeidas';

  constructor(private miService: MlService, private logger: LogService) {}

  ngOnInit() {
    this.cargarNotificaciones();
    // iniciar polling
    this.pollHandle = setInterval(() => this.cargarNotificaciones(), this.pollIntervalMs);
  }

  ngOnDestroy() {
    if (this.pollHandle) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    // cuando se abre, se podría refrescar inmediatamente
    if (this.showNotifications) this.cargarNotificaciones();
  }

  get notificacionesNoLeidasCount(): number {
    return Array.isArray(this.notificaciones) ? this.notificaciones.filter(n => !n.leida).length : 0;
  }

  /**
   * Cargar solicitudes y detectar transiciones para generar notificaciones (solo para el usuario actual)
   */
  cargarNotificaciones() {
    this.logger.log('[notificaciones] Cargando notificaciones (fetch solicitudes)...');

    this.miService.obtenerSolicitudes().subscribe({
      next: (solicitudes: any[]) => {
        try {
          this.logger.log('[notificaciones] solicitudes recibidas:', solicitudes?.length ?? 0);

          // snapshot previo (expediente -> data)
          const prevSnapshot = this._loadSnapshot();

          // nuevo snapshot que guardaremos al final
          const newSnapshot: Record<string, any> = {};

          // Lista temporal de notificaciones detectadas ahora
          const nuevasNotis: any[] = [];

          // recorrer cada solicitud y detectar eventos comparando snapshot
          (solicitudes || []).forEach(s => {
            const expediente = s?.expediente ?? s?.numerodeexpediente ?? '';
            if (!expediente) return;

            // normalizar campos que vamos a comparar
            const curr = {
              expediente,
              inspector_asignado: s?.inspector_asignado ?? s?.inspector ?? null,
              estado: (s?.estado ?? s?.estado_licencia ?? s?.status ?? '').toString(),
              fecha: s?.fecha ?? s?.updatedAt ?? new Date().toISOString(),
              raw: s
            };

            const prev = prevSnapshot[expediente] ?? null;

            // Guardar en nuevo snapshot
            newSnapshot[expediente] = {
              inspector_asignado: curr.inspector_asignado,
              estado: curr.estado,
              fecha: curr.fecha
            };

            // ---------- DETECCIÓN DE TRANSICIONES ----------

            // 1) ASIGNACIÓN: inspector_asignado cambia de vacío/null a un valor
            const prevInspector = prev?.inspector_asignado ?? null;
            const currInspector = curr.inspector_asignado ?? null;
            if ((!prevInspector || prevInspector === '') && currInspector) {
              // notificar al inspector asignado y al administrador
              const noti = {
                id: `asignacion_${expediente}_${Date.now()}`,
                tipo: 'asignacion',
                titulo: 'Solicitud asignada',
                mensaje: `Se te ha asignado la solicitud ${expediente}`,
                fecha: curr.fecha,
                leida: false,
                expediente,
                inspectorAsignado: currInspector,
                // indicamos destinatarios para debug, pero se filtrará abajo según usuarioActual
                targets: { roles: ['administrador'], users: [currInspector] }
              };
              if (this._shouldShowNotificationForCurrentUser(noti, s)) {
                nuevasNotis.push(noti);
                this.logger.log('[notificaciones] detectada ASIGNACION ->', noti);
              }
            }

            // 2) CAMBIO DE ESTADO: inspección por parte del inspector
            // Detectar aceptación/observación/rechazo por parte del inspector
            const prevEstado = prev?.estado ?? '';
            const currEstado = curr.estado ?? '';

            // utilidad: normalizar lowercase
            const pe = (prevEstado ?? '').toString().toLowerCase();
            const ce = (currEstado ?? '').toString().toLowerCase();

            const isAccepted = (st: string) => /list|acept|aprob/i.test(st);
            const isObserved = (st: string) => /observ|obs/i.test(st);
            const isRejected = (st: string) => /rechaz/i.test(st);
            const isDeleted = (st: string) => /borr|elimin/i.test(st);

            // inspector ha aprobado (ej. estado cambia a "Listo" / "Aprobado")
            if (!isAccepted(pe) && isAccepted(ce)) {
              const noti = {
                id: `inspector_acepta_${expediente}_${Date.now()}`,
                tipo: 'inspector_acepta',
                titulo: 'Solicitud revisada por inspector',
                mensaje: `El inspector ha marcado como aprobada la solicitud ${expediente}`,
                fecha: curr.fecha,
                leida: false,
                expediente,
                targets: { roles: ['administrativo', 'administrador'], users: [] }
              };
              if (this._shouldShowNotificationForCurrentUser(noti, s)) {
                nuevasNotis.push(noti);
                this.logger.log('[notificaciones] detectada ACEPTACION POR INSPECTOR ->', noti);
              }
            }

            // inspector observó (ej. estado contiene 'observ')
            if (!isObserved(pe) && isObserved(ce)) {
              const noti = {
                id: `inspector_observo_${expediente}_${Date.now()}`,
                tipo: 'inspector_observa',
                titulo: 'Solicitud observada por inspector',
                mensaje: `El inspector dejó observaciones en la solicitud ${expediente}`,
                fecha: curr.fecha,
                leida: false,
                expediente,
                targets: { roles: ['administrativo', 'administrador'], users: [] }
              };
              if (this._shouldShowNotificationForCurrentUser(noti, s)) {
                nuevasNotis.push(noti);
                this.logger.log('[notificaciones] detectada OBSERVACION POR INSPECTOR ->', noti);
              }
            }

            // inspector rechazó
            if (!isRejected(pe) && isRejected(ce)) {
              const noti = {
                id: `inspector_rechaza_${expediente}_${Date.now()}`,
                tipo: 'inspector_rechaza',
                titulo: 'Solicitud rechazada por inspector',
                mensaje: `El inspector rechazó la solicitud ${expediente}`,
                fecha: curr.fecha,
                leida: false,
                expediente,
                targets: { roles: ['administrativo', 'administrador'], users: [] }
              };
              if (this._shouldShowNotificationForCurrentUser(noti, s)) {
                nuevasNotis.push(noti);
                this.logger.log('[notificaciones] detectada RECHAZO POR INSPECTOR ->', noti);
              }
            }

            // administrativo acepta (detectamos si estado cambia a algo que contenga "admin" o "aprob" después de paso administrativo)
            // buscamos en el objeto raw si hay claves típicas: estado_admin, admin_estado, aprobado_por_admin
            const prevEstadoAdmin = prev?.estado_admin ?? (prev?.estado ?? '');
            const currEstadoAdmin = (s?.estado_admin ?? s?.estado ?? '').toString();

            const pea = (prevEstadoAdmin ?? '').toString().toLowerCase();
            const cea = (currEstadoAdmin ?? '').toString().toLowerCase();

            // detectar aceptación administrativa (heurística)
            if (!/aprob|acept/i.test(pea) && /aprob|acept/i.test(cea)) {
              const noti = {
                id: `admin_acepta_${expediente}_${Date.now()}`,
                tipo: 'admin_acepta',
                titulo: 'Aprobación administrativa',
                mensaje: `El administrativo/aprobador aprobó la solicitud ${expediente}`,
                fecha: curr.fecha,
                leida: false,
                expediente,
                targets: { roles: ['administrador'], users: [] }
              };
              if (this._shouldShowNotificationForCurrentUser(noti, s)) {
                nuevasNotis.push(noti);
                this.logger.log('[notificaciones] detectada ACEPTACION ADMINISTRATIVO ->', noti);
              }
            }

            // detectamos borrado (solo para admin)
            if (!isDeleted(pe) && isDeleted(ce)) {
              const noti = {
                id: `borrado_${expediente}_${Date.now()}`,
                tipo: 'borrado',
                titulo: 'Solicitud borrada',
                mensaje: `La solicitud ${expediente} fue borrada`,
                fecha: curr.fecha,
                leida: false,
                expediente,
                targets: { roles: ['administrador'], users: [] }
              };
              if (this._shouldShowNotificationForCurrentUser(noti, s)) {
                nuevasNotis.push(noti);
                this.logger.log('[notificaciones] detectado BORRADO ->', noti);
              }
            }

          }); // end forEach solicitudes

          // MERGE: añadir notificaciones nuevas (sin duplicar por id)
          const existentesIds = new Set(this.notificaciones.map(n => n.id));
          nuevasNotis.forEach(n => {
            if (!existentesIds.has(n.id)) {
              this.notificaciones.unshift(n); // las nuevas al inicio
            }
          });

          // Restaurar read flags y persistir
          const leidas = JSON.parse(localStorage.getItem(this.leidasKey) || '[]');
          this.notificaciones.forEach(n => {
            n.leida = !!leidas.includes(n.id);
          });

          // Mantener orden por fecha
          this.notificaciones.sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

          // Guardar snapshot nuevo
          this._saveSnapshot(newSnapshot);

          this.logger.log('[notificaciones] notificaciones actuales:', this.notificaciones.length);
        } catch (procErr) {
          this.logger.error('[notificaciones] error procesando solicitudes:', procErr);
        }
      },
      error: (err) => {
        this.logger.error('[notificaciones] error al obtener solicitudes:', err);
      }
    });
  }

  /**
   * Determina si la notificación debe mostrarse al usuario actual (según rol y asignación)
   * - administrador ve todo
   * - inspector ve asignaciones a él y notificaciones relacionadas a sus expedientes (si queremos)
   * - administrativo ve notificaciones de inspector (acepta/observa) y otros eventos administrativos
   */
  private _shouldShowNotificationForCurrentUser(noti: any, solicitudRaw: any): boolean {
    try {
      const rol = this.usuarioActual?.rol ?? '';
      if (!rol) return false;

      // administrador ve todo
      if (rol === 'administrador') return true;

      // inspector: solo notificaciones tipo 'asignacion' dirigidas a él (comparar por id/nombre/username)
      if (rol === 'inspector') {
        if (noti.tipo === 'asignacion') {
          const assigned = noti.inspectorAsignado;
          if (!assigned) return false;
          const matches =
            String(assigned) === String(this.usuarioActual.id) ||
            String(assigned).toLowerCase() === String(this.usuarioActual.nombre).toLowerCase() ||
            String(assigned).toLowerCase() === String(this.usuarioActual.username).toLowerCase();
          return matches;
        }
        // También permitimos que el inspector vea notificaciones relacionadas a su expediente (opcional)
        // Aquí devolvemos false para que inspector reciba solo asignaciones
        return false;
      }

      // administrativo: le deben aparecer notificaciones cuando inspector acepta/observa/rechaza (tipo inspector_acepta / inspector_observa / inspector_rechaza)
      if (rol === 'administrativo') {
        return ['inspector_acepta', 'inspector_observa', 'inspector_rechaza'].includes(noti.tipo);
      }

      return false;
    } catch (err) {
      this.logger.error('[notificaciones] _shouldShowNotificationForCurrentUser error:', err);
      return false;
    }
  }

  // Marcar notificación como leída (persistir)
  marcarLeida(noti: any) {
    try {
      noti.leida = true;
      const leidas: string[] = JSON.parse(localStorage.getItem(this.leidasKey) || '[]');
      if (!leidas.includes(noti.id)) {
        leidas.push(noti.id);
        localStorage.setItem(this.leidasKey, JSON.stringify(leidas));
      }
    } catch (err) {
      this.logger.error('[notificaciones] marcarLeida error:', err);
    }
  }

  // Eliminar notificación de la lista (local)
  eliminarNoti(noti: any) {
    const idx = this.notificaciones.indexOf(noti);
    if (idx > -1) this.notificaciones.splice(idx, 1);
  }

  // ---------- Helpers para snapshot ----------
  private _loadSnapshot(): Record<string, any> {
    try {
      const raw = localStorage.getItem(this.snapshotKey);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (err) {
      this.logger.error('[notificaciones] _loadSnapshot parse error:', err);
      return {};
    }
  }

  private _saveSnapshot(snapshot: Record<string, any>) {
    try {
      localStorage.setItem(this.snapshotKey, JSON.stringify(snapshot));
    } catch (err) {
      this.logger.error('[notificaciones] _saveSnapshot error:', err);
    }
  }
}