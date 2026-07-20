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
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
      <h2>Crear Nuevo Caso</h2>
      <button (click)="cancelar()" style="padding:0.5rem 1rem; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer;">
        ← Cancelar y volver
      </button>
    </div>

    <form [formGroup]="casoForm" (ngSubmit)="onSubmit()" style="max-width:700px;">

      <!-- Área -->
      <div style="margin-bottom:0.8rem;">
        <label style="display:block; font-weight:bold;">Área *</label>
        <select formControlName="idArea" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
          <option value="">Seleccionar área</option>
          <option *ngFor="let a of areas" [value]="a.id">{{ a.nombre }}</option>
        </select>
        <div *ngIf="casoForm.get('idArea')?.invalid && casoForm.get('idArea')?.touched" style="color:red; font-size:0.9rem;">
          El área es requerida
        </div>
      </div>

      <!-- Proceso -->
      <div style="margin-bottom:0.8rem;">
        <label style="display:block; font-weight:bold;">Proceso *</label>
        <select formControlName="idProceso" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
          <option value="">Seleccionar proceso</option>
          <option *ngFor="let p of procesos" [value]="p.id">{{ p.nombre }}</option>
        </select>
        <div *ngIf="casoForm.get('idProceso')?.invalid && casoForm.get('idProceso')?.touched" style="color:red; font-size:0.9rem;">
          El proceso es requerido
        </div>
      </div>

      <!-- Tipo de Evento -->
      <div style="margin-bottom:0.8rem;">
        <label style="display:block; font-weight:bold;">Tipo de Evento *</label>
        <select formControlName="idTipoEvento" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
          <option value="">Seleccionar tipo</option>
          <option *ngFor="let t of tiposEvento" [value]="t.id">{{ t.nombre }}</option>
        </select>
        <div *ngIf="casoForm.get('idTipoEvento')?.invalid && casoForm.get('idTipoEvento')?.touched" style="color:red; font-size:0.9rem;">
          El tipo de evento es requerido
        </div>
      </div>

      <!-- Criticidad -->
      <div style="margin-bottom:0.8rem;">
        <label style="display:block; font-weight:bold;">Criticidad *</label>
        <select formControlName="idCriticidad" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
          <option value="">Seleccionar criticidad</option>
          <option *ngFor="let c of criticidades" [value]="c.id">{{ c.nombre }}</option>
        </select>
        <div *ngIf="casoForm.get('idCriticidad')?.invalid && casoForm.get('idCriticidad')?.touched" style="color:red; font-size:0.9rem;">
          La criticidad es requerida
        </div>
      </div>

      <!-- Fecha del Evento -->
      <div style="margin-bottom:0.8rem;">
        <label style="display:block; font-weight:bold;">Fecha del Evento *</label>
        <input type="datetime-local" formControlName="fechaEvento" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
        <div *ngIf="casoForm.get('fechaEvento')?.invalid && casoForm.get('fechaEvento')?.touched" style="color:red; font-size:0.9rem;">
          La fecha del evento es requerida
        </div>
      </div>

      <!-- Lugar -->
      <div style="margin-bottom:0.8rem;">
        <label style="display:block; font-weight:bold;">Lugar *</label>
        <input formControlName="lugar" placeholder="Ej. Bodega principal, área de carga" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
        <div *ngIf="casoForm.get('lugar')?.invalid && casoForm.get('lugar')?.touched" style="color:red; font-size:0.9rem;">
          El lugar es requerido
        </div>
      </div>

      <!-- Descripción -->
      <div style="margin-bottom:0.8rem;">
        <label style="display:block; font-weight:bold;">Descripción *</label>
        <textarea formControlName="descripcion" rows="4" placeholder="Descripción detallada del evento..." style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;"></textarea>
        <div *ngIf="casoForm.get('descripcion')?.invalid && casoForm.get('descripcion')?.touched" style="color:red; font-size:0.9rem;">
          La descripción es requerida
        </div>
      </div>

      <!-- Título (opcional) -->
      <div style="margin-bottom:0.8rem;">
        <label style="display:block; font-weight:bold;">Título (opcional)</label>
        <input formControlName="titulo" placeholder="Si no se envía, se genera automáticamente desde la descripción" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
        <div style="color:#6c757d; font-size:0.9rem; margin-top:0.3rem;">
          Si no ingresas un título, el sistema lo generará automáticamente
        </div>
      </div>

      <!-- Botones -->
      <div style="display:flex; gap:1rem; margin-top:1rem;">
        <button type="submit" [disabled]="casoForm.invalid || enviando" style="padding:0.5rem 2rem; background:#28a745; color:white; border:none; border-radius:4px; cursor:pointer;">
          {{ enviando ? 'Creando...' : 'Crear Caso' }}
        </button>
        <button type="button" (click)="cancelar()" style="padding:0.5rem 2rem; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer;">
          Cancelar
        </button>
      </div>

      <!-- Mensajes -->
      <div *ngIf="error" style="color:red; margin-top:1rem; padding:0.5rem; background:#ffe6e6; border-radius:4px;">
        {{ error }}
      </div>

      <div *ngIf="exito" style="color:green; margin-top:1rem; padding:0.5rem; background:#e6ffe6; border-radius:4px;">
        {{ exito }}
      </div>
    </form>
  `,
  styles: [`
    input, textarea, select { box-sizing: border-box; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class CrearCasoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private casosService = inject(CasosService);
  private catalogosService = inject(CatalogosService);
  private router = inject(Router);

  areas: any[] = [];
  procesos: any[] = [];
  tiposEvento: any[] = [];
  criticidades: any[] = [];
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
  });

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  cargarCatalogos() {
    this.catalogosService.getAreas().subscribe({
      next: (res) => this.areas = res.data || [],
      error: (err) => console.error('Error cargando áreas', err)
    });
    this.catalogosService.getProcesos().subscribe({
      next: (res) => this.procesos = res.data || [],
      error: (err) => console.error('Error cargando procesos', err)
    });
    this.catalogosService.getTiposEvento().subscribe({
      next: (res) => this.tiposEvento = res.data || [],
      error: (err) => console.error('Error cargando tipos de evento', err)
    });
    this.catalogosService.getCriticidades().subscribe({
      next: (res) => this.criticidades = res.data || [],
      error: (err) => console.error('Error cargando criticidades', err)
    });
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
    const payload = {
      idArea: +formValue.idArea!,
      idProceso: +formValue.idProceso!,
      idTipoEvento: +formValue.idTipoEvento!,
      idCriticidad: +formValue.idCriticidad!,
      fechaEvento: new Date(formValue.fechaEvento!).toISOString(),
      lugar: formValue.lugar!,
      descripcion: formValue.descripcion!,
      titulo: formValue.titulo || undefined,
    };

    this.casosService.crearCaso(payload).subscribe({
      next: (res) => {
        this.exito = '¡Caso creado correctamente! Redirigiendo...';
        this.enviando = false;
        const id = res.data.caso.id;
        setTimeout(() => {
          this.router.navigate(['/casos', id]);
        }, 1500);
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al crear el caso';
        this.enviando = false;
        console.error('Error al crear caso', err);
      },
    });
  }

  cancelar() {
    this.router.navigate(['/casos']);
  }
}