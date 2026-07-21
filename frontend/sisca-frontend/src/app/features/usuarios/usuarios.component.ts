import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuariosService, ActualizarUsuarioRequest, CrearUsuarioRequest } from './usuarios.service';
import { Rol, Usuario } from '../../core/models/auth.model';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section style="max-width:960px; margin:0 auto;">
      <h1>Gestión de usuarios</h1>

      <div *ngIf="mensaje" style="margin-bottom:1rem; padding:0.75rem 1rem; background:#e8f5e9; color:#2e7d32; border-radius:4px;">
        {{ mensaje }}
      </div>
      <div *ngIf="error" style="margin-bottom:1rem; padding:0.75rem 1rem; background:#ffebee; color:#c62828; border-radius:4px;">
        {{ error }}
      </div>

      <article style="margin-bottom:2rem; padding:1rem; border:1px solid #ddd; border-radius:8px; background:#fafafa;">
        <h2>Usuarios existentes</h2>
        <table style="width:100%; border-collapse:collapse; margin-top:1rem;">
          <thead>
            <tr style="background:#f5f5f5; text-align:left;">
              <th style="padding:0.75rem; border-bottom:1px solid #ddd;">Nombre</th>
              <th style="padding:0.75rem; border-bottom:1px solid #ddd;">Correo</th>
              <th style="padding:0.75rem; border-bottom:1px solid #ddd;">Activo</th>
              <th style="padding:0.75rem; border-bottom:1px solid #ddd;">Roles</th>
              <th style="padding:0.75rem; border-bottom:1px solid #ddd;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let usuario of usuarios">
              <td style="padding:0.75rem; border-bottom:1px solid #eee;">{{ usuario.nombre }}</td>
              <td style="padding:0.75rem; border-bottom:1px solid #eee;">{{ usuario.correo }}</td>
              <td style="padding:0.75rem; border-bottom:1px solid #eee;">{{ usuario.activo ? 'Sí' : 'No' }}</td>
              <td style="padding:0.75rem; border-bottom:1px solid #eee;">{{ getRolesTexto(usuario) }}</td>
              <td style="padding:0.75rem; border-bottom:1px solid #eee;">
                <button type="button" (click)="editarUsuario(usuario)" style="margin-right:0.5rem; padding:0.35rem 0.7rem; background:#007bff; color:white; border:none; border-radius:4px; cursor:pointer;">Editar</button>
                <button type="button" (click)="desactivarUsuario(usuario.id)" style="padding:0.35rem 0.7rem; background:#dc3545; color:white; border:none; border-radius:4px; cursor:pointer;">Desactivar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </article>

      <article style="padding:1rem; border:1px solid #ddd; border-radius:8px; background:#fff;">
        <h2>{{ modoEdicion ? 'Editar usuario' : 'Crear nuevo usuario' }}</h2>
        <form [formGroup]="usuarioForm" (ngSubmit)="guardarUsuario()" style="display:grid; gap:1rem;">
          <label>
            Nombre
            <input formControlName="nombre" type="text" placeholder="Usuario Prueba SISCA" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px;">
          </label>
          <label>
            Correo
            <input formControlName="correo" type="email" placeholder="usuario.prueba@sisca.com" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px;">
          </label>
          <label>
            Contraseña {{ modoEdicion ? '(opcional para mantener la actual)' : '' }}
            <input formControlName="password" type="password" placeholder="Usuario123*" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px;">
          </label>
          <label>
            Rol
            <select formControlName="roles" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">
              <option [ngValue]="null" disabled>Selecciona un rol</option>
              <option *ngFor="let rol of roles" [ngValue]="rol.id">{{ rol.nombre }}</option>
            </select>
          </label>
          <small style="color:#6c757d;">Selecciona un rol para el usuario.</small>
          <label style="display:flex; align-items:center; gap:0.5rem;">
            <input formControlName="activo" type="checkbox">
            Activo
          </label>
          <div style="display:flex; gap:1rem; flex-wrap:wrap;">
            <button type="submit" [disabled]="usuarioForm.invalid" style="width:fit-content; padding:0.75rem 1.25rem; background:#007bff; color:#fff; border:none; border-radius:4px; cursor:pointer;">
              {{ modoEdicion ? 'Guardar cambios' : 'Crear usuario' }}
            </button>
            <button *ngIf="modoEdicion" type="button" (click)="cancelarEdicion()" style="width:fit-content; padding:0.75rem 1.25rem; background:#6c757d; color:#fff; border:none; border-radius:4px; cursor:pointer;">
              Cancelar
            </button>
          </div>
        </form>
      </article>
    </section>
  `
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  roles: Rol[] = [];
  mensaje = '';
  error = '';
  modoEdicion = false;
  usuarioEditId: number | null = null;

  private fb = inject(FormBuilder);
  private usuariosService = inject(UsuariosService);

  usuarioForm = this.fb.group({
    nombre: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    password: [''],
    roles: this.fb.control<number | null>(null, Validators.required),
    activo: [true],
  });

  ngOnInit(): void {
    this.cargarRoles();
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.usuariosService.listarUsuarios().subscribe({
      next: (response) => {
        if (response.success) {
          this.usuarios = response.data?.usuarios ?? [];
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'No se pudieron cargar los usuarios';
      },
    });
  }

  cargarRoles() {
    this.usuariosService.listarRoles().subscribe({
      next: (response) => {
        if (response.success) {
          this.roles = response.data?.roles ?? [];
        }
      },
      error: () => {
        this.error = 'No se pudieron cargar los roles disponibles';
      },
    });
  }

  get rolesDisponibles(): string {
    return this.roles.map((rol) => rol.nombre).join(', ');
  }

  getRolesTexto(usuario: Usuario): string {
    return (usuario.roles ?? []).map((rol) => rol.nombre).join(', ');
  }

  editarUsuario(usuario: Usuario) {
    this.modoEdicion = true;
    this.usuarioEditId = usuario.id;
    this.mensaje = '';
    this.error = '';
    this.usuarioForm.patchValue({
      nombre: usuario.nombre,
      correo: usuario.correo,
      password: '',
      roles: usuario.roles?.length ? usuario.roles[0].id : null,
      activo: usuario.activo,
    });
  }

  cancelarEdicion() {
    this.modoEdicion = false;
    this.usuarioEditId = null;
    this.usuarioForm.reset({ activo: true, password: '' });
    this.error = '';
    this.mensaje = '';
  }

  guardarUsuario() {
    if (this.usuarioForm.invalid) return;

    const nombre = this.usuarioForm.value.nombre?.toString().trim() || '';
    const correo = this.usuarioForm.value.correo?.toString().trim() || '';
    const password = this.usuarioForm.value.password?.toString() || '';
    const activo = !!this.usuarioForm.value.activo;
    const rolSeleccionado = this.usuarioForm.value.roles as number | null;
    const roles = rolSeleccionado ? [rolSeleccionado] : [];

    if (!nombre || !correo) {
      this.error = 'Nombre y correo son obligatorios';
      return;
    }

    if (!this.modoEdicion && !password) {
      this.error = 'La contraseña es obligatoria al crear un usuario';
      return;
    }

    if (!this.modoEdicion && password.length < 8) {
      this.error = 'La contraseña debe tener al menos 8 caracteres';
      return;
    }

    this.error = '';

    if (this.modoEdicion && this.usuarioEditId !== null) {
      const payload: ActualizarUsuarioRequest = {
        nombre,
        correo,
        activo,
        roles,
      };

      if (password) {
        payload.password = password;
      }

      this.usuariosService.actualizarUsuario(this.usuarioEditId, payload).subscribe({
        next: (response) => {
          if (response.success) {
            this.mensaje = 'Usuario actualizado correctamente';
            this.cancelarEdicion();
            this.cargarUsuarios();
          }
        },
        error: (err) => {
          this.error = err.error?.message || 'No se pudo actualizar el usuario';
        },
      });
      return;
    }

    const request: CrearUsuarioRequest = {
      nombre,
      correo,
      password,
      activo,
      roles,
    };

    this.usuariosService.crearUsuario(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.mensaje = 'Usuario creado correctamente';
          this.usuarioForm.reset({ activo: true, password: '' });
          this.cargarUsuarios();
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'No se pudo crear el usuario';
      },
    });
  }

  desactivarUsuario(id: number) {
    this.error = '';
    this.mensaje = '';

    this.usuariosService.desactivarUsuario(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.mensaje = 'Usuario desactivado correctamente';
          this.cargarUsuarios();
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'No se pudo desactivar el usuario';
      },
    });
  }

}
