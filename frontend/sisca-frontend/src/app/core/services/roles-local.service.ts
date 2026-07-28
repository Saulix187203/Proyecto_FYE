import { Injectable } from '@angular/core';
import { Rol } from '../models/auth.model';

export interface CustomRole {
  id: number;
  nombre: string;
  descripcion: string;
  funcionalidades: string[];
  creadoEn: string;
}

export interface FuncionalidadOption {
  key: string;
  label: string;
  descripcion: string;
}

@Injectable({ providedIn: 'root' })
export class RolesLocalService {
  private readonly STORAGE_KEY = 'sisca_custom_roles';
  private readonly ASSIGNMENTS_KEY = 'sisca_custom_role_assignments';
  private readonly DB_NAME = 'sisca-frontend-db';
  private readonly DB_VERSION = 1;
  private readonly ROLES_STORE = 'custom_roles';
  private readonly ASSIGNMENTS_STORE = 'custom_role_assignments';
  private dbPromise: Promise<IDBDatabase> | null = null;

  private readonly funcionalidadesBase: FuncionalidadOption[] = [
    { key: 'dashboard', label: 'Dashboard', descripcion: 'Ver el tablero principal' },
    { key: 'casos', label: 'Casos', descripcion: 'Acceder a casos y gestión de incidentes' },
    { key: 'notificaciones', label: 'Notificaciones', descripcion: 'Gestionar notificaciones' },
    { key: 'perfil', label: 'Perfil', descripcion: 'Editar el perfil propio' },
    { key: 'usuarios', label: 'Usuarios', descripcion: 'Administrar usuarios' },
    { key: 'roles', label: 'Roles', descripcion: 'Crear y administrar roles personalizados' },
  ];

  getFunctionalidades(): FuncionalidadOption[] {
    return this.funcionalidadesBase;
  }

  listarRoles(): CustomRole[] {
    return this.leerRolesDesdeStorage();
  }

  crearRol(nombre: string, descripcion: string, funcionalidades: string[]): CustomRole {
    const roles = this.leerRolesDesdeStorage();
    const rol: CustomRole = {
      id: Date.now(),
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      funcionalidades: funcionalidades.filter(Boolean),
      creadoEn: new Date().toISOString(),
    };

    roles.push(rol);
    this.guardarRoles(roles);
    return rol;
  }

  eliminarRol(id: number): void {
    const roles = this.leerRolesDesdeStorage().filter((rol) => rol.id !== id);
    this.guardarRoles(roles);
  }

  asignarRolAlUsuario(nombreRol: string, activo: boolean): void {
    const usuario = this.obtenerUsuarioActual();
    if (!usuario) return;

    const asignaciones = this.leerAsignacionesDesdeStorage();
    const clave = this.claveParaUsuario(usuario);
    const actual = asignaciones[clave] || { usuario: this.resumenUsuario(usuario), roles: [] };

    const roles = actual.roles.filter((rol) => rol !== nombreRol);
    if (activo) roles.push(nombreRol);

    actual.roles = roles;
    asignaciones[clave] = actual;
    this.escribirAsignacionesEnStorage(asignaciones);
  }

  guardarAsignacionesParaUsuario(usuario: { id?: number; correo?: string; nombre?: string } | null, roles: string[]): void {
    if (!usuario) return;

    const asignaciones = this.leerAsignacionesDesdeStorage();
    const clave = this.claveParaUsuario(usuario);
    const rolesUnicos = [...new Set(roles.filter(Boolean))];

    asignaciones[clave] = {
      usuario: this.resumenUsuario(usuario),
      roles: rolesUnicos,
    };

    this.escribirAsignacionesEnStorage(asignaciones);
  }

  obtenerRolesDeUsuario(usuario: { id?: number; correo?: string; nombre?: string } | null): string[] {
    if (!usuario) return [];

    const asignaciones = this.leerAsignacionesDesdeStorage();
    const clave = this.claveParaUsuario(usuario);
    return asignaciones[clave]?.roles ?? [];
  }

  listarRolesComoModelo(): Rol[] {
    return this.listarRoles().map((rol) => ({
      id: -(rol.id),
      nombre: rol.nombre,
    }));
  }

  hasRoleForCurrentUser(nombreRol: string): boolean {
    return this.rolesAsignadosAlUsuario().includes(nombreRol);
  }

  hasPermissionForCurrentUser(permission: string): boolean {
    const rolesAsignados = this.rolesAsignadosAlUsuario();
    const roles = this.leerRolesDesdeStorage().filter((rol) => rolesAsignados.includes(rol.nombre));
    return roles.some((rol) => rol.funcionalidades.includes(permission));
  }

  rolesAsignadosAlUsuario(): string[] {
    const usuario = this.obtenerUsuarioActual();
    if (!usuario) return [];

    const asignaciones = this.leerAsignacionesDesdeStorage();
    const clave = this.claveParaUsuario(usuario);
    return asignaciones[clave]?.roles ?? [];
  }

  private leerRolesDesdeStorage(): CustomRole[] {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return [];

    try {
      return JSON.parse(raw) as CustomRole[];
    } catch {
      return [];
    }
  }

  private guardarRoles(roles: CustomRole[]): void {
    this.escribirRolesEnStorage(roles);
  }

  private leerAsignacionesDesdeStorage(): Record<string, { usuario: string; roles: string[] }> {
    const raw = localStorage.getItem(this.ASSIGNMENTS_KEY);
    if (!raw) return {};

    try {
      return JSON.parse(raw) as Record<string, { usuario: string; roles: string[] }>;
    } catch {
      return {};
    }
  }

  private escribirRolesEnStorage(roles: CustomRole[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(roles));
    void this.guardarRolesEnIndexedDb(roles);
  }

  private escribirAsignacionesEnStorage(asignaciones: Record<string, { usuario: string; roles: string[] }>): void {
    localStorage.setItem(this.ASSIGNMENTS_KEY, JSON.stringify(asignaciones));
    void this.guardarAsignacionesEnIndexedDb(asignaciones);
  }

  private async guardarRolesEnIndexedDb(roles: CustomRole[]): Promise<void> {
    const db = await this.openDb();
    const transaction = db.transaction(this.ROLES_STORE, 'readwrite');
    const store = transaction.objectStore(this.ROLES_STORE);
    store.clear();
    roles.forEach((rol) => store.put({ ...rol, id: rol.id.toString() }));
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  private async guardarAsignacionesEnIndexedDb(asignaciones: Record<string, { usuario: string; roles: string[] }>): Promise<void> {
    const db = await this.openDb();
    const transaction = db.transaction(this.ASSIGNMENTS_STORE, 'readwrite');
    const store = transaction.objectStore(this.ASSIGNMENTS_STORE);
    store.clear();
    Object.entries(asignaciones).forEach(([clave, value]) => {
      store.put({ key: clave, ...value });
    });
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  private openDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.ROLES_STORE)) {
          db.createObjectStore(this.ROLES_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(this.ASSIGNMENTS_STORE)) {
          db.createObjectStore(this.ASSIGNMENTS_STORE, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  private obtenerUsuarioActual(): { id?: number; correo?: string; nombre?: string } | null {
    const raw = localStorage.getItem('user_data');
    if (!raw) return null;

    try {
      const usuario = JSON.parse(raw);
      return {
        id: usuario?.id,
        correo: usuario?.correo,
        nombre: usuario?.nombre,
      };
    } catch {
      return null;
    }
  }

  private claveParaUsuario(usuario: { id?: number; correo?: string; nombre?: string }): string {
    if (usuario.id) return `user:${usuario.id}`;
    if (usuario.correo) return `email:${usuario.correo}`;
    return `name:${usuario.nombre ?? 'anon'}`;
  }

  private resumenUsuario(usuario: { id?: number; correo?: string; nombre?: string }): string {
    return [usuario.nombre, usuario.correo].filter(Boolean).join(' - ');
  }
}
