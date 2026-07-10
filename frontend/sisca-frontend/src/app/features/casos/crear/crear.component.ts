import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CasosService } from '../services/casos.service';
import { CatalogosService } from '../../../core/services/catalogos.service';

@Component({
  selector: 'app-crear-caso',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <h2>Crear Nuevo Caso</h2>
    <form [formGroup]="casoForm" (ngSubmit)="onSubmit()" style="max-width:600px;">
      <div>
        <label>Área *</label>
        <select formControlName="idArea">
          <option *ngFor="let a of areas" [value]="a.id">{{ a.nombre }}</option>
        </select>
      </div>
      <div>
        <label>Proceso *</label>
        <select formControlName="idProceso">
          <option *ngFor="let p of procesos" [value]="p.id">{{ p.nombre }}</option>
        </select>
      </div>
      <div>
        <label>Tipo de Evento *</label>
        <select formControlName="idTipoEvento">
          <option *ngFor="let t of tiposEvento" [value]="t.id">{{ t.nombre }}</option>
        </select>
      </div>
      <div>
        <label>Criticidad *</label>
        <select formControlName="idCriticidad">
          <option *ngFor="let c of criticidades" [value]="c.id">{{ c.nombre }}</option>
        </select>
      </div>
      <div>
        <label>Fecha del Evento *</label>
        <input type="datetime-local" formControlName="fechaEvento">
      </div>
      <div>
        <label>Lugar *</label>
        <input formControlName="lugar" placeholder="Ej. Bodega principal">
      </div>
      <div>
        <label>Descripción *</label>
        <textarea formControlName="descripcion" rows="3"></textarea>
      </div>
      <div>
        <label>Título (opcional)</label>
        <input formControlName="titulo" placeholder="Si no se envía, se genera automáticamente">
      </div>
      <button type="submit" [disabled]="casoForm.invalid">Crear Caso</button>
      <div *ngIf="error" style="color:red; margin-top:1rem;">{{ error }}</div>
    </form>
  `,
  styles: [`
    div { margin-bottom: 0.8rem; }
    label { display:block; font-weight:bold; }
    select, input, textarea { width:100%; padding:0.5rem; box-sizing:border-box; }
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
    this.catalogosService.getAreas().subscribe({
      next: (res: any) => this.areas = res.data,
      error: (err) => console.error(err)
    });
    this.catalogosService.getProcesos().subscribe({
      next: (res: any) => this.procesos = res.data,
      error: (err) => console.error(err)
    });
    this.catalogosService.getTiposEvento().subscribe({
      next: (res: any) => this.tiposEvento = res.data,
      error: (err) => console.error(err)
    });
    this.catalogosService.getCriticidades().subscribe({
      next: (res: any) => this.criticidades = res.data,
      error: (err) => console.error(err)
    });
  }

  onSubmit() {
    if (this.casoForm.invalid) return;
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
        const id = res.data.caso.id;
        this.router.navigate(['/casos', id]);
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al crear el caso';
      },
    });
  }
}