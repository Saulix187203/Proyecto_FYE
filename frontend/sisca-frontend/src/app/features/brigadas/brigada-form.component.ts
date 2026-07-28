import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BrigadasService, Brigada } from '../../core/services/brigadas.service';
import { CatalogosService } from '../../core/services/catalogos.service';

@Component({
  selector: 'app-brigada-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
      <h2 style="margin:0;">{{ esEdicion ? '✏️ Editar Brigada' : '📝 Nueva Brigada' }}</h2>
      <button (click)="cancelar()" style="padding:0.5rem 1.2rem; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer;">
        ← Cancelar y volver
      </button>
    </div>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" style="max-width:700px;">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
        <div>
          <label style="display:block; font-weight:bold;">Número *</label>
          <input formControlName="numero" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
          <div *ngIf="form.get('numero')?.invalid && form.get('numero')?.touched" style="color:red; font-size:0.9rem;">Requerido</div>
        </div>
        <div>
          <label style="display:block; font-weight:bold;">Nombre *</label>
          <input formControlName="nombre" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
          <div *ngIf="form.get('nombre')?.invalid && form.get('nombre')?.touched" style="color:red; font-size:0.9rem;">Requerido</div>
        </div>
        <div>
          <label style="display:block; font-weight:bold;">Tipo de Brigada *</label>
          <select formControlName="tipoBrigadaId" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
            <option value="">Seleccionar</option>
            <option *ngFor="let tb of tiposBrigada" [value]="tb.id">{{ tb.nombre }}</option>
          </select>
          <div *ngIf="form.get('tipoBrigadaId')?.invalid && form.get('tipoBrigadaId')?.touched" style="color:red; font-size:0.9rem;">Requerido</div>
        </div>
        <div>
          <label style="display:block; font-weight:bold;">Región *</label>
          <select formControlName="regionId" (change)="onRegionChange($event)" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
            <option value="">Seleccionar</option>
            <option *ngFor="let r of regiones" [value]="r.id">{{ r.nombre }}</option>
          </select>
          <div *ngIf="form.get('regionId')?.invalid && form.get('regionId')?.touched" style="color:red; font-size:0.9rem;">Requerido</div>
        </div>
        <div>
          <label style="display:block; font-weight:bold;">Departamento *</label>
          <select formControlName="departamentoId" (change)="onDepartamentoChange($event)" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
            <option value="">Seleccionar</option>
            <option *ngFor="let d of departamentos" [value]="d.id">{{ d.nombre }}</option>
          </select>
          <div *ngIf="form.get('departamentoId')?.invalid && form.get('departamentoId')?.touched" style="color:red; font-size:0.9rem;">Requerido</div>
        </div>
        <div>
          <label style="display:block; font-weight:bold;">Municipio *</label>
          <select formControlName="municipioId" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
            <option value="">Seleccionar</option>
            <option *ngFor="let m of municipios" [value]="m.id">{{ m.nombre }}</option>
          </select>
          <div *ngIf="form.get('municipioId')?.invalid && form.get('municipioId')?.touched" style="color:red; font-size:0.9rem;">Requerido</div>
        </div>
      </div>

      <div style="margin-top:1.5rem; display:flex; gap:1rem;">
        <button type="submit" [disabled]="form.invalid || guardando" style="padding:0.5rem 2rem; background:#28a745; color:white; border:none; border-radius:4px; cursor:pointer;">
          {{ guardando ? 'Guardando...' : 'Guardar' }}
        </button>
        <button type="button" (click)="cancelar()" style="padding:0.5rem 2rem; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer;">Cancelar</button>
      </div>

      <div *ngIf="error" style="color:red; margin-top:1rem; padding:0.5rem; background:#ffe6e6; border-radius:4px;">{{ error }}</div>
    </form>
  `,
  styles: [`
    input, select { border: 1px solid #ced4da; border-radius: 4px; box-sizing: border-box; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class BrigadaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private brigadasService = inject(BrigadasService);
  private catalogosService = inject(CatalogosService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  esEdicion = false;
  brigadaId: number | null = null;
  guardando = false;
  error = '';

  tiposBrigada: any[] = [];
  regiones: any[] = [];
  departamentos: any[] = [];
  municipios: any[] = [];

  // 🔥 Cambiar el tipo de los controles a 'string | null' porque los selects emiten strings
  form = this.fb.group({
    numero: ['', Validators.required],
    nombre: ['', Validators.required],
    tipoBrigadaId: ['', Validators.required],
    regionId: ['', Validators.required],
    departamentoId: ['', Validators.required],
    municipioId: ['', Validators.required],
  });

  ngOnInit(): void {
    this.cargarCatalogos();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion = true;
      this.brigadaId = +id;
      this.cargarBrigada(this.brigadaId);
    }
  }

  cargarCatalogos(): void {
    this.catalogosService.getTiposBrigada().subscribe({
      next: (res) => { this.tiposBrigada = res.data || []; },
      error: () => { /* silencio */ }
    });
    this.catalogosService.getRegiones().subscribe({
      next: (res) => { this.regiones = res.data || []; },
      error: () => { /* silencio */ }
    });
  }

  cargarBrigada(id: number): void {
    this.brigadasService.obtener(id).subscribe({
      next: (brigada) => {
        // 🔥 Convertir IDs numéricos a string para los FormControls
        this.form.patchValue({
          numero: brigada.numero,
          nombre: brigada.nombre,
          tipoBrigadaId: brigada.tipoBrigadaId?.toString() || '',
          regionId: brigada.regionId?.toString() || '',
          departamentoId: brigada.departamentoId?.toString() || '',
          municipioId: brigada.municipioId?.toString() || '',
        });
        // Cargar dependencias geográficas
        if (brigada.regionId) {
          this.catalogosService.getDepartamentos(brigada.regionId).subscribe({
            next: (res) => { this.departamentos = res.data || []; }
          });
        }
        if (brigada.departamentoId) {
          this.catalogosService.getMunicipios(brigada.departamentoId).subscribe({
            next: (res) => { this.municipios = res.data || []; }
          });
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al cargar brigada.';
      }
    });
  }

  onRegionChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const regionId = select.value ? +select.value : null;
    this.departamentos = [];
    this.municipios = [];
    this.form.patchValue({ departamentoId: '', municipioId: '' });
    if (regionId) {
      this.catalogosService.getDepartamentos(regionId).subscribe({
        next: (res) => { this.departamentos = res.data || []; },
        error: () => { /* silencio */ }
      });
    }
  }

  onDepartamentoChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const deptoId = select.value ? +select.value : null;
    this.municipios = [];
    this.form.patchValue({ municipioId: '' });
    if (deptoId) {
      this.catalogosService.getMunicipios(deptoId).subscribe({
        next: (res) => { this.municipios = res.data || []; },
        error: () => { /* silencio */ }
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(k => this.form.get(k)?.markAsTouched());
      return;
    }
    this.guardando = true;
    this.error = '';
    const data = this.form.value;
    // 🔥 Convertir strings a number para el payload
    const payload = {
      numero: data.numero!,
      nombre: data.nombre!,
      tipoBrigadaId: data.tipoBrigadaId ? +data.tipoBrigadaId : undefined,
      regionId: data.regionId ? +data.regionId : undefined,
      departamentoId: data.departamentoId ? +data.departamentoId : undefined,
      municipioId: data.municipioId ? +data.municipioId : undefined,
    };

    const obs = this.esEdicion && this.brigadaId
      ? this.brigadasService.actualizar(this.brigadaId, payload)
      : this.brigadasService.crear(payload);

    obs.subscribe({
      next: () => {
        this.guardando = false;
        this.router.navigate(['/brigadas']);
      },
      error: (err) => {
        this.guardando = false;
        this.error = err.error?.message || 'Error al guardar brigada.';
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/brigadas']);
  }
}