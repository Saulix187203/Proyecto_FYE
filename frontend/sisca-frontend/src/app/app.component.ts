import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NgIf],
  template: `
    <nav *ngIf="auth.isAuthenticated()" style="display:flex; gap:1rem; padding:0.5rem; background:#eee;">
      <a routerLink="/dashboard">Dashboard</a>
      <a routerLink="/casos">Casos</a>
      <a routerLink="/notificaciones">Notificaciones</a>
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

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}