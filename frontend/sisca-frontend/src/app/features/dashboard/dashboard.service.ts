import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../core/models/api-response.model';
import { environment } from '../../../environments/environment';
import {
  DashboardAccionesResponse,
  DashboardCasosResponse,
  DashboardChartResponse,
  DashboardResumen,
} from './models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  resumen(): Observable<ApiResponse<DashboardResumen>> {
    return this.http.get<ApiResponse<DashboardResumen>>(`${environment.apiUrl}/dashboard/resumen`);
  }

  casosPorEstado(): Observable<ApiResponse<DashboardChartResponse>> {
    return this.http.get<ApiResponse<DashboardChartResponse>>(`${environment.apiUrl}/dashboard/casos-por-estado`);
  }

  casosPorArea(): Observable<ApiResponse<DashboardChartResponse>> {
    return this.http.get<ApiResponse<DashboardChartResponse>>(`${environment.apiUrl}/dashboard/casos-por-area`);
  }

  casosPorCriticidad(): Observable<ApiResponse<DashboardChartResponse>> {
    return this.http.get<ApiResponse<DashboardChartResponse>>(`${environment.apiUrl}/dashboard/casos-por-criticidad`);
  }

  accionesVencidas(): Observable<ApiResponse<DashboardAccionesResponse>> {
    return this.http.get<ApiResponse<DashboardAccionesResponse>>(`${environment.apiUrl}/dashboard/acciones-vencidas`);
  }

  ultimosCasos(limit: number = 10): Observable<ApiResponse<DashboardCasosResponse>> {
    return this.http.get<ApiResponse<DashboardCasosResponse>>(`${environment.apiUrl}/dashboard/ultimos-casos?limit=${limit}`);
  }
}