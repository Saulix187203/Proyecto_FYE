import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class BrigadasService {
  private http = inject(HttpClient);

  // Obtener brigadas activas (opciones para combo)
  getBrigadasOpciones(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/brigadas/opciones`);
  }

  // Obtener miembros activos de una brigada
  getMiembrosByBrigada(brigadaId: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/brigadas/${brigadaId}/miembros?activo=true`);
  }
}