import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LogService } from '../service/log.service';
import { environment } from '../../environments/environment';

interface Usuario {
  id: number;
  username: string;
  fullName: string;
  roleId: number;
  roleName?: string;
  email?: string;
  dni?: string;
  telefono?: string;
  cargo?: string;
  departamento?: string;
  fecha_ingreso?: string;
  id_empleado?: string;
  foto_perfil?: string;
  estado?: string;
  createdAt: string;
}

interface Rol {
  id: number;
  name: string;
}

@Component({
  selector: 'app-ajustes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ajustes.html',
  styleUrls: ['./ajustes.css']
})
export class AjustesComponent implements OnInit {
  private apiUrl = `${environment.apiUrl}/api`;
  
  usuarios: Usuario[] = [];
  roles: Rol[] = [];
  searchQuery: string = '';
  usuarioActualRol: string = '';
  
  // Modales
  showModalRegistrar: boolean = false;
  showModalEditar: boolean = false;
  showModalPassword: boolean = false;
  showModalEliminar: boolean = false;
  
  // Usuario seleccionado
  usuarioSeleccionado: Usuario | null = null;
  
  // Control de visibilidad de contraseñas
  mostrarPasswordNuevo: boolean = false;
  mostrarConfirmarNuevo: boolean = false;
  mostrarPasswordCambio: boolean = false;
  mostrarConfirmarCambio: boolean = false;
  
  // Formulario nuevo usuario
  nuevoUsuario = {
    username: '',
    fullName: '',
    password: '',
    confirmarPassword: '',
    roleId: null as number | null, // Inicializar como null, se asignará cuando se abra el modal
    email: '',
    dni: '',
    telefono: '',
    cargo: '',
    departamento: 'Defensa Civil',
    fecha_ingreso: '',
    id_empleado: ''
  };
  
  // Formulario editar usuario
  editarUsuarioForm = {
    id: 0,
    username: '',
    fullName: '',
    email: '',
    dni: '',
    telefono: '',
    fecha_nacimiento: '',
    genero: '',
    direccion: '',
    cargo: '',
    departamento: '',
    fecha_ingreso: '',
    id_empleado: '',
    roleId: 3
  };
  
  // Formulario cambiar contraseña
  cambiarPasswordForm = {
    id: 0,
    nuevaPassword: '',
    confirmarPassword: ''
  };
  
  fotoPerfilUrl: string = '';

  constructor(private http: HttpClient, private logger: LogService) {}

  ngOnInit() {
    this.usuarioActualRol = localStorage.getItem('rol') || '';
    // Cargar roles primero para asegurar que estén disponibles
    this.cargarRoles();
    this.cargarUsuarios();
    
    // Diagnóstico: Verificar roles después de cargar
    setTimeout(() => {
      this.verificarRoles();
    }, 1000);
  }

  verificarRoles() {
    this.http.get<any>(`${this.apiUrl}/diagnostico/roles`).subscribe({
      next: (diagnostico) => {
        console.log('🔍 Diagnóstico de roles:', diagnostico);
        
        if (!diagnostico.inspectorRol) {
          console.error('❌ PROBLEMA DETECTADO: El rol de Inspector no existe en la base de datos');
          console.error('❌ Roles disponibles:', diagnostico.roles);
          console.error('❌ Conteo por rol:', diagnostico.conteoPorRol);
          
          // Mostrar alerta al usuario
          alert('⚠️ ADVERTENCIA: El rol de Inspector no se encuentra en la base de datos.\n\n' +
                'Por favor, verifica que la tabla "roles" tenga un registro con id=3 y nombre="Inspector".\n\n' +
                'Roles encontrados: ' + diagnostico.roles.map((r: any) => `${r.nombre} (ID: ${r.id})`).join(', '));
        } else {
          console.log('✅ Rol de Inspector encontrado:', diagnostico.inspectorRol);
          const totalInspectores = diagnostico.conteoPorRol.find((c: any) => c.id === 3)?.total_usuarios || 0;
          console.log(`📊 Total de inspectores en el sistema: ${totalInspectores}`);
        }
      },
      error: (err) => {
        console.error('Error en diagnóstico de roles:', err);
      }
    });
  }

  // ============================================
  // CARGAR DATOS
  // ============================================
  
  cargarUsuarios() {
    this.http.get<Usuario[]>(`${this.apiUrl}/usuarios`).subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.logger.log('Usuarios cargados:', usuarios);
      },
      error: (err) => {
        this.logger.error('Error al cargar usuarios:', err);
        alert('Error al cargar usuarios');
      }
    });
  }

  cargarRoles() {
    this.http.get<Rol[]>(`${this.apiUrl}/roles`).subscribe({
      next: (roles) => {
        // Normalizar IDs a números (pueden venir como strings desde el backend)
        this.roles = roles.map(rol => ({
          id: typeof rol.id === 'string' ? parseInt(rol.id, 10) : Number(rol.id),
          name: rol.name
        }));
        
        this.logger.log('Roles cargados (normalizados):', this.roles);
        console.log('📋 Roles cargados con tipos:', this.roles.map(r => ({ 
          id: r.id, 
          name: r.name, 
          tipoId: typeof r.id 
        })));
        
        // Verificar que el rol de inspector existe (puede tener ID 2 o 3)
        const inspectorRol = this.roles.find(r => 
          r.id === 2 || 
          r.id === 3 || 
          r.name?.toLowerCase().includes('inspector')
        );
        if (!inspectorRol) {
          console.warn('⚠️ Advertencia: No se encontró el rol de Inspector en la lista de roles');
          console.warn('Roles disponibles:', this.roles);
        } else {
          console.log('✅ Rol de Inspector encontrado:', inspectorRol);
        }
      },
      error: (err) => {
        this.logger.error('Error al cargar roles:', err);
        alert('Error al cargar los roles. Por favor recarga la página.');
      }
    });
  }

  // ============================================
  // MODAL REGISTRAR USUARIO
  // ============================================
  
  abrirModalRegistrar() {
    // Temporalmente permitir a todos (para pruebas)
    // TODO: Restaurar validación cuando funcione correctamente
    // if (!this.esAdministrador()) {
    //   alert('Solo los administradores pueden registrar usuarios');
    //   return;
    // }
    
    // Verificar que los roles estén cargados
    if (this.roles.length === 0) {
      alert('Los roles aún se están cargando. Por favor espera un momento e intenta de nuevo.');
      this.cargarRoles();
      return;
    }
    
    // Buscar el rol de inspector (puede tener ID 2, 3 o nombre que contenga "inspector")
    const inspectorRol = this.roles.find(r => 
      r.id === 2 || 
      r.id === 3 || 
      r.name?.toLowerCase().includes('inspector')
    );
    const roleIdPorDefecto = inspectorRol ? inspectorRol.id : (this.roles.length > 0 ? this.roles[0].id : null);
    
    if (!roleIdPorDefecto) {
      alert('Error: No se encontraron roles disponibles. Por favor recarga la página.');
      console.error('❌ No hay roles disponibles:', this.roles);
      return;
    }
    
    this.nuevoUsuario = {
      username: '',
      fullName: '',
      password: '',
      confirmarPassword: '',
      roleId: roleIdPorDefecto, // Usar el primer rol disponible o el inspector si existe
      email: '',
      dni: '',
      telefono: '',
      cargo: '',
      departamento: 'Defensa Civil',
      fecha_ingreso: new Date().toISOString().split('T')[0],
      id_empleado: ''
    };
    
    console.log('📝 Modal abierto. Roles disponibles:', this.roles);
    console.log('📝 RoleId por defecto:', roleIdPorDefecto);
    console.log('📝 Inspector encontrado:', inspectorRol);
    
    this.showModalRegistrar = true;
  }

  cerrarModalRegistrar() {
    this.showModalRegistrar = false;
    this.mostrarPasswordNuevo = false;
    this.mostrarConfirmarNuevo = false;
  }

  registrarUsuario() {
    // Validaciones
    if (!this.nuevoUsuario.username.trim()) {
      alert('El usuario es obligatorio');
      return;
    }
    
    if (!this.nuevoUsuario.fullName.trim()) {
      alert('El nombre completo es obligatorio');
      return;
    }
    
    if (!this.nuevoUsuario.password) {
      alert('La contraseña es obligatoria');
      return;
    }
    
    if (this.nuevoUsuario.password.length < 8) {
      alert('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    if (this.nuevoUsuario.password !== this.nuevoUsuario.confirmarPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    
    if (!this.nuevoUsuario.email.trim()) {
      alert('El email es obligatorio');
      return;
    }

    // Validar que roleId esté definido
    if (this.nuevoUsuario.roleId === null || this.nuevoUsuario.roleId === undefined) {
      alert('Error: Por favor selecciona un rol.');
      console.error('❌ RoleId es null o undefined');
      return;
    }
    
    // Convertir roleId a número (puede venir como string del HTML o como número)
    const roleIdNum = typeof this.nuevoUsuario.roleId === 'string' 
      ? parseInt(this.nuevoUsuario.roleId, 10) 
      : Number(this.nuevoUsuario.roleId);
    
    // Validar que sea un número válido
    if (isNaN(roleIdNum) || roleIdNum < 1) {
      console.error('❌ RoleId inválido:', {
        roleIdSeleccionado: this.nuevoUsuario.roleId,
        roleIdNum: roleIdNum,
        tipo: typeof this.nuevoUsuario.roleId
      });
      alert(`Error: El ID del rol no es válido: ${this.nuevoUsuario.roleId}`);
      return;
    }
    
    // Validar que el roleId seleccionado existe en la lista de roles
    const rolSeleccionado = this.roles.find(r => r.id === roleIdNum);
    if (!rolSeleccionado) {
      console.error('❌ Rol no encontrado:', {
        roleIdSeleccionado: this.nuevoUsuario.roleId,
        roleIdNum: roleIdNum,
        rolesDisponibles: this.roles.map(r => ({ id: r.id, name: r.name })),
        tipoRoleId: typeof this.nuevoUsuario.roleId,
        todosLosRoles: this.roles
      });
      alert(`Error: El rol seleccionado no es válido.\n\n` +
            `Rol seleccionado: ${this.nuevoUsuario.roleId} (convertido a número: ${roleIdNum})\n` +
            `Roles disponibles:\n${this.roles.map(r => `- ${r.name} (ID: ${r.id}, tipo: ${typeof r.id})`).join('\n')}\n\n` +
            `Por favor selecciona un rol de la lista.`);
      return;
    }

    console.log('📝 Creando usuario con:', {
      username: this.nuevoUsuario.username,
      roleId: roleIdNum,
      roleIdOriginal: this.nuevoUsuario.roleId,
      rolNombre: rolSeleccionado.name,
      tipoRoleId: typeof this.nuevoUsuario.roleId,
      rolesCargados: this.roles.length
    });

    const usuarioData = {
      username: this.nuevoUsuario.username,
      fullName: this.nuevoUsuario.fullName,
      password: this.nuevoUsuario.password,
      roleId: roleIdNum, // Usar el número convertido
      email: this.nuevoUsuario.email,
      dni: this.nuevoUsuario.dni || null,
      telefono: this.nuevoUsuario.telefono || null,
      cargo: this.nuevoUsuario.cargo || null,
      departamento: this.nuevoUsuario.departamento || 'Defensa Civil',
      fecha_ingreso: this.nuevoUsuario.fecha_ingreso || null,
      id_empleado: this.nuevoUsuario.id_empleado || null
    };

    this.http.post(`${this.apiUrl}/usuarios`, usuarioData).subscribe({
      next: (response: any) => {
        if (response.success) {
          alert(`Usuario registrado correctamente como ${rolSeleccionado.name}`);
          this.cerrarModalRegistrar();
          this.cargarUsuarios();
        } else {
          alert('Error: ' + (response.error || 'No se pudo registrar el usuario'));
        }
      },
      error: (err) => {
        this.logger.error('Error al registrar usuario:', err);
        const errorMessage = err.error?.error || err.error?.detail || err.error?.message || 'Error desconocido';
        alert(`Error al registrar usuario: ${errorMessage}`);
        
        // Si el error está relacionado con el rol, mostrar información útil
        if (errorMessage.includes('rol') || errorMessage.includes('role')) {
          console.error('❌ Error relacionado con el rol. Roles disponibles:', this.roles);
          console.error('❌ RoleId intentado:', this.nuevoUsuario.roleId);
        }
      }
    });
  }

  // ============================================
  // MODAL EDITAR USUARIO
  // ============================================
  
  abrirModalEditar(usuario: Usuario) {
    this.usuarioSeleccionado = usuario;
    
    // Cargar datos del perfil completo
    this.http.get<any>(`${this.apiUrl}/perfil/${usuario.id}`).subscribe({
      next: (response) => {
        if (response.success) {
          const u = response.usuario;
          this.editarUsuarioForm = {
            id: u.id,
            username: u.usuario,
            fullName: u.nombres_completos,
            email: u.email || '',
            dni: u.dni || '',
            telefono: u.telefono || '',
            fecha_nacimiento: u.fecha_nacimiento || '',
            genero: u.genero || '',
            direccion: u.direccion || '',
            cargo: u.cargo || '',
            departamento: u.departamento || 'Defensa Civil',
            fecha_ingreso: u.fecha_ingreso || '',
            id_empleado: u.id_empleado || '',
            roleId: u.rol_id
          };
          
          this.fotoPerfilUrl = u.foto_perfil || '';
          this.showModalEditar = true;
        }
      },
      error: (err) => {
        this.logger.error('Error al cargar perfil:', err);
        alert('Error al cargar datos del usuario');
      }
    });
  }

  cerrarModalEditar() {
    this.showModalEditar = false;
    this.usuarioSeleccionado = null;
    this.fotoPerfilUrl = '';
  }

  guardarEdicionUsuario() {
    if (!this.editarUsuarioForm.fullName.trim()) {
      alert('El nombre completo es obligatorio');
      return;
    }
    
    if (!this.editarUsuarioForm.email.trim()) {
      alert('El email es obligatorio');
      return;
    }

    // Validar y convertir roleId a número
    const roleIdNum = typeof this.editarUsuarioForm.roleId === 'string' 
      ? parseInt(this.editarUsuarioForm.roleId, 10) 
      : Number(this.editarUsuarioForm.roleId);
    
    if (isNaN(roleIdNum) || roleIdNum < 1) {
      alert(`Error: El ID del rol no es válido: ${this.editarUsuarioForm.roleId}`);
      return;
    }
    
    // Validar que el rol existe
    const rolSeleccionado = this.roles.find(r => r.id === roleIdNum);
    if (!rolSeleccionado) {
      alert(`Error: El rol seleccionado no es válido.\n\nRoles disponibles: ${this.roles.map(r => `${r.name} (ID: ${r.id})`).join(', ')}`);
      return;
    }

    // Actualizar usuario básico
    const usuarioBasico = {
      username: this.editarUsuarioForm.username,
      fullName: this.editarUsuarioForm.fullName,
      roleId: roleIdNum
    };

    this.http.put(`${this.apiUrl}/usuarios/${this.editarUsuarioForm.id}`, usuarioBasico).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Actualizar perfil completo
          const perfilData = {
            nombre: this.editarUsuarioForm.fullName,
            dni: this.editarUsuarioForm.dni,
            email: this.editarUsuarioForm.email,
            telefono: this.editarUsuarioForm.telefono,
            fechaNacimiento: this.editarUsuarioForm.fecha_nacimiento,
            genero: this.editarUsuarioForm.genero,
            direccion: this.editarUsuarioForm.direccion
          };

          this.http.put(`${this.apiUrl}/perfil/${this.editarUsuarioForm.id}`, perfilData).subscribe({
            next: () => {
              alert('Usuario actualizado correctamente');
              this.cerrarModalEditar();
              this.cargarUsuarios();
            },
            error: (err) => {
              this.logger.error('Error al actualizar perfil:', err);
              alert('Usuario actualizado pero hubo un error al actualizar el perfil');
              this.cerrarModalEditar();
              this.cargarUsuarios();
            }
          });
        }
      },
      error: (err) => {
        this.logger.error('Error al actualizar usuario:', err);
        alert('Error al actualizar usuario');
      }
    });
  }

  onFileSelectedEditar(event: any) {
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

      // ⭐ USAR FORMDATA EN VEZ DE BASE64
      const formData = new FormData();
      formData.append('foto', file);
      
      this.http.post(`${this.apiUrl}/perfil/${this.editarUsuarioForm.id}/foto`, formData).subscribe({
        next: (response: any) => {
          if (response.success) {
            // Actualizar la URL de la foto
            this.fotoPerfilUrl = response.foto_perfil;
            
            // Actualizar el usuario en la lista
            const userIndex = this.usuarios.findIndex(u => u.id === this.editarUsuarioForm.id);
            if (userIndex !== -1) {
              this.usuarios[userIndex].foto_perfil = response.foto_perfil;
            }

              // Si el administrador está editando su propia foto, actualizar localStorage y notificar
              const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
              if (currentUser.id && currentUser.id === this.editarUsuarioForm.id) {
                currentUser.foto_perfil = response.foto_perfil;
                localStorage.setItem('user', JSON.stringify(currentUser));
                localStorage.setItem('foto_perfil', response.foto_perfil);
                window.dispatchEvent(new Event('foto_perfil_actualizada'));
              }
            
            alert('Foto actualizada correctamente');
          }
        },
        error: (err) => {
          this.logger.error('Error al subir foto:', err);
          alert('Error al subir la foto: ' + (err.error?.message || err.message));
        }
      });
      
      event.target.value = '';
    }
  }

  // ============================================
  // MODAL CAMBIAR CONTRASEÑA
  // ============================================
  
  abrirModalPassword(usuario: Usuario) {
    if (!this.esAdministrador()) {
      alert('Solo los administradores pueden cambiar contraseñas');
      return;
    }
    
    this.usuarioSeleccionado = usuario;
    this.cambiarPasswordForm = {
      id: usuario.id,
      nuevaPassword: '',
      confirmarPassword: ''
    };
    this.showModalPassword = true;
  }

  cerrarModalPassword() {
    this.showModalPassword = false;
    this.usuarioSeleccionado = null;
    this.mostrarPasswordCambio = false;
    this.mostrarConfirmarCambio = false;
  }

  cambiarPassword() {
    if (!this.cambiarPasswordForm.nuevaPassword) {
      alert('Ingrese la nueva contraseña');
      return;
    }
    
    if (this.cambiarPasswordForm.nuevaPassword.length < 8) {
      alert('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    if (this.cambiarPasswordForm.nuevaPassword !== this.cambiarPasswordForm.confirmarPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    this.http.patch(`${this.apiUrl}/usuarios/${this.cambiarPasswordForm.id}/password`, {
      password: this.cambiarPasswordForm.nuevaPassword
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          alert('Contraseña actualizada correctamente');
          this.cerrarModalPassword();
        }
      },
      error: (err) => {
        this.logger.error('Error al cambiar contraseña:', err);
        alert('Error al cambiar contraseña');
      }
    });
  }

  // ============================================
  // MODAL ELIMINAR USUARIO
  // ============================================
  
  abrirModalEliminar(usuario: Usuario) {
    if (!this.esAdministrador()) {
      alert('Solo los administradores pueden eliminar usuarios');
      return;
    }
    
    this.usuarioSeleccionado = usuario;
    this.showModalEliminar = true;
  }

  cerrarModalEliminar() {
    this.showModalEliminar = false;
    this.usuarioSeleccionado = null;
  }

  confirmarEliminar() {
    if (!this.usuarioSeleccionado) return;

    this.http.delete(`${this.apiUrl}/usuarios/${this.usuarioSeleccionado.id}`).subscribe({
      next: (response: any) => {
        if (response.success) {
          alert('Usuario eliminado correctamente');
          this.cerrarModalEliminar();
          this.cargarUsuarios();
        }
      },
      error: (err) => {
        this.logger.error('Error al eliminar usuario:', err);
        alert('Error al eliminar usuario');
      }
    });
  }

  // ============================================
  // FILTRADO Y UTILIDADES
  // ============================================
  
  get usuariosFiltrados(): Usuario[] {
    if (!this.searchQuery.trim()) {
      return this.usuarios;
    }
    
    const query = this.searchQuery.toLowerCase();
    return this.usuarios.filter(u => 
      u.username.toLowerCase().includes(query) ||
      u.fullName.toLowerCase().includes(query) ||
      (u.email && u.email.toLowerCase().includes(query)) ||
      (u.roleName && u.roleName.toLowerCase().includes(query))
    );
  }

  getRolNombre(usuario: Usuario): string {
    // Si el usuario ya tiene roleName desde el backend, úsalo
    if (usuario.roleName) {
      return usuario.roleName;
    }
    
    // Fallback: buscar en el array de roles
    const rol = this.roles.find(r => r.id === usuario.roleId);
    return rol ? rol.name : 'Desconocido';
  }

  esAdministrador(): boolean {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const rol = localStorage.getItem('rol') || '';
      
      this.logger.log('🔐 Verificando permisos:', {
        user,
        roleId: user.roleId,
        rol_id: user.rol_id,
        rol: rol,
        esAdmin: user.roleId === 1 || user.rol_id === 1 || rol === 'Administrador'
      });
      
      // Verificar múltiples formas de identificar admin
      return user.roleId === 1 || 
             user.rol_id === 1 || 
             rol === 'Administrador' ||
             rol === 'ADMINISTRADOR';
    } catch (error) {
      this.logger.error('Error al verificar permisos:', error);
      return false;
    }
  }

  getIniciales(nombre: string): string {
    if (!nombre) return 'U';
    const palabras = nombre.trim().split(' ');
    if (palabras.length >= 2) {
      return (palabras[0][0] + palabras[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}