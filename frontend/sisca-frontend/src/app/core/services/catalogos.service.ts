import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Area, Proceso, TipoEvento, Criticidad, EstadoCaso, EstadoAccion } from '../models/catalogo.model';

@Injectable({ providedIn: 'root' })
export class CatalogosService {
  private http = inject(HttpClient);

  // Catálogos existentes
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

  // Geografía
  getRegiones(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/catalogos/regiones`);
  }

  getDepartamentos(regionId?: number): Observable<ApiResponse<any[]>> {
    let params = new HttpParams();
    if (regionId) {
      params = params.set('regionId', regionId.toString());
    }
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/catalogos/departamentos`, { params });
  }

  getMunicipios(departamentoId?: number): Observable<ApiResponse<any[]>> {
    let params = new HttpParams();
    if (departamentoId) {
      params = params.set('departamentoId', departamentoId.toString());
    }
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/catalogos/municipios`, { params });
  }

  // Tipos de brigada
  getTiposBrigada(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/catalogos/tipos-brigada`);
  }

  // === NUEVOS: Brigadas y miembros ===
  getBrigadas(tipoBrigadaId?: number): Observable<ApiResponse<any>> {
    let params = new HttpParams();
    if (tipoBrigadaId) {
      params = params.set('tipoBrigadaId', tipoBrigadaId.toString());
    }
    params = params.set('activo', 'true');
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/brigadas`, { params });
  }

  getMiembrosByBrigada(brigadaId: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/brigadas/${brigadaId}/miembros?activo=true`);
  }
}