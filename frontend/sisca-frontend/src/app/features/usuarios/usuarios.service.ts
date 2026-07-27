import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/api-response.model';
import { Rol, Usuario } from '../../core/models/auth.model';

export interface CrearUsuarioRequest {
  nombre: string;
  correo: string;
  password: string;
  activo: boolean;
  roles: number[];
  // Campos opcionales para usuarios de brigada
  tipoBrigadaId?: number;
  codigoBrigada?: string;
}

export interface ActualizarUsuarioRequest {
  nombre?: string;
  correo?: string;
  password?: string;
  activo?: boolean;
  roles?: number[];
  // Campos opcionales para usuarios de brigada
  tipoBrigadaId?: number;
  codigoBrigada?: string;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private http = inject(HttpClient);

  getOpciones(texto?: string, limit: number = 20): Observable<ApiResponse<any[]>> {
    let params = new HttpParams().set('limit', limit.toString());
    if (texto) params = params.set('texto', texto);
    return this.http.get<ApiResponse<any[]>>(
      `${environment.apiUrl}/usuarios/opciones`,
      { params }
    );
  }

  // Si necesitas filtrar por rol (ej. solo responsables)
  getOpcionesPorRol(rolNombre: string, texto?: string, limit: number = 20): Observable<ApiResponse<any[]>> {
    let params = new HttpParams().set('limit', limit.toString()).set('rol', rolNombre);
    if (texto) params = params.set('texto', texto);
    return this.http.get<ApiResponse<any[]>>(
      `${environment.apiUrl}/usuarios/opciones`,
      { params }
    );
  }

  listarUsuarios(): Observable<ApiResponse<{ usuarios: Usuario[] }>> {
    return this.http.get<ApiResponse<{ usuarios: Usuario[] }>>(`${environment.apiUrl}/usuarios`);
  }

  listarRoles(): Observable<ApiResponse<{ roles: Rol[] }>> {
    return this.http.get<ApiResponse<{ roles: Rol[] }>>(`${environment.apiUrl}/roles`);
  }

  getUsuarioById(id: number): Observable<ApiResponse<{ usuario: Usuario }>> {
    return this.http.get<ApiResponse<{ usuario: Usuario }>>(`${environment.apiUrl}/usuarios/${id}`);
  }

  crearUsuario(data: CrearUsuarioRequest): Observable<ApiResponse<{ usuario: Usuario }>> {
    return this.http.post<ApiResponse<{ usuario: Usuario }>>(`${environment.apiUrl}/usuarios`, data);
  }

  actualizarUsuario(id: number, data: ActualizarUsuarioRequest): Observable<ApiResponse<{ usuario: Usuario }>> {
    return this.http.put<ApiResponse<{ usuario: Usuario }>>(`${environment.apiUrl}/usuarios/${id}`, data);
  }

  actualizarRolesUsuario(id: number, data: { roles: number[] }): Observable<ApiResponse<{ usuario: Usuario }>> {
    return this.http.put<ApiResponse<{ usuario: Usuario }>>(`${environment.apiUrl}/usuarios/${id}/roles`, data);
  }

  actualizarPasswordUsuario(id: number, data: { password: string }): Observable<ApiResponse<{ usuario: Usuario }>> {
    return this.http.put<ApiResponse<{ usuario: Usuario }>>(`${environment.apiUrl}/usuarios/${id}/password`, data);
  }

  agregarMiembroBrigada(brigadaId: number, data: { idUsuario: number; cargoEnBrigada?: string; esLider?: boolean }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/brigadas/${brigadaId}/miembros`, data);
  }

  desactivarUsuario(id: number): Observable<ApiResponse<{ usuario: Usuario }>> {
    return this.http.delete<ApiResponse<{ usuario: Usuario }>>(`${environment.apiUrl}/usuarios/${id}`);
  }
}
