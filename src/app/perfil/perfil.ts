import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LogService } from '../service/log.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.css']
})
export class PerfilComponent implements OnInit {
  
  private apiUrl = `${environment.apiUrl}/api`;
  usuarioId: number = 0;
  
  usuarioNombre: string = '';
  usuarioEmail: string = '';
  usuarioRol: string = '';
  editandoPersonal: boolean = false;
  fotoPerfilUrl: string = '';

  usuario = {
    nombre: '',
    dni: '',
    email: '',
    telefono: '',
    fechaNacimiento: '',
    genero: '',
    direccion: '',
    cargo: '',
    fechaIngreso: new Date('2024-01-15'),
    idEmpleado: 'DC-2024-001'
  };

  cambioPassword = {
    actual: '',
    nueva: '',
    confirmar: ''
  };

  actividadReciente: any[] = [];

  constructor(private http: HttpClient, private logger: LogService) {}

  ngOnInit() {
    // ⭐ OBTENER USER COMPLETO
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.usuarioId = user.id || parseInt(localStorage.getItem('usuario_id') || '0');
    
    this.logger.log('=== PERFIL COMPONENT ngOnInit ===');
    this.logger.log('Usuario completo:', user);
    this.logger.log('usuarioId:', this.usuarioId);
    this.logger.log('roleId:', user.roleId);
    this.logger.log('foto_perfil:', user.foto_perfil);
    this.logger.log('====================================');
    
    if (this.usuarioId > 0) {
      // Cargar desde backend
      this.cargarDatosUsuarioDesdeBackend();
      this.cargarFotoPerfil();
      this.cargarActividad();
    } else {
      // Fallback: cargar desde localStorage
      this.cargarDatosUsuarioLocal();
    }
  }

  // ============================================
  // CARGA DE DATOS DESDE BACKEND
  // ============================================
  cargarDatosUsuarioDesdeBackend() {
    this.http.get<any>(`${this.apiUrl}/perfil/${this.usuarioId}`).subscribe({
      next: (response) => {
        if (response.success) {
          const u = response.usuario;
          this.usuarioNombre = u.nombres_completos;
          this.usuarioEmail = u.email || 'admin@huanchaco.gob.pe';
          this.usuarioRol = this.obtenerNombreRol(u.rol_id);
          
          this.usuario = {
            nombre: u.nombres_completos,
            dni: u.dni || '',
            email: u.email || '',
            telefono: u.telefono || '',
            fechaNacimiento: u.fecha_nacimiento || '',
            genero: u.genero || '',
            direccion: u.direccion || '',
            cargo: u.cargo || this.usuarioRol,
            fechaIngreso: u.fecha_ingreso ? new Date(u.fecha_ingreso) : new Date('2024-01-15'),
            idEmpleado: u.id_empleado || 'DC-2024-001'
          };

          // ⭐ ACTUALIZAR USER COMPLETO EN LOCALSTORAGE
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          user.nombres_apellidos = this.usuarioNombre;
          user.nombre_completo = this.usuarioNombre;
          user.fullName = this.usuarioNombre;
          user.email = this.usuarioEmail;
          user.rol = this.usuarioRol;
          localStorage.setItem('user', JSON.stringify(user));

          // Mantener compatibilidad
          localStorage.setItem('usuario_nombre', this.usuarioNombre);
          localStorage.setItem('usuario_email', this.usuarioEmail);
          localStorage.setItem('rol', this.usuarioRol);
        }
      },
      error: (err) => {
        this.logger.error('Error al cargar perfil desde backend:', err);
        this.cargarDatosUsuarioLocal();
      }
    });
  }

  cargarDatosUsuarioLocal() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    this.usuarioNombre = user.fullName || user.nombre_completo || localStorage.getItem('usuario_nombre') || 'Usuario';
    this.usuarioEmail = user.email || localStorage.getItem('usuario_email') || 'admin@huanchaco.gob.pe';
    this.usuarioRol = user.roleName || user.rol || localStorage.getItem('rol') || 'Usuario';
    this.fotoPerfilUrl = user.foto_perfil || localStorage.getItem('foto_perfil') || '';
    
    this.usuario.nombre = this.usuarioNombre;
    this.usuario.email = this.usuarioEmail;
    this.usuario.cargo = this.usuarioRol;
  }

  cargarFotoPerfil() {
    // ⭐ Primero intentar cargar desde localStorage (más rápido)
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const fotoDesdeLS = user.foto_perfil || localStorage.getItem('foto_perfil') || '';
    
    if (fotoDesdeLS) {
      // ⭐ Agregar timestamp para evitar caché
      this.fotoPerfilUrl = fotoDesdeLS + (fotoDesdeLS.includes('?') ? '&' : '?') + 't=' + Date.now();
    }
    
    // ⭐ También cargar desde el backend para asegurar que esté actualizada
    this.http.get<any>(`${this.apiUrl}/perfil/${this.usuarioId}/foto`).subscribe({
      next: (response) => {
        if (response.success && response.foto) {
          // ⭐ Agregar timestamp para evitar caché
          const fotoUrl = response.foto + (response.foto.includes('?') ? '&' : '?') + 't=' + Date.now();
          this.fotoPerfilUrl = fotoUrl;
          
          // ⭐ ACTUALIZAR USER EN LOCALSTORAGE (sin timestamp)
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          user.foto_perfil = response.foto;
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('foto_perfil', response.foto);
        } else if (!this.fotoPerfilUrl) {
          // Solo usar fallback si no hay foto
          this.fotoPerfilUrl = fotoDesdeLS;
        }
      },
      error: (err) => {
        this.logger.error('Error al cargar foto:', err);
        // Si hay error pero tenemos foto en localStorage, usarla
        if (!this.fotoPerfilUrl && fotoDesdeLS) {
          this.fotoPerfilUrl = fotoDesdeLS + (fotoDesdeLS.includes('?') ? '&' : '?') + 't=' + Date.now();
        }
      }
    });
  }

  cargarActividad() {
    this.http.get<any>(`${this.apiUrl}/perfil/${this.usuarioId}/actividad`).subscribe({
      next: (response) => {
        if (response.success && response.actividades && response.actividades.length > 0) {
          this.actividadReciente = response.actividades;
        } else {
          this.actividadReciente = [
            {
              accion: 'Bienvenido',
              descripcion: 'Primera vez en el sistema',
              fecha: new Date(),
              icono: 'fas fa-user-check',
              tipo: 'info'
            }
          ];
        }
      },
      error: (err) => {
        this.logger.error('Error al cargar actividad:', err);
        this.actividadReciente = [
          {
            accion: 'Perfil creado',
            descripcion: 'Tu cuenta ha sido creada',
            fecha: new Date(),
            icono: 'fas fa-user-plus',
            tipo: 'success'
          }
        ];
      }
    });
  }

  // ============================================
  // SUBIDA DE FOTO - CORREGIDO ✅
  // ============================================
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar los 5MB');
        return;
      }

      // ⭐ USA FORMDATA EN VEZ DE BASE64
      const formData = new FormData();
      formData.append('foto', file);

      if (this.usuarioId > 0) {
        this.http.post<any>(`${this.apiUrl}/perfil/${this.usuarioId}/foto`, formData)
          .subscribe({
            next: (response) => {
              if (response.success) {
                this.logger.log('✅ Foto subida:', response);

                // ⭐ OBTENER EL USER COMPLETO DEL LOCALSTORAGE
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                
                // ⭐ Usar la URL que viene del backend (ya incluye el dominio completo)
                const fotoUrlBase = response.foto_perfil;
                
                this.logger.log('🖼️ Foto URL recibida del backend:', fotoUrlBase);

                // ⭐ ACTUALIZAR SOLO LA FOTO, SIN PERDER EL roleId
                user.foto_perfil = fotoUrlBase;
                
                // ⭐ GUARDAR DE NUEVO EN LOCALSTORAGE
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('foto_perfil', fotoUrlBase);

                // ⭐ ACTUALIZAR LA VARIABLE LOCAL INMEDIATAMENTE
                // Agregar timestamp único para forzar recarga de la imagen (evitar caché)
                const separador = fotoUrlBase.includes('?') ? '&' : '?';
                this.fotoPerfilUrl = fotoUrlBase + separador + 't=' + Date.now();

                this.logger.log('🖼️ Foto URL actualizada con timestamp:', this.fotoPerfilUrl);

                // ⭐ Recargar la foto después de un breve delay para asegurar que se vea
                setTimeout(() => {
                  this.cargarFotoPerfil();
                }, 200);

                alert('✅ Foto actualizada correctamente');
              }
            },
            error: (err) => {
              this.logger.error('❌ Error al subir foto:', err);
              alert('Error al subir la foto: ' + (err.error?.message || 'Error desconocido'));
            }
          });
      } else {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const fotoBase64 = e.target.result;
          
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          user.foto_perfil = fotoBase64;
          localStorage.setItem('user', JSON.stringify(user));
          
          this.fotoPerfilUrl = fotoBase64;
          localStorage.setItem('foto_perfil', fotoBase64);
          alert('Foto actualizada correctamente (solo local)');
        };
        reader.readAsDataURL(file);
      }
      
      event.target.value = '';
    }
  }

  // ============================================
  // EDICIÓN DE INFORMACIÓN
  // ============================================
  editarInformacionPersonal() {
    this.editandoPersonal = true;
  }

  cancelarEdicion() {
    this.editandoPersonal = false;
    if (this.usuarioId > 0) {
      this.cargarDatosUsuarioDesdeBackend();
    } else {
      this.cargarDatosUsuarioLocal();
    }
  }

  guardarInformacionPersonal() {
    if (!this.usuario.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    if (!this.usuario.email.trim()) {
      alert('El email es obligatorio');
      return;
    }

    if (this.usuarioId > 0) {
      this.http.put(`${this.apiUrl}/perfil/${this.usuarioId}`, {
        nombre: this.usuario.nombre,
        dni: this.usuario.dni,
        email: this.usuario.email,
        telefono: this.usuario.telefono,
        fechaNacimiento: this.usuario.fechaNacimiento,
        genero: this.usuario.genero,
        direccion: this.usuario.direccion
      }).subscribe({
        next: (response: any) => {
          if (response.success) {
            // ⭐ ACTUALIZAR USER EN LOCALSTORAGE
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.nombres_apellidos = this.usuario.nombre;
            user.nombre_completo = this.usuario.nombre;
            user.fullName = this.usuario.nombre;
            user.email = this.usuario.email;
            localStorage.setItem('user', JSON.stringify(user));
            
            localStorage.setItem('usuario_nombre', this.usuario.nombre);
            localStorage.setItem('usuario_email', this.usuario.email);
            
            this.usuarioNombre = this.usuario.nombre;
            this.usuarioEmail = this.usuario.email;
            
            this.editandoPersonal = false;
            alert('Información actualizada correctamente');
          }
        },
        error: (err) => {
          this.logger.error('Error al guardar:', err);
          alert('Error al actualizar la información');
        }
      });
    } else {
      localStorage.setItem('usuario_nombre', this.usuario.nombre);
      localStorage.setItem('usuario_email', this.usuario.email);
      
      this.usuarioNombre = this.usuario.nombre;
      this.usuarioEmail = this.usuario.email;
      
      this.editandoPersonal = false;
      alert('Información actualizada correctamente (solo local)');
    }
  }

  // ============================================
  // CAMBIAR CONTRASEÑA
  // ============================================
  cambiarContrasena() {
    if (!this.cambioPassword.actual) {
      alert('Ingrese su contraseña actual');
      return;
    }

    if (!this.cambioPassword.nueva) {
      alert('Ingrese la nueva contraseña');
      return;
    }

    if (this.cambioPassword.nueva !== this.cambioPassword.confirmar) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (this.cambioPassword.nueva.length < 8) {
      alert('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    const tieneMayuscula = /[A-Z]/.test(this.cambioPassword.nueva);
    const tieneMinuscula = /[a-z]/.test(this.cambioPassword.nueva);
    const tieneNumero = /[0-9]/.test(this.cambioPassword.nueva);

    if (!tieneMayuscula || !tieneMinuscula || !tieneNumero) {
      alert('La contraseña debe incluir mayúsculas, minúsculas y números');
      return;
    }

    if (this.usuarioId > 0) {
      this.http.post(`${this.apiUrl}/perfil/${this.usuarioId}/cambiar-password`, {
        actual: this.cambioPassword.actual,
        nueva: this.cambioPassword.nueva,
        confirmar: this.cambioPassword.confirmar
      }).subscribe({
        next: (response: any) => {
          if (response.success) {
            alert('Contraseña actualizada correctamente');
            this.cambioPassword = { actual: '', nueva: '', confirmar: '' };
          }
        },
        error: (err) => {
          this.logger.error('Error:', err);
          alert(err.error?.message || 'Error al cambiar contraseña');
        }
      });
    } else {
      this.logger.log('Cambiando contraseña (sin backend)...');
      alert('Funcionalidad no disponible sin backend');
      this.cambioPassword = { actual: '', nueva: '', confirmar: '' };
    }
  }

  // ============================================
  // MÉTODOS AUXILIARES
  // ============================================
  getIniciales(): string {
    if (!this.usuarioNombre) return 'U';
    const palabras = this.usuarioNombre.trim().split(' ');
    if (palabras.length >= 2) {
      return (palabras[0][0] + palabras[1][0]).toUpperCase();
    }
    return this.usuarioNombre.substring(0, 2).toUpperCase();
  }

  // ✅ MÉTODO CORREGIDO - MAPEO DE ROLES CORRECTO
  obtenerNombreRol(rol_id: number): string {
    const roles: any = { 
      1: 'Administrativo',  // ✅ CORRECTO según tu BD
      2: 'Inspector',       // ✅ CORRECTO según tu BD
      3: 'Administrador'    // ✅ CORRECTO según tu BD
    };
    return roles[rol_id] || 'Usuario';
  }
}