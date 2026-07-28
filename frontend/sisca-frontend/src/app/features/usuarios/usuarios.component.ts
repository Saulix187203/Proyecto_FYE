import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuariosService, ActualizarUsuarioRequest, CrearUsuarioRequest } from './usuarios.service';
import { Rol, Usuario } from '../../core/models/auth.model';
import { CatalogosService } from '../../core/services/catalogos.service';
import { RolesLocalService } from '../../core/services/roles-local.service';
import { Router } from '@angular/router';

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

      <div style="display:flex; justify-content:space-between; align-items:center; gap:1rem; margin-bottom:1rem; flex-wrap:wrap;">
        <h2 style="margin:0;">Usuarios existentes</h2>
        <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
          <button type="button" (click)="abrirRolesLocal()" style="padding:0.6rem 1rem; background:#6f42c1; color:white; border:none; border-radius:4px; cursor:pointer;">Gestionar roles</button>
          <button type="button" (click)="abrirFormularioCreacion()" style="padding:0.6rem 1rem; background:#28a745; color:white; border:none; border-radius:4px; cursor:pointer;">Crear nuevo usuario</button>
        </div>
      </div>

      <article style="margin-bottom:2rem; padding:1rem; border:1px solid #ddd; border-radius:8px; background:#fafafa;">
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
                <button type="button" (click)="abrirModalRoles(usuario)" style="margin-right:0.5rem; padding:0.35rem 0.7rem; background:#6f42c1; color:white; border:none; border-radius:4px; cursor:pointer;">Roles</button>
                <button type="button" (click)="desactivarUsuario(usuario.id)" style="margin-right:0.5rem; padding:0.35rem 0.7rem; background:#dc3545; color:white; border:none; border-radius:4px; cursor:pointer;">Desactivar</button>
                <button type="button" (click)="eliminarUsuario(usuario.id)" style="padding:0.35rem 0.7rem; background:#b02a37; color:white; border:none; border-radius:4px; cursor:pointer;">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </article>

      <div *ngIf="mostrarFormulario" style="position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1100; padding:1rem;">
        <div style="width:min(100%, 720px); max-height:90vh; overflow:auto; background:#fff; border-radius:10px; padding:1.25rem; box-shadow:0 12px 35px rgba(0,0,0,0.2);">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:1rem; margin-bottom:1rem;">
            <h2 style="margin:0;">{{ modoEdicion ? 'Editar usuario' : 'Crear nuevo usuario' }}</h2>
            <button type="button" (click)="cancelarEdicion()" style="border:none; background:transparent; font-size:1.2rem; cursor:pointer;">✕</button>
          </div>

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
            <div *ngIf="esRolBrigada()" style="display:grid; gap:0.5rem;">
              <label>
                Tipo de brigada
                <select formControlName="tipoBrigadaId" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">
                  <option [ngValue]="null" disabled>Selecciona tipo de brigada</option>
                  <option *ngFor="let t of tiposBrigada" [ngValue]="t.id">{{ t.nombre }}</option>
                </select>
              </label>
              <label>
                Brigada
                <select formControlName="codigoBrigada" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">
                  <option [ngValue]="null" disabled>Selecciona una brigada</option>
                  <option *ngFor="let brigada of brigadas" [ngValue]="brigada.numero">{{ getBrigadaLabel(brigada) }}</option>
                </select>
              </label>
              <small style="color:#6c757d;">Seleccione la brigada a la que pertenecerá el usuario.</small>
            </div>
            <label style="display:flex; align-items:center; gap:0.5rem;">
              <input formControlName="activo" type="checkbox">
              Activo
            </label>
            <div style="display:flex; gap:1rem; flex-wrap:wrap; justify-content:flex-end;">
              <button type="button" (click)="cancelarEdicion()" style="padding:0.75rem 1.25rem; background:#6c757d; color:#fff; border:none; border-radius:4px; cursor:pointer;">
                Cancelar
              </button>
              <button type="submit" [disabled]="usuarioForm.invalid" style="padding:0.75rem 1.25rem; background:#007bff; color:#fff; border:none; border-radius:4px; cursor:pointer;">
                {{ modoEdicion ? 'Guardar cambios' : 'Crear usuario' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div *ngIf="mostrarModalRoles" style="position:fixed; inset:0; background:rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; z-index:1000; padding:1rem;">
        <div style="width:min(100%, 480px); background:#fff; border-radius:8px; padding:1.25rem; box-shadow:0 10px 30px rgba(0,0,0,0.2);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="margin:0;">Asignar roles</h3>
            <button type="button" (click)="cerrarModalRoles()" style="border:none; background:transparent; font-size:1.2rem; cursor:pointer;">✕</button>
          </div>

          <p *ngIf="usuarioSeleccionadoParaRoles" style="margin:0 0 1rem; color:#495057;">
            {{ usuarioSeleccionadoParaRoles.nombre }} ({{ usuarioSeleccionadoParaRoles.correo }})
          </p>

          <div style="display:grid; gap:0.6rem; max-height:280px; overflow:auto; padding-right:0.25rem;">
            <label *ngFor="let rol of roles" style="display:flex; align-items:center; gap:0.6rem; padding:0.5rem 0.6rem; border:1px solid #dee2e6; border-radius:6px; cursor:pointer;">
              <input type="checkbox" [checked]="estaSeleccionado(rol.id)" (change)="toggleRol(rol.id)">
              <span>{{ rol.nombre }}</span>
            </label>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1rem;">
            <button type="button" (click)="cerrarModalRoles()" style="padding:0.6rem 1rem; background:#6c757d; color:#fff; border:none; border-radius:4px; cursor:pointer;">Cancelar</button>
            <button type="button" (click)="guardarRolesUsuario()" style="padding:0.6rem 1rem; background:#28a745; color:#fff; border:none; border-radius:4px; cursor:pointer;">Guardar roles</button>
          </div>
        </div>
      </div>
    </section>
  `
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  roles: Rol[] = [];
  tiposBrigada: any[] = [];
  brigadas: any[] = [];
  mensaje = '';
  error = '';
  modoEdicion = false;
  usuarioEditId: number | null = null;
  mostrarModalRoles = false;
  mostrarFormulario = false;
  usuarioSeleccionadoParaRoles: Usuario | null = null;
  rolesSeleccionados: number[] = [];

  private fb = inject(FormBuilder);
  private usuariosService = inject(UsuariosService);
  private catalogosService = inject(CatalogosService);
  private rolesLocalService = inject(RolesLocalService);
  private router = inject(Router);

  usuarioForm = this.fb.group({
    nombre: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    password: [''],
    roles: this.fb.control<number | null>(null, Validators.required),
    activo: [true],
    tipoBrigadaId: [null],
    codigoBrigada: [''],
  });

  ngOnInit(): void {
    this.cargarRoles();
    this.cargarTiposBrigada();
    this.cargarUsuarios();

    this.usuarioForm.get('roles')?.valueChanges.subscribe(() => {
      if (!this.esRolBrigada()) {
        this.brigadas = [];
        this.usuarioForm.patchValue({ codigoBrigada: null }, { emitEvent: false });
        return;
      }

      this.cargarBrigadas(this.usuarioForm.value.tipoBrigadaId as number | null);
    });

    this.usuarioForm.get('tipoBrigadaId')?.valueChanges.subscribe(() => {
      if (!this.esRolBrigada()) {
        return;
      }

      this.cargarBrigadas(this.usuarioForm.value.tipoBrigadaId as number | null);
    });
  }

  cargarTiposBrigada() {
    this.catalogosService.getTiposBrigada().subscribe({
      next: (response) => {
        if (response.success) {
          this.tiposBrigada = response.data ?? [];
        }
      },
      error: () => {
        // No bloqueante si falla
      },
    });
  }

  cargarBrigadas(tipoBrigadaId?: number | null) {
    if (!this.esRolBrigada()) {
      this.brigadas = [];
      return;
    }

    this.catalogosService.getBrigadas(tipoBrigadaId ?? undefined).subscribe({
      next: (response) => {
        const data = response.data as any;
        this.brigadas = data?.brigadas ?? data ?? [];
      },
      error: () => {
        this.brigadas = [];
      },
    });
  }

  getBrigadaLabel(brigada: any): string {
    const numero = brigada?.numero ? `${brigada.numero}` : '';
    const nombre = brigada?.nombre ? `${brigada.nombre}` : '';
    return [numero, nombre].filter(Boolean).join(' - ');
  }

  esRolBrigada(): boolean {
    const rolId = this.usuarioForm.value.roles as number | null;
    if (!rolId) return false;
    const rol = this.roles.find((r) => r.id === rolId);
    return !!rol && rol.nombre.toLowerCase().includes('brigad');
  }

  cargarUsuarios() {
    this.usuariosService.listarUsuarios().subscribe({
      next: (response) => {
        if (response.success) {
          this.usuarios = (response.data?.usuarios ?? [])
            .filter((usuario: Usuario) => usuario.activo !== false)
            .map((usuario: Usuario) => this.agregarRolesLocales(usuario));
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'No se pudieron cargar los usuarios';
      },
    });
  }

  private agregarRolesLocales(usuario: Usuario): Usuario {
    const rolesLocales = this.rolesLocalService.obtenerRolesDeUsuario(usuario);
    const rolesLocalesModel = rolesLocales
      .map((nombreRol) => {
        const rolLocal = this.rolesLocalService.listarRoles().find((rol) => rol.nombre === nombreRol);
        return rolLocal ? { id: -(rolLocal.id), nombre: rolLocal.nombre } : null;
      })
      .filter((rol): rol is Rol => !!rol);

    const rolesBackend = (usuario.roles ?? []).map((rol) => ({ ...rol }));
    const rolesCombinados = [...rolesBackend, ...rolesLocalesModel.filter((rol) => !rolesBackend.some((item) => item.nombre === rol.nombre))];

    return {
      ...usuario,
      roles: rolesCombinados,
    };
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

  abrirModalRoles(usuario: Usuario) {
    this.usuarioSeleccionadoParaRoles = usuario;
    this.rolesSeleccionados = (usuario.roles ?? []).map((rol) => rol.id);
    this.mostrarModalRoles = true;
    this.error = '';
    this.mensaje = '';
  }

  cerrarModalRoles() {
    this.mostrarModalRoles = false;
    this.usuarioSeleccionadoParaRoles = null;
    this.rolesSeleccionados = [];
  }

  estaSeleccionado(rolId: number): boolean {
    return this.rolesSeleccionados.includes(rolId);
  }

  toggleRol(rolId: number) {
    const existe = this.rolesSeleccionados.includes(rolId);
    if (existe) {
      this.rolesSeleccionados = this.rolesSeleccionados.filter((id) => id !== rolId);
      return;
    }

    this.rolesSeleccionados = [...this.rolesSeleccionados, rolId];
  }

  guardarRolesUsuario() {
    if (!this.usuarioSeleccionadoParaRoles) {
      return;
    }

    const rolesSeleccionados = this.roles.filter((rol) => this.rolesSeleccionados.includes(rol.id));
    const rolesLocales = rolesSeleccionados.filter((rol) => rol.id < 0).map((rol) => rol.nombre);
    const rolesBackend = rolesSeleccionados.filter((rol) => rol.id >= 0).map((rol) => rol.id);

    this.rolesLocalService.guardarAsignacionesParaUsuario(this.usuarioSeleccionadoParaRoles, rolesLocales);

    if (rolesBackend.length > 0 || (this.usuarioSeleccionadoParaRoles.roles ?? []).some((rol) => rol.id >= 0)) {
      this.usuariosService.actualizarRolesUsuario(this.usuarioSeleccionadoParaRoles.id, { roles: rolesBackend }).subscribe({
        next: (response) => {
          if (response.success) {
            this.mensaje = 'Roles actualizados correctamente';
            this.cerrarModalRoles();
            this.cargarUsuarios();
          }
        },
        error: (err) => {
          this.error = err.error?.message || 'No se pudieron actualizar los roles';
        },
      });
      return;
    }

    this.mensaje = 'Roles actualizados correctamente';
    this.cerrarModalRoles();
    this.cargarUsuarios();
  }

  abrirFormularioCreacion() {
    this.modoEdicion = false;
    this.usuarioEditId = null;
    this.mensaje = '';
    this.error = '';
    this.usuarioForm.reset({ activo: true, password: '' });
    this.brigadas = [];
    this.mostrarFormulario = true;
  }

  abrirRolesLocal() {
    this.router.navigate(['/roles-local']);
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
      tipoBrigadaId: (usuario as any).tipoBrigadaId ?? null,
      codigoBrigada: (usuario as any).codigoBrigada ?? null,
    });

    if (this.esRolBrigada()) {
      this.cargarBrigadas(this.usuarioForm.value.tipoBrigadaId as number | null);
    }

    this.mostrarFormulario = true;
  }

  cancelarEdicion() {
    this.modoEdicion = false;
    this.usuarioEditId = null;
    this.usuarioForm.reset({ activo: true, password: '' });
    this.brigadas = [];
    this.error = '';
    this.mensaje = '';
    this.mostrarFormulario = false;
  }

  guardarUsuario() {
    if (this.usuarioForm.invalid) return;

    const nombre = this.usuarioForm.value.nombre?.toString().trim() || '';
    const correo = this.usuarioForm.value.correo?.toString().trim() || '';
    const password = this.usuarioForm.value.password?.toString() || '';
    const activo = !!this.usuarioForm.value.activo;
    const rolSeleccionado = this.usuarioForm.value.roles as number | null;
    const roles = rolSeleccionado ? [rolSeleccionado] : [];
    const rolesBackend = roles.filter((id) => id >= 0);
    const rolesLocales = roles.filter((id) => id < 0).map((id) => this.roles.find((rol) => rol.id === id)?.nombre).filter((nombre): nombre is string => !!nombre);

    // Validación condicional para usuarios de brigada
    const tipoBrigadaIdForValidation = this.usuarioForm.value.tipoBrigadaId as number | null;
    const codigoBrigadaForValidation = this.usuarioForm.value.codigoBrigada?.toString().trim() || '';
    const seleccionEsBrigada = !!rolSeleccionado && (this.roles.find(r => r.id === rolSeleccionado)?.nombre.toLowerCase().includes('brigad'));
    if (seleccionEsBrigada) {
      if (!tipoBrigadaIdForValidation) {
        this.error = 'Debe seleccionar el tipo de brigada';
        return;
      }
      if (!codigoBrigadaForValidation) {
        this.error = 'Debe ingresar el código de brigada';
        return;
      }
    }

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
      const actualizarBasico = () => {
        const payload: ActualizarUsuarioRequest = {
          nombre,
          correo,
          activo,
        };

        this.usuariosService.actualizarUsuario(this.usuarioEditId!, payload).subscribe({
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
      };

      const cambiarRoles = () => {
        this.usuariosService.actualizarRolesUsuario(this.usuarioEditId!, { roles: rolesBackend }).subscribe({
          next: (response) => {
            if (response.success) {
              this.mensaje = 'Roles actualizados correctamente';
              this.cargarUsuarios();
            }
          },
          error: (err) => {
            this.error = err.error?.message || 'No se pudieron actualizar los roles';
          },
        });
      };

      const cambiarPassword = () => {
        if (!password) return;

        this.usuariosService.actualizarPasswordUsuario(this.usuarioEditId!, { password }).subscribe({
          next: (response) => {
            if (response.success) {
              this.mensaje = 'Contraseña actualizada correctamente';
              this.cargarUsuarios();
            }
          },
          error: (err) => {
            this.error = err.error?.message || 'No se pudo actualizar la contraseña';
          },
        });
      };

      actualizarBasico();
      if (roles.length > 0) {
        cambiarRoles();
      }
      cambiarPassword();

      return;
    }

    const request: CrearUsuarioRequest = {
      nombre,
      correo,
      password,
      activo,
      roles: rolesBackend,
    };

    // Añadir campos de brigada si están presentes
    const tipoBrigadaId = this.usuarioForm.value.tipoBrigadaId as number | null;
    const codigoBrigada = this.usuarioForm.value.codigoBrigada?.toString().trim() || '';
    if (tipoBrigadaId) (request as any).tipoBrigadaId = tipoBrigadaId;
    if (codigoBrigada) (request as any).codigoBrigada = codigoBrigada;

    this.usuariosService.crearUsuario(request).subscribe({
      next: (response) => {
        if (response.success) {
          const usuarioCreado = response.data?.usuario;
          if (usuarioCreado) {
            this.rolesLocalService.guardarAsignacionesParaUsuario(usuarioCreado, rolesLocales);
          }
          const brigadaSeleccionada = this.usuarioForm.value.codigoBrigada?.toString().trim() || '';
          const brigada = this.brigadas.find((item) => item.numero === brigadaSeleccionada || item.id?.toString() === brigadaSeleccionada);

          if (seleccionEsBrigada && usuarioCreado?.id && brigada?.id) {
            this.usuariosService.agregarMiembroBrigada(brigada.id, { idUsuario: usuarioCreado.id }).subscribe({
              next: () => {
                this.mensaje = 'Usuario creado y asignado a la brigada correctamente';
              },
              error: () => {
                this.mensaje = 'Usuario creado, pero no se pudo asignar la brigada';
              },
              complete: () => {
                this.usuarioForm.reset({ activo: true, password: '' });
                this.brigadas = [];
                this.cargarUsuarios();
              },
            });
          } else {
            this.mensaje = 'Usuario creado correctamente';
            this.usuarioForm.reset({ activo: true, password: '' });
            this.brigadas = [];
            this.cargarUsuarios();
          }
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
          this.usuarios = this.usuarios.filter((usuario) => usuario.id !== id);
          this.mensaje = 'Usuario desactivado correctamente';
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'No se pudo desactivar el usuario';
      },
    });
  }

  eliminarUsuario(id: number) {
    if (!window.confirm('¿Seguro que deseas eliminar este usuario?')) {
      return;
    }

    this.error = '';
    this.mensaje = '';

    this.usuariosService.desactivarUsuario(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.usuarios = this.usuarios.filter((usuario) => usuario.id !== id);
          this.mensaje = 'Usuario eliminado correctamente';
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'No se pudo eliminar el usuario';
      },
    });
  }

}
