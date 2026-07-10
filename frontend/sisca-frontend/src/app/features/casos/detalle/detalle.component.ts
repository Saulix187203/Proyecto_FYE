import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CasosService } from '../services/casos.service';
import { Caso } from '../../../core/models/caso.model';

@Component({
  selector: 'app-detalle-caso',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <h2>Detalle del Caso</h2>
    <div *ngIf="caso">
      <p><strong>Correlativo:</strong> {{ caso.correlativo }}</p>
      <p><strong>Título:</strong> {{ caso.titulo }}</p>
      <p><strong>Estado:</strong> {{ caso.estado.nombre }}</p>
      <p><strong>Área:</strong> {{ caso.area.nombre }}</p>
      <p><strong>Proceso:</strong> {{ caso.proceso.nombre }}</p>
      <p><strong>Tipo Evento:</strong> {{ caso.tipoEvento.nombre }}</p>
      <p><strong>Criticidad:</strong> {{ caso.criticidad.nombre }}</p>
      <p><strong>Fecha Evento:</strong> {{ caso.fechaEvento | date:'short' }}</p>
      <p><strong>Lugar:</strong> {{ caso.lugar }}</p>
      <p><strong>Descripción:</strong> {{ caso.descripcion }}</p>
      <p><strong>Creado por:</strong> {{ caso.creadoPor.nombre }}</p>
      <p><strong>Fecha Creación:</strong> {{ caso.fechaCreacion | date:'short' }}</p>

      <hr>
      <h3>Editar datos básicos</h3>
      <form [formGroup]="editForm" (ngSubmit)="actualizar()">
        <div>
          <label>Lugar</label>
          <input formControlName="lugar">
        </div>
        <div>
          <label>Descripción</label>
          <textarea formControlName="descripcion" rows="3"></textarea>
        </div>
        <button type="submit" [disabled]="editForm.invalid">Actualizar</button>
        <div *ngIf="editError" style="color:red;">{{ editError }}</div>
      </form>

      <hr>
      <a [routerLink]="['/casos', caso.id, 'expediente']">Ver Expediente Completo</a>
    </div>
    <div *ngIf="!caso">Cargando...</div>
  `,
  styles: [`
    div { margin-bottom: 0.5rem; }
    input, textarea { width:100%; padding:0.5rem; box-sizing:border-box; }
  `]
})
export class DetalleCasoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private casosService = inject(CasosService);
  private fb = inject(FormBuilder);

  caso: Caso | null = null;
  editError = '';

  editForm = this.fb.group({
    lugar: ['', Validators.required],
    descripcion: ['', Validators.required],
  });

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.cargarCaso(id);
  }

  cargarCaso(id: number) {
    this.casosService.obtenerCaso(id).subscribe({
      next: (res) => {
        this.caso = res.data;
        this.editForm.patchValue({
          lugar: this.caso.lugar,
          descripcion: this.caso.descripcion,
        });
      },
      error: (err) => console.error('Error al cargar caso', err),
    });
  }

  actualizar() {
    if (!this.caso || this.editForm.invalid) return;
    const data = {
      lugar: this.editForm.value.lugar!,
      descripcion: this.editForm.value.descripcion!,
    };
    this.casosService.actualizarCaso(this.caso.id, data).subscribe({
      next: (res) => {
        this.caso = res.data.caso;
        this.editError = '';
      },
      error: (err) => {
        this.editError = err.error?.message || 'Error al actualizar';
      },
    });
  }
}