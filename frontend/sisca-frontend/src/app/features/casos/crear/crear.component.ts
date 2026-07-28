import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CatalogosService } from '../../../core/services/catalogos.service';
import { CasosService } from '../services/casos.service';
import { AuthService } from '../../../core/services/auth.service';
import { BrigadasService, Brigada } from '../../../core/services/brigadas.service';

@Component({
  selector: 'app-crear-caso',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
      <h2 style="margin:0;">📋 Crear Nuevo Caso</h2>
      <button (click)="cancelar()" style="padding:0.5rem 1.2rem; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:500;">
        ✖ Cancelar y volver
      </button>
    </div>

    <form [formGroup]="casoForm" (ngSubmit)="onSubmit()" style="max-width:900px; margin:0 auto;">

      <!-- SECCIÓN 1: Datos del evento -->
      <div style="background:#f8f9fa; padding:1.2rem; border-radius:8px; margin-bottom:1.5rem; border:1px solid #e9ecef;">
        <h4 style="margin:0 0 0.8rem 0; color:#495057;">📌 Datos del evento</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">

          <div>
            <label style="display:block; font-weight:bold; margin-bottom:0.2rem;">Área *</label>
            <select formControlName="idArea" (change)="onAreaChange($event)" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
              <option value="">Seleccionar área</option>
              <option *ngFor="let a of areas" [value]="a.id">{{ a.nombre }}</option>
            </select>
            <div *ngIf="casoForm.get('idArea')?.invalid && casoForm.get('idArea')?.touched" style="color:red; font-size:0.9rem;">Requerido</div>
          </div>

          <div>
            <label style="display:block; font-weight:bold; margin-bottom:0.2rem;">Proceso *</label>
            <select formControlName="idProceso" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
              <option value="">Seleccionar proceso</option>
              <option *ngFor="let p of procesosFiltrados" [value]="p.id">{{ p.nombre }}</option>
            </select>
            <div *ngIf="casoForm.get('idProceso')?.invalid && casoForm.get('idProceso')?.touched" style="color:red; font-size:0.9rem;">Requerido</div>
          </div>

          <div>
            <label style="display:block; font-weight:bold; margin-bottom:0.2rem;">Tipo de Evento *</label>
            <select formControlName="idTipoEvento" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
              <option value="">Seleccionar tipo</option>
              <option *ngFor="let t of tiposEvento" [value]="t.id">{{ t.nombre }}</option>
            </select>
            <div *ngIf="casoForm.get('idTipoEvento')?.invalid && casoForm.get('idTipoEvento')?.touched" style="color:red; font-size:0.9rem;">Requerido</div>
          </div>

          <div>
            <label style="display:block; font-weight:bold; margin-bottom:0.2rem;">Criticidad *</label>
            <select formControlName="idCriticidad" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
              <option value="">Seleccionar criticidad</option>
              <option *ngFor="let c of criticidades" [value]="c.id">{{ c.nombre }}</option>
            </select>
            <div *ngIf="casoForm.get('idCriticidad')?.invalid && casoForm.get('idCriticidad')?.touched" style="color:red; font-size:0.9rem;">Requerido</div>
          </div>

          <div>
            <label style="display:block; font-weight:bold; margin-bottom:0.2rem;">Fecha del Evento *</label>
            <input type="datetime-local" formControlName="fechaEvento" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
            <div *ngIf="casoForm.get('fechaEvento')?.invalid && casoForm.get('fechaEvento')?.touched" style="color:red; font-size:0.9rem;">Requerido</div>
          </div>

          <div>
            <label style="display:block; font-weight:bold; margin-bottom:0.2rem;">Lugar *</label>
            <input formControlName="lugar" placeholder="Ej. Bodega principal, área de carga" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
            <div *ngIf="casoForm.get('lugar')?.invalid && casoForm.get('lugar')?.touched" style="color:red; font-size:0.9rem;">Requerido</div>
          </div>

          <div style="grid-column: span 2;">
            <label style="display:block; font-weight:bold; margin-bottom:0.2rem;">Descripción *</label>
            <textarea formControlName="descripcion" rows="3" placeholder="Descripción detallada del evento..." style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px; resize:vertical;"></textarea>
            <div *ngIf="casoForm.get('descripcion')?.invalid && casoForm.get('descripcion')?.touched" style="color:red; font-size:0.9rem;">Requerido</div>
          </div>

          <div style="grid-column: span 2;">
            <label style="display:block; font-weight:bold; margin-bottom:0.2rem;">Título (opcional)</label>
            <input formControlName="titulo" placeholder="Si no se envía, se genera automáticamente desde la descripción" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
            <div style="color:#6c757d; font-size:0.9rem; margin-top:0.2rem;">💡 Si no ingresas un título, el sistema lo generará automáticamente.</div>
          </div>

        </div>
      </div>

      <!-- SECCIÓN 2: Datos del técnico y brigada -->
      <div style="background:#f0f8f0; padding:1.2rem; border-radius:8px; margin-bottom:1.5rem; border:1px solid #b7e0b7;">
        <h4 style="margin:0 0 0.8rem 0; color:#155724;">👷 Datos del técnico / brigada</h4>

        <!-- Mensaje de autocompletado para Brigada (solo si es BRIGADA PURO) -->
        <div *ngIf="esUsuarioBrigada && !tieneOtrosRoles" style="background:#d4edda; padding:0.5rem 1rem; border-radius:4px; margin-bottom:0.8rem; color:#155724; border-left:4px solid #28a745;">
          ✅ Tus datos de brigada y técnico han sido asignados automáticamente.
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">

          <!-- Tipo de Brigada (filtro) -->
          <div>
            <label style="display:block; font-weight:bold; margin-bottom:0.2rem;">Tipo de Brigada *</label>
            <select formControlName="idTipoBrigada" (change)="onTipoBrigadaChange($event)" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
              <option value="">Seleccionar tipo</option>
              <option *ngFor="let tb of tiposBrigada" [value]="tb.id">{{ tb.nombre }}</option>
            </select>
            <div *ngIf="casoForm.get('idTipoBrigada')?.invalid && casoForm.get('idTipoBrigada')?.touched" style="color:red; font-size:0.9rem;">Requerido</div>
          </div>

          <!-- Brigada (código) -->
          <div>
            <label style="display:block; font-weight:bold; margin-bottom:0.2rem;">Código de Brigada *</label>
            <select formControlName="idBrigada" [disabled]="brigadaBloqueada" (change)="onBrigadaChange($event)" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
              <option value="">Seleccionar brigada</option>
              <option *ngFor="let b of brigadas" [value]="b.id">{{ b.numero }} - {{ b.nombre }}</option>
            </select>
            <div *ngIf="casoForm.get('idBrigada')?.invalid && casoForm.get('idBrigada')?.touched" style="color:red; font-size:0.9rem;">Requerido</div>
          </div>

          <!-- Técnico (nombre) -->
          <div style="grid-column: span 2;">
            <label style="display:block; font-weight:bold; margin-bottom:0.2rem;">Técnico que reporta *</label>
            <select formControlName="idTecnico" [disabled]="tecnicoBloqueado" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
              <option value="">Seleccionar técnico</option>
              <option *ngFor="let m of miembros" [value]="m.usuario.id">{{ m.usuario.nombre }}</option>
            </select>
            <div *ngIf="casoForm.get('idTecnico')?.invalid && casoForm.get('idTecnico')?.touched" style="color:red; font-size:0.9rem;">Requerido</div>
          </div>

        </div>
        <div style="margin-top:0.5rem; font-size:0.9rem; color:#6c757d;">
          <span *ngIf="brigadaSeleccionada">Brigada: {{ brigadaSeleccionada.numero }} - {{ brigadaSeleccionada.nombre }}</span>
          <span *ngIf="tecnicoSeleccionado" style="margin-left:1rem;">Técnico: {{ tecnicoSeleccionado }}</span>
        </div>
      </div>

      <!-- Botones -->
      <div style="display:flex; gap:1rem; margin-top:1.5rem; justify-content:flex-end;">
        <button type="button" (click)="cancelar()" style="padding:0.6rem 2rem; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:500;">
          Cancelar
        </button>
        <button type="submit" [disabled]="casoForm.invalid || enviando" style="padding:0.6rem 2.5rem; background:#28a745; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:500;">
          {{ enviando ? 'Creando...' : '✅ Crear Caso' }}
        </button>
      </div>

      <!-- Mensajes -->
      <div *ngIf="error" style="color:#dc3545; margin-top:1rem; padding:0.75rem; background:#f8d7da; border-radius:4px; border:1px solid #f5c6cb;">
        {{ error }}
      </div>
      <div *ngIf="exito" style="color:#155724; margin-top:1rem; padding:0.75rem; background:#d4edda; border-radius:4px; border:1px solid #c3e6cb;">
        {{ exito }}
      </div>

    </form>
  `,
  styles: [`
    input, textarea, select { box-sizing: border-box; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    select:focus, input:focus, textarea:focus {
      outline: none;
      border-color: #80bdff;
      box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
    }
  `]
})
export class CrearCasoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private casosService = inject(CasosService);
  private catalogosService = inject(CatalogosService);
  private authService = inject(AuthService);
  private brigadasService = inject(BrigadasService);
  private router = inject(Router);

  // Catálogos principales
  areas: any[] = [];
  tiposEvento: any[] = [];
  criticidades: any[] = [];
  tiposBrigada: any[] = [];

  // Procesos con filtro
  todosLosProcesos: any[] = [];
  procesosFiltrados: any[] = [];

  // Brigadas y miembros
  brigadas: any[] = [];
  miembros: any[] = [];
  brigadaSeleccionada: any = null;
  tecnicoSeleccionado: string | null = null;

  // Control de autocompletado para Brigada
  esUsuarioBrigada = false;
  tieneOtrosRoles = false;
  brigadaBloqueada = false;
  tecnicoBloqueado = false;

  error = '';
  exito = '';
  enviando = false;

  casoForm = this.fb.group({
    idArea: ['', Validators.required],
    idProceso: ['', Validators.required],
    idTipoEvento: ['', Validators.required],
    idCriticidad: ['', Validators.required],
    fechaEvento: ['', Validators.required],
    lugar: ['', Validators.required],
    descripcion: ['', Validators.required],
    titulo: [''],
    idTipoBrigada: ['', Validators.required],
    idBrigada: ['', Validators.required],
    idTecnico: ['', Validators.required],
  });

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarTiposBrigada();
    this.verificarUsuarioBrigada();
  }

  // ============================================
  // DETECCIÓN DE USUARIO BRIGADA Y AUTOCOMPLETADO
  // ============================================
  private verificarUsuarioBrigada(): void {
    const usuario = this.authService.getUsuario();
    if (!usuario) return;

    const roles = usuario.roles || [];
    this.esUsuarioBrigada = roles.some(r => r.nombre === 'Brigada');
    this.tieneOtrosRoles = roles.some(r => r.nombre !== 'Brigada');

    if (this.esUsuarioBrigada) {
      if (!this.tieneOtrosRoles) {
        this.brigadaBloqueada = true;
        this.tecnicoBloqueado = true;
      }

      this.brigadasService.getMisBrigadas().subscribe({
        next: (brigadas) => {
          if (brigadas.length > 0) {
            const brigada = brigadas[0];
            this.brigadaSeleccionada = brigada;
            this.casoForm.patchValue({
              idBrigada: String(brigada.id),
              idTipoBrigada: String(brigada.tipoBrigadaId || '')
            });
            this.cargarMiembrosDeBrigada(brigada.id);
            this.seleccionarTecnicoActual(usuario.id);
          }
        },
        error: () => { /* silencio */ }
      });
    }
  }

  private cargarMiembrosDeBrigada(brigadaId: number): void {
    this.catalogosService.getMiembrosByBrigada(brigadaId).subscribe({
      next: (res) => {
        const miembros = (res.data as any)?.miembros || res.data || [];
        this.miembros = miembros;
        const usuario = this.authService.getUsuario();
        if (usuario) {
          this.seleccionarTecnicoActual(usuario.id);
        }
      },
      error: () => { /* silencio */ }
    });
  }

  private seleccionarTecnicoActual(usuarioId: number): void {
    const miembro = this.miembros.find(m => m.usuario?.id === usuarioId);
    if (miembro) {
      this.tecnicoSeleccionado = miembro.usuario?.nombre || 'Técnico';
      this.casoForm.patchValue({
        idTecnico: String(miembro.usuario?.id || '')
      });
    }
  }

  // ============================================
  // CARGA DE CATÁLOGOS
  // ============================================
  cargarCatalogos() {
    this.catalogosService.getAreas().subscribe({
      next: (res) => { this.areas = res.data || []; },
      error: () => { /* silencio */ }
    });

    this.catalogosService.getProcesos().subscribe({
      next: (res) => {
        const procesos = (res.data as any)?.procesos || res.data || [];
        this.todosLosProcesos = procesos;
        this.procesosFiltrados = this.todosLosProcesos;
      },
      error: () => { /* silencio */ }
    });

    this.catalogosService.getTiposEvento().subscribe({
      next: (res) => { this.tiposEvento = res.data || []; },
      error: () => { /* silencio */ }
    });

    this.catalogosService.getCriticidades().subscribe({
      next: (res) => { this.criticidades = res.data || []; },
      error: () => { /* silencio */ }
    });
  }

  cargarTiposBrigada() {
    this.catalogosService.getTiposBrigada().subscribe({
      next: (res) => { this.tiposBrigada = res.data || []; },
      error: () => { /* silencio */ }
    });
  }

  // ============================================
  // FILTRO DE PROCESOS POR ÁREA
  // ============================================
  onAreaChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const areaId = select.value ? +select.value : null;
    if (areaId) {
      this.procesosFiltrados = this.todosLosProcesos.filter(p => p.area?.id === areaId);
    } else {
      this.procesosFiltrados = this.todosLosProcesos;
    }
    this.casoForm.patchValue({ idProceso: '' });
  }

  // ============================================
  // CASCADA DE BRIGADAS
  // ============================================
  onTipoBrigadaChange(event: Event) {
    if (this.brigadaBloqueada) return;

    const select = event.target as HTMLSelectElement;
    const tipoId = select.value ? +select.value : null;
    if (tipoId) {
      this.catalogosService.getBrigadas(tipoId).subscribe({
        next: (res) => {
          const brigadas = (res.data as any)?.brigadas || res.data || [];
          this.brigadas = brigadas;
          this.miembros = [];
          this.brigadaSeleccionada = null;
          this.tecnicoSeleccionado = null;
          this.casoForm.patchValue({ idBrigada: '', idTecnico: '' });
        },
        error: () => { /* silencio */ }
      });
    } else {
      this.brigadas = [];
      this.miembros = [];
      this.brigadaSeleccionada = null;
      this.tecnicoSeleccionado = null;
      this.casoForm.patchValue({ idBrigada: '', idTecnico: '' });
    }
  }

  onBrigadaChange(event: Event) {
    if (this.brigadaBloqueada) return;

    const select = event.target as HTMLSelectElement;
    const brigadaId = select.value ? +select.value : null;
    if (brigadaId) {
      this.brigadaSeleccionada = this.brigadas.find(b => b.id === brigadaId) || null;
      this.catalogosService.getMiembrosByBrigada(brigadaId).subscribe({
        next: (res) => {
          const miembros = (res.data as any)?.miembros || res.data || [];
          this.miembros = miembros;
          this.tecnicoSeleccionado = null;
          this.casoForm.patchValue({ idTecnico: '' });
        },
        error: () => { /* silencio */ }
      });
    } else {
      this.miembros = [];
      this.brigadaSeleccionada = null;
      this.tecnicoSeleccionado = null;
      this.casoForm.patchValue({ idTecnico: '' });
    }
  }

  // ============================================
  // ENVÍO DEL FORMULARIO
  // ============================================
  onSubmit() {
    if (this.casoForm.invalid) {
      Object.keys(this.casoForm.controls).forEach(key => {
        this.casoForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.enviando = true;
    this.error = '';
    this.exito = '';

    const formValue = this.casoForm.value;
    const brigadaId = formValue.idBrigada ? +formValue.idBrigada : null;
    const tecnicoId = formValue.idTecnico ? +formValue.idTecnico : null;

    const brigada = this.brigadas.find(b => b.id === brigadaId);
    const codigoBrigada = brigada?.numero || '';
    const nombreBrigada = brigada?.nombre || '';

    const miembro = this.miembros.find(m => m.usuario?.id === tecnicoId);
    const nombreTecnico = miembro?.usuario?.nombre || '';

    // Ubicación geográfica se toma de la brigada seleccionada
    const regionId = brigada?.region?.id || null;
    const departamentoId = brigada?.departamento?.id || null;
    const municipioId = brigada?.municipio?.id || null;

    const payload = {
      idArea: +formValue.idArea!,
      idProceso: +formValue.idProceso!,
      idTipoEvento: +formValue.idTipoEvento!,
      idCriticidad: +formValue.idCriticidad!,
      fechaEvento: new Date(formValue.fechaEvento!).toISOString(),
      lugar: formValue.lugar!,
      descripcion: formValue.descripcion!,
      titulo: formValue.titulo || undefined,
      idRegion: regionId,
      idDepartamento: departamentoId,
      idMunicipio: municipioId,
      idBrigadaReportante: brigadaId,
      codigoBrigada: codigoBrigada,
      nombreBrigada: nombreBrigada,
      nombreTecnico: nombreTecnico,
      idTecnico: tecnicoId,
    };

    this.casosService.crearCaso(payload).subscribe({
      next: (res) => {
        this.exito = '✅ ¡Caso creado correctamente! Redirigiendo...';
        this.enviando = false;
        const id = res.data.caso.id;
        setTimeout(() => this.router.navigate(['/casos', id]), 1500);
      },
      error: (err) => {
        this.error = err.error?.message || '❌ Error al crear el caso. Verifica los datos e intenta de nuevo.';
        this.enviando = false;
      },
    });
  }

  cancelar() {
    this.router.navigate(['/casos']);
  }
}