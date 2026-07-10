export interface Area {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface Proceso {
  id: number;
  nombre: string;
  activo: boolean;
  area: Area;
}

export interface TipoEvento {
  id: number;
  nombre: string;
}

export interface Criticidad {
  id: number;
  nombre: string;
}

export interface EstadoCaso {
  id: number;
  nombre: string;
}

export interface EstadoAccion {
  id: number;
  nombre: string;
}