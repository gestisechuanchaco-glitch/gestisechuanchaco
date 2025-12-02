import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Servicio centralizado de logging
 * Solo muestra logs en ambiente de desarrollo
 */
@Injectable({ providedIn: 'root' })
export class LogService {
  
  /**
   * Log informativo (equivalente a console.log)
   */
  log(...args: any[]): void {
    if (environment.enableLogs) {
      console.log(...args);
    }
  }

  /**
   * Log de error (equivalente a console.error)
   */
  error(...args: any[]): void {
    if (environment.enableLogs) {
      console.error(...args);
    }
  }

  /**
   * Log de advertencia (equivalente a console.warn)
   */
  warn(...args: any[]): void {
    if (environment.enableLogs) {
      console.warn(...args);
    }
  }

  /**
   * Log de información (equivalente a console.info)
   */
  info(...args: any[]): void {
    if (environment.enableLogs) {
      console.info(...args);
    }
  }

  /**
   * Log de tabla (equivalente a console.table)
   */
  table(data: any): void {
    if (environment.enableLogs) {
      console.table(data);
    }
  }

  /**
   * Agrupa logs (equivalente a console.group)
   */
  group(label: string): void {
    if (environment.enableLogs) {
      console.group(label);
    }
  }

  /**
   * Cierra grupo de logs (equivalente a console.groupEnd)
   */
  groupEnd(): void {
    if (environment.enableLogs) {
      console.groupEnd();
    }
  }
}










