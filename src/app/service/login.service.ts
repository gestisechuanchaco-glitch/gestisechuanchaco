import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LoginService {
  constructor(private http: HttpClient) {}

  // Debe aceptar los 3 parámetros
  login(username: string, password: string, role: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/login`, {
      usuario: username,
      contraseña: password,
      rol: role
    });
  }
}