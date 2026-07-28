import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

// ============================================
// TIPOS Y MODELOS
// ============================================

export interface Brigada {
  id: number;
  numero: string;
  nombre: string;
  activo?: boolean;
  tipoBrigadaId?: number;
  tipoBrigada?: { id: number; nombre: string };
  regionId?: number;
  region?: { id: number; nombre: string; codigo?: string };
  departamentoId?: number;
  departamento?: { id: number; nombre: string; codigo?: string };
  municipioId?: number;
  municipio?: { id: number; nombre: string; codigo?: string };
  createdAt?: string;
  updatedAt?: string;
  _count?: { miembros: number };
}

export interface MiembroBrigada {
  id: number;
  brigadaId: number;
  usuarioId: number;
  usuario?: { id: number; nombre: string; correo: string };
  cargoEnBrigada: string;
  esLider: boolean;
  activo: boolean;
  fechaDesde: string;
  fechaHasta?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FiltrosBrigadas {
  texto?: string;
  activo?: boolean;
  tipoBrigadaId?: number;
  regionId?: number;
  departamentoId?: number;
  municipioId?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

// ============================================
// SERVICIO
// ============================================

@Injectable({ providedIn: 'root' })
export class BrigadasService {
  private http = inject(HttpClient);

  // ==================== MÉTODOS EXISTENTES (NO MODIFICAR) ====================

  /** Obtiene las brigadas del usuario autenticado (membresías activas) */
  getMisBrigadas(): Observable<Brigada[]> {
    return this.http.get<ApiResponse<{ brigadas: Brigada[] }>>(
      `${environment.apiUrl}/brigadas/mis-brigadas`
    ).pipe(
      map(res => res.data?.brigadas || [])
    );
  }

  /** Obtiene los miembros activos de una brigada */
  getMiembrosByBrigada(brigadaId: number): Observable<any[]> {
    return this.http.get<ApiResponse<{ miembros: any[] }>>(
      `${environment.apiUrl}/brigadas/${brigadaId}/miembros?activo=true`
    ).pipe(
      map(res => res.data?.miembros || [])
    );
  }

  // ==================== NUEVOS MÉTODOS PARA EL MÓDULO DE BRIGADAS ====================

  /** Listar brigadas (paginado y con filtros) */
  listar(filtros?: FiltrosBrigadas): Observable<{
    brigadas: Brigada[];
    pagination: { page: number; limit: number; totalItems: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean };
    sort: { sortBy: string; sortDir: string };
  }> {
    let params = new HttpParams();
    if (filtros) {
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/brigadas`, { params })
      .pipe(
        map(res => {
          const data = res.data;
          return {
            brigadas: data.brigadas || data || [],
            pagination: data.pagination || { page: 1, limit: 50, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
            sort: data.sort || { sortBy: 'numero', sortDir: 'asc' }
          };
        })
      );
  }

  /** Obtener una brigada por ID */
  obtener(id: number): Observable<Brigada> {
    return this.http.get<ApiResponse<{ brigada: Brigada }>>(`${environment.apiUrl}/brigadas/${id}`)
      .pipe(map(res => res.data.brigada));
  }

  /** Crear brigada */
  crear(data: Partial<Brigada>): Observable<Brigada> {
    return this.http.post<ApiResponse<{ brigada: Brigada }>>(`${environment.apiUrl}/brigadas`, data)
      .pipe(map(res => res.data.brigada));
  }

  /** Actualizar brigada */
  actualizar(id: number, data: Partial<Brigada>): Observable<Brigada> {
    return this.http.put<ApiResponse<{ brigada: Brigada }>>(`${environment.apiUrl}/brigadas/${id}`, data)
      .pipe(map(res => res.data.brigada));
  }

  /** Desactivar brigada (DELETE lógico) */
  desactivar(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${environment.apiUrl}/brigadas/${id}`)
      .pipe(map(() => undefined));
  }

  // ==================== MÉTODOS PARA MIEMBROS ====================

  /** Listar miembros de una brigada (con opción de filtrar por activo) */
  listarMiembros(brigadaId: number, activo?: boolean): Observable<MiembroBrigada[]> {
    let params = new HttpParams();
    if (activo !== undefined) params = params.set('activo', activo.toString());
    return this.http.get<ApiResponse<{ miembros: MiembroBrigada[] }>>(
      `${environment.apiUrl}/brigadas/${brigadaId}/miembros`,
      { params }
    ).pipe(
      map(res => res.data.miembros || [])
    );
  }

  /** Agregar miembro a una brigada */
  agregarMiembro(brigadaId: number, data: { idUsuario: number; cargoEnBrigada?: string; esLider?: boolean; fechaDesde?: string }): Observable<MiembroBrigada> {
    return this.http.post<ApiResponse<{ miembro: MiembroBrigada }>>(
      `${environment.apiUrl}/brigadas/${brigadaId}/miembros`,
      data
    ).pipe(map(res => res.data.miembro));
  }

  /** Actualizar miembro (cargo, esLider, fechaHasta) */
  actualizarMiembro(brigadaId: number, miembroId: number, data: { cargoEnBrigada?: string; esLider?: boolean; fechaHasta?: string }): Observable<MiembroBrigada> {
    return this.http.put<ApiResponse<{ miembro: MiembroBrigada }>>(
      `${environment.apiUrl}/brigadas/${brigadaId}/miembros/${miembroId}`,
      data
    ).pipe(map(res => res.data.miembro));
  }

  /** Desactivar miembro (DELETE lógico) */
  desactivarMiembro(brigadaId: number, miembroId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${environment.apiUrl}/brigadas/${brigadaId}/miembros/${miembroId}`)
      .pipe(map(() => undefined));
  }
}