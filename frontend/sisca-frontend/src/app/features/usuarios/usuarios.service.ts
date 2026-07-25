import { HttpClient } from '@angular/common/http';
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
