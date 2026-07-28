import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RolesLocalService, CustomRole, FuncionalidadOption } from '../../core/services/roles-local.service';
import { UsuariosService } from './usuarios.service';

@Component({
  selector: 'app-roles-local',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section style="max-width:980px; margin:0 auto; display:grid; gap:1rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:1rem; flex-wrap:wrap;">
        <div>
          <h1 style="margin:0 0 0.25rem;">Roles personalizados</h1>
          <p style="margin:0; color:#6c757d;">Crea roles nuevos y selecciona las funcionalidades que quieres habilitar. Esto funciona solo en el frontend.</p>
        </div>
        <button type="button" (click)="abrirFormulario()" style="padding:0.7rem 1rem; background:#28a745; color:white; border:none; border-radius:6px; cursor:pointer;">Crear rol</button>
      </div>

      <div *ngIf="mensaje" style="padding:0.8rem 1rem; background:#e8f5e9; color:#2e7d32; border-radius:6px;">{{ mensaje }}</div>
      <div *ngIf="error" style="padding:0.8rem 1rem; background:#ffebee; color:#c62828; border-radius:6px;">{{ error }}</div>

      <article style="border:1px solid #dee2e6; border-radius:10px; padding:1rem; background:#fff;">
        <div style="display:grid; gap:0.75rem;">
          <div *ngFor="let rol of roles" style="border:1px solid #e9ecef; border-radius:8px; padding:0.9rem 1rem; background:#fafafa;">
            <div style="display:flex; justify-content:space-between; gap:1rem; flex-wrap:wrap; align-items:center;">
              <div>
                <h3 style="margin:0 0 0.25rem;">{{ rol.nombre }}</h3>
                <p style="margin:0; color:#6c757d;">{{ rol.descripcion || 'Sin descripción' }}</p>
              </div>
              <button type="button" (click)="eliminarRol(rol.id)" style="padding:0.5rem 0.8rem; background:#dc3545; color:white; border:none; border-radius:6px; cursor:pointer;">Eliminar</button>
            </div>
            <div style="margin-top:0.75rem; display:flex; flex-wrap:wrap; gap:0.45rem;">
              <span *ngFor="let funcionalidad of rol.funcionalidades" style="padding:0.35rem 0.6rem; background:#e9f2ff; color:#0d6efd; border-radius:999px; font-size:0.9rem;">{{ getLabelFuncionalidad(funcionalidad) }}</span>
            </div>
          </div>

          <div *ngIf="!roles.length" style="padding:1rem; border:1px dashed #ced4da; border-radius:8px; color:#6c757d; text-align:center;">
            Aún no hay roles personalizados.
          </div>
        </div>
      </article>

      <div *ngIf="mostrarFormulario" style="position:fixed; inset:0; background:rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; padding:1rem; z-index:1200;">
        <div style="width:min(100%, 720px); background:#fff; border-radius:10px; padding:1.25rem; box-shadow:0 12px 35px rgba(0,0,0,0.2);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h2 style="margin:0;">Crear rol personalizado</h2>
            <button type="button" (click)="cerrarFormulario()" style="border:none; background:transparent; font-size:1.2rem; cursor:pointer;">✕</button>
          </div>

          <form [formGroup]="rolForm" (ngSubmit)="guardarRol()" style="display:grid; gap:1rem;">
            <label>
              Nombre del rol
              <input formControlName="nombre" type="text" style="width:100%; padding:0.6rem; border:1px solid #ccc; border-radius:6px; box-sizing:border-box;" />
            </label>
            <label>
              Descripción
              <textarea formControlName="descripcion" rows="3" style="width:100%; padding:0.6rem; border:1px solid #ccc; border-radius:6px; box-sizing:border-box;"></textarea>
            </label>

            <div>
              <h3 style="margin:0 0 0.5rem;">Funcionalidades disponibles</h3>
              <div style="display:grid; gap:0.5rem;">
                <label *ngFor="let opcion of funcionalidades" style="display:flex; align-items:flex-start; gap:0.6rem; padding:0.7rem; border:1px solid #dee2e6; border-radius:6px; cursor:pointer; background:#fcfcfd;">
                  <input type="checkbox" [checked]="estaSeleccionada(opcion.key)" (change)="toggleFuncionalidad(opcion.key)" />
                  <span>
                    <strong>{{ opcion.label }}</strong><br />
                    <small style="color:#6c757d;">{{ opcion.descripcion }}</small>
                  </span>
                </label>
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:0.75rem; flex-wrap:wrap;">
              <button type="button" (click)="cerrarFormulario()" style="padding:0.7rem 1rem; background:#6c757d; color:white; border:none; border-radius:6px; cursor:pointer;">Cancelar</button>
              <button type="submit" [disabled]="rolForm.invalid" style="padding:0.7rem 1rem; background:#007bff; color:white; border:none; border-radius:6px; cursor:pointer;">Guardar rol</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  `,
})
export class RolesLocalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly rolesLocalService = inject(RolesLocalService);
  private readonly usuariosService = inject(UsuariosService);

  roles: CustomRole[] = [];
  funcionalidades: FuncionalidadOption[] = [];
  mensaje = '';
  error = '';
  mostrarFormulario = false;
  funcionalidadesSeleccionadas: string[] = [];

  rolForm = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: [''],
  });

  ngOnInit(): void {
    this.funcionalidades = this.rolesLocalService.getFunctionalidades();
    this.cargarRoles();
  }

  abrirFormulario(): void {
    this.error = '';
    this.mensaje = '';
    this.funcionalidadesSeleccionadas = [];
    this.rolForm.reset({ nombre: '', descripcion: '' });
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.rolForm.reset({ nombre: '', descripcion: '' });
    this.funcionalidadesSeleccionadas = [];
  }

  cargarRoles(): void {
    this.usuariosService.listarRoles().subscribe({
      next: (response) => {
        if (response.success) {
          this.roles = (response.data?.roles ?? []).map((rol) => ({
            id: rol.id,
            nombre: rol.nombre,
            descripcion: '',
            funcionalidades: [],
            creadoEn: new Date().toISOString(),
          }));
        }
      },
      error: () => {
        this.roles = this.rolesLocalService.listarRoles();
      },
    });
  }

  estaSeleccionada(key: string): boolean {
    return this.funcionalidadesSeleccionadas.includes(key);
  }

  toggleFuncionalidad(key: string): void {
    if (this.estaSeleccionada(key)) {
      this.funcionalidadesSeleccionadas = this.funcionalidadesSeleccionadas.filter((item) => item !== key);
      return;
    }
    this.funcionalidadesSeleccionadas = [...this.funcionalidadesSeleccionadas, key];
  }

  guardarRol(): void {
    if (this.rolForm.invalid) {
      this.error = 'El nombre del rol es obligatorio';
      return;
    }

    const nombre = this.rolForm.value.nombre?.toString().trim() || '';
    const descripcion = this.rolForm.value.descripcion?.toString().trim() || '';

    if (!nombre) {
      this.error = 'El nombre del rol es obligatorio';
      return;
    }

    this.usuariosService.crearRol({ nombre, descripcion }).subscribe({
      next: (response) => {
        if (response.success) {
          const rolCreado = response.data?.rol;
          if (rolCreado) {
            this.rolesLocalService.crearRol(rolCreado.nombre, rolCreado.descripcion ?? '', this.funcionalidadesSeleccionadas);
          }
          this.mensaje = `Rol creado correctamente: ${nombre}`;
          this.cargarRoles();
          this.cerrarFormulario();
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'No se pudo crear el rol';
      },
    });
  }

  eliminarRol(id: number): void {
    if (!window.confirm('¿Seguro que deseas eliminar este rol personalizado?')) {
      return;
    }

    this.usuariosService.eliminarRol(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.rolesLocalService.eliminarRol(id);
          this.mensaje = 'Rol eliminado correctamente';
          this.cargarRoles();
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'No se pudo eliminar el rol';
      },
    });
  }

  getLabelFuncionalidad(key: string): string {
    return this.funcionalidades.find((item) => item.key === key)?.label ?? key;
  }
}
