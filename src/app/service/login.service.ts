import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoginService {
  constructor(private http: HttpClient) {}

  // Debe aceptar los 3 parámetros
  login(username: string, password: string, role: string): Observable<any> {
    return this.http.post<any>('http://localhost:3000/login', {
      usuario: username,
      contraseña: password,
      rol: role
    });
  }
}