import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { RolesLocalService } from './core/services/roles-local.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NgIf],
  template: `
    <nav *ngIf="auth.isAuthenticated()" style="display:flex; gap:1rem; padding:0.5rem; background:#eee; align-items:center;">
      <!-- Dashboard solo para roles autorizados -->
      <a *ngIf="puedeVerDashboard()" routerLink="/dashboard">Dashboard</a>
      <a routerLink="/casos">Casos</a>
      <a routerLink="/notificaciones">Notificaciones</a>
      <a routerLink="/perfil">Perfil</a>
      <a *ngIf="auth.hasRole('Administrador')" routerLink="/usuarios">Usuarios</a>
      <a *ngIf="auth.hasRole('Administrador')" routerLink="/roles-local">Roles</a>
      <button (click)="logout()" style="margin-left:auto;">Cerrar sesión</button>
    </nav>
    <main>
      <router-outlet />
    </main>
  `,
  styles: [`
    nav a { text-decoration: none; color: #333; }
    nav a:hover { text-decoration: underline; }
    main { padding: 1rem; }
  `]
})
export class AppComponent {
  auth = inject(AuthService);
  private router = inject(Router);
  private rolesLocalService = inject(RolesLocalService);

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  // Método para determinar si el usuario puede ver el Dashboard
  puedeVerDashboard(): boolean {
    const rolesPermitidos = ['Administrador', 'SYMA', 'Gestión y Control SYMA', 'Gerencia'];
    if (rolesPermitidos.some(r => this.auth.hasRole(r))) {
      return true;
    }
    return this.rolesLocalService.hasPermissionForCurrentUser('dashboard');
  }
}