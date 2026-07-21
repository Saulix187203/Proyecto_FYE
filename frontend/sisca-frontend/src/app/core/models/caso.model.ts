import { Area, Proceso, TipoEvento, Criticidad, EstadoCaso, EstadoAccion } from './catalogo.model';
import { Usuario } from './auth.model';

export interface Caso {
  id: number;
  correlativo: string;
  titulo: string;
  descripcion: string;
  lugar: string;
  fechaEvento: string;
  fechaCreacion: string;
  area: Area | null;
  proceso: Proceso | null;
  tipoEvento: TipoEvento | null;
  criticidad: Criticidad | null;
  estado: EstadoCaso | null;
  creadoPor: Usuario | null;
}

export interface ReporteInicial {
  id: number;
  descripcionDetallada: string;
  condicionDetectada: string;
  accionInmediata: string;
  observaciones: string;
  caso: { id: number };
}

export interface ValidacionProcedencia {
  id: number;
  estadoAnterior: string;
  estadoNuevo: string;
  observaciones: string;
  fecha: string;
  usuario: Usuario;
}

export interface AccionCorrectiva {
  id: number;
  descripcion: string;
  observaciones?: string;
  fechaCompromiso: string;
  fechaCreacion: string;
  fechaCierre?: string;
  estado: EstadoAccion;
  responsable: Usuario;
  caso: { id: number };
  evidencias: Evidencia[];
}

export interface Evidencia {
  id: number;
  nombreOriginal: string;
  descripcion: string;
  tipoMime: string;
  tamaño: number;
  fechaSubida: string;
  subidoPor: Usuario;
}

export interface Comentario {
  id: number;
  contenido: string;
  fecha: string;
  usuario: Usuario;
}

export interface BitacoraEvento {
  id: number;
  tipo: string;
  descripcion: string;
  fecha: string;
  usuario: Usuario;
  metadata?: any;
}

export interface Expediente {
  caso: Caso;
  reporteInicial: ReporteInicial | null;
  validaciones: ValidacionProcedencia[];
  acciones: AccionCorrectiva[];
  evidencias: Evidencia[];
  comentarios: Comentario[];
  bitacora: BitacoraEvento[];
}