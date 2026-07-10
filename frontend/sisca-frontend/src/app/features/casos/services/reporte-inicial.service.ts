import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ReporteInicial } from '../../../core/models/caso.model';
import { ApiResponse } from '../../../core/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class ReporteInicialService {
  private http = inject(HttpClient);

  crearOActualizar(data: { idCaso: number; descripcionDetallada: string; condicionDetectada: string; accionInmediata: string; observaciones?: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/reportes-iniciales`, data);
  }

  obtenerPorCaso(idCaso: number): Observable<ApiResponse<ReporteInicial>> {
    return this.http.get<ApiResponse<ReporteInicial>>(`${environment.apiUrl}/reportes-iniciales/caso/${idCaso}`);
  }
}