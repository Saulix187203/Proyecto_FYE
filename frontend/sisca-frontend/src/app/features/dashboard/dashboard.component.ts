import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1>Dashboard</h1>
    <div *ngIf="resumen" style="display:flex; gap:1rem; flex-wrap:wrap;">
      <div style="border:1px solid #ccc; padding:1rem; border-radius:8px; min-width:150px;">
        <h3>Total Casos</h3>
        <p>{{ resumen.totalCasos }}</p>
      </div>
      <div style="border:1px solid #ccc; padding:1rem; border-radius:8px; min-width:150px;">
        <h3>Abiertos</h3>
        <p>{{ resumen.casosAbiertos }}</p>
      </div>
      <div style="border:1px solid #ccc; padding:1rem; border-radius:8px; min-width:150px;">
        <h3>Cerrados</h3>
        <p>{{ resumen.casosCerrados }}</p>
      </div>
      <div style="border:1px solid #ccc; padding:1rem; border-radius:8px; min-width:150px;">
        <h3>En Revisión</h3>
        <p>{{ resumen.casosEnRevision }}</p>
      </div>
      <div style="border:1px solid #ccc; padding:1rem; border-radius:8px; min-width:150px;">
        <h3>Acciones Pendientes</h3>
        <p>{{ resumen.accionesPendientes }}</p>
      </div>
      <div style="border:1px solid #ccc; padding:1rem; border-radius:8px; min-width:150px;">
        <h3>Acciones Vencidas</h3>
        <p>{{ resumen.accionesVencidas }}</p>
      </div>
    </div>
    <div *ngIf="!resumen">Cargando...</div>
  `,
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  resumen: any = null;

  ngOnInit(): void {
    this.dashboardService.resumen().subscribe({
      next: (res) => this.resumen = res.data,
      error: (err) => console.error('Error al cargar dashboard', err),
    });
  }
}