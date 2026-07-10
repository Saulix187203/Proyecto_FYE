import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Administrador', 'SYMA', 'Gestión y Control SYMA', 'Gerencia'] },
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'casos',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/casos/listado/listado.component').then(m => m.ListadoCasosComponent),
      },
      {
        path: 'crear',
        loadComponent: () => import('./features/casos/crear/crear.component').then(m => m.CrearCasoComponent),
      },
      {
        path: ':id',
        loadComponent: () => import('./features/casos/detalle/detalle.component').then(m => m.DetalleCasoComponent),
      },
      {
        path: ':id/expediente',
        loadComponent: () => import('./features/casos/expediente/expendiente.component').then(m => m.ExpedienteComponent),
      },
    ],
  },
  {
    path: 'notificaciones',
    canActivate: [authGuard],
    loadComponent: () => import('./features/notificaciones/notificaciones.component').then(m => m.NotificacionesComponent),
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' },
];