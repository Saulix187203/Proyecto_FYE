import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Evidencia } from '../../../core/models/caso.model';


@Injectable({ providedIn: 'root' })
export class EvidenciasService {
  private http = inject(HttpClient);

  subirCaso(idCaso: number, archivo: File, descripcion?: string): Observable<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    if (descripcion) formData.append('descripcion', descripcion);
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/evidencias/caso/${idCaso}`, formData);
  }

  subirAccion(idAccion: number, archivo: File, descripcion?: string): Observable<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    if (descripcion) formData.append('descripcion', descripcion);
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/evidencias/accion/${idAccion}`, formData);
  }

  listarCaso(idCaso: number): Observable<ApiResponse<{ evidencias: Evidencia[] }>> {
    return this.http.get<ApiResponse<{ evidencias: Evidencia[] }>>(`${environment.apiUrl}/evidencias/caso/${idCaso}`);
  }

  listarAccion(idAccion: number): Observable<ApiResponse<{ evidencias: Evidencia[] }>> {
    return this.http.get<ApiResponse<{ evidencias: Evidencia[] }>>(`${environment.apiUrl}/evidencias/accion/${idAccion}`);
  }

  descargar(idEvidencia: number): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/evidencias/${idEvidencia}/descargar`, { responseType: 'blob' });
  }
}