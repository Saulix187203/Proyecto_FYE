import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/api-response.model';
import { Notificacion, ResumenNotificaciones } from '../../core/models/notificacion.model';

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private http = inject(HttpClient);

  listar(leida?: boolean): Observable<ApiResponse<Notificacion[]>> {
    let params = new HttpParams();
    if (leida !== undefined) params = params.set('leida', leida.toString());
    return this.http.get<ApiResponse<Notificacion[]>>(`${environment.apiUrl}/notificaciones`, { params });
  }

  resumen(): Observable<ApiResponse<ResumenNotificaciones>> {
    return this.http.get<ApiResponse<ResumenNotificaciones>>(`${environment.apiUrl}/notificaciones/resumen`);
  }

  marcarLeida(id: number): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${environment.apiUrl}/notificaciones/${id}/leida`, {});
  }

  marcarTodasLeidas(): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${environment.apiUrl}/notificaciones/marcar-todas-leidas`, {});
  }
}