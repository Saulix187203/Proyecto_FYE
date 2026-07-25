import { Component, inject, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { AccionesService } from '../services/acciones.service';
import { EvidenciasService } from '../services/evidencias.service';
import { UsuariosService } from '../services/usuarios.service';
import { AuthService } from '../../../core/services/auth.service';
import { AccionCorrectiva } from '../../../core/models/caso.model';

@Component({
  selector: 'app-acciones-caso',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div style="margin-top:1.5rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:1rem;">
        <h3 style="margin:0;">Acciones Correctivas</h3>
        <button *ngIf="puedeCrearAccion()" 
                (click)="mostrarFormularioCrear = true" 
                style="padding:0.4rem 1rem; background:#28a745; color:white; border:none; border-radius:4px; cursor:pointer;">
          + Crear acción
        </button>
      </div>

      <!-- Formulario para crear acción -->
      <div *ngIf="mostrarFormularioCrear" style="background:#f8f9fa; padding:1rem; border-radius:4px; margin-bottom:1rem; border:1px solid #ced4da;">
        <h4 style="margin:0 0 0.8rem 0;">Nueva acción correctiva</h4>
        <form [formGroup]="crearForm" (ngSubmit)="crearAccion()">
          <div style="margin-bottom:0.5rem;">
            <label style="display:block; font-weight:bold;">Descripción *</label>
            <textarea formControlName="descripcion" rows="2" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;"></textarea>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">
            <div>
              <label style="display:block; font-weight:bold;">Responsable *</label>
              <select formControlName="idResponsable" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
                <option value="">Seleccionar</option>
                <option *ngFor="let u of usuarios" [value]="u.id">{{ u.nombre }}</option>
              </select>
            </div>
            <div>
              <label style="display:block; font-weight:bold;">Fecha compromiso *</label>
              <input type="datetime-local" formControlName="fechaCompromiso" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
            </div>
          </div>
          <div style="margin-top:0.5rem; display:flex; gap:0.5rem;">
            <button type="submit" [disabled]="crearForm.invalid || creando" style="padding:0.4rem 1.5rem; background:#28a745; color:white; border:none; border-radius:4px; cursor:pointer;">
              {{ creando ? 'Guardando...' : 'Guardar' }}
            </button>
            <button type="button" (click)="cancelarCrear()" style="padding:0.4rem 1.5rem; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer;">Cancelar</button>
          </div>
          <div *ngIf="errorCrear" style="color:red; margin-top:0.5rem;">{{ errorCrear }}</div>
        </form>
      </div>

      <!-- Lista de acciones -->
      <div *ngIf="acciones.length === 0" style="color:#6c757d;">No hay acciones.</div>
      <div *ngFor="let accion of acciones" style="background:#fff; border:1px solid #dee2e6; border-radius:4px; padding:0.75rem; margin-bottom:0.75rem;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem;">
          <div>
            <p style="margin:0 0 0.2rem 0;"><strong>{{ accion.descripcion }}</strong></p>
            <p style="margin:0; font-size:0.9rem; color:#6c757d;">
              <span>Estado: <strong [style.color]="getEstadoColor(accion.estado?.nombre)">{{ accion.estado?.nombre || 'N/A' }}</strong></span>
              <span style="margin-left:1rem;">Responsable: {{ accion.responsable?.nombre || 'N/A' }}</span>
              <span style="margin-left:1rem;">Compromiso: {{ accion.fechaCompromiso | date:'dd/MM/yyyy HH:mm' }}</span>
            </p>
          </div>
          <div style="display:flex; gap:0.3rem; flex-wrap:wrap;">
            <!-- Iniciar (solo Pendiente) -->
            <button *ngIf="accion.estado?.nombre === 'Pendiente' && puedeIniciar(accion)" 
                    (click)="iniciarAccion(accion.id)" 
                    style="padding:0.2rem 0.8rem; background:#17a2b8; color:white; border:none; border-radius:4px; cursor:pointer; font-size:0.8rem;">
              Iniciar
            </button>
            <!-- Enviar a validación (solo En proceso o Devuelta) -->
            <button *ngIf="(accion.estado?.nombre === 'En proceso' || accion.estado?.nombre === 'Devuelta') && puedeEnviarValidacion(accion)" 
                    (click)="abrirModalValidarAccion(accion)" 
                    style="padding:0.2rem 0.8rem; background:#ffc107; color:#212529; border:none; border-radius:4px; cursor:pointer; font-size:0.8rem;">
              Enviar validación
            </button>
            <!-- Cerrar (solo En validación) -->
            <button *ngIf="accion.estado?.nombre === 'En validación' && puedeCerrar(accion)" 
                    (click)="abrirModalCerrarAccion(accion)" 
                    style="padding:0.2rem 0.8rem; background:#28a745; color:white; border:none; border-radius:4px; cursor:pointer; font-size:0.8rem;">
              Cerrar
            </button>
            <!-- Devolver (solo En validación) -->
            <button *ngIf="accion.estado?.nombre === 'En validación' && puedeDevolver(accion)" 
                    (click)="abrirModalDevolverAccion(accion)" 
                    style="padding:0.2rem 0.8rem; background:#fd7e14; color:white; border:none; border-radius:4px; cursor:pointer; font-size:0.8rem;">
              Devolver
            </button>
            <!-- Subir evidencia (si no está Cerrada) -->
            <button *ngIf="accion.estado?.nombre !== 'Cerrada'" 
                    (click)="subirEvidenciaAccion(accion.id)" 
                    style="padding:0.2rem 0.8rem; background:#007bff; color:white; border:none; border-radius:4px; cursor:pointer; font-size:0.8rem;">
              📎 Evidencia
            </button>
            <!-- Ver evidencias -->
            <button *ngIf="accion.evidencias && accion.evidencias.length > 0" 
                    (click)="verEvidencias(accion.evidencias)" 
                    style="padding:0.2rem 0.8rem; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer; font-size:0.8rem;">
              Ver {{ accion.evidencias.length }}
            </button>
          </div>
        </div>
        <!-- Observaciones de la acción -->
        <div *ngIf="accion.observaciones" style="margin-top:0.3rem; font-size:0.9rem; background:#f1f3f5; padding:0.3rem 0.6rem; border-radius:4px;">
          <strong>Obs:</strong> {{ accion.observaciones }}
        </div>
      </div>
    </div>

    <!-- Modales para observaciones (validación, cierre, devolución) -->
    <div *ngIf="modalAccion" class="modal-overlay" (click)="cerrarModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <h4>{{ modalTitulo }}</h4>
        <form [formGroup]="observacionForm" (ngSubmit)="ejecutarModalAccion()">
          <div style="margin-bottom:0.8rem;">
            <label style="display:block; font-weight:bold;">Observaciones *</label>
            <textarea formControlName="observaciones" rows="3" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;"></textarea>
          </div>
          <div style="display:flex; gap:0.5rem;">
            <button type="submit" [disabled]="observacionForm.invalid || ejecutandoModal" style="padding:0.4rem 1.5rem; background:#28a745; color:white; border:none; border-radius:4px; cursor:pointer;">
              {{ ejecutandoModal ? 'Procesando...' : 'Confirmar' }}
            </button>
            <button type="button" (click)="cerrarModal()" style="padding:0.4rem 1.5rem; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer;">Cancelar</button>
          </div>
          <div *ngIf="errorModal" style="color:red; margin-top:0.5rem;">{{ errorModal }}</div>
        </form>
      </div>
    </div>

    <!-- Modal para subir evidencia -->
    <div *ngIf="modalEvidencia" class="modal-overlay" (click)="cerrarModalEvidencia()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <h4>Subir evidencia a acción</h4>
        <div style="margin-bottom:0.5rem;">
          <label style="display:block; font-weight:bold;">Archivo *</label>
          <input type="file" (change)="onArchivoSeleccionado($event)" accept=".pdf,.png,.jpg,.jpeg,.webp" />
        </div>
        <div style="margin-bottom:0.5rem;">
          <label style="display:block; font-weight:bold;">Descripción</label>
          <input type="text" [(ngModel)]="descripcionEvidencia" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;" />
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button (click)="subirEvidencia()" [disabled]="!archivoSeleccionado || subiendoEvidencia" style="padding:0.4rem 1.5rem; background:#007bff; color:white; border:none; border-radius:4px; cursor:pointer;">
            {{ subiendoEvidencia ? 'Subiendo...' : 'Subir' }}
          </button>
          <button (click)="cerrarModalEvidencia()" style="padding:0.4rem 1.5rem; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer;">Cancelar</button>
        </div>
        <div *ngIf="errorEvidencia" style="color:red; margin-top:0.5rem;">{{ errorEvidencia }}</div>
      </div>
    </div>

    <!-- Modal para ver evidencias -->
    <div *ngIf="modalVerEvidencias" class="modal-overlay" (click)="cerrarModalVerEvidencias()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <h4>Evidencias</h4>
        <ul style="list-style:none; padding:0;">
          <li *ngFor="let e of evidenciasMostrar" style="border-bottom:1px solid #dee2e6; padding:0.5rem 0;">
            <strong>{{ e.nombreOriginal }}</strong>
            <button (click)="descargarEvidencia(e.id)" style="margin-left:0.5rem; padding:0.2rem 0.6rem; background:#007bff; color:white; border:none; border-radius:4px; cursor:pointer;">Descargar</button>
          </li>
        </ul>
        <button (click)="cerrarModalVerEvidencias()" style="margin-top:1rem; padding:0.4rem 1rem; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer;">Cerrar</button>
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
    }
    .modal-content {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
      max-height: 90vh;
      overflow-y: auto;
    }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class AccionesCasoComponent implements OnInit {
  @Input() idCaso!: number;
  @Input() estadoCaso?: string;
  @Output() cambio = new EventEmitter<void>();

  private accionesService = inject(AccionesService);
  private evidenciasService = inject(EvidenciasService);
  private usuariosService = inject(UsuariosService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  acciones: AccionCorrectiva[] = [];
  usuarios: any[] = [];
  mostrarFormularioCrear = false;
  creando = false;
  errorCrear = '';

  crearForm = this.fb.group({
    descripcion: ['', Validators.required],
    idResponsable: ['', Validators.required],
    fechaCompromiso: ['', Validators.required],
  });

  // Modales de observaciones
  modalAccion = false;
  modalTitulo = '';
  accionModalId: number | null = null;
  tipoModal: 'enviar' | 'cerrar' | 'devolver' = 'enviar';
  observacionForm = this.fb.group({ observaciones: ['', Validators.required] });
  ejecutandoModal = false;
  errorModal = '';

  // Modal evidencia
  modalEvidencia = false;
  accionEvidenciaId: number | null = null;
  archivoSeleccionado: File | null = null;
  descripcionEvidencia = '';
  subiendoEvidencia = false;
  errorEvidencia = '';

  // Modal ver evidencias
  modalVerEvidencias = false;
  evidenciasMostrar: any[] = [];

  ngOnInit(): void {
    this.cargarAcciones();
    this.cargarUsuarios();
  }

  cargarAcciones() {
    if (!this.idCaso) return;
    this.accionesService.listarPorCaso(this.idCaso).subscribe({
      next: (res) => this.acciones = res.data || [],
      error: (err) => console.error('Error cargando acciones', err)
    });
  }

  cargarUsuarios() {
    // Cargar usuarios con roles de responsable (puedes ajustar el rol)
    this.usuariosService.getOpcionesPorRol('Responsable del Proceso').subscribe({
      next: (res) => this.usuarios = res.data || [],
      error: () => {
        // Si falla, cargar todos los usuarios (fallback)
        this.usuariosService.getOpciones().subscribe({
          next: (res) => this.usuarios = res.data || []
        });
      }
    });
  }

  // Permisos
  tieneRol(roles: string[]): boolean {
    return roles.some(r => this.authService.hasRole(r));
  }

  puedeCrearAccion(): boolean {
    const estadosPermitidos = ['Aprobado', 'Con acciones'];
    if (!this.estadoCaso || !estadosPermitidos.includes(this.estadoCaso)) return false;
    return this.tieneRol(['Administrador', 'PRL Contratista', 'Responsable del Proceso', 'SYMA']);
  }

  puedeIniciar(accion: AccionCorrectiva): boolean {
    return this.tieneRol(['Administrador', 'Responsable del Proceso', 'PRL Contratista']);
  }

  puedeEnviarValidacion(accion: AccionCorrectiva): boolean {
    return this.tieneRol(['Administrador', 'Responsable del Proceso', 'PRL Contratista']);
  }

  puedeCerrar(accion: AccionCorrectiva): boolean {
    return this.tieneRol(['Administrador', 'SYMA', 'Gestión y Control SYMA']);
  }

  puedeDevolver(accion: AccionCorrectiva): boolean {
    return this.tieneRol(['Administrador', 'SYMA', 'Gestión y Control SYMA']);
  }

  // Crear acción
  crearAccion() {
    if (this.crearForm.invalid || !this.idCaso) return;
    this.creando = true;
    this.errorCrear = '';
    const formVal = this.crearForm.value;
    const payload = {
      idCaso: this.idCaso,
      descripcion: formVal.descripcion!,
      idResponsable: +formVal.idResponsable!,
      fechaCompromiso: new Date(formVal.fechaCompromiso!).toISOString(),
    };
    this.accionesService.crearAccion(payload).subscribe({
      next: () => {
        this.creando = false;
        this.mostrarFormularioCrear = false;
        this.crearForm.reset();
        this.cargarAcciones();
        this.cambio.emit();
      },
      error: (err) => {
        this.creando = false;
        this.errorCrear = err.error?.message || 'Error al crear acción.';
      }
    });
  }

  cancelarCrear() {
    this.mostrarFormularioCrear = false;
    this.crearForm.reset();
    this.errorCrear = '';
  }

  // Transiciones con observaciones
  abrirModalValidarAccion(accion: AccionCorrectiva) {
    this.accionModalId = accion.id;
    this.tipoModal = 'enviar';
    this.modalTitulo = 'Enviar a validación';
    this.modalAccion = true;
    this.observacionForm.reset();
    this.errorModal = '';
  }

  abrirModalCerrarAccion(accion: AccionCorrectiva) {
    this.accionModalId = accion.id;
    this.tipoModal = 'cerrar';
    this.modalTitulo = 'Cerrar acción';
    this.modalAccion = true;
    this.observacionForm.reset();
    this.errorModal = '';
  }

  abrirModalDevolverAccion(accion: AccionCorrectiva) {
    this.accionModalId = accion.id;
    this.tipoModal = 'devolver';
    this.modalTitulo = 'Devolver acción';
    this.modalAccion = true;
    this.observacionForm.reset();
    this.errorModal = '';
  }

  cerrarModal() {
    this.modalAccion = false;
    this.accionModalId = null;
    this.errorModal = '';
    this.observacionForm.reset();
  }

  ejecutarModalAccion() {
    if (this.observacionForm.invalid || !this.accionModalId) return;
    this.ejecutandoModal = true;
    this.errorModal = '';
    const obs = this.observacionForm.value.observaciones!;

    let request;
    switch (this.tipoModal) {
      case 'enviar':
        request = this.accionesService.enviarValidacion(this.accionModalId, obs);
        break;
      case 'cerrar':
        request = this.accionesService.cerrar(this.accionModalId, obs);
        break;
      case 'devolver':
        request = this.accionesService.devolver(this.accionModalId, obs);
        break;
      default: return;
    }

    request.subscribe({
      next: () => {
        this.ejecutandoModal = false;
        this.cerrarModal();
        this.cargarAcciones();
        this.cambio.emit();
      },
      error: (err) => {
        this.ejecutandoModal = false;
        this.errorModal = err.error?.message || 'Error al ejecutar acción.';
      }
    });
  }

  // Iniciar acción (sin observaciones)
  iniciarAccion(id: number) {
    this.accionesService.iniciar(id).subscribe({
      next: () => {
        this.cargarAcciones();
        this.cambio.emit();
      },
      error: (err) => console.error('Error al iniciar', err)
    });
  }

  // Evidencias
  subirEvidenciaAccion(id: number) {
    this.accionEvidenciaId = id;
    this.modalEvidencia = true;
    this.archivoSeleccionado = null;
    this.descripcionEvidencia = '';
    this.errorEvidencia = '';
  }

  onArchivoSeleccionado(event: Event) {
    const input = event.target as HTMLInputElement;
    this.archivoSeleccionado = input.files?.[0] || null;
  }

  subirEvidencia() {
    if (!this.archivoSeleccionado || !this.accionEvidenciaId) return;
    this.subiendoEvidencia = true;
    this.errorEvidencia = '';
    this.evidenciasService.subirAccion(
      this.accionEvidenciaId,
      this.archivoSeleccionado,
      this.descripcionEvidencia || undefined
    ).subscribe({
      next: () => {
        this.subiendoEvidencia = false;
        this.cerrarModalEvidencia();
        this.cargarAcciones();
        this.cambio.emit();
      },
      error: (err) => {
        this.subiendoEvidencia = false;
        this.errorEvidencia = err.error?.message || 'Error al subir evidencia.';
      }
    });
  }

  cerrarModalEvidencia() {
    this.modalEvidencia = false;
    this.accionEvidenciaId = null;
    this.archivoSeleccionado = null;
    this.descripcionEvidencia = '';
    this.errorEvidencia = '';
  }

  verEvidencias(evidencias: any[]) {
    this.evidenciasMostrar = evidencias;
    this.modalVerEvidencias = true;
  }

  cerrarModalVerEvidencias() {
    this.modalVerEvidencias = false;
    this.evidenciasMostrar = [];
  }

  descargarEvidencia(id: number) {
    this.evidenciasService.descargar(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      },
      error: (err) => console.error('Error descargando', err)
    });
  }

  getEstadoColor(estado?: string): string {
    const colores: Record<string, string> = {
      'Pendiente': '#ffc107',
      'En proceso': '#17a2b8',
      'En validación': '#6f42c1',
      'Cerrada': '#28a745',
      'Devuelta': '#fd7e14',
      'Vencida': '#dc3545'
    };
    return colores[estado || ''] || '#333';
  }
}