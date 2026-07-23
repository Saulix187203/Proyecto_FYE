import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CatalogosService } from '../../../core/services/catalogos.service';
import { CasosService } from '../services/casos.service';

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

          <!-- Área con filtro de procesos -->
          <div>
            <label style="display:block; font-weight:bold; margin-bottom:0.2rem;">Área *</label>
            <select formControlName="idArea" (change)="onAreaChange($event)" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
              <option value="">Seleccionar área</option>
              <option *ngFor="let a of areas" [value]="a.id">{{ a.nombre }}</option>
            </select>
            <div *ngIf="casoForm.get('idArea')?.invalid && casoForm.get('idArea')?.touched" style="color:red; font-size:0.9rem;">Requerido</div>
          </div>

          <!-- Proceso filtrado -->
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

      <!-- SECCIÓN 2: Ubicación geográfica -->
      <div style="background:#e9f7fe; padding:1.2rem; border-radius:8px; margin-bottom:1.5rem; border:1px solid #b8daff;">
        <h4 style="margin:0 0 0.8rem 0; color:#0056b3;">🌍 Ubicación geográfica</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:1rem;">

          <div>
            <label style="display:block; font-weight:bold; margin-bottom:0.2rem;">Región *</label>
            <select formControlName="idRegion" (change)="onRegionChange($event)" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
              <option value="">Seleccionar región</option>
              <option *ngFor="let r of regiones" [value]="r.id">{{ r.nombre }}</option>
            </select>
            <div *ngIf="casoForm.get('idRegion')?.invalid && casoForm.get('idRegion')?.touched" style="color:red; font-size:0.9rem;">Requerido</div>
          </div>

          <div>
            <label style="display:block; font-weight:bold; margin-bottom:0.2rem;">Departamento</label>
            <select formControlName="idDepartamento" (change)="onDepartamentoChange($event)" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
              <option value="">Seleccionar departamento</option>
              <option *ngFor="let d of departamentos" [value]="d.id">{{ d.nombre }}</option>
            </select>
          </div>

          <div>
            <label style="display:block; font-weight:bold; margin-bottom:0.2rem;">Municipio</label>
            <select formControlName="idMunicipio" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
              <option value="">Seleccionar municipio</option>
              <option *ngFor="let m of municipios" [value]="m.id">{{ m.nombre }}</option>
            </select>
          </div>

        </div>
      </div>

      <!-- SECCIÓN 3: Datos del técnico y brigada -->
      <div style="background:#f0f8f0; padding:1.2rem; border-radius:8px; margin-bottom:1.5rem; border:1px solid #b7e0b7;">
        <h4 style="margin:0 0 0.8rem 0; color:#155724;">👷 Datos del técnico / brigada</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">

          <!-- Tipo de Brigada -->
          <div>
            <label style="display:block; font-weight:bold; margin-bottom:0.2rem;">Tipo de Brigada *</label>
            <select formControlName="idTipoBrigada" (change)="onTipoBrigadaChange($event)" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
              <option value="">Seleccionar tipo</option>
              <option *ngFor="let tb of tiposBrigada" [value]="tb.id">{{ tb.nombre }}</option>
            </select>
            <div *ngIf="casoForm.get('idTipoBrigada')?.invalid && casoForm.get('idTipoBrigada')?.touched" style="color:red; font-size:0.9rem;">Requerido</div>
          </div>

          <!-- Brigada -->
          <div>
            <label style="display:block; font-weight:bold; margin-bottom:0.2rem;">Código de Brigada *</label>
            <select formControlName="idBrigada" (change)="onBrigadaChange($event)" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
              <option value="">Seleccionar brigada</option>
              <option *ngFor="let b of brigadas" [value]="b.id">{{ b.numero }} - {{ b.nombre }}</option>
            </select>
            <div *ngIf="casoForm.get('idBrigada')?.invalid && casoForm.get('idBrigada')?.touched" style="color:red; font-size:0.9rem;">Requerido</div>
          </div>

          <!-- Técnico -->
          <div style="grid-column: span 2;">
            <label style="display:block; font-weight:bold; margin-bottom:0.2rem;">Técnico que reporta *</label>
            <select formControlName="idTecnico" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
              <option value="">Seleccionar técnico</option>
              <option *ngFor="let m of miembros" [value]="m.usuario.id">{{ m.usuario.nombre }}</option>
            </select>
            <div *ngIf="casoForm.get('idTecnico')?.invalid && casoForm.get('idTecnico')?.touched" style="color:red; font-size:0.9rem;">Requerido</div>
          </div>

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
  private router = inject(Router);

  // Catálogos principales
  areas: any[] = [];
  tiposEvento: any[] = [];
  criticidades: any[] = [];
  regiones: any[] = [];
  departamentos: any[] = [];
  municipios: any[] = [];
  tiposBrigada: any[] = [];

  // Procesos con filtro
  todosLosProcesos: any[] = [];
  procesosFiltrados: any[] = [];

  // Brigadas y miembros
  brigadas: any[] = [];
  miembros: any[] = [];

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
    idRegion: ['', Validators.required],
    idDepartamento: [''],
    idMunicipio: [''],
    idTipoBrigada: ['', Validators.required],
    idBrigada: ['', Validators.required],
    idTecnico: ['', Validators.required],
  });

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarRegiones();
    this.cargarTiposBrigada();
  }

  // Carga de catálogos
  cargarCatalogos() {
    this.catalogosService.getAreas().subscribe({
      next: (res) => this.areas = res.data || [],
      error: (err) => console.error('Error áreas', err)
    });

    this.catalogosService.getProcesos().subscribe({
      next: (res) => {
        this.todosLosProcesos = res.data || [];
        this.procesosFiltrados = this.todosLosProcesos; // Mostrar todos al inicio
      },
      error: (err) => console.error('Error procesos', err)
    });

    this.catalogosService.getTiposEvento().subscribe({
      next: (res) => this.tiposEvento = res.data || [],
      error: (err) => console.error('Error tipos evento', err)
    });

    this.catalogosService.getCriticidades().subscribe({
      next: (res) => this.criticidades = res.data || [],
      error: (err) => console.error('Error criticidades', err)
    });
  }

  cargarRegiones() {
    this.catalogosService.getRegiones().subscribe({
      next: (res) => this.regiones = res.data || [],
      error: (err) => console.error('Error regiones', err)
    });
  }

  cargarTiposBrigada() {
    this.catalogosService.getTiposBrigada().subscribe({
      next: (res) => this.tiposBrigada = res.data || [],
      error: (err) => console.error('Error tipos brigada', err)
    });
  }

  // Filtro de procesos por área
  onAreaChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const areaId = select.value ? +select.value : null;

    if (areaId) {
      this.procesosFiltrados = this.todosLosProcesos.filter(p => p.area?.id === areaId);
    } else {
      this.procesosFiltrados = this.todosLosProcesos;
    }

    // Resetear el proceso seleccionado si el área cambió
    this.casoForm.patchValue({ idProceso: '' });
  }

  // Cascada geográfica
  onRegionChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const regionId = select.value ? +select.value : null;
    if (regionId) {
      this.catalogosService.getDepartamentos(regionId).subscribe({
        next: (res) => {
          this.departamentos = res.data || [];
          this.municipios = [];
          this.casoForm.patchValue({ idDepartamento: '', idMunicipio: '' });
        },
        error: (err) => console.error('Error departamentos', err)
      });
    } else {
      this.departamentos = [];
      this.municipios = [];
      this.casoForm.patchValue({ idDepartamento: '', idMunicipio: '' });
    }
  }

  onDepartamentoChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const deptoId = select.value ? +select.value : null;
    if (deptoId) {
      this.catalogosService.getMunicipios(deptoId).subscribe({
        next: (res) => {
          this.municipios = res.data || [];
          this.casoForm.patchValue({ idMunicipio: '' });
        },
        error: (err) => console.error('Error municipios', err)
      });
    } else {
      this.municipios = [];
      this.casoForm.patchValue({ idMunicipio: '' });
    }
  }

  // Cascada de brigadas
  onTipoBrigadaChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const tipoId = select.value ? +select.value : null;
    if (tipoId) {
      this.catalogosService.getBrigadas(tipoId).subscribe({
        next: (res) => {
          this.brigadas = res.data?.brigadas || [];
          this.miembros = [];
          this.casoForm.patchValue({ idBrigada: '', idTecnico: '' });
        },
        error: (err) => console.error('Error brigadas', err)
      });
    } else {
      this.brigadas = [];
      this.miembros = [];
      this.casoForm.patchValue({ idBrigada: '', idTecnico: '' });
    }
  }

  onBrigadaChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const brigadaId = select.value ? +select.value : null;
    if (brigadaId) {
      this.catalogosService.getMiembrosByBrigada(brigadaId).subscribe({
        next: (res) => {
          this.miembros = res.data?.miembros || [];
          this.casoForm.patchValue({ idTecnico: '' });
        },
        error: (err) => console.error('Error miembros', err)
      });
    } else {
      this.miembros = [];
      this.casoForm.patchValue({ idTecnico: '' });
    }
  }

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

    const miembro = this.miembros.find(m => m.usuario.id === tecnicoId);
    const nombreTecnico = miembro?.usuario?.nombre || '';

    const payload = {
      idArea: +formValue.idArea!,
      idProceso: +formValue.idProceso!,
      idTipoEvento: +formValue.idTipoEvento!,
      idCriticidad: +formValue.idCriticidad!,
      fechaEvento: new Date(formValue.fechaEvento!).toISOString(),
      lugar: formValue.lugar!,
      descripcion: formValue.descripcion!,
      titulo: formValue.titulo || undefined,
      idRegion: formValue.idRegion ? +formValue.idRegion : undefined,
      idDepartamento: formValue.idDepartamento ? +formValue.idDepartamento : undefined,
      idMunicipio: formValue.idMunicipio ? +formValue.idMunicipio : undefined,
      idBrigadaReportante: brigadaId,
      codigoBrigada: codigoBrigada,
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
        console.error('Error al crear caso', err);
      },
    });
  }

  cancelar() {
    this.router.navigate(['/casos']);
  }
}