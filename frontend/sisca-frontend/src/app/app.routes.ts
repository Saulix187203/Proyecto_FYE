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
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./features/perfil/perfil.component').then(m => m.PerfilComponent),
  },
  {
    path: 'usuarios',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Administrador'] },
    loadComponent: () => import('./features/usuarios/usuarios.component').then(m => m.UsuariosComponent),
  },
  {
    path: 'brigadas',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Administrador'] },
    children: [
      { path: '', loadComponent: () => import('./features/brigadas/brigadas.component').then(m => m.BrigadasComponent) },
      { path: 'nuevo', loadComponent: () => import('./features/brigadas/brigada-form.component').then(m => m.BrigadaFormComponent) },
      { path: ':id', loadComponent: () => import('./features/brigadas/brigada-form.component').then(m => m.BrigadaFormComponent) },
      { path: ':id/miembros', loadComponent: () => import('./features/brigadas/miembros.component').then(m => m.MiembrosComponent) },
    ],
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' },
];