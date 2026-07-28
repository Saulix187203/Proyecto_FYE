import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CasosService, FiltrosCasos } from '../services/casos.service';
import { CatalogosService } from '../../../core/services/catalogos.service';
import { AuthService } from '../../../core/services/auth.service';
import { BrigadasService } from '../../../core/services/brigadas.service';
import { UsuariosService } from '../services/usuarios.service';
import { Caso } from '../../../core/models/caso.model';

@Component({
  selector: 'app-listado-casos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
      <h2 style="margin:0;">Listado de Casos</h2>
      <a *ngIf="puedeCrearCaso()" routerLink="/casos/crear" style="display:inline-block; padding:0.5rem 1rem; background:#28a745; color:white; text-decoration:none; border-radius:4px;">
        + Nuevo Caso
      </a>
    </div>

    <!-- Mensaje de filtro por brigada (solo para usuarios Brigada) -->
    <div *ngIf="filtroBrigadaActivo" style="background:#e9f7fe; padding:0.5rem 1rem; border-radius:4px; margin-bottom:1rem; border-left:4px solid #007bff;">
      <strong>📌 Mostrando solo casos de tu brigada:</strong> {{ nombreBrigada || 'N/A' }}
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
      <select formControlName="region" (change)="onRegionChange($event)" style="padding:0.3rem; border:1px solid #ced4da; border-radius:4px; min-width:120px;">
        <option value="">Todas las regiones</option>
        <option *ngFor="let r of regiones" [value]="r.id">{{ r.nombre }}</option>
      </select>
      <select formControlName="departamento" (change)="onDepartamentoChange($event)" style="padding:0.3rem; border:1px solid #ced4da; border-radius:4px; min-width:120px;">
        <option value="">Todos los departamentos</option>
        <option *ngFor="let d of departamentos" [value]="d.id">{{ d.nombre }}</option>
      </select>
      <select formControlName="municipio" style="padding:0.3rem; border:1px solid #ced4da; border-radius:4px; min-width:120px;">
        <option value="">Todos los municipios</option>
        <option *ngFor="let m of municipios" [value]="m.id">{{ m.nombre }}</option>
      </select>
      <select formControlName="tecnico" style="padding:0.3rem; border:1px solid #ced4da; border-radius:4px; min-width:120px;">
        <option value="">Todos los técnicos</option>
        <option *ngFor="let u of tecnicos" [value]="u.id">{{ u.nombre }}</option>
      </select>
      <input formControlName="fechaDesde" type="datetime-local" placeholder="Desde" style="padding:0.3rem; border:1px solid #ced4da; border-radius:4px;">
      <input formControlName="fechaHasta" type="datetime-local" placeholder="Hasta" style="padding:0.3rem; border:1px solid #ced4da; border-radius:4px;">
      <button type="submit" style="padding:0.3rem 1rem; background:#007bff; color:white; border:none; border-radius:4px; cursor:pointer;">Filtrar</button>
      <button type="button" (click)="limpiarFiltros()" style="padding:0.3rem 1rem; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer;">Limpiar</button>
    </form>

    <div *ngIf="accessDeniedMessage" style="background:#fff3cd; padding:0.75rem; border-radius:4px; margin-bottom:1rem; color:#856404; border-left:4px solid #ffeeba;">
      {{ accessDeniedMessage }}
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
              <th style="border:1px solid #ddd; padding:0.5rem; text-align:left;">Área</th>
              <th style="border:1px solid #ddd; padding:0.5rem; text-align:left;">Estado</th>
              <th style="border:1px solid #ddd; padding:0.5rem; text-align:left;">Municipio</th>
              <th style="border:1px solid #ddd; padding:0.5rem; text-align:left;">Técnico</th>
              <th style="border:1px solid #ddd; padding:0.5rem; text-align:left;">Fecha</th>
              <th style="border:1px solid #ddd; padding:0.5rem; text-align:left;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let caso of casos">
              <td style="border:1px solid #ddd; padding:0.5rem;">{{ caso.correlativo }}</td>
              <td style="border:1px solid #ddd; padding:0.5rem;">{{ caso.area?.nombre || 'N/A' }}</td>
              <td style="border:1px solid #ddd; padding:0.5rem;">
                <span [style.color]="getEstadoColor(caso.estado?.nombre)" style="font-weight:bold;">
                  {{ caso.estado?.nombre || 'N/A' }}
                </span>
              </td>
              <td style="border:1px solid #ddd; padding:0.5rem;">
                {{ caso.brigadaReportante?.municipio?.nombre || 'N/A' }}
              </td>
              <td style="border:1px solid #ddd; padding:0.5rem;">
                {{ (caso.usuarioReporta || caso.creadoPor)?.nombre || 'N/A' }}
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
  private authService = inject(AuthService);
  private brigadasService = inject(BrigadasService);
  private usuariosService = inject(UsuariosService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);

  casos: Caso[] = [];
  accessDeniedMessage = '';
  cargando = true;
  error = '';

  areas: any[] = [];
  estados: any[] = [];
  criticidades: any[] = [];
  regiones: any[] = [];
  departamentos: any[] = [];
  municipios: any[] = [];
  tecnicos: any[] = [];

  filtroBrigadaActivo = false;
  nombreBrigada = '';

  filtroForm = this.fb.group({
    texto: [''],
    estado: [''],
    area: [''],
    criticidad: [''],
    region: [''],
    departamento: [''],
    municipio: [''],
    tecnico: [''],
    fechaDesde: [''],
    fechaHasta: [''],
  });

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarDependencias();
    this.route.queryParams.subscribe(params => {
      if (params['accessDenied'] === 'usuarios') {
        this.accessDeniedMessage = 'No tienes permiso para acceder a Usuarios.';
      } else {
        this.accessDeniedMessage = '';
      }
    });
    this.aplicarFiltros();
  }

  private cargarCatalogos(): void {
    this.catalogosService.getAreas().subscribe({
      next: (res) => { this.areas = res.data || []; },
      error: () => { /* silencio */ }
    });
    this.catalogosService.getEstadosCaso().subscribe({
      next: (res) => { this.estados = res.data || []; },
      error: () => { /* silencio */ }
    });
    this.catalogosService.getCriticidades().subscribe({
      next: (res) => { this.criticidades = res.data || []; },
      error: () => { /* silencio */ }
    });
    this.catalogosService.getRegiones().subscribe({
      next: (res) => { this.regiones = res.data || []; },
      error: () => { /* silencio */ }
    });
    this.usuariosService.getOpciones().subscribe({
      next: (data) => { this.tecnicos = data || []; },
      error: () => { /* silencio */ }
    });
  }

  private cargarDependencias(): void {
    // Se cargan departamentos y municipios según la región seleccionada en el filtro
  }

  onRegionChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const regionId = select.value ? +select.value : null;
    this.departamentos = [];
    this.municipios = [];
    this.filtroForm.patchValue({ departamento: '', municipio: '' });
    if (regionId) {
      this.catalogosService.getDepartamentos(regionId).subscribe({
        next: (res) => {
          const deptos = (res.data as any)?.departamentos || res.data || [];
          this.departamentos = deptos;
        },
        error: () => { /* silencio */ }
      });
    }
  }

  onDepartamentoChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const deptoId = select.value ? +select.value : null;
    this.municipios = [];
    this.filtroForm.patchValue({ municipio: '' });
    if (deptoId) {
      this.catalogosService.getMunicipios(deptoId).subscribe({
        next: (res) => {
          const munis = (res.data as any)?.municipios || res.data || [];
          this.municipios = munis;
        },
        error: () => { /* silencio */ }
      });
    }
  }

  puedeCrearCaso(): boolean {
    const rolesPermitidos = ['Administrador', 'Brigada', 'PRL Contratista', 'SYMA'];
    const usuario = this.authService.getUsuario();
    if (!usuario) return false;
    return usuario.roles?.some(r => rolesPermitidos.includes(r.nombre)) || false;
  }

  aplicarFiltros(): void {
    this.cargando = true;
    this.error = '';

    const formVal = this.filtroForm.value;
    const filtros: FiltrosCasos = {};

    if (formVal.texto) filtros.texto = formVal.texto;
    if (formVal.estado) filtros.estado = formVal.estado;
    if (formVal.area) filtros.area = formVal.area;
    if (formVal.criticidad) filtros.criticidad = formVal.criticidad;
    if (formVal.region) filtros.region = formVal.region;
    if (formVal.departamento) filtros.departamento = formVal.departamento;
    if (formVal.municipio) filtros.municipio = formVal.municipio;
    if (formVal.tecnico) filtros.tecnico = formVal.tecnico;
    if (formVal.fechaDesde) filtros.fechaDesde = formVal.fechaDesde;
    if (formVal.fechaHasta) filtros.fechaHasta = formVal.fechaHasta;

    const usuario = this.authService.getUsuario();
    const esBrigada = usuario?.roles?.some(r => r.nombre === 'Brigada') || false;
    if (esBrigada) {
      this.brigadasService.getMisBrigadas().subscribe({
        next: (brigadas) => {
          if (brigadas.length > 0) {
            const brigada = brigadas[0];
            filtros.brigada = brigada.id;
            this.filtroBrigadaActivo = true;
            this.nombreBrigada = `${brigada.numero} - ${brigada.nombre}`;
          } else {
            this.filtroBrigadaActivo = false;
            this.nombreBrigada = '';
          }
          this.ejecutarBusqueda(filtros);
        },
        error: () => {
          this.filtroBrigadaActivo = false;
          this.nombreBrigada = '';
          this.ejecutarBusqueda(filtros);
        }
      });
    } else {
      this.filtroBrigadaActivo = false;
      this.nombreBrigada = '';
      this.ejecutarBusqueda(filtros);
    }
  }

  private ejecutarBusqueda(filtros: FiltrosCasos): void {
    this.casosService.listarCasos(filtros).subscribe({
      next: (res) => {
        let dataArray: any[] = [];
        if (res.success && res.data) {
          if (Array.isArray(res.data)) {
            dataArray = res.data;
          } else {
            const obj = res.data as any;
            if (Array.isArray(obj.casos)) dataArray = obj.casos;
            else if (Array.isArray(obj.data)) dataArray = obj.data;
            else if (Array.isArray(obj.items)) dataArray = obj.items;
            else dataArray = [];
          }
        }
        this.casos = dataArray;
        this.cargando = false;
      },
      error: (err) => {
        this.error = err.error?.message || err.message || 'Error al cargar casos. Verifica que el backend esté corriendo.';
        this.cargando = false;
      }
    });
  }

  limpiarFiltros(): void {
    this.filtroForm.reset();
    this.departamentos = [];
    this.municipios = [];
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