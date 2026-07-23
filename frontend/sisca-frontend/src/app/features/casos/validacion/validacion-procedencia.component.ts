import { Component, inject, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ValidacionService } from '../services/validacion.service';
import { AuthService } from '../../../core/services/auth.service';
import { Caso } from '../../../core/models/caso.model';

@Component({
  selector: 'app-validacion-procedencia',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Fondo oscuro (overlay) -->
    <div class="modal-overlay" (click)="cerrar()">
      <!-- Contenido del modal (evita que el click en el interior cierre) -->
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <h3 style="margin:0;">🔍 Validación de Procedencia</h3>
          <button (click)="cerrar()" style="background:transparent; border:none; font-size:1.5rem; cursor:pointer;">&times;</button>
        </div>

        <div style="margin-bottom:1rem;">
          <p><strong>Caso:</strong> {{ caso?.correlativo }} - {{ caso?.titulo }}</p>
          <p><strong>Estado actual:</strong> 
            <span [style.color]="getEstadoColor(caso?.estado?.nombre)" style="font-weight:bold;">
              {{ caso?.estado?.nombre || 'N/A' }}
            </span>
          </p>
        </div>

        <!-- Acciones disponibles según estado y rol -->
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:1rem;">

          <!-- Iniciar revisión (solo desde Reportado o Devuelto) -->
          <button *ngIf="puedeIniciarRevision()" 
                  (click)="iniciarRevision()" 
                  style="padding:0.5rem 1.2rem; background:#17a2b8; color:white; border:none; border-radius:4px; cursor:pointer;">
            Iniciar revisión
          </button>

          <!-- Aprobar (solo desde En revisión) -->
          <button *ngIf="puedeAprobar()" 
                  (click)="abrirFormulario('aprobar')" 
                  style="padding:0.5rem 1.2rem; background:#28a745; color:white; border:none; border-radius:4px; cursor:pointer;">
            ✅ Aprobar
          </button>

          <!-- Devolver (solo desde En revisión) -->
          <button *ngIf="puedeDevolver()" 
                  (click)="abrirFormulario('devolver')" 
                  style="padding:0.5rem 1.2rem; background:#fd7e14; color:white; border:none; border-radius:4px; cursor:pointer;">
            ↩️ Devolver
          </button>

          <!-- Rechazar (solo desde En revisión) -->
          <button *ngIf="puedeRechazar()" 
                  (click)="abrirFormulario('rechazar')" 
                  style="padding:0.5rem 1.2rem; background:#dc3545; color:white; border:none; border-radius:4px; cursor:pointer;">
            ❌ Rechazar
          </button>

          <div *ngIf="!accionesDisponibles()" style="color:#6c757d; font-style:italic;">
            No hay acciones disponibles para el estado actual.
          </div>
        </div>

        <!-- Formulario para observaciones (se muestra al hacer clic en Aprobar/Devolver/Rechazar) -->
        <div *ngIf="mostrarFormulario" style="border-top:1px solid #dee2e6; padding-top:1rem; margin-top:0.5rem;">
          <form [formGroup]="observacionForm" (ngSubmit)="ejecutarAccion()">
            <div style="margin-bottom:0.8rem;">
              <label style="display:block; font-weight:bold; margin-bottom:0.2rem;">Observaciones *</label>
              <textarea formControlName="observaciones" rows="3" placeholder="Ingrese las observaciones..." style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px; resize:vertical;"></textarea>
              <div *ngIf="observacionForm.get('observaciones')?.invalid && observacionForm.get('observaciones')?.touched" style="color:red; font-size:0.9rem;">
                Las observaciones son requeridas.
              </div>
            </div>
            <div style="display:flex; gap:0.5rem;">
              <button type="submit" [disabled]="observacionForm.invalid || ejecutando" style="padding:0.5rem 1.5rem; background:#28a745; color:white; border:none; border-radius:4px; cursor:pointer;">
                {{ ejecutando ? 'Procesando...' : 'Confirmar' }}
              </button>
              <button type="button" (click)="cancelarFormulario()" style="padding:0.5rem 1.5rem; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer;">
                Cancelar
              </button>
            </div>
            <div *ngIf="errorFormulario" style="color:red; margin-top:0.5rem;">{{ errorFormulario }}</div>
          </form>
        </div>

        <!-- Mensaje de éxito/error -->
        <div *ngIf="mensaje" style="margin-top:1rem; padding:0.5rem; border-radius:4px;" 
             [style.background]="mensajeError ? '#f8d7da' : '#d4edda'" 
             [style.color]="mensajeError ? '#dc3545' : '#155724'">
          {{ mensaje }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      animation: fadeIn 0.3s;
    }
    .modal-content {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
      animation: slideIn 0.3s;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideIn {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class ValidacionProcedenciaComponent implements OnInit {
  @Input() idCaso!: number;
  @Input() caso?: Caso; // Para mostrar datos adicionales
  @Output() cerrado = new EventEmitter<boolean>(); // Emite true si hubo cambios

  private validacionService = inject(ValidacionService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  mostrarFormulario = false;
  accionSeleccionada: 'aprobar' | 'devolver' | 'rechazar' | null = null;
  ejecutando = false;
  mensaje = '';
  mensajeError = false;
  errorFormulario = '';

  observacionForm = this.fb.group({
    observaciones: ['', Validators.required]
  });

  ngOnInit(): void {
    if (!this.idCaso) {
      this.mensaje = 'Error: ID de caso no proporcionado.';
      this.mensajeError = true;
    }
  }

  // Verificar roles
  tieneRol(roles: string[]): boolean {
    return roles.some(r => this.authService.hasRole(r));
  }

  // Acciones disponibles según estado
  puedeIniciarRevision(): boolean {
    if (!this.caso) return false;
    const estado = this.caso.estado?.nombre;
    const rolesPermitidos = ['Administrador', 'PRL Contratista', 'SYMA'];
    return this.tieneRol(rolesPermitidos) && (estado === 'Reportado' || estado === 'Devuelto');
  }

  puedeAprobar(): boolean {
    if (!this.caso) return false;
    const estado = this.caso.estado?.nombre;
    const rolesPermitidos = ['Administrador', 'PRL Contratista', 'SYMA'];
    return this.tieneRol(rolesPermitidos) && estado === 'En revisión';
  }

  puedeDevolver(): boolean {
    return this.puedeAprobar(); // Mismos roles y estado
  }

  puedeRechazar(): boolean {
    return this.puedeAprobar();
  }

  accionesDisponibles(): boolean {
    return this.puedeIniciarRevision() || this.puedeAprobar() || this.puedeDevolver() || this.puedeRechazar();
  }

  // Iniciar revisión (sin observaciones)
  iniciarRevision() {
    if (!this.idCaso) return;
    this.ejecutando = true;
    this.mensaje = '';
    this.mensajeError = false;

    this.validacionService.iniciarRevision(this.idCaso).subscribe({
      next: (res) => {
        this.ejecutando = false;
        this.mensaje = res.message || 'Revisión iniciada correctamente.';
        this.mensajeError = false;
        setTimeout(() => {
          this.cerrar(true);
        }, 1500);
      },
      error: (err) => {
        this.ejecutando = false;
        this.mensaje = err.error?.message || 'Error al iniciar revisión.';
        this.mensajeError = true;
      }
    });
  }

  // Abrir formulario para acciones que requieren observaciones
  abrirFormulario(accion: 'aprobar' | 'devolver' | 'rechazar') {
    this.accionSeleccionada = accion;
    this.mostrarFormulario = true;
    this.observacionForm.reset();
    this.errorFormulario = '';
  }

  cancelarFormulario() {
    this.mostrarFormulario = false;
    this.accionSeleccionada = null;
    this.errorFormulario = '';
  }

  // Ejecutar la acción con observaciones
  ejecutarAccion() {
    if (this.observacionForm.invalid || !this.accionSeleccionada || !this.idCaso) {
      this.errorFormulario = 'Debe ingresar observaciones.';
      return;
    }

    const observaciones = this.observacionForm.value.observaciones!.trim();
    if (!observaciones) {
      this.errorFormulario = 'Las observaciones son requeridas.';
      return;
    }

    this.ejecutando = true;
    this.errorFormulario = '';
    this.mensaje = '';
    this.mensajeError = false;

    let request;
    switch (this.accionSeleccionada) {
      case 'aprobar':
        request = this.validacionService.aprobar(this.idCaso, observaciones);
        break;
      case 'devolver':
        request = this.validacionService.devolver(this.idCaso, observaciones);
        break;
      case 'rechazar':
        request = this.validacionService.rechazar(this.idCaso, observaciones);
        break;
      default:
        return;
    }

    request.subscribe({
      next: (res) => {
        this.ejecutando = false;
        this.mensaje = res.message || 'Acción ejecutada correctamente.';
        this.mensajeError = false;
        setTimeout(() => {
          this.cerrar(true);
        }, 1500);
      },
      error: (err) => {
        this.ejecutando = false;
        this.mensaje = err.error?.message || 'Error al ejecutar la acción.';
        this.mensajeError = true;
      }
    });
  }

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

  cerrar(recargar: boolean = false) {
    this.cerrado.emit(recargar);
  }
}