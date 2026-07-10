import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ExpedienteService } from '../services/expediente.service';
import { Expediente } from '../../../core/models/caso.model';

@Component({
  selector: 'app-expediente',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Expediente del Caso</h2>
    <div *ngIf="expediente">
      <h3>Datos del Caso</h3>
      <p><strong>Correlativo:</strong> {{ expediente.caso.correlativo }}</p>
      <p><strong>Título:</strong> {{ expediente.caso.titulo }}</p>
      <p><strong>Estado:</strong> {{ expediente.caso.estado.nombre }}</p>

      <h3>Reporte Inicial</h3>
      <div *ngIf="expediente.reporteInicial; else sinReporte">
        <p><strong>Descripción Detallada:</strong> {{ expediente.reporteInicial.descripcionDetallada }}</p>
        <p><strong>Condición Detectada:</strong> {{ expediente.reporteInicial.condicionDetectada }}</p>
        <p><strong>Acción Inmediata:</strong> {{ expediente.reporteInicial.accionInmediata }}</p>
        <p><strong>Observaciones:</strong> {{ expediente.reporteInicial.observaciones }}</p>
      </div>
      <ng-template #sinReporte>No hay reporte inicial registrado.</ng-template>

      <h3>Validaciones</h3>
      <ul *ngIf="expediente.validaciones.length > 0">
        <li *ngFor="let v of expediente.validaciones">
          {{ v.estadoAnterior }} → {{ v.estadoNuevo }} ({{ v.fecha | date:'short' }}) - {{ v.usuario.nombre }}: {{ v.observaciones }}
        </li>
      </ul>
      <p *ngIf="expediente.validaciones.length === 0">Sin validaciones.</p>

      <h3>Acciones Correctivas</h3>
      <ul *ngIf="expediente.acciones.length > 0">
        <li *ngFor="let a of expediente.acciones">
          {{ a.descripcion }} - Estado: {{ a.estado.nombre }} - Responsable: {{ a.responsable.nombre }}
          <ul *ngIf="a.evidencias.length > 0">
            <li *ngFor="let e of a.evidencias">Evidencia: {{ e.nombreOriginal }}</li>
          </ul>
        </li>
      </ul>
      <p *ngIf="expediente.acciones.length === 0">Sin acciones.</p>

      <h3>Bitácora</h3>
      <ul>
        <li *ngFor="let b of expediente.bitacora">
          {{ b.fecha | date:'short' }} - {{ b.usuario.nombre }}: {{ b.descripcion }}
        </li>
      </ul>
    </div>
    <div *ngIf="!expediente">Cargando expediente...</div>
  `,
  styles: [`
    h3 { margin-top: 1.5rem; }
    ul { padding-left: 1.5rem; }
  `]
})
export class ExpedienteComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private expedienteService = inject(ExpedienteService);
  expediente: Expediente | null = null;

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.expedienteService.obtenerExpediente(id).subscribe({
      next: (res) => this.expediente = res.data.expediente,
      error: (err) => console.error('Error al cargar expediente', err),
    });
  }
}