export interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha: string;
  enlace?: string;
  usuario: { id: number };
}

export interface ResumenNotificaciones {
  total: number;
  noLeidas: number;
}