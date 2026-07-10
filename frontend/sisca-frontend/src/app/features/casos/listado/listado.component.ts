import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CasosService, FiltrosCasos } from '../services/casos.service';
import { CatalogosService } from '../../../core/services/catalogos.service';
import { Caso } from '../../../core/models/caso.model';


@Component({
  selector: 'app-listado-casos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <h2>Listado de Casos</h2>
    <form [formGroup]="filtroForm" (ngSubmit)="aplicarFiltros()" style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:1rem;">
      <input formControlName="texto" placeholder="Buscar...">
      <select formControlName="estado">
        <option value="">Todos los estados</option>
        <option *ngFor="let e of estados" [value]="e.id">{{ e.nombre }}</option>
      </select>
      <select formControlName="area">
        <option value="">Todas las áreas</option>
        <option *ngFor="let a of areas" [value]="a.id">{{ a.nombre }}</option>
      </select>
      <select formControlName="criticidad">
        <option value="">Todas las criticidades</option>
        <option *ngFor="let c of criticidades" [value]="c.id">{{ c.nombre }}</option>
      </select>
      <input formControlName="fechaDesde" type="datetime-local" placeholder="Desde">
      <input formControlName="fechaHasta" type="datetime-local" placeholder="Hasta">
      <button type="submit">Filtrar</button>
      <button type="button" (click)="limpiarFiltros()">Limpiar</button>
    </form>
    <a routerLink="/casos/crear" style="display:inline-block; margin-bottom:1rem;">+ Nuevo Caso</a>
    <table style="width:100%; border-collapse:collapse;">
      <thead>
        <tr>
          <th>Correlativo</th>
          <th>Título</th>
          <th>Área</th>
          <th>Estado</th>
          <th>Fecha</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let caso of casos">
          <td>{{ caso.correlativo }}</td>
          <td>{{ caso.titulo }}</td>
          <td>{{ caso.area.nombre }}</td>
          <td>{{ caso.estado.nombre }}</td>
          <td>{{ caso.fechaEvento | date:'short' }}</td>
          <td><a [routerLink]="['/casos', caso.id]">Ver</a></td>
        </tr>
      </tbody>
    </table>
    <div *ngIf="!casos || casos.length === 0">No hay casos para mostrar.</div>
  `,
  styles: [`
    table th, table td { border:1px solid #ddd; padding:0.5rem; text-align:left; }
    form input, form select { padding:0.3rem; }
  `]
})
export class ListadoCasosComponent implements OnInit {
  private casosService = inject(CasosService);
  private catalogosService = inject(CatalogosService);
  private fb = inject(FormBuilder);

  casos: Caso[] = [];
  areas: any[] = [];
  estados: any[] = [];
  criticidades: any[] = [];

  filtroForm = this.fb.group({
    texto: [''],
    estado: [''],
    area: [''],
    criticidad: [''],
    fechaDesde: [''],
    fechaHasta: [''],
  });

  ngOnInit(): void {
    this.cargarCatalogos();
    this.aplicarFiltros();
  }

  cargarCatalogos() {
    this.catalogosService.getAreas().subscribe({
      next: (res: any) => this.areas = res.data,
      error: (err) => console.error(err)
    });
    this.catalogosService.getEstadosCaso().subscribe({
      next: (res: any) => this.estados = res.data,
      error: (err) => console.error(err)
    });
    this.catalogosService.getCriticidades().subscribe({
      next: (res: any) => this.criticidades = res.data,
      error: (err) => console.error(err)
    });
  }

  aplicarFiltros() {
    const formVal = this.filtroForm.value;
    const filtros: FiltrosCasos = {
      texto: formVal.texto || undefined,
      estado: formVal.estado || undefined,
      area: formVal.area || undefined,
      criticidad: formVal.criticidad || undefined,
      fechaDesde: formVal.fechaDesde || undefined,
      fechaHasta: formVal.fechaHasta || undefined,
    };
    this.casosService.listarCasos(filtros).subscribe({
      next: (res) => this.casos = res.data,
      error: (err) => console.error('Error al cargar casos', err),
    });
  }

  limpiarFiltros() {
    this.filtroForm.reset();
    this.aplicarFiltros();
  }
}