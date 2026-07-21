import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CasosService, FiltrosCasos } from '../services/casos.service';
import { CatalogosService } from '../../../core/services/catalogos.service';
import { Caso } from '../../../core/models/caso.model';

@Component({
  selector: 'app-listado-casos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
      <h2 style="margin:0;">Listado de Casos</h2>
      <a routerLink="/casos/crear" style="display:inline-block; padding:0.5rem 1rem; background:#28a745; color:white; text-decoration:none; border-radius:4px;">
        + Nuevo Caso
      </a>
    </div>

    <!-- Filtros -->
    <form [formGroup]="filtroForm" (ngSubmit)="aplicarFiltros()" style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:1rem; padding:1rem; background:#f8f9fa; border-radius:4px; align-items:center;">
      <input formControlName="texto" placeholder="Buscar..." style="padding:0.3rem; flex:1; min-width:150px; border:1px solid #ced4da; border-radius:4px;">
      <select formControlName="estado" style="padding:0.3rem; border:1px solid #ced4da; border-radius:4px; min-width:120px;">
        <option value="">Todos los estados</option>
        <option *ngFor="let e of estados" [value]="e.id">{{ e.nombre }}</option>
      </select>
      <select formControlName="area" style="padding:0.3rem; border:1px solid #ced4da; border-radius:4px; min-width:120px;">
        <option value="">Todas las áreas</option>
        <option *ngFor="let a of areas" [value]="a.id">{{ a.nombre }}</option>
      </select>
      <select formControlName="criticidad" style="padding:0.3rem; border:1px solid #ced4da; border-radius:4px; min-width:120px;">
        <option value="">Todas las criticidades</option>
        <option *ngFor="let c of criticidades" [value]="c.id">{{ c.nombre }}</option>
      </select>
      <input formControlName="fechaDesde" type="datetime-local" placeholder="Desde" style="padding:0.3rem; border:1px solid #ced4da; border-radius:4px;">
      <input formControlName="fechaHasta" type="datetime-local" placeholder="Hasta" style="padding:0.3rem; border:1px solid #ced4da; border-radius:4px;">
      <button type="submit" style="padding:0.3rem 1rem; background:#007bff; color:white; border:none; border-radius:4px; cursor:pointer;">Filtrar</button>
      <button type="button" (click)="limpiarFiltros()" style="padding:0.3rem 1rem; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer;">Limpiar</button>
    </form>

    <div *ngIf="accessDeniedMessage" style="background:#fff3cd; padding:0.75rem; border-radius:4px; margin-bottom:1rem; color:#856404; border-left:4px solid #ffeeba;">
      {{ accessDeniedMessage }}
    </div>
    <!-- Mensaje de depuración -->
    <div *ngIf="debugInfo" style="background:#e8f4fd; padding:0.5rem; border-radius:4px; margin-bottom:1rem; font-size:0.9rem; border-left:3px solid #007bff;">
      <strong>Depuración:</strong> {{ debugInfo }}
    </div>

    <!-- Cargando -->
    <div *ngIf="cargando" style="text-align:center; padding:2rem;">
      <span>Cargando casos...</span>
    </div>

    <!-- Error -->
    <div *ngIf="error" style="color:red; padding:1rem; background:#ffe6e6; border-radius:4px; margin:1rem 0;">
      <strong>Error:</strong> {{ error }}
      <br>
      <button (click)="aplicarFiltros()" style="margin-top:0.5rem; padding:0.3rem 1rem; background:#007bff; color:white; border:none; border-radius:4px; cursor:pointer;">
        Reintentar
      </button>
    </div>

    <!-- Tabla de casos -->
    <div *ngIf="!cargando && !error">
      <div *ngIf="casos.length === 0" style="text-align:center; padding:3rem; background:#f8f9fa; border-radius:4px; border:1px dashed #dee2e6;">
        <p style="font-size:1.1rem; color:#6c757d;">No hay casos para mostrar.</p>
        <p style="color:#6c757d;">Crea tu primer caso haciendo clic en <strong>"+ Nuevo Caso"</strong></p>
      </div>

      <div *ngIf="casos.length > 0">
        <div style="margin-bottom:0.5rem; color:#6c757d; font-size:0.9rem;">
          Mostrando {{ casos.length }} caso(s)
        </div>
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr style="background:#f8f9fa;">
              <th style="border:1px solid #ddd; padding:0.5rem; text-align:left;">Correlativo</th>
              <th style="border:1px solid #ddd; padding:0.5rem; text-align:left;">Título</th>
              <th style="border:1px solid #ddd; padding:0.5rem; text-align:left;">Área</th>
              <th style="border:1px solid #ddd; padding:0.5rem; text-align:left;">Estado</th>
              <th style="border:1px solid #ddd; padding:0.5rem; text-align:left;">Fecha</th>
              <th style="border:1px solid #ddd; padding:0.5rem; text-align:left;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let caso of casos">
              <td style="border:1px solid #ddd; padding:0.5rem;">{{ caso.correlativo }}</td>
              <td style="border:1px solid #ddd; padding:0.5rem;">{{ caso.titulo }}</td>
              <td style="border:1px solid #ddd; padding:0.5rem;">{{ caso.area?.nombre || 'N/A' }}</td>
              <td style="border:1px solid #ddd; padding:0.5rem;">
                <span [style.color]="getEstadoColor(caso.estado?.nombre)" style="font-weight:bold;">
                  {{ caso.estado?.nombre || 'N/A' }}
                </span>
              </td>
              <td style="border:1px solid #ddd; padding:0.5rem;">{{ caso.fechaEvento | date:'dd/MM/yyyy HH:mm' }}</td>
              <td style="border:1px solid #ddd; padding:0.5rem;">
                <a [routerLink]="['/casos', caso.id]" style="color:#007bff; text-decoration:none;">Ver</a>
                <span style="margin:0 5px;">|</span>
                <a [routerLink]="['/casos', caso.id, 'expediente']" style="color:#007bff; text-decoration:none;">Expediente</a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    table th, table td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
    table tbody tr:hover { background: #f5f5f5; }
    input, select { border: 1px solid #ced4da; border-radius: 4px; }
    input:focus, select:focus { outline: none; border-color: #80bdff; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class ListadoCasosComponent implements OnInit {
  private casosService = inject(CasosService);
  private catalogosService = inject(CatalogosService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);

  casos: Caso[] = [];
  accessDeniedMessage = '';
  areas: any[] = [];
  estados: any[] = [];
  criticidades: any[] = [];
  cargando = true;
  error = '';
  debugInfo = '';

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
    this.route.queryParams.subscribe(params => {
      if (params['accessDenied'] === 'usuarios') {
        this.accessDeniedMessage = 'No tienes permiso para acceder a Usuarios.';
      } else {
        this.accessDeniedMessage = '';
      }
    });
    this.aplicarFiltros();
  }

  cargarCatalogos() {
    this.catalogosService.getAreas().subscribe({
      next: (res) => {
        this.areas = res.data || [];
        console.log('Áreas cargadas:', this.areas.length);
      },
      error: (err) => console.error('Error cargando áreas', err)
    });
    this.catalogosService.getEstadosCaso().subscribe({
      next: (res) => {
        this.estados = res.data || [];
        console.log('Estados cargados:', this.estados.length);
      },
      error: (err) => console.error('Error cargando estados', err)
    });
    this.catalogosService.getCriticidades().subscribe({
      next: (res) => {
        this.criticidades = res.data || [];
        console.log('Criticidades cargadas:', this.criticidades.length);
      },
      error: (err) => console.error('Error cargando criticidades', err)
    });
  }

  aplicarFiltros() {
    this.cargando = true;
    this.error = '';
    this.debugInfo = 'Cargando casos...';

    const formVal = this.filtroForm.value;
    const filtros: FiltrosCasos = {};
    
    if (formVal.texto) filtros.texto = formVal.texto;
    if (formVal.estado) filtros.estado = formVal.estado;
    if (formVal.area) filtros.area = formVal.area;
    if (formVal.criticidad) filtros.criticidad = formVal.criticidad;
    if (formVal.fechaDesde) filtros.fechaDesde = formVal.fechaDesde;
    if (formVal.fechaHasta) filtros.fechaHasta = formVal.fechaHasta;

    console.log('Filtros aplicados:', filtros);

    this.casosService.listarCasos(filtros).subscribe({
      next: (res) => {
        console.log('Respuesta completa de casos:', res);
        console.log('Tipo de res.data:', typeof res.data);
        console.log('¿res.data es array?', Array.isArray(res.data));
        
        // Asegurar que casos sea un array
        let dataArray: any[] = [];
        if (res.success && res.data) {
          if (Array.isArray(res.data)) {
            dataArray = res.data;
          } else {
            // Intentar extraer de propiedades comunes
            const obj = res.data as any;
            if (Array.isArray(obj.casos)) {
              dataArray = obj.casos;
            } else if (Array.isArray(obj.data)) {
              dataArray = obj.data;
            } else if (Array.isArray(obj.items)) {
              dataArray = obj.items;
            } else {
              console.warn('res.data no es un array y no se encontró una propiedad array:', res.data);
              dataArray = [];
            }
          }
        }
        this.casos = dataArray;
        this.debugInfo = `Se encontraron ${this.casos.length} casos`;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar casos - Detalle completo:', err);
        this.error = err.error?.message || err.message || 'Error al cargar casos. Verifica que el backend esté corriendo.';
        this.debugInfo = 'Error: ' + this.error;
        this.cargando = false;
      },
    });
  }

  limpiarFiltros() {
    this.filtroForm.reset();
    this.aplicarFiltros();
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
}