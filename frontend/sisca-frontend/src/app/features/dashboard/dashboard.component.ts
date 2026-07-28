import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { finalize, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DashboardService } from './dashboard.service';
import {
  DashboardAccionVencida,
  DashboardCasoReciente,
  DashboardChartData,
  DashboardChartItem,
  DashboardResumen,
} from './models/dashboard.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  resumen: DashboardResumen | null = null;
  accionesVencidas: DashboardAccionVencida[] = [];
  ultimosCasos: DashboardCasoReciente[] = [];
  displayedColumnsAcciones = ['descripcion', 'responsable', 'fechaCompromiso', 'estado'];
  displayedColumnsCasos = ['correlativo', 'descripcion', 'estado', 'fechaReporte'];
  isLoading = true;

  public barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
    },
  };

  public doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const },
    },
  };

  public barChartDataEstado: DashboardChartData = {
    labels: [],
    datasets: [{ label: 'Casos', data: [], backgroundColor: '#4f46e5' }],
  };

  public barChartDataArea: DashboardChartData = {
    labels: [],
    datasets: [{ label: 'Casos', data: [], backgroundColor: '#06b6d4' }],
  };

  public doughnutChartDataCriticidad: DashboardChartData = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'] }],
  };

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.isLoading = true;

    forkJoin({
      resumen: this.dashboardService.resumen().pipe(catchError(() => of(null))),
      casosEstado: this.dashboardService.casosPorEstado().pipe(catchError(() => of(null))),
      casosArea: this.dashboardService.casosPorArea().pipe(catchError(() => of(null))),
      casosCriticidad: this.dashboardService.casosPorCriticidad().pipe(catchError(() => of(null))),
      accionesVencidas: this.dashboardService.accionesVencidas().pipe(catchError(() => of(null))),
      ultimosCasos: this.dashboardService.ultimosCasos(10).pipe(catchError(() => of(null))),
    })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: ({ resumen, casosEstado, casosArea, casosCriticidad, accionesVencidas, ultimosCasos }) => {
          this.resumen = resumen?.success ? (resumen.data as DashboardResumen) : null;
          this.barChartDataEstado = this.mapChartData(casosEstado?.data?.items ?? [], 'estado');
          this.barChartDataArea = this.mapChartData(casosArea?.data?.items ?? [], 'area');
          this.doughnutChartDataCriticidad = this.mapChartData(casosCriticidad?.data?.items ?? [], 'criticidad', true);
          this.accionesVencidas = accionesVencidas?.success ? (accionesVencidas.data?.acciones ?? []) : [];
          this.ultimosCasos = ultimosCasos?.success ? (ultimosCasos.data?.casos ?? []) : [];
        },
        error: (err) => {
          console.error('Error al cargar dashboard', err);
          this.resumen = null;
          this.accionesVencidas = [];
          this.ultimosCasos = [];
        },
      });
  }

  private mapChartData(items: DashboardChartItem[], key: 'estado' | 'area' | 'criticidad', doughnut = false): DashboardChartData {
    const labels = items.map((item) => item[key]?.nombre ?? 'Sin información');
    const values = items.map((item) => item.total ?? 0);

    return {
      labels,
      datasets: [
        {
          label: doughnut ? undefined : 'Casos',
          data: values,
          backgroundColor: doughnut ? ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'] : '#4f46e5',
        },
      ],
    };
  }
}