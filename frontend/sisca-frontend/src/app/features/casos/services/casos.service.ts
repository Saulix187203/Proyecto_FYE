import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Caso } from '../../../core/models/caso.model';

export interface FiltrosCasos {
  estado?: string | number;
  area?: string | number;
  criticidad?: string | number;
  fechaDesde?: string;
  fechaHasta?: string;
  texto?: string;
}

@Injectable({ providedIn: 'root' })
export class CasosService {
  private http = inject(HttpClient);

  listarCasos(filtros?: FiltrosCasos): Observable<ApiResponse<Caso[]>> {
    let params = new HttpParams();
    if (filtros) {
      Object.keys(filtros).forEach(key => {
        const value = filtros[key as keyof FiltrosCasos];
        if (value != null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<ApiResponse<Caso[]>>(`${environment.apiUrl}/casos`, { params });
  }

  // IMPORTANTE: El backend devuelve { caso: Caso } dentro de data
  obtenerCaso(id: number): Observable<ApiResponse<{ caso: Caso }>> {
    return this.http.get<ApiResponse<{ caso: Caso }>>(`${environment.apiUrl}/casos/${id}`);
  }

  crearCaso(data: any): Observable<ApiResponse<{ caso: Caso }>> {
    return this.http.post<ApiResponse<{ caso: Caso }>>(`${environment.apiUrl}/casos`, data);
  }

  actualizarCaso(id: number, data: any): Observable<ApiResponse<{ caso: Caso }>> {
    return this.http.put<ApiResponse<{ caso: Caso }>>(`${environment.apiUrl}/casos/${id}`, data);
  }
}