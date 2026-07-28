import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BrigadasService, FiltrosBrigadas, Brigada } from '../../core/services/brigadas.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-brigadas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
      <h2 style="margin:0;">🚒 Gestión de Brigadas</h2>
      <a routerLink="/brigadas/nuevo" style="display:inline-block; padding:0.5rem 1rem; background:#28a745; color:white; text-decoration:none; border-radius:4px;">
        + Nueva Brigada
      </a>
    </div>

    <!-- Filtros -->
    <form [formGroup]="filtroForm" (ngSubmit)="aplicarFiltros()" style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:1rem; padding:1rem; background:#f8f9fa; border-radius:4px; align-items:center;">
      <input formControlName="texto" placeholder="Buscar..." style="padding:0.3rem; flex:1; min-width:150px; border:1px solid #ced4da; border-radius:4px;">
      <select formControlName="tipoBrigadaId" style="padding:0.3rem; border:1px solid #ced4da; border-radius:4px; min-width:120px;">
        <option value="">Todos los tipos</option>
        <option *ngFor="let tb of tiposBrigada" [value]="tb.id">{{ tb.nombre }}</option>
      </select>
      <select formControlName="regionId" (change)="onRegionChange($event)" style="padding:0.3rem; border:1px solid #ced4da; border-radius:4px; min-width:120px;">
        <option value="">Todas las regiones</option>
        <option *ngFor="let r of regiones" [value]="r.id">{{ r.nombre }}</option>
      </select>
      <select formControlName="departamentoId" (change)="onDepartamentoChange($event)" style="padding:0.3rem; border:1px solid #ced4da; border-radius:4px; min-width:120px;">
        <option value="">Todos los departamentos</option>
        <option *ngFor="let d of departamentos" [value]="d.id">{{ d.nombre }}</option>
      </select>
      <select formControlName="municipioId" style="padding:0.3rem; border:1px solid #ced4da; border-radius:4px; min-width:120px;">
        <option value="">Todos los municipios</option>
        <option *ngFor="let m of municipios" [value]="m.id">{{ m.nombre }}</option>
      </select>
      <select formControlName="activo" style="padding:0.3rem; border:1px solid #ced4da; border-radius:4px; min-width:100px;">
        <option value="">Todos</option>
        <option [value]="true">Activos</option>
        <option [value]="false">Inactivos</option>
      </select>
      <button type="submit" style="padding:0.3rem 1rem; background:#007bff; color:white; border:none; border-radius:4px; cursor:pointer;">Filtrar</button>
      <button type="button" (click)="limpiarFiltros()" style="padding:0.3rem 1rem; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer;">Limpiar</button>
    </form>

    <!-- Cargando / Error -->
    <div *ngIf="cargando" style="text-align:center; padding:2rem;">Cargando...</div>
    <div *ngIf="error" style="color:red; padding:1rem; background:#ffe6e6; border-radius:4px; margin:1rem 0;">{{ error }}</div>

    <!-- Tabla -->
    <div *ngIf="!cargando && !error">
      <div *ngIf="brigadas.length === 0" style="text-align:center; padding:3rem; background:#f8f9fa; border-radius:4px; border:1px dashed #dee2e6;">
        <p style="font-size:1.1rem; color:#6c757d;">No hay brigadas.</p>
        <p style="color:#6c757d;">Crea la primera brigada haciendo clic en <strong>"+ Nueva Brigada"</strong></p>
      </div>

      <div *ngIf="brigadas.length > 0">
        <div style="margin-bottom:0.5rem; color:#6c757d; font-size:0.9rem;">
          Mostrando {{ brigadas.length }} de {{ totalItems }} brigada(s)
        </div>

        <!-- Paginación simple (puedes reemplazar con MatPaginator) -->
        <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:0.5rem; flex-wrap:wrap;">
          <button (click)="cambiarPagina(page - 1)" [disabled]="page <= 1" style="padding:0.2rem 0.6rem;">Anterior</button>
          <span>Página {{ page }} de {{ totalPages }}</span>
          <button (click)="cambiarPagina(page + 1)" [disabled]="!hasNextPage" style="padding:0.2rem 0.6rem;">Siguiente</button>
          <select (change)="cambiarLimit($event)" style="padding:0.2rem; margin-left:0.5rem;">
            <option value="10">10</option>
            <option value="25" selected>25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>

        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr style="background:#f8f9fa;">
              <th style="border:1px solid #ddd; padding:0.5rem; text-align:left;">Número</th>
              <th style="border:1px solid #ddd; padding:0.5rem; text-align:left;">Nombre</th>
              <th style="border:1px solid #ddd; padding:0.5rem; text-align:left;">Tipo</th>
              <th style="border:1px solid #ddd; padding:0.5rem; text-align:left;">Región</th>
              <th style="border:1px solid #ddd; padding:0.5rem; text-align:left;">Estado</th>
              <th style="border:1px solid #ddd; padding:0.5rem; text-align:left;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let b of brigadas">
              <td style="border:1px solid #ddd; padding:0.5rem;">{{ b.numero }}</td>
              <td style="border:1px solid #ddd; padding:0.5rem;">{{ b.nombre }}</td>
              <td style="border:1px solid #ddd; padding:0.5rem;">{{ b.tipoBrigada?.nombre || 'N/A' }}</td>
              <td style="border:1px solid #ddd; padding:0.5rem;">{{ b.region?.nombre || 'N/A' }}</td>
              <td style="border:1px solid #ddd; padding:0.5rem;">
                <span [style.color]="b.activo ? '#28a745' : '#dc3545'">{{ b.activo ? 'Activa' : 'Inactiva' }}</span>
              </td>
              <td style="border:1px solid #ddd; padding:0.5rem;">
                <a [routerLink]="['/brigadas', b.id]" style="color:#007bff; text-decoration:none;">Editar</a>
                <span style="margin:0 5px;">|</span>
                <a [routerLink]="['/brigadas', b.id, 'miembros']" style="color:#007bff; text-decoration:none;">Miembros</a>
                <span style="margin:0 5px;">|</span>
                <button (click)="toggleActivo(b)" style="background:transparent; border:none; color:#dc3545; cursor:pointer; text-decoration:underline;">
                  {{ b.activo ? 'Desactivar' : 'Activar' }}
                </button>
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
export class BrigadasComponent implements OnInit {
  private brigadasService = inject(BrigadasService);
  private catalogosService = inject(CatalogosService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  brigadas: Brigada[] = [];
  tiposBrigada: any[] = [];
  regiones: any[] = [];
  departamentos: any[] = [];
  municipios: any[] = [];

  cargando = true;
  error = '';
  page = 1;
  limit = 25;
  totalItems = 0;
  totalPages = 0;
  hasNextPage = false;

  filtroForm = this.fb.group({
    texto: [''],
    tipoBrigadaId: [''],
    regionId: [''],
    departamentoId: [''],
    municipioId: [''],
    activo: [''],
  });

  ngOnInit(): void {
    this.cargarCatalogos();
    this.aplicarFiltros();
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

  onRegionChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const regionId = select.value ? +select.value : null;
    this.departamentos = [];
    this.municipios = [];
    this.filtroForm.patchValue({ departamentoId: '', municipioId: '' });
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
    this.filtroForm.patchValue({ municipioId: '' });
    if (deptoId) {
      this.catalogosService.getMunicipios(deptoId).subscribe({
        next: (res) => { this.municipios = res.data || []; },
        error: () => { /* silencio */ }
      });
    }
  }

  aplicarFiltros(): void {
    this.cargando = true;
    this.error = '';
    const formVal = this.filtroForm.value;
    const filtros: FiltrosBrigadas = {
      page: this.page,
      limit: this.limit,
      sortBy: 'numero',
      sortDir: 'asc',
    };
    if (formVal.texto) filtros.texto = formVal.texto;
    if (formVal.tipoBrigadaId) filtros.tipoBrigadaId = +formVal.tipoBrigadaId;
    if (formVal.regionId) filtros.regionId = +formVal.regionId;
    if (formVal.departamentoId) filtros.departamentoId = +formVal.departamentoId;
    if (formVal.municipioId) filtros.municipioId = +formVal.municipioId;
    if (formVal.activo !== '') filtros.activo = formVal.activo === 'true';

    this.brigadasService.listar(filtros).subscribe({
      next: (res) => {
        this.brigadas = res.brigadas;
        this.totalItems = res.pagination.totalItems;
        this.totalPages = res.pagination.totalPages;
        this.hasNextPage = res.pagination.hasNextPage;
        this.cargando = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al cargar brigadas.';
        this.cargando = false;
      }
    });
  }

  limpiarFiltros(): void {
    this.filtroForm.reset();
    this.departamentos = [];
    this.municipios = [];
    this.page = 1;
    this.aplicarFiltros();
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPages) return;
    this.page = pagina;
    this.aplicarFiltros();
  }

  cambiarLimit(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.limit = +select.value;
    this.page = 1;
    this.aplicarFiltros();
  }

  toggleActivo(brigada: Brigada): void {
    const nuevoEstado = !brigada.activo;
    const confirmacion = confirm(`¿${nuevoEstado ? 'Activar' : 'Desactivar'} la brigada ${brigada.nombre}?`);
    if (!confirmacion) return;
    this.brigadasService.actualizar(brigada.id, { activo: nuevoEstado }).subscribe({
      next: () => { this.aplicarFiltros(); },
      error: (err) => { alert(err.error?.message || 'Error al cambiar estado.'); }
    });
  }
}