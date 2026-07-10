import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Area, Proceso, TipoEvento, Criticidad, EstadoCaso, EstadoAccion } from '../models/catalogo.model';

@Injectable({ providedIn: 'root' })
export class CatalogosService {
  private http = inject(HttpClient);

  getAreas(): Observable<ApiResponse<Area[]>> {
    return this.http.get<ApiResponse<Area[]>>(`${environment.apiUrl}/catalogos/areas`);
  }

  getProcesos(): Observable<ApiResponse<Proceso[]>> {
    return this.http.get<ApiResponse<Proceso[]>>(`${environment.apiUrl}/catalogos/procesos`);
  }

  getTiposEvento(): Observable<ApiResponse<TipoEvento[]>> {
    return this.http.get<ApiResponse<TipoEvento[]>>(`${environment.apiUrl}/catalogos/tipos-evento`);
  }

  getCriticidades(): Observable<ApiResponse<Criticidad[]>> {
    return this.http.get<ApiResponse<Criticidad[]>>(`${environment.apiUrl}/catalogos/criticidades`);
  }

  getEstadosCaso(): Observable<ApiResponse<EstadoCaso[]>> {
    return this.http.get<ApiResponse<EstadoCaso[]>>(`${environment.apiUrl}/catalogos/estados-caso`);
  }

  getEstadosAccion(): Observable<ApiResponse<EstadoAccion[]>> {
    return this.http.get<ApiResponse<EstadoAccion[]>>(`${environment.apiUrl}/catalogos/estados-accion`);
  }
}