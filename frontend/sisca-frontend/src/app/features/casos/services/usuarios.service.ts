import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private http = inject(HttpClient);

  // Opciones livianas para selectores (solo id, nombre, correo)
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
}