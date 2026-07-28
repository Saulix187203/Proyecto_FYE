import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface Brigada {
  id: number;
  numero: string;
  nombre: string;
  // ... otros campos
}

@Injectable({ providedIn: 'root' })
export class BrigadasService {
  private http = inject(HttpClient);

  /** Obtiene las brigadas del usuario autenticado (membresías activas) */
  getMisBrigadas(): Observable<Brigada[]> {
    return this.http.get<ApiResponse<{ brigadas: Brigada[] }>>(
      `${environment.apiUrl}/brigadas/mis-brigadas`
    ).pipe(
      map(res => res.data?.brigadas || [])
    );
  }
}