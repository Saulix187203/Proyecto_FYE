import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';

// Definimos un tipo para el expediente según lo que devuelve la API
export interface ExpedienteResponse {
  datosGenerales: any;           // Datos del caso
  reporteInicial: any | null;
  validacionesProcedencia: any[];
  accionesCorrectivas: any[];
  bitacora: any[];
  comentariosObservacion: any[];
  evidencias: any[];
  divulgaciones: any[];
  notificaciones: any[];
}

@Injectable({ providedIn: 'root' })
export class ExpedienteService {
  private http = inject(HttpClient);

  obtenerExpediente(idCaso: number): Observable<ApiResponse<{ expediente: ExpedienteResponse }>> {
    return this.http.get<ApiResponse<{ expediente: ExpedienteResponse }>>(
      `${environment.apiUrl}/expedientes/${idCaso}`
    );
  }
}