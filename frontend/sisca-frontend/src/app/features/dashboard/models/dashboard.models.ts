export interface DashboardResumen {
  totalCasos: number;
  casosAbiertos: number;
  casosCerrados: number;
  casosEnRevision: number;
  accionesPendientes: number;
  accionesVencidas: number;
  accionesEnValidacion: number;
}

export interface DashboardCatalogItem {
  id: number;
  nombre: string;
  color?: string;
}

export interface DashboardChartItem {
  estado?: DashboardCatalogItem;
  area?: DashboardCatalogItem;
  criticidad?: DashboardCatalogItem;
  total: number;
}

export interface DashboardChartResponse {
  items: DashboardChartItem[];
}

export interface DashboardAccionVencida {
  id: number;
  descripcion: string;
  fechaCompromiso: string;
  responsable?: {
    id: number;
    nombre: string;
    correo?: string;
  } | null;
  estado?: {
    id: number;
    nombre: string;
  } | null;
  caso?: {
    id: number;
    correlativo?: string;
    titulo?: string;
  } | null;
}

export interface DashboardAccionesResponse {
  acciones: DashboardAccionVencida[];
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export interface DashboardCasoReciente {
  id: number;
  correlativo: string;
  fechaReporte: string;
  estado?: {
    id: number;
    nombre: string;
  } | null;
  area?: {
    id: number;
    nombre: string;
  } | null;
  criticidad?: {
    id: number;
    nombre: string;
    color?: string;
  } | null;
  usuarioReporta?: {
    id: number;
    nombre: string;
    correo?: string;
  } | null;
}

export interface DashboardCasosResponse {
  casos: DashboardCasoReciente[];
}

export interface DashboardChartData {
  labels: string[];
  datasets: Array<{
    label?: string;
    data: number[];
    backgroundColor?: string | string[];
  }>;
}
