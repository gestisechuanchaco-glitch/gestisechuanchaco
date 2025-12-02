import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoginService } from '../service/login.service';
import { LogService } from '../service/log.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  remember: boolean = false;
  roles: string[] = ['Administrativo', 'Inspector', 'Administrador'];
  selectedRole: string = '';
  error: string = '';
  showPassword: boolean = false;
  loading: boolean = false;

  constructor(private router: Router, private loginService: LoginService, private logger: LogService) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onForgotPassword(event: Event) {
    event.preventDefault();
    alert('Por favor contacta al administrador del sistema para recuperar tu contraseña.');
  }

  onHelp(event: Event) {
    event.preventDefault();
    alert('Para soporte técnico, contacta a: soporte@huanchaco.gob.pe');
  }

  onLogin() {
    this.error = '';
    this.loading = true;
    
    // Validaciones básicas
    if (!this.username || !this.password || !this.selectedRole) {
      this.error = 'Por favor complete todos los campos';
      this.loading = false;
      return;
    }

    this.loginService.login(this.username, this.password, this.selectedRole).subscribe({
      next: resp => {
        if (resp.success) {
          this.logger.log('✅ Login exitoso:', resp.usuario);
          
          const nombreCompleto = resp.usuario.nombres_apellidos || 
                                 resp.usuario.nombre_completo || 
                                 resp.usuario.fullName ||
                                 resp.usuario.usuario || 
                                 'Usuario';

          // ✅ CREAR OBJETO USER COMPLETO
          const user = {
            id: resp.usuario.id,
            usuario: resp.usuario.usuario,
            nombres_apellidos: nombreCompleto,
            nombre_completo: nombreCompleto,
            fullName: nombreCompleto,
            email: resp.usuario.email || 'admin@huanchaco.gob.pe',
            rol: resp.usuario.rol,
            rol_id: resp.usuario.rol_id || resp.usuario.roleId,
            roleId: resp.usuario.rol_id || resp.usuario.roleId,
            roleName: resp.usuario.rol || resp.usuario.roleName,
            foto_perfil: resp.usuario.foto_perfil || null,
            fecha_creacion: resp.usuario.fecha_creacion
          };

          // ✅ GUARDAR OBJETO USER COMPLETO EN LOCALSTORAGE
          localStorage.setItem('user', JSON.stringify(user));
          
          // ✅ MANTENER COMPATIBILIDAD CON CÓDIGO ANTIGUO
          localStorage.setItem('usuario_id', user.id?.toString() || '0');
          localStorage.setItem('usuario_email', user.email);
          localStorage.setItem('usuario_nombre', user.nombre_completo);
          localStorage.setItem('usuario', user.usuario); // ⭐ AGREGADO
          localStorage.setItem('rol', user.rol);
          localStorage.setItem('username', user.usuario);
          localStorage.setItem('token', resp.token || 'session-active');

          this.logger.log('📦 Usuario guardado en localStorage:', user);
          this.logger.log('👤 usuario (para creadoPor):', user.nombre_completo);
          this.logger.log('🔑 roleId:', user.roleId);
          this.logger.log('🖼️ foto_perfil:', user.foto_perfil);
          
          // Navegar según rol
          if (user.rol === 'Administrador' || user.rol === 'Administrativo') {
            this.router.navigate(['/dashboard']);
          } else if (user.rol === 'Inspector') {
            this.router.navigate(['/bienvenido']);
          } else {
            this.router.navigate(['/bienvenido']);
          }
        } else {
          this.error = resp.message || 'Usuario, contraseña o rol incorrecto';
          console.warn('⚠️ Login fallido:', resp.message);
          this.loading = false;
        }
      },
      error: (err) => {
        this.logger.error('❌ Error en login:', err);
        this.error = 'Error de conexión con el servidor';
        this.loading = false;
      }
    });
  }
}