import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Expediente } from '../../../core/models/caso.model';

@Injectable({ providedIn: 'root' })
export class ExpedienteService {
  private http = inject(HttpClient);

  obtenerExpediente(idCaso: number): Observable<ApiResponse<{ expediente: Expediente }>> {
    return this.http.get<ApiResponse<{ expediente: Expediente }>>(`${environment.apiUrl}/expedientes/${idCaso}`);
  }
}