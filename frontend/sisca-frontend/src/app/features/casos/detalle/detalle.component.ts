import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CasosService } from '../services/casos.service';
import { Caso } from '../../../core/models/caso.model';
import { AuthService } from '../../../core/services/auth.service';
import { ValidacionProcedenciaComponent } from '../validacion/validacion-procedencia.component';

@Component({
  selector: 'app-detalle-caso',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ValidacionProcedenciaComponent],
  template: `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
      <h2 style="margin:0;">Detalle del Caso</h2>
      <button (click)="volver()" style="padding:0.5rem 1rem; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer;">
        ← Volver al listado
      </button>
    </div>

    <!-- Cargando -->
    <div *ngIf="cargando" style="text-align:center; padding:2rem;">
      <span>Cargando caso...</span>
    </div>

    <!-- Error -->
    <div *ngIf="error" style="color:red; padding:1rem; background:#ffe6e6; border-radius:4px; margin:1rem 0;">
      <p><strong>Error:</strong> {{ error }}</p>
      <button (click)="volver()" style="margin-top:0.5rem; padding:0.3rem 1rem; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer;">
        Volver al listado
      </button>
    </div>

    <!-- Contenido -->
    <div *ngIf="caso && !cargando">
      <!-- Información del caso -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; background:#f8f9fa; padding:1rem; border-radius:4px;">
        <div>
          <p><strong>Correlativo:</strong> {{ caso.correlativo }}</p>
          <p><strong>Título:</strong> {{ caso.titulo }}</p>
          <p><strong>Estado:</strong> 
            <span [style.color]="getEstadoColor(caso.estado?.nombre)" style="font-weight:bold;">
              {{ caso.estado?.nombre || 'N/A' }}
            </span>
          </p>
          <p><strong>Área:</strong> {{ caso.area?.nombre || 'N/A' }}</p>
          <p><strong>Proceso:</strong> {{ caso.proceso?.nombre || 'N/A' }}</p>
        </div>
        <div>
          <p><strong>Tipo Evento:</strong> {{ caso.tipoEvento?.nombre || 'N/A' }}</p>
          <p><strong>Criticidad:</strong> 
            <span [style.color]="getCriticidadColor(caso.criticidad?.nombre)" style="font-weight:bold;">
              {{ caso.criticidad?.nombre || 'N/A' }}
            </span>
          </p>
          <p><strong>Fecha Evento:</strong> {{ caso.fechaEvento | date:'dd/MM/yyyy HH:mm' }}</p>
          <p><strong>Lugar:</strong> {{ caso.lugar }}</p>
          <p><strong>Creado por:</strong> {{ caso.creadoPor?.nombre || 'N/A' }}</p>
          <p><strong>Fecha Creación:</strong> {{ caso.fechaCreacion | date:'dd/MM/yyyy HH:mm' }}</p>
          <p><strong>Región:</strong> {{ caso.region?.nombre || 'N/A' }}</p>
          <p><strong>Departamento:</strong> {{ caso.departamento?.nombre || 'N/A' }}</p>
          <p><strong>Municipio:</strong> {{ caso.municipio?.nombre || 'N/A' }}</p>
          <p><strong>Tipo Brigada:</strong> {{ caso.tipoBrigada?.nombre || 'N/A' }}</p>
          <p><strong>Técnico:</strong> {{ caso.nombreTecnico || 'N/A' }}</p>
          <p><strong>Código Brigada:</strong> {{ caso.codigoBrigada || 'N/A' }}</p>
        </div>
      </div>

      <!-- Descripción -->
      <div style="margin-top:1rem;">
        <p><strong>Descripción:</strong></p>
        <p style="background:#f8f9fa; padding:0.75rem; border-radius:4px; border-left:4px solid #007bff;">
          {{ caso.descripcion }}
        </p>
      </div>

      <hr style="margin:1.5rem 0;">

      <!-- Editar datos básicos -->
      <h3>Editar datos básicos</h3>
      <form [formGroup]="editForm" (ngSubmit)="actualizar()" style="max-width:500px;">
        <div style="margin-bottom:0.8rem;">
          <label style="display:block; font-weight:bold;">Lugar</label>
          <input formControlName="lugar" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px; box-sizing:border-box;">
        </div>
        <div style="margin-bottom:0.8rem;">
          <label style="display:block; font-weight:bold;">Descripción</label>
          <textarea formControlName="descripcion" rows="3" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px; box-sizing:border-box;"></textarea>
        </div>
        <div style="display:flex; gap:1rem; flex-wrap:wrap;">
          <button type="submit" [disabled]="editForm.invalid || editando" style="padding:0.5rem 1.5rem; background:#28a745; color:white; border:none; border-radius:4px; cursor:pointer;">
            {{ editando ? 'Actualizando...' : 'Actualizar' }}
          </button>
          <button type="button" (click)="resetEditForm()" style="padding:0.5rem 1.5rem; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer;">
            Restaurar
          </button>
        </div>
        <div *ngIf="editError" style="color:red; margin-top:0.5rem;">{{ editError }}</div>
        <div *ngIf="editSuccess" style="color:green; margin-top:0.5rem;">✓ Actualizado correctamente</div>
      </form>

      <hr style="margin:1.5rem 0;">

      <!-- Acciones -->
      <div style="display:flex; gap:1rem; flex-wrap:wrap; align-items:center;">
        <a [routerLink]="['/casos', caso.id, 'expediente']" style="display:inline-block; padding:0.5rem 1rem; background:#007bff; color:white; text-decoration:none; border-radius:4px;">
          📄 Ver Expediente Completo
        </a>

        <!-- Botón para validación de procedencia -->
        <button *ngIf="mostrarBotonValidacion()" 
                (click)="abrirValidacion()" 
                style="padding:0.5rem 1rem; background:#6f42c1; color:white; border:none; border-radius:4px; cursor:pointer;">
          🔍 Validar procedencia
        </button>

        <button (click)="volver()" style="padding:0.5rem 1rem; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer;">
          ← Volver al listado
        </button>
      </div>
    </div>

    <!-- Modal de validación de procedencia -->
    <app-validacion-procedencia *ngIf="mostrarValidacion && caso"
      [idCaso]="caso.id"
      [caso]="caso"
      (cerrado)="cerrarValidacion($event)">
    </app-validacion-procedencia>
  `,
  styles: [`
    input, textarea { border: 1px solid #ced4da; border-radius: 4px; }
    input:focus, textarea:focus { outline: none; border-color: #80bdff; box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25); }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class DetalleCasoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private casosService = inject(CasosService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  caso: Caso | null = null;
  cargando = true;
  error = '';
  editando = false;
  editError = '';
  editSuccess = false;

  // Para el modal de validación
  mostrarValidacion = false;

  editForm = this.fb.group({
    lugar: ['', Validators.required],
    descripcion: ['', Validators.required],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarCaso(+id);
    } else {
      this.error = 'No se proporcionó un ID de caso válido';
      this.cargando = false;
    }
  }

  cargarCaso(id: number) {
    this.cargando = true;
    this.error = '';
    this.casosService.obtenerCaso(id).subscribe({
      next: (res) => {
        if (res.success && res.data.caso) {
          this.caso = res.data.caso;
          this.editForm.patchValue({
            lugar: this.caso.lugar,
            descripcion: this.caso.descripcion,
          });
        } else {
          this.error = 'No se encontró el caso';
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar caso:', err);
        this.error = err.error?.message || 'Error al cargar el caso. Verifica que el ID sea correcto.';
        this.cargando = false;
      },
    });
  }

  actualizar() {
    if (!this.caso || this.editForm.invalid) return;
    this.editando = true;
    this.editError = '';
    this.editSuccess = false;

    const data = {
      lugar: this.editForm.value.lugar!,
      descripcion: this.editForm.value.descripcion!,
    };

    this.casosService.actualizarCaso(this.caso.id, data).subscribe({
      next: (res) => {
        if (res.success && res.data.caso) {
          this.caso = res.data.caso;
          this.editSuccess = true;
          setTimeout(() => this.editSuccess = false, 3000);
        }
        this.editando = false;
      },
      error: (err) => {
        this.editError = err.error?.message || 'Error al actualizar';
        this.editando = false;
      },
    });
  }

  resetEditForm() {
    if (this.caso) {
      this.editForm.patchValue({
        lugar: this.caso.lugar,
        descripcion: this.caso.descripcion,
      });
      this.editError = '';
      this.editSuccess = false;
    }
  }

  volver() {
    this.router.navigate(['/casos']);
  }

  // === MÉTODOS PARA VALIDACIÓN DE PROCEDENCIA ===
  mostrarBotonValidacion(): boolean {
    if (!this.caso) return false;
    const estado = this.caso.estado?.nombre;
    const rolesValidos = ['Administrador', 'PRL Contratista', 'SYMA'];
    const tieneRol = rolesValidos.some(r => this.authService.hasRole(r));
    return tieneRol && (estado === 'Reportado' || estado === 'Devuelto' || estado === 'En revisión');
  }

  abrirValidacion() {
    this.mostrarValidacion = true;
  }

  cerrarValidacion(recargar: boolean) {
    this.mostrarValidacion = false;
    if (recargar && this.caso) {
      this.cargarCaso(this.caso.id);
    }
  }

  // === UTILIDADES ===
  getEstadoColor(estado?: string): string {
    const colores: Record<string, string> = {
      'Reportado': '#ffc107',
      'En revisión': '#17a2b8',
      'Devuelto': '#fd7e14',
      'Aprobado': '#28a745',
      'Rechazado': '#dc3545',
      'Con acciones': '#007bff',
      'En validación': '#6f42c1',
      'Cerrado': '#6c757d'
    };
    return colores[estado || ''] || '#333';
  }

  getCriticidadColor(criticidad?: string): string {
    const colores: Record<string, string> = {
      'Muy Alta': '#dc3545',
      'Alta': '#fd7e14',
      'Media': '#ffc107',
      'Baja': '#28a745',
      'Muy Baja': '#6c757d'
    };
    return colores[criticidad || ''] || '#333';
  }
}