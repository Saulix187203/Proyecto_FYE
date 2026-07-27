import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private http = inject(HttpClient);

  // Opciones livianas para selectores (solo id, nombre, correo)
  // El endpoint devuelve { success, data: { usuarios: [...], pagination: {...} } }
  getOpciones(texto?: string, limit: number = 20): Observable<any[]> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('page', '1');
    if (texto) params = params.set('texto', texto);
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/usuarios/opciones`, { params })
      .pipe(
        map(res => res.data?.usuarios || [])
      );
  }

  // Si necesitas filtrar por rol (ej. solo responsables)
  getOpcionesPorRol(rolNombre: string, texto?: string, limit: number = 20): Observable<any[]> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('page', '1')
      .set('rol', rolNombre);
    if (texto) params = params.set('texto', texto);
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/usuarios/opciones`, { params })
      .pipe(
        map(res => res.data?.usuarios || [])
      );
  }
}