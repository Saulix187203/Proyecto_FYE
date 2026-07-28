export interface Brigada {
  id: number;
  numero: string;
  nombre: string;
  activo: boolean;
  tipoBrigadaId: number;
  tipoBrigada?: { id: number; nombre: string };
  regionId: number;
  region?: { id: number; nombre: string; codigo?: string };
  departamentoId: number;
  departamento?: { id: number; nombre: string; codigo?: string };
  municipioId: number;
  municipio?: { id: number; nombre: string; codigo?: string };
  createdAt?: string;
  updatedAt?: string;
  _count?: { miembros: number };
}

export interface MiembroBrigada {
  id: number;
  brigadaId: number;
  usuarioId: number;
  usuario?: { id: number; nombre: string; correo: string };
  cargoEnBrigada: string;
  esLider: boolean;
  activo: boolean;
  fechaDesde: string;
  fechaHasta?: string;
  createdAt?: string;
  updatedAt?: string;
}