import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class CierreService {
  private http = inject(HttpClient);

  cerrarConAcciones(idCaso: number, observaciones: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/cierre-casos/${idCaso}/cerrar`, { observaciones });
  }

  cerrarSinAcciones(idCaso: number, observaciones: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/cierre-casos/${idCaso}/cerrar-sin-acciones`, { observaciones });
  }

  devolverCierre(idCaso: number, observaciones: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/cierre-casos/${idCaso}/devolver-cierre`, { observaciones });
  }
}