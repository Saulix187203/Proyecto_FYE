import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ExpedienteService, ExpedienteResponse } from '../services/expediente.service';

@Component({
  selector: 'app-expediente',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
      <h2 style="margin:0;">Expediente del Caso</h2>
      <button (click)="volver()" style="padding:0.5rem 1rem; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer;">
        ← Volver al detalle
      </button>
    </div>

    <!-- Cargando -->
    <div *ngIf="cargando" style="text-align:center; padding:2rem;">
      <span>Cargando expediente...</span>
    </div>

    <!-- Error -->
    <div *ngIf="error" style="color:red; padding:1rem; background:#ffe6e6; border-radius:4px; margin:1rem 0;">
      {{ error }}
      <br>
      <button (click)="volver()" style="margin-top:0.5rem; padding:0.3rem 1rem; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer;">Volver</button>
    </div>

    <!-- Expediente -->
    <div *ngIf="!cargando && !error && expediente">
      <!-- Datos Generales (Caso) -->
      <h3 style="margin-top:0;">Datos del Caso</h3>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; background:#f8f9fa; padding:1rem; border-radius:4px;">
        <p><strong>Correlativo:</strong> {{ expediente.datosGenerales.correlativo }}</p>
        <p><strong>Título:</strong> {{ expediente.datosGenerales.titulo }}</p>
        <p><strong>Estado:</strong> {{ expediente.datosGenerales.estado?.nombre || 'N/A' }}</p>
        <p><strong>Área:</strong> {{ expediente.datosGenerales.area?.nombre || 'N/A' }}</p>
        <p><strong>Proceso:</strong> {{ expediente.datosGenerales.proceso?.nombre || 'N/A' }}</p>
        <p><strong>Criticidad:</strong> {{ expediente.datosGenerales.criticidad?.nombre || 'N/A' }}</p>
        <p><strong>Lugar:</strong> {{ expediente.datosGenerales.lugar }}</p>
        <p><strong>Fecha Evento:</strong> {{ expediente.datosGenerales.fechaEvento | date:'dd/MM/yyyy HH:mm' }}</p>
        <p><strong>Descripción:</strong> {{ expediente.datosGenerales.descripcion }}</p>
        <p><strong>Creado por:</strong> {{ expediente.datosGenerales.creadoPor?.nombre || 'N/A' }}</p>
        <p><strong>Fecha Creación:</strong> {{ expediente.datosGenerales.fechaCreacion | date:'dd/MM/yyyy HH:mm' }}</p>
      </div>

      <!-- Reporte Inicial -->
      <h3>Reporte Inicial</h3>
      <div *ngIf="expediente.reporteInicial; else sinReporte" style="background:#f8f9fa; padding:1rem; border-radius:4px;">
        <p><strong>Descripción Detallada:</strong> {{ expediente.reporteInicial.descripcionDetallada }}</p>
        <p><strong>Condición Detectada:</strong> {{ expediente.reporteInicial.condicionDetectada }}</p>
        <p><strong>Acción Inmediata:</strong> {{ expediente.reporteInicial.accionInmediata }}</p>
        <p><strong>Observaciones:</strong> {{ expediente.reporteInicial.observaciones || 'N/A' }}</p>
      </div>
      <ng-template #sinReporte>
        <p style="color:#6c757d;">No hay reporte inicial registrado.</p>
      </ng-template>

      <!-- Validaciones -->
      <h3>Validaciones de Procedencia</h3>
      <div *ngIf="expediente.validacionesProcedencia && expediente.validacionesProcedencia.length > 0; else sinValidaciones">
        <ul style="list-style:none; padding:0;">
          <li *ngFor="let v of expediente.validacionesProcedencia" style="background:#f8f9fa; margin-bottom:0.5rem; padding:0.5rem; border-radius:4px; border-left:3px solid #007bff;">
            <strong>{{ v.estadoAnterior }}</strong> → <strong>{{ v.estadoNuevo }}</strong><br>
            <span style="color:#6c757d; font-size:0.9rem;">
              {{ v.fecha | date:'dd/MM/yyyy HH:mm' }} - {{ v.usuario?.nombre || 'N/A' }}
            </span>
            <p style="margin:0.3rem 0 0 0; font-size:0.95rem;">{{ v.observaciones || 'Sin observaciones' }}</p>
          </li>
        </ul>
      </div>
      <ng-template #sinValidaciones>
        <p style="color:#6c757d;">Sin validaciones registradas.</p>
      </ng-template>

      <!-- Acciones Correctivas -->
      <h3>Acciones Correctivas</h3>
      <div *ngIf="expediente.accionesCorrectivas && expediente.accionesCorrectivas.length > 0; else sinAcciones">
        <div *ngFor="let a of expediente.accionesCorrectivas" style="background:#f8f9fa; margin-bottom:0.5rem; padding:0.5rem; border-radius:4px; border-left:3px solid #28a745;">
          <p><strong>{{ a.descripcion }}</strong></p>
          <p style="margin:0.2rem 0;">
            <span style="font-weight:bold;">Estado:</span> {{ a.estado?.nombre || 'N/A' }}
            <span style="margin-left:1rem; font-weight:bold;">Responsable:</span> {{ a.responsable?.nombre || 'N/A' }}
          </p>
          <p style="margin:0.2rem 0; font-size:0.9rem; color:#6c757d;">
            Fecha compromiso: {{ a.fechaCompromiso | date:'dd/MM/yyyy HH:mm' }}
          </p>
          <div *ngIf="a.evidencias && a.evidencias.length > 0" style="margin-top:0.3rem;">
            <span style="font-weight:bold;">Evidencias:</span>
            <ul style="margin:0.2rem 0 0 1.5rem;">
              <li *ngFor="let e of a.evidencias">{{ e.nombreOriginal }}</li>
            </ul>
          </div>
        </div>
      </div>
      <ng-template #sinAcciones>
        <p style="color:#6c757d;">No hay acciones correctivas.</p>
      </ng-template>

      <!-- Bitácora -->
      <h3>Bitácora</h3>
      <div *ngIf="expediente.bitacora && expediente.bitacora.length > 0; else sinBitacora">
        <ul style="list-style:none; padding:0; max-height:300px; overflow-y:auto; border:1px solid #dee2e6; border-radius:4px;">
          <li *ngFor="let b of expediente.bitacora" style="padding:0.5rem; border-bottom:1px solid #dee2e6;">
            <span style="color:#6c757d; font-size:0.85rem;">{{ b.fecha | date:'dd/MM/yyyy HH:mm' }}</span>
            <span style="font-weight:bold;">{{ b.usuario?.nombre || 'Sistema' }}</span>
            <span>— {{ b.descripcion }}</span>
          </li>
        </ul>
      </div>
      <ng-template #sinBitacora>
        <p style="color:#6c757d;">No hay eventos en la bitácora.</p>
      </ng-template>

      <!-- Comentarios (si existen) -->
      <h3>Comentarios</h3>
      <div *ngIf="expediente.comentariosObservacion && expediente.comentariosObservacion.length > 0; else sinComentarios">
        <ul style="list-style:none; padding:0;">
          <li *ngFor="let c of expediente.comentariosObservacion" style="background:#f8f9fa; margin-bottom:0.5rem; padding:0.5rem; border-radius:4px; border-left:3px solid #fd7e14;">
            <span style="color:#6c757d; font-size:0.9rem;">{{ c.fecha | date:'dd/MM/yyyy HH:mm' }}</span>
            <span style="font-weight:bold;">{{ c.usuario?.nombre || 'N/A' }}</span>
            <p style="margin:0.3rem 0 0 0;">{{ c.contenido }}</p>
          </li>
        </ul>
      </div>
      <ng-template #sinComentarios>
        <p style="color:#6c757d;">Sin comentarios.</p>
      </ng-template>

      <!-- Botón volver -->
      <div style="margin-top:1.5rem;">
        <button (click)="volver()" style="padding:0.5rem 1.5rem; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer;">
          ← Volver al detalle
        </button>
      </div>
    </div>
  `,
  styles: [`
    h3 { margin-top: 1.5rem; margin-bottom: 0.8rem; }
  `]
})
export class ExpedienteComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private expedienteService = inject(ExpedienteService);

  expediente: ExpedienteResponse | null = null;
  cargando = true;
  error = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarExpediente(+id);
    } else {
      this.error = 'No se proporcionó un ID de caso válido';
      this.cargando = false;
    }
  }

  cargarExpediente(id: number) {
    this.cargando = true;
    this.error = '';
    this.expedienteService.obtenerExpediente(id).subscribe({
      next: (res) => {
        console.log('Expediente recibido:', res);
        if (res.success && res.data?.expediente) {
          this.expediente = res.data.expediente;
          console.log('Datos generales:', this.expediente.datosGenerales);
        } else {
          this.error = res.message || 'No se encontró el expediente';
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar expediente:', err);
        this.error = err.error?.message || 'Error al cargar el expediente. Verifica que el backend esté corriendo.';
        this.cargando = false;
      },
    });
  }

  volver() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.router.navigate(['/casos', id]);
    } else {
      this.router.navigate(['/casos']);
    }
  }
}