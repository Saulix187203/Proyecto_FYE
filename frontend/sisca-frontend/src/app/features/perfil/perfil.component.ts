import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Usuario } from '../../core/models/auth.model';
import { UsuariosService } from '../usuarios/usuarios.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section style="max-width:760px; margin:0 auto; padding:1rem 0;">
      <h2 style="margin-bottom:1rem;">Mi perfil</h2>

      <div *ngIf="mensaje" style="margin-bottom:1rem; padding:0.75rem 1rem; background:#e8f5e9; color:#2e7d32; border-radius:4px;">
        {{ mensaje }}
      </div>
      <div *ngIf="error" style="margin-bottom:1rem; padding:0.75rem 1rem; background:#ffebee; color:#c62828; border-radius:4px;">
        {{ error }}
      </div>

      <article style="padding:1rem; border:1px solid #ddd; border-radius:8px; background:#fff;">
        <div *ngIf="cargando" style="color:#6c757d;">Cargando perfil...</div>

        <form *ngIf="!cargando" [formGroup]="perfilForm" (ngSubmit)="guardarPerfil()" style="display:grid; gap:1rem;">
          <label>
            Nombre
            <input formControlName="nombre" type="text" style="width:100%; padding:0.6rem; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">
          </label>

          <label>
            Correo
            <input formControlName="correo" type="email" style="width:100%; padding:0.6rem; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">
          </label>

          <label>
            Nueva contraseña (opcional)
            <input formControlName="password" type="password" placeholder="Deja vacío para mantener la actual" style="width:100%; padding:0.6rem; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">
          </label>

          <label>
            Confirmar nueva contraseña
            <input formControlName="confirmarPassword" type="password" style="width:100%; padding:0.6rem; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">
          </label>

          <div style="display:flex; gap:1rem; flex-wrap:wrap;">
            <button type="submit" style="padding:0.75rem 1.25rem; background:#007bff; color:#fff; border:none; border-radius:4px; cursor:pointer;">
              Guardar cambios
            </button>
            <button type="button" (click)="cancelar()" style="padding:0.75rem 1.25rem; background:#6c757d; color:#fff; border:none; border-radius:4px; cursor:pointer;">
              Cancelar
            </button>
          </div>
        </form>
      </article>
    </section>
  `
})
export class PerfilComponent implements OnInit {
  private fb = inject(FormBuilder);
  private usuariosService = inject(UsuariosService);
  private authService = inject(AuthService);
  private router = inject(Router);

  usuarioActual: Usuario | null = null;
  mensaje = '';
  error = '';
  cargando = false;

  perfilForm = this.fb.group({
    nombre: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    password: [''],
    confirmarPassword: [''],
  });

  ngOnInit(): void {
    this.cargarPerfil();
  }

  cargarPerfil() {
    const usuarioLogueado = this.authService.getUsuario();
    if (!usuarioLogueado?.id) {
      this.router.navigate(['/login']);
      return;
    }

    this.cargando = true;
    this.error = '';

    this.authService.getMe().subscribe({
      next: (response) => {
        this.cargando = false;
        if (response.success) {
          this.usuarioActual = response.data?.usuario ?? null;
          this.perfilForm.patchValue({
            nombre: this.usuarioActual?.nombre ?? '',
            correo: this.usuarioActual?.correo ?? '',
            password: '',
            confirmarPassword: '',
          });
        } else {
          this.error = 'No se pudo cargar tu perfil.';
        }
      },
      error: () => {
        this.cargando = false;
        this.error = 'No se pudo cargar tu perfil.';
      },
    });
  }

  guardarPerfil() {
    if (this.perfilForm.invalid) {
      Object.keys(this.perfilForm.controls).forEach((key) => this.perfilForm.get(key)?.markAsTouched());
      return;
    }

    const nombre = this.perfilForm.value.nombre?.toString().trim() || '';
    const correo = this.perfilForm.value.correo?.toString().trim() || '';
    const password = this.perfilForm.value.password?.toString() || '';
    const confirmarPassword = this.perfilForm.value.confirmarPassword?.toString() || '';

    if (password && password.length < 8) {
      this.error = 'La contraseña debe tener al menos 8 caracteres.';
      return;
    }

    if (password && password !== confirmarPassword) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }

    const usuarioId = this.usuarioActual?.id;
    if (!usuarioId) {
      this.error = 'No se pudo identificar tu usuario.';
      return;
    }

    this.error = '';
    this.mensaje = '';

    this.usuariosService.actualizarUsuario(usuarioId, { nombre, correo }).subscribe({
      next: (response) => {
        if (!response.success) {
          this.error = response.message || 'No se pudo actualizar tu perfil.';
          return;
        }

        const actualizado = response.data?.usuario;
        if (actualizado) {
          this.usuarioActual = actualizado;
          this.authService.updateUserData(actualizado);
        }

        if (password) {
          this.usuariosService.actualizarPasswordUsuario(usuarioId, { password }).subscribe({
            next: (passwordResponse) => {
              if (passwordResponse.success) {
                this.mensaje = 'Perfil actualizado correctamente.';
                this.perfilForm.patchValue({ password: '', confirmarPassword: '' });
              } else {
                this.error = passwordResponse.message || 'No se pudo actualizar la contraseña.';
              }
            },
            error: () => {
              this.error = 'No se pudo actualizar la contraseña.';
            },
          });
        } else {
          this.mensaje = 'Perfil actualizado correctamente.';
        }
      },
      error: () => {
        this.error = 'No se pudo actualizar tu perfil.';
      },
    });
  }

  cancelar() {
    this.perfilForm.patchValue({
      nombre: this.usuarioActual?.nombre ?? '',
      correo: this.usuarioActual?.correo ?? '',
      password: '',
      confirmarPassword: '',
    });
    this.error = '';
    this.mensaje = '';
  }
}
