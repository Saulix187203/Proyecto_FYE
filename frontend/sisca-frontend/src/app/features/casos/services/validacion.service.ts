import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ValidacionProcedencia } from '../../../core/models/caso.model';


@Injectable({ providedIn: 'root' })
export class ValidacionService {
  private http = inject(HttpClient);

  iniciarRevision(idCaso: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/validaciones-procedencia/${idCaso}/iniciar-revision`, {});
  }

  aprobar(idCaso: number, observaciones: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/validaciones-procedencia/${idCaso}/aprobar`, { observaciones });
  }

  devolver(idCaso: number, observaciones: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/validaciones-procedencia/${idCaso}/devolver`, { observaciones });
  }

  rechazar(idCaso: number, observaciones: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/validaciones-procedencia/${idCaso}/rechazar`, { observaciones });
  }

  historial(idCaso: number): Observable<ApiResponse<ValidacionProcedencia[]>> {
    return this.http.get<ApiResponse<ValidacionProcedencia[]>>(`${environment.apiUrl}/validaciones-procedencia/caso/${idCaso}`);
  }
}