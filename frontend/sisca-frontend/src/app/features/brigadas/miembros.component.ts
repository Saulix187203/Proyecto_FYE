import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BrigadasService, MiembroBrigada } from '../../core/services/brigadas.service';
import { UsuariosService } from '../../features/casos/services/usuarios.service';

@Component({
  selector: 'app-miembros',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
      <h2 style="margin:0;">👥 Miembros de Brigada</h2>
      <button (click)="volver()" style="padding:0.5rem 1.2rem; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer;">
        ← Volver a brigadas
      </button>
    </div>

    <div *ngIf="cargando">Cargando...</div>
    <div *ngIf="error" style="color:red; padding:1rem; background:#ffe6e6; border-radius:4px; margin:1rem 0;">{{ error }}</div>

    <!-- Formulario para agregar miembro -->
    <div style="background:#f8f9fa; padding:1rem; border-radius:4px; margin-bottom:1.5rem; border:1px solid #ced4da;">
      <h4 style="margin:0 0 0.8rem 0;">Agregar miembro</h4>
      <form [formGroup]="miembroForm" (ngSubmit)="agregarMiembro()" style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">
        <div>
          <label>Usuario</label>
          <select formControlName="idUsuario" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
            <option value="">Seleccionar</option>
            <option *ngFor="let u of usuarios" [value]="u.id">{{ u.nombre }}</option>
          </select>
        </div>
        <div>
          <label>Cargo</label>
          <input formControlName="cargoEnBrigada" placeholder="Ej. Integrante, Líder" style="width:100%; padding:0.5rem; border:1px solid #ced4da; border-radius:4px;">
        </div>
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <label>Es líder</label>
          <input formControlName="esLider" type="checkbox">
        </div>
        <div style="display:flex; align-items:end; gap:0.5rem;">
          <button type="submit" [disabled]="miembroForm.invalid || agregando" style="padding:0.4rem 1rem; background:#28a745; color:white; border:none; border-radius:4px; cursor:pointer;">
            {{ agregando ? 'Agregando...' : 'Agregar' }}
          </button>
          <div *ngIf="errorMiembro" style="color:red; font-size:0.9rem;">{{ errorMiembro }}</div>
        </div>
      </form>
    </div>

    <!-- Lista de miembros -->
    <div *ngIf="miembros.length === 0" style="color:#6c757d;">No hay miembros en esta brigada.</div>
    <table *ngIf="miembros.length > 0" style="width:100%; border-collapse:collapse;">
      <thead>
        <tr style="background:#f8f9fa;">
          <th style="border:1px solid #ddd; padding:0.5rem; text-align:left;">Usuario</th>
          <th style="border:1px solid #ddd; padding:0.5rem; text-align:left;">Cargo</th>
          <th style="border:1px solid #ddd; padding:0.5rem; text-align:left;">Líder</th>
          <th style="border:1px solid #ddd; padding:0.5rem; text-align:left;">Estado</th>
          <th style="border:1px solid #ddd; padding:0.5rem; text-align:left;">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let m of miembros">
          <td style="border:1px solid #ddd; padding:0.5rem;">{{ m.usuario?.nombre || 'N/A' }}</td>
          <td style="border:1px solid #ddd; padding:0.5rem;">{{ m.cargoEnBrigada }}</td>
          <td style="border:1px solid #ddd; padding:0.5rem;">{{ m.esLider ? 'Sí' : 'No' }}</td>
          <td style="border:1px solid #ddd; padding:0.5rem;">
            <span [style.color]="m.activo ? '#28a745' : '#dc3545'">{{ m.activo ? 'Activo' : 'Inactivo' }}</span>
          </td>
          <td style="border:1px solid #ddd; padding:0.5rem;">
            <button (click)="editarMiembro(m)" style="margin-right:0.3rem; padding:0.2rem 0.6rem; background:#ffc107; border:none; border-radius:4px; cursor:pointer;">Editar</button>
            <button *ngIf="m.activo" (click)="desactivarMiembro(m.id)" style="padding:0.2rem 0.6rem; background:#dc3545; color:white; border:none; border-radius:4px; cursor:pointer;">Desactivar</button>
          </td>
        </tr>
      </tbody>
    </table>
  `,
  styles: [`
    table th, table td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
    table tbody tr:hover { background: #f5f5f5; }
    input, select { border: 1px solid #ced4da; border-radius: 4px; box-sizing: border-box; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class MiembrosComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private brigadasService = inject(BrigadasService);
  private usuariosService = inject(UsuariosService);
  private fb = inject(FormBuilder);

  brigadaId!: number;
  miembros: MiembroBrigada[] = [];
  usuarios: any[] = [];
  cargando = true;
  error = '';
  agregando = false;
  errorMiembro = '';

  miembroForm = this.fb.group({
    idUsuario: ['', Validators.required],
    cargoEnBrigada: ['', Validators.required],
    esLider: [false],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID de brigada no proporcionado.';
      this.cargando = false;
      return;
    }
    this.brigadaId = +id;
    this.cargarMiembros();
    this.cargarUsuarios();
  }

  cargarMiembros(): void {
    this.cargando = true;
    this.brigadasService.listarMiembros(this.brigadaId).subscribe({
      next: (data) => {
        this.miembros = data;
        this.cargando = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al cargar miembros.';
        this.cargando = false;
      }
    });
  }

  cargarUsuarios(): void {
    this.usuariosService.getOpciones().subscribe({
      next: (data) => { this.usuarios = data || []; },
      error: () => { /* silencio */ }
    });
  }

  agregarMiembro(): void {
    if (this.miembroForm.invalid) {
      this.miembroForm.markAllAsTouched();
      return;
    }
    this.agregando = true;
    this.errorMiembro = '';
    const data = {
      idUsuario: +this.miembroForm.value.idUsuario!,
      cargoEnBrigada: this.miembroForm.value.cargoEnBrigada!,
      esLider: this.miembroForm.value.esLider || false,
      fechaDesde: new Date().toISOString(),
    };
    this.brigadasService.agregarMiembro(this.brigadaId, data).subscribe({
      next: () => {
        this.agregando = false;
        this.miembroForm.reset({ esLider: false });
        this.cargarMiembros();
      },
      error: (err) => {
        this.agregando = false;
        this.errorMiembro = err.error?.message || 'Error al agregar miembro.';
      }
    });
  }

  editarMiembro(miembro: MiembroBrigada): void {
    const nuevoCargo = prompt('Nuevo cargo:', miembro.cargoEnBrigada);
    if (nuevoCargo === null) return;
    const esLider = confirm('¿Marcar como líder? (Cancelar = No)');
    this.brigadasService.actualizarMiembro(this.brigadaId, miembro.id, {
      cargoEnBrigada: nuevoCargo,
      esLider: esLider,
    }).subscribe({
      next: () => { this.cargarMiembros(); },
      error: (err) => { alert(err.error?.message || 'Error al actualizar miembro.'); }
    });
  }

  desactivarMiembro(miembroId: number): void {
    if (!confirm('¿Desactivar este miembro?')) return;
    this.brigadasService.desactivarMiembro(this.brigadaId, miembroId).subscribe({
      next: () => { this.cargarMiembros(); },
      error: (err) => { alert(err.error?.message || 'Error al desactivar miembro.'); }
    });
  }

  volver(): void {
    this.router.navigate(['/brigadas']);
  }
}