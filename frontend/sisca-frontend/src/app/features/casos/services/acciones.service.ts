import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AccionCorrectiva } from '../../../core/models/caso.model';
import { ApiResponse } from '../../../core/models/api-response.model';


@Injectable({ providedIn: 'root' })
export class AccionesService {
  private http = inject(HttpClient);

  crearAccion(data: any): Observable<ApiResponse<{ accion: AccionCorrectiva }>> {
    return this.http.post<ApiResponse<{ accion: AccionCorrectiva }>>(`${environment.apiUrl}/acciones-correctivas`, data);
  }

  listarPorCaso(idCaso: number): Observable<ApiResponse<AccionCorrectiva[]>> {
    return this.http.get<ApiResponse<AccionCorrectiva[]>>(`${environment.apiUrl}/acciones-correctivas/caso/${idCaso}`);
  }

  obtener(id: number): Observable<ApiResponse<AccionCorrectiva>> {
    return this.http.get<ApiResponse<AccionCorrectiva>>(`${environment.apiUrl}/acciones-correctivas/${id}`);
  }

  actualizar(id: number, data: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${environment.apiUrl}/acciones-correctivas/${id}`, data);
  }

  iniciar(id: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/acciones-correctivas/${id}/iniciar`, {});
  }

  enviarValidacion(id: number, observaciones: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/acciones-correctivas/${id}/enviar-validacion`, { observaciones });
  }

  devolver(id: number, observaciones: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/acciones-correctivas/${id}/devolver`, { observaciones });
  }

  cerrar(id: number, observaciones: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/acciones-correctivas/${id}/cerrar`, { observaciones });
  }
}