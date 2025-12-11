import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { LogService } from './service/log.service';
import { MlService } from './service/mi.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule, HttpClientModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit, OnDestroy {
  public esLogin: boolean = false;
  public rol: 'Administrativo' | 'Inspector' | 'Administrador' | null = null;
  public sidebarCollapsed: boolean = false;
  public mobileMenuOpen: boolean = false;
  public showUserMenu: boolean = false;
  public showNotifications: boolean = false;
  public showSettings: boolean = false;
  
  public currentTheme: 'light' | 'dark' = 'light';
  public searchQuery: string = '';
  public pageTitle: string = 'Dashboard';
  public notificaciones: any[] = [];
  public fotoPerfilUrl: string = ''; 
  
  // Eventos próximos del calendario
  public eventosProximos: any[] = [];
  public tieneEventosProximos: boolean = false;
  
  // Notificación global de eventos
  public mostrarNotificacionEventos: boolean = false;
  public eventoNotificacionPrincipal: any = null;
  private eventosAtendidos: Set<string> = new Set(); // IDs de eventos marcados como atendidos
  
  private apiUrl = `${environment.apiUrl}/api`;
  private pollingInterval: any = null;
  private eventosInterval: any = null;
  private fotoPerfilEventHandler = (event: Event) => {
    const customEvent = event as CustomEvent;
    if (customEvent.detail?.fotoUrl) {
      this.logger.log('🔄 Evento foto_perfil_actualizada recibido:', customEvent.detail.fotoUrl);
      // Actualizar inmediatamente desde el detalle del evento
      const fotoUrl = this.normalizarFotoUrl(customEvent.detail.fotoUrl);
      this.fotoPerfilUrl = `${fotoUrl}${fotoUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
      this.logger.log('✅ Foto actualizada desde evento:', this.fotoPerfilUrl);
    } else {
      // Si no hay detalle, recargar desde backend
      this.cargarFotoPerfil(true);
    }
  };
  private closeFiltersEvent = () => window.dispatchEvent(new Event('close_filters'));

  constructor(private router: Router, private location: Location, private http: HttpClient, public logger: LogService, private miService: MlService) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
      
        document.body.setAttribute('data-route', event.url);
        
        this.esLogin = this.router.url === '/' || this.router.url === '/login';
        
        const rolLS = localStorage.getItem('rol');
        this.rol = rolLS === 'Administrativo' || rolLS === 'Inspector' || rolLS === 'Administrador'
          ? rolLS as any
          : null;

        if (
          (this.rol === 'Administrativo' || this.rol === 'Administrador') &&
          (this.router.url === '/' || this.router.url === '/bienvenido')
        ) {
          this.router.navigate(['/dashboard']);
        }
        
        this.actualizarTituloPagina(event.url);
        
        // ⭐ Recargar foto de perfil cuando se navega (especialmente al salir del perfil)
        this.cargarFotoPerfil();
        
        this.cerrarMenus();
      }
    });

    this.esLogin = this.router.url === '/' || this.router.url === '/login';
    const rolLS = localStorage.getItem('rol');
    this.rol = rolLS === 'Administrativo' || rolLS === 'Inspector' || rolLS === 'Administrador'
      ? rolLS as any
      : null;

    if (
      (this.rol === 'Administrativo' || this.rol === 'Administrador') &&
      (this.router.url === '/' || this.router.url === '/bienvenido')
    ) {
      this.router.navigate(['/dashboard']);
    }

    this.actualizarTituloPagina(this.router.url);
  }

  ngOnInit() {
    // Escuchar actualizaciones explícitas de foto de perfil
    window.addEventListener('foto_perfil_actualizada', this.fotoPerfilEventHandler);

    // Manejar redirección desde 404.html (GitHub Pages)
    const redirectPath = sessionStorage.getItem('redirectPath');
    if (redirectPath) {
      sessionStorage.removeItem('redirectPath');
      // Usar setTimeout para asegurar que Angular esté completamente inicializado
      setTimeout(() => {
        this.router.navigateByUrl(redirectPath, { replaceUrl: true });
      }, 0);
    }
    
    // Cargar eventos atendidos desde localStorage
    this.cargarEventosAtendidos();
    
    this.cargarTema();
    this.cargarDatosUsuario(); 
    this.cargarFotoPerfil(); 
    this.cargarNotificaciones();
    
    // Cargar eventos próximos después de un pequeño delay
    setTimeout(() => {
      this.cargarEventosProximos();
    }, 800); // Esperar 800ms para que todo esté cargado
    
    // Actualizar notificaciones cada 30 segundos
    this.pollingInterval = setInterval(() => {
      this.cargarNotificaciones();
    }, 30000);
    
    // Actualizar eventos próximos cada 5 minutos
    this.eventosInterval = setInterval(() => {
      this.cargarEventosProximos();
    }, 5 * 60 * 1000);
  }

  cargarEventosAtendidos() {
    const eventosAtendidosStr = localStorage.getItem('eventos_globales_atendidos');
    if (eventosAtendidosStr) {
      try {
        const eventosAtendidosArray = JSON.parse(eventosAtendidosStr);
        this.eventosAtendidos = new Set(eventosAtendidosArray);
        this.logger.log('✅ Eventos atendidos cargados:', this.eventosAtendidos.size);
      } catch (e) {
        this.logger.error('Error al cargar eventos atendidos:', e);
        this.eventosAtendidos = new Set();
      }
    }
  }

  guardarEventosAtendidos() {
    localStorage.setItem('eventos_globales_atendidos', JSON.stringify(Array.from(this.eventosAtendidos)));
  }
  
  ngOnDestroy() {
    window.removeEventListener('foto_perfil_actualizada', this.fotoPerfilEventHandler);

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    if (this.eventosInterval) {
      clearInterval(this.eventosInterval);
    }
  }


  cargarDatosUsuario() {
    if (!localStorage.getItem('usuario_nombre')) {
      const usuario = localStorage.getItem('usuario');
      if (usuario) {
        localStorage.setItem('usuario_nombre', usuario);
      }
    }
  }

 
  private normalizarFotoUrl(url: string): string {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('http') || trimmed.startsWith('data:')) return trimmed;

    const base = environment.apiUrl.replace(/\/$/, '');
    const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${base}${path}`;
  }

  cargarFotoPerfil(forceRefresh: boolean = false) {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const usuarioId = user.id || parseInt(localStorage.getItem('usuario_id') || '0');
      
      // ⭐ SIEMPRE intentar cargar desde el backend primero para asegurar que esté actualizada
      if (usuarioId > 0) {
        const timestamp = forceRefresh ? `?t=${Date.now()}` : '';
        this.http.get<any>(`${this.apiUrl}/perfil/${usuarioId}/foto${timestamp}`, { 
          observe: 'response' 
        }).subscribe({
          next: (httpResponse) => {
            // Manejar respuesta HTTP completa
            const response = httpResponse.body;
            if (response && response.success && response.foto) {
              const fotoUrl = this.normalizarFotoUrl(response.foto);
              this.fotoPerfilUrl = forceRefresh 
                ? `${fotoUrl}${fotoUrl.includes('?') ? '&' : '?'}t=${Date.now()}`
                : fotoUrl;
              
              // Actualizar localStorage
              localStorage.setItem('foto_perfil', response.foto);
              user.foto_perfil = response.foto;
              localStorage.setItem('user', JSON.stringify(user));
              
              this.logger.log('✅ Foto de perfil cargada desde backend:', this.fotoPerfilUrl);
            } else if (response && response.success && !response.foto) {
              // Usuario sin foto, usar localStorage si existe
              this.logger.log('⚠️ Usuario sin foto en backend');
              this.cargarFotoDesdeLocalStorage();
            } else {
              // Respuesta inválida, intentar desde localStorage
              this.logger.warn('⚠️ Respuesta inválida del backend:', response);
              this.cargarFotoDesdeLocalStorage();
            }
          },
          error: (err) => {
            this.logger.error('Error al cargar foto desde backend:', err);
            this.logger.error('Detalles del error:', {
              status: err.status,
              statusText: err.statusText,
              message: err.message,
              error: err.error
            });
            // Si hay error, intentar desde localStorage
            this.cargarFotoDesdeLocalStorage();
          }
        });
      } else {
        // Si no hay usuarioId, cargar desde localStorage
        this.cargarFotoDesdeLocalStorage();
      }
    } catch (e) {
      this.logger.error('Error al cargar foto de perfil:', e);
      this.cargarFotoDesdeLocalStorage();
    }
  }

  private cargarFotoDesdeLocalStorage() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const fotoDesdeLS = user.foto_perfil || localStorage.getItem('foto_perfil') || '';
      
      if (fotoDesdeLS) {
        this.fotoPerfilUrl = this.normalizarFotoUrl(fotoDesdeLS);
        this.logger.log('✅ Foto de perfil cargada desde localStorage:', this.fotoPerfilUrl);
      } else {
        this.fotoPerfilUrl = '';
        this.logger.log('⚠️ No hay foto de perfil disponible');
      }
    } catch (e) {
      this.logger.error('Error al cargar foto desde localStorage:', e);
      this.fotoPerfilUrl = '';
    }
  }

  private actualizarTituloPagina(url: string) {
    const rutas: { [key: string]: string } = {
      '/dashboard': 'Dashboard',
      '/solicitudes': 'Solicitudes',
      '/reportes': 'Reportes',
      '/historial': 'Historial',
      '/historial-inspecciones': 'Historial de Inspecciones',
      '/locales': 'Locales',
      '/fiscalizacion': '',  
      '/ajustes': '', 
      '/inspecciones': 'Inspecciones',
      '/informe': 'Informe',
      '/bienvenido': 'Inicio',
      '/perfil': 'Mi Perfil', 
      '/usuarios': '' // 
    };

    for (const [ruta, titulo] of Object.entries(rutas)) {
      if (url.startsWith(ruta)) {
        this.pageTitle = titulo;
        return;
      }
    }

    this.pageTitle = 'GESTISEC';
  }

  cargarTema() {
    const temaGuardado = localStorage.getItem('theme') as 'light' | 'dark';
    this.currentTheme = temaGuardado || 'light';
    this.aplicarTema();
  }

  toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    this.currentTheme = newTheme as 'light' | 'dark';
  }

  private aplicarTema() {
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    document.body.setAttribute('data-theme', this.currentTheme);
  }

  getUsuarioIniciales(): string {
    const nombre = this.usuarioNombre;
    if (!nombre || nombre === 'Usuario') return 'U';
    
    const palabras = nombre.trim().split(' ');
    if (palabras.length >= 2) {
      return (palabras[0][0] + palabras[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }

  toggleSidebar() {
    // En móviles, toggle mobile menu; en desktop, toggle collapsed
    if (window.innerWidth <= 768) {
      this.mobileMenuOpen = !this.mobileMenuOpen;
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    }
  }

  toggleSettings() {
    this.closeFiltersEvent();
    this.showSettings = !this.showSettings;
    this.showUserMenu = false;
    this.showNotifications = false;
  }

  cerrarSesion() {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
      localStorage.clear(); 
      sessionStorage.clear();
      this.router.navigate(['/login']);
    }
  }

  toggleNotifications() {
    this.closeFiltersEvent();
    this.showNotifications = !this.showNotifications;
    this.showUserMenu = false;
    this.showSettings = false;
  }

  toggleUserMenu() {
    this.closeFiltersEvent();
    this.showUserMenu = !this.showUserMenu;
    this.showNotifications = false;
    this.showSettings = false;
  }

  get notificacionesNoLeidasCount(): number {
    const notisCount = Array.isArray(this.notificaciones) ? this.notificaciones.filter(n => !n.leida).length : 0;
    const eventosCount = this.eventosProximos.length;
    return notisCount + eventosCount;
  }

  get tieneNotificacionesPendientes(): boolean {
    return this.notificacionesNoLeidasCount > 0;
  }

  cargarEventosProximos() {
    this.miService.obtenerEventosCalendario().subscribe({
      next: (eventos) => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        // Obtener eventos en los próximos 30 días (igual que el calendario)
        const proximos30Dias = new Date();
        proximos30Dias.setDate(hoy.getDate() + 30);
        proximos30Dias.setHours(23, 59, 59, 999);
        
        console.log('📅 Filtrando eventos entre:', hoy.toLocaleDateString(), 'y', proximos30Dias.toLocaleDateString());
        console.log('📅 Total eventos recibidos:', eventos.length);
        
        this.eventosProximos = eventos
          .filter(evento => {
            // Filtrar eventos atendidos
            if (evento.id && this.eventosAtendidos.has(evento.id.toString())) {
              console.log('🔕 Evento ya atendido, omitiendo:', evento.title);
              return false;
            }
            
            if (!evento.start) {
              console.log('⚠️ Evento sin start:', evento);
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
                console.log('✅ Evento en rango:', evento.title, fechaEvento.toLocaleDateString());
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
          .slice(0, 5); // Mostrar máximo 5 para la notificación
        
        this.tieneEventosProximos = this.eventosProximos.length > 0;
        
        console.log('📊 Eventos próximos cargados:', this.eventosProximos.length, this.eventosProximos);
        
        // Mostrar notificación global si hay eventos
        if (this.eventosProximos.length > 0) {
          console.log('✅ Hay eventos próximos, llamando mostrarNotificacionGlobal()');
          this.mostrarNotificacionGlobal();
        } else {
          console.log('⚠️ No hay eventos próximos para mostrar');
        }
      },
      error: (error) => {
        this.logger.error('Error al cargar eventos próximos:', error);
        this.eventosProximos = [];
        this.tieneEventosProximos = false;
      }
    });
  }

  cargarNotificaciones() {
    const usuarioId = localStorage.getItem('usuario_id');
    const rol = (localStorage.getItem('rol') || '').toLowerCase();
    
    if (!rol) {
      console.warn('No se encontró el rol del usuario');
      return;
    }

    const params: any = { rol };
    if (usuarioId) {
      params.usuario_id = usuarioId;
    }

    this.http.get<any[]>(`${this.apiUrl}/notificaciones`, { params }).subscribe({
      next: (notificaciones) => {
        this.notificaciones = notificaciones || [];
        this.logger.log('✅ Notificaciones cargadas:', this.notificaciones.length);
      },
      error: (error) => {
        this.logger.error('❌ Error al cargar notificaciones:', error);
        this.notificaciones = [];
      }
    });
  }

  marcarComoLeida(notificacion: any) {
    if (notificacion.leida) return;

    this.http.put(`${this.apiUrl}/notificaciones/${notificacion.id}/leer`, {}).subscribe({
      next: () => {
        notificacion.leida = true;
        this.logger.log('✅ Notificación marcada como leída');
      },
      error: (error) => {
        this.logger.error('❌ Error al marcar como leída:', error);
      }
    });
  }

  eliminarNoti(notificacion: any) {
    if (!confirm('¿Eliminar esta notificación?')) return;

    this.http.delete(`${this.apiUrl}/notificaciones/${notificacion.id}`).subscribe({
      next: () => {
        const idx = this.notificaciones.indexOf(notificacion);
        if (idx > -1) {
          this.notificaciones.splice(idx, 1);
        }
        this.logger.log('✅ Notificación eliminada');
      },
      error: (error) => {
        this.logger.error('❌ Error al eliminar notificación:', error);
      }
    });
  }

  marcarTodasLeidas() {
    const usuarioId = localStorage.getItem('usuario_id');
    const rol = (localStorage.getItem('rol') || '').toLowerCase();

    const body: any = { rol };
    if (usuarioId) {
      body.usuario_id = usuarioId;
    }

    this.http.put(`${this.apiUrl}/notificaciones/marcar-todas-leidas`, body).subscribe({
      next: (response: any) => {
        this.notificaciones.forEach(n => n.leida = true);
        this.logger.log('✅ Todas las notificaciones marcadas como leídas');
      },
      error: (error) => {
        this.logger.error('❌ Error al marcar todas como leídas:', error);
      }
    });
  }

  buscarGlobal() {
    if (this.searchQuery.trim()) {
      this.logger.log('Buscando:', this.searchQuery);
      
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.topbar-dropdown') && !target.closest('.settings-dropdown-container')) {
      this.showNotifications = false;
      this.showUserMenu = false;
      this.showSettings = false;
    }
  }



  formatearFecha(fecha: Date): string {
    const ahora = new Date();
    const diff = ahora.getTime() - fecha.getTime();
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return 'Hace un momento';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas} h`;
    if (dias < 7) return `Hace ${dias} días`;
    
    return fecha.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  get isDarkMode(): boolean {
    return this.currentTheme === 'dark';
  }

  get usuarioNombre(): string {
    // Priorizar mostrar el nombre de usuario (corto) en lugar del nombre completo (largo)
    return localStorage.getItem('usuario') || 
           localStorage.getItem('username') || 
           localStorage.getItem('usuario_nombre') || 
           'Usuario';
  }

  // ✅ AGREGADO: Obtener email del usuario
  get usuarioEmail(): string {
    return localStorage.getItem('usuario_email') || 'admin@huanchaco.gob.pe';
  }

  navegarA(ruta: string): void {
    this.router.navigate([ruta]);
    // En móviles, cerrar el menú móvil después de navegar
    if (window.innerWidth <= 768) {
      this.mobileMenuOpen = false;
    }
    this.cerrarMenus();
  }

  cerrarMenus(): void {
    this.showSettings = false;
    this.showNotifications = false;
    this.showUserMenu = false;
  }

  get esAdministrador(): boolean {
    return this.rol === 'Administrador';
  }

  get esInspector(): boolean {
    return this.rol === 'Inspector';
  }

  get esAdministrativo(): boolean {
    return this.rol === 'Administrativo';
  }

  // ✅ AGREGADO: Verificar si es ruta de ajustes/fiscalización
  esRutaAjustes(): boolean {
    const url = this.router.url;
    return url.includes('/ajustes') || url.includes('/fiscalizacion');
  }

  // ============================================
  // EVENTOS PRÓXIMOS DEL CALENDARIO
  // ============================================

  getDiasRestantes(evento: any): number {
    if (!evento.start) return 999;
    try {
      const fechaEvento = new Date(evento.start);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      fechaEvento.setHours(0, 0, 0, 0);
      return Math.ceil((fechaEvento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    } catch {
      return 999;
    }
  }

  getTextoDias(evento: any): string {
    const dias = this.getDiasRestantes(evento);
    if (dias === 0) return 'HOY';
    if (dias === 1) return 'MAÑANA';
    if (dias <= 7) return `En ${dias} días`;
    return `En ${dias} días`;
  }

  formatearFechaEvento(fecha: string): string {
    if (!fecha) return '';
    try {
      const d = new Date(fecha);
      return d.toLocaleDateString('es-PE', { 
        weekday: 'short',
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fecha;
    }
  }

  navegarACalendario() {
    this.router.navigate(['/calendario']);
    this.showNotifications = false;
  }

  // ============================================
  // NOTIFICACIÓN GLOBAL DE EVENTOS
  // ============================================

  mostrarNotificacionGlobal() {
    console.log('🔔 mostrarNotificacionGlobal() llamado');
    console.log('🔔 eventosProximos:', this.eventosProximos);
    console.log('🔔 eventosProximos.length:', this.eventosProximos?.length);
    
    if (this.eventosProximos && this.eventosProximos.length > 0) {
      this.eventoNotificacionPrincipal = this.eventosProximos[0];
      
      // Verificar si el evento principal ya fue atendido
      if (this.eventoNotificacionPrincipal.id && this.eventosAtendidos.has(this.eventoNotificacionPrincipal.id.toString())) {
        console.log('🔕 Evento principal ya atendido, no se muestra la notificación');
        this.mostrarNotificacionEventos = false;
        return;
      }
      
      console.log('🔔 eventoNotificacionPrincipal asignado:', this.eventoNotificacionPrincipal);
      
      // Mostrar inmediatamente
      this.mostrarNotificacionEventos = true;
      console.log('🔔 mostrarNotificacionEventos = true (inmediato)');
      
      // También después de un delay para asegurar
      setTimeout(() => {
        this.mostrarNotificacionEventos = true;
        this.eventoNotificacionPrincipal = this.eventosProximos[0];
        console.log('🔔 NOTIFICACIÓN FORZADA - mostrarNotificacionEventos:', this.mostrarNotificacionEventos);
        console.log('🔔 eventoNotificacionPrincipal:', this.eventoNotificacionPrincipal);
        console.log('🔔 Condición *ngIf:', this.mostrarNotificacionEventos && this.eventoNotificacionPrincipal);
      }, 1000);
    } else {
      console.log('❌ No hay eventos para mostrar notificación');
      this.mostrarNotificacionEventos = false;
    }
  }

  marcarEventoComoAtendido() {
    if (this.eventoNotificacionPrincipal && this.eventoNotificacionPrincipal.id) {
      const eventoId = this.eventoNotificacionPrincipal.id.toString();
      this.eventosAtendidos.add(eventoId);
      this.guardarEventosAtendidos();
      this.logger.log(`✅ Evento ${eventoId} marcado como atendido: ${this.eventoNotificacionPrincipal.title}`);
      
      // Ocultar notificación
      this.mostrarNotificacionEventos = false;
      
      // Remover el evento de la lista de próximos
      this.eventosProximos = this.eventosProximos.filter(e => e.id?.toString() !== eventoId);
      
      // Si hay más eventos, mostrar el siguiente
      if (this.eventosProximos.length > 0) {
        setTimeout(() => {
          this.mostrarNotificacionGlobal();
        }, 500);
      }
    } else {
      // Si no tiene ID, simplemente cerrar
      this.cerrarNotificacionEventos();
    }
  }

  cerrarNotificacionEventos() {
    // Solo cerrar sin marcar como atendido (para que vuelva a aparecer)
    this.mostrarNotificacionEventos = false;
  }

  irACalendario() {
    this.router.navigate(['/calendario']);
    // No marcar como atendido al ir al calendario, solo cerrar
    this.cerrarNotificacionEventos();
  }

  obtenerTextoNotificacionPrincipal(): string {
    if (!this.eventoNotificacionPrincipal) return '';
    const dias = this.getDiasRestantesEventoPrincipal(this.eventoNotificacionPrincipal);
    if (dias === 0) {
      return '¡Tienes un evento HOY!';
    } else if (dias === 1) {
      return '¡Tienes un evento MAÑANA!';
    } else {
      return `Tienes ${this.eventosProximos.length} evento${this.eventosProximos.length > 1 ? 's' : ''} próximos`;
    }
  }

  getDiasRestantesEventoPrincipal(evento: any): number {
    if (!evento || !evento.start) return 999;
    try {
      const fechaEvento = new Date(evento.start);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      fechaEvento.setHours(0, 0, 0, 0);
      return Math.ceil((fechaEvento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    } catch {
      return 999;
    }
  }

  formatearFechaEventoPrincipal(fecha: string): string {
    if (!fecha) return '';
    try {
      const d = new Date(fecha);
      return d.toLocaleDateString('es-PE', { 
        weekday: 'short',
        day: 'numeric', 
        month: 'short'
      });
    } catch {
      return fecha;
    }
  }
}