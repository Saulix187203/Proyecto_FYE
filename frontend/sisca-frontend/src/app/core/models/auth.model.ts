export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  activo: boolean;
  ultimoAcceso: string;
  roles?: Rol[] | null;
}

export interface Rol {
  id: number;
  nombre: string;
}

export interface LoginRequest {
  correo: string;
  password: string;
}

export interface LoginResponse {
  usuario: Usuario;
  token: string;
}