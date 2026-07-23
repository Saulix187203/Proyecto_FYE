import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpedienteService, ExpedienteResponse } from '../services/expediente.service';
import { EvidenciasService } from '../services/evidencias.service';
import { Evidencia } from '../../../core/models/caso.model';

@Component({
  selector: 'app-expediente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
      <h2 style="margin:0;">Expediente del Caso</h2>
      <button (click)="volverAlListado()" style="padding:0.5rem 1rem; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer;">
        ← Volver al listado
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
      <button (click)="volverAlListado()" style="margin-top:0.5rem; padding:0.3rem 1rem; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer;">Volver al listado</button>
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
        <p><strong>Tipo de Evento:</strong> {{ expediente.datosGenerales.tipoEvento?.nombre || 'N/A' }}</p>
        <p><strong>Criticidad:</strong> {{ expediente.datosGenerales.criticidad?.nombre || 'N/A' }}</p>
        <p><strong>Lugar:</strong> {{ expediente.datosGenerales.lugar }}</p>
        <p><strong>Fecha Evento:</strong> {{ expediente.datosGenerales.fechaEvento | date:'dd/MM/yyyy HH:mm' }}</p>
        <p><strong>Descripción:</strong> {{ expediente.datosGenerales.descripcion }}</p>
        <p><strong>Creado por:</strong> {{ expediente.datosGenerales.usuarioReporta?.nombre || 'N/A' }}</p>
        <p><strong>Fecha Creación:</strong> {{ (expediente.datosGenerales.fechaReporte || expediente.datosGenerales.createdAt) | date:'dd/MM/yyyy HH:mm' }}</p>
        <p><strong>Región:</strong> {{ expediente.datosGenerales.region?.nombre || 'N/A' }}</p>
        <p><strong>Departamento:</strong> {{ expediente.datosGenerales.departamento?.nombre || 'N/A' }}</p>
        <p><strong>Municipio:</strong> {{ expediente.datosGenerales.municipio?.nombre || 'N/A' }}</p>
        <p><strong>Tipo Brigada:</strong> {{ expediente.datosGenerales.tipoBrigada?.nombre || 'N/A' }}</p>
        <p><strong>Técnico:</strong> {{ expediente.datosGenerales.nombreTecnico || 'N/A' }}</p>
        <p><strong>Código Brigada:</strong> {{ expediente.datosGenerales.codigoBrigada || 'N/A' }}</p>
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

      <!-- Validaciones de Procedencia -->
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

      <!-- Evidencias del caso -->
      <h3>Evidencias del Caso</h3>
      <div style="background:#f8f9fa; padding:1rem; border-radius:4px; margin-bottom:1rem;">
        <p style="margin:0 0 0.75rem 0; font-weight:bold;">Subir nueva evidencia</p>
        <p style="margin:0 0 0.75rem 0; color:#6c757d; font-size:0.95rem;">Formatos permitidos: PDF, imágenes (JPG/PNG/WEBP) y archivos Excel (.xls/.xlsx).</p>
        <div style="display:grid; gap:0.75rem; max-width:600px;">
          <div *ngIf="modoReemplazo && evidenciaEnEdicion" style="background:#fff3cd; padding:0.75rem; border-radius:4px; color:#856404;">
            Estás sustituyendo la evidencia: <strong>{{ evidenciaEnEdicion.nombreOriginal }}</strong>
            <button type="button" (click)="cancelarReemplazo()" style="margin-left:0.5rem; background:transparent; border:none; color:#856404; cursor:pointer; text-decoration:underline;">
              Cancelar
            </button>
          </div>
          <input type="file" (change)="onArchivoSeleccionado($event)" accept=".pdf,.png,.jpg,.jpeg,.webp,.xls,.xlsx,application/pdf,image/png,image/jpeg,image/webp,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
          <input type="text" [(ngModel)]="descripcion" placeholder="Descripción de la evidencia" style="padding:0.5rem; border:1px solid #ced4da; border-radius:4px;" />
          <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
            <button type="button" (click)="subirEvidencia()" [disabled]="subiendo || !archivoSeleccionado" style="padding:0.5rem 1rem; background:#17a2b8; color:white; border:none; border-radius:4px; cursor:pointer; opacity:1;">
              {{ subiendo ? 'Subiendo...' : (modoReemplazo ? 'Sustituir archivo' : 'Subir archivo') }}
            </button>
            <span *ngIf="archivoSeleccionado" style="color:#495057;">{{ archivoSeleccionado.name }}</span>
          </div>
          <div *ngIf="mensaje" [style.color]="errorUpload ? '#dc3545' : '#155724'" style="font-size:0.95rem;">
            {{ mensaje }}
          </div>
        </div>
      </div>
      <div *ngIf="expediente.evidencias && expediente.evidencias.length > 0; else sinEvidencias">
        <ul style="list-style:none; padding:0;">
          <li *ngFor="let e of expediente.evidencias" style="background:#f8f9fa; margin-bottom:0.5rem; padding:0.5rem; border-radius:4px; border-left:3px solid #17a2b8; display:flex; justify-content:space-between; gap:0.75rem; flex-wrap:wrap; align-items:center;">
            <div>
              <strong>{{ e.nombreOriginal }}</strong><br>
              <span style="font-size:0.9rem; color:#6c757d;">
                Subido por: {{ e.subidoPor?.nombre || 'N/A' }} - {{ e.fechaSubida | date:'dd/MM/yyyy HH:mm' }}
              </span>
              <p style="margin:0.3rem 0 0 0;">{{ e.descripcion || 'Sin descripción' }}</p>
            </div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
              <button type="button" (click)="verEvidencia(e)" style="padding:0.4rem 0.8rem; background:#007bff; color:white; border:none; border-radius:4px; cursor:pointer;">
                Ver / Descargar
              </button>
              <button type="button" (click)="iniciarReemplazo(e)" style="padding:0.4rem 0.8rem; background:#fd7e14; color:white; border:none; border-radius:4px; cursor:pointer;">
                Cambiar por otro
              </button>
            </div>
          </li>
        </ul>
      </div>
      <ng-template #sinEvidencias>
        <p style="color:#6c757d;">No hay evidencias.</p>
      </ng-template>

      <!-- Comentarios / Observaciones -->
      <h3>Comentarios</h3>
      <div *ngIf="expediente.comentariosObservacion && expediente.comentariosObservacion.length > 0; else sinComentarios">
        <ul style="list-style:none; padding:0;">
          <li *ngFor="let c of expediente.comentariosObservacion" style="background:#f8f9fa; margin-bottom:0.5rem; padding:0.5rem; border-radius:4px; border-left:3px solid #fd7e14;">
            <span style="font-size:0.9rem; color:#6c757d;">{{ c.fecha | date:'dd/MM/yyyy HH:mm' }}</span>
            <strong>{{ c.usuario?.nombre || 'N/A' }}</strong>
            <p style="margin:0.3rem 0 0 0;">{{ c.contenido }}</p>
          </li>
        </ul>
      </div>
      <ng-template #sinComentarios>
        <p style="color:#6c757d;">Sin comentarios.</p>
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

      <!-- Botón volver -->
      <div style="margin-top:1.5rem; display:flex; gap:0.75rem; flex-wrap:wrap;">
        <button (click)="volverAlDetalle()" style="padding:0.5rem 1.5rem; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer;">
          ← Volver al detalle
        </button>
        <button (click)="volverAlListado()" style="padding:0.5rem 1.5rem; background:#495057; color:white; border:none; border-radius:4px; cursor:pointer;">
          ← Volver al listado
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
  private evidenciasService = inject(EvidenciasService);

  expediente: ExpedienteResponse | null = null;
  cargando = true;
  error = '';
  archivoSeleccionado: File | null = null;
  descripcion = '';
  subiendo = false;
  mensaje = '';
  errorUpload = false;
  modoReemplazo = false;
  evidenciaEnEdicion: Evidencia | null = null;

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
        if (res.success && res.data?.expediente) {
          this.expediente = res.data.expediente;
        } else {
          this.error = res.message || 'No se encontró el expediente';
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar expediente:', err);
        this.error = err.error?.message || 'Error al cargar el expediente';
        this.cargando = false;
      },
    });
  }

  onArchivoSeleccionado(event: Event) {
    const input = event.target as HTMLInputElement;
    this.archivoSeleccionado = input.files?.[0] ?? null;
    this.mensaje = '';
    this.errorUpload = false;
  }

  subirEvidencia() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!this.archivoSeleccionado || !id) {
      this.mensaje = 'Selecciona un archivo para subir. Se aceptan PDF, imágenes y archivos Excel (.xls/.xlsx).';
      this.errorUpload = true;
      return;
    }

    this.subiendo = true;
    this.mensaje = '';
    this.errorUpload = false;

    this.evidenciasService.subirCaso(+id, this.archivoSeleccionado, this.descripcion.trim() || undefined).subscribe({
      next: (res) => {
        this.subiendo = false;
        if (res.success) {
          this.mensaje = res.message || 'Evidencia subida correctamente.';
          this.archivoSeleccionado = null;
          this.descripcion = '';
          this.modoReemplazo = false;
          this.evidenciaEnEdicion = null;
          const input = document.querySelector('input[type="file"]') as HTMLInputElement | null;
          if (input) {
            input.value = '';
          }
          this.cargarExpediente(+id);
        } else {
          this.errorUpload = true;
          this.mensaje = res.message || 'No se pudo subir la evidencia.';
        }
      },
      error: (err) => {
        this.subiendo = false;
        this.errorUpload = true;
        this.mensaje = err.error?.message || 'Error al subir la evidencia. Verifica el tipo de archivo y que sea un PDF, imagen o Excel válido.';
      },
    });
  }

  iniciarReemplazo(evidencia: Evidencia) {
    this.modoReemplazo = true;
    this.evidenciaEnEdicion = evidencia;
    this.mensaje = '';
    this.errorUpload = false;
  }

  cancelarReemplazo() {
    this.modoReemplazo = false;
    this.evidenciaEnEdicion = null;
    this.mensaje = '';
    this.errorUpload = false;
  }

  verEvidencia(evidencia: Evidencia) {
    this.evidenciasService.descargar(evidencia.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      },
      error: () => {
        this.mensaje = 'No se pudo abrir la evidencia.';
        this.errorUpload = true;
      },
    });
  }

  volverAlDetalle() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.router.navigate(['/casos', id]);
    } else {
      this.router.navigate(['/casos']);
    }
  }

  volverAlListado() {
    this.router.navigate(['/casos']);
  }
}