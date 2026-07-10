import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  template: `
    <div style="max-width:400px; margin:2rem auto; padding:1.5rem; border:1px solid #ccc; border-radius:8px;">
      <h2>Iniciar sesión</h2>
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <div>
          <label>Correo:</label>
          <input formControlName="correo" type="email" placeholder="admin@sisca.com" style="width:100%; padding:0.5rem; margin:0.5rem 0;">
        </div>
        <div>
          <label>Contraseña:</label>
          <input formControlName="password" type="password" placeholder="Admin123*" style="width:100%; padding:0.5rem; margin:0.5rem 0;">
        </div>
        <button type="submit" [disabled]="loginForm.invalid" style="padding:0.5rem 1rem; background:#007bff; color:white; border:none; border-radius:4px; cursor:pointer;">
          Ingresar
        </button>
        <div *ngIf="error" style="color:red; margin-top:1rem;">{{ error }}</div>
      </form>
    </div>
  `,
  styles: [`
    input { box-sizing: border-box; }
    button:disabled { opacity:0.6; cursor:not-allowed; }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  error = '';

  loginForm = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  onSubmit() {
    if (this.loginForm.invalid) return;
    const { correo, password } = this.loginForm.value;
    this.auth.login({ correo: correo!, password: password! }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error = err.error?.message || 'Error de autenticación. Verifica tus credenciales.';
      },
    });
  }
}