# Guía de integración Frontend Angular — SISCA

Esta guía describe la integración del frontend Angular con la API REST de SISCA, disponible hasta la Fase 6.

## 1. Configuración base

URL base local:

```text
http://localhost:3000/api
```

Configuración sugerida en `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
};
```

El backend admite por defecto peticiones desde `http://localhost:4200`. Si Angular utiliza otro origen, debe agregarse a `CORS_ORIGIN` en el `.env` del backend.

## 2. Formato estándar de respuestas

Respuesta exitosa:

```json
{
  "success": true,
  "message": "Operación realizada correctamente",
  "data": {}
}
```

Respuesta de error:

```json
{
  "success": false,
  "message": "Descripción del error"
}
```

Códigos HTTP usados:

| Código | Significado |
|---|---|
| `200` | Consulta o actualización correcta |
| `201` | Recurso creado correctamente |
| `400` | Datos inválidos o transición de estado no permitida |
| `401` | Token ausente, inválido, vencido o usuario inactivo |
| `403` | Usuario autenticado sin el rol requerido |
| `404` | Recurso no encontrado o no perteneciente al usuario |
| `500` | Error interno del servidor |

El frontend debe usar el código HTTP como fuente principal y `message` para mostrar información al usuario.

## 3. Autenticación

### Login

```http
POST /auth/login
Content-Type: application/json
```

Body:

```json
{
  "correo": "admin@sisca.com",
  "password": "Admin123*"
}
```

Respuesta:

```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "usuario": {
      "id": 1,
      "nombre": "Administrador SISCA",
      "correo": "admin@sisca.com",
      "activo": true,
      "ultimoAcceso": "2026-07-03T12:00:00.000Z",
      "roles": [
        {
          "id": 1,
          "nombre": "Administrador"
        }
      ]
    },
    "token": "JWT_GENERADO_POR_EL_BACKEND"
  }
}
```

El token está en `response.data.token`. La contraseña y su hash nunca son devueltos.

### Usuario autenticado

```http
GET /auth/me
Authorization: Bearer <token>
```

Este endpoint debe usarse al restaurar una sesión para confirmar que el token continúa válido y obtener los roles actuales desde la base de datos.

### Enviar el JWT

Todas las rutas protegidas requieren:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

No se debe agregar `Bearer` al valor almacenado; debe agregarse únicamente al construir el header.

## 4. Roles existentes

Los nombres deben compararse exactamente como los devuelve el backend:

1. `Administrador`
2. `Brigada`
3. `PRL Contratista`
4. `Responsable del Proceso`
5. `SYMA`
6. `Gestión y Control SYMA`
7. `Gerencia`

El frontend puede ocultar o deshabilitar opciones según el rol, pero el backend siempre realiza la validación definitiva.

## 5. Flujo general del sistema

```text
Login
  ↓
Consultar catálogos
  ↓
Crear caso → Reportado
  ↓
Completar o actualizar reporte inicial
  ↓
Iniciar revisión → En revisión
  ├─ Aprobar → Aprobado
  ├─ Devolver → Devuelto → nueva revisión
  └─ Rechazar → Rechazado

Caso Aprobado
  ├─ Cerrar sin acciones → Cerrado
  └─ Crear acción correctiva → Con acciones
         ↓
     Pendiente → En proceso
         ↓
     Adjuntar evidencia
         ↓
     Enviar a validación → En validación
         ├─ Devolver → Devuelta → En proceso
         └─ Cerrar → Cerrada
                         ↓
          Todas las acciones cerradas
                         ↓
                Caso → En validación
                         ├─ Cierre formal → Cerrado
                         └─ Devolver cierre → Con acciones
```

Cada operación importante genera entradas en la bitácora. Los cierres y eventos relevantes de acciones también generan notificaciones.

## 6. Endpoints principales

Todos los paths se agregan a `http://localhost:3000/api`.

### Sistema y autenticación

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/health` | Estado del backend |
| `POST` | `/auth/login` | Iniciar sesión |
| `GET` | `/auth/me` | Obtener usuario autenticado |

### Usuarios y roles

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/roles` | Listar roles |
| `GET` | `/usuarios` | Listar usuarios; solo Administrador |
| `GET` | `/usuarios/:id` | Consultar usuario; solo Administrador |
| `POST` | `/usuarios` | Crear usuario; solo Administrador |
| `PUT` | `/usuarios/:id` | Actualizar usuario; solo Administrador |
| `DELETE` | `/usuarios/:id` | Desactivar usuario; solo Administrador |

### Catálogos

| Método | Endpoint |
|---|---|
| `GET` | `/catalogos/areas` |
| `GET` | `/catalogos/procesos` |
| `GET` | `/catalogos/tipos-evento` |
| `GET` | `/catalogos/criticidades` |
| `GET` | `/catalogos/estados-caso` |
| `GET` | `/catalogos/estados-accion` |

Solo se devuelven registros activos. En los procesos, el área se encuentra en `proceso.area`.

### Casos, reporte y expediente

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/casos` | Crear caso y correlativo automático |
| `GET` | `/casos` | Listar y filtrar casos |
| `GET` | `/casos/:id` | Consultar caso |
| `PUT` | `/casos/:id` | Actualizar datos básicos, no el estado |
| `POST` | `/reportes-iniciales` | Crear o actualizar reporte inicial |
| `GET` | `/reportes-iniciales/caso/:idCaso` | Consultar reporte inicial |
| `GET` | `/expedientes/:idCaso` | Consultar expediente consolidado |

Filtros de `GET /casos`:

```text
estado, area, criticidad, fechaDesde, fechaHasta, texto
```

`estado`, `area` y `criticidad` aceptan un id o un nombre.

### Validación de procedencia

| Método | Endpoint | Resultado |
|---|---|---|
| `POST` | `/validaciones-procedencia/:idCaso/iniciar-revision` | `En revisión` |
| `POST` | `/validaciones-procedencia/:idCaso/aprobar` | `Aprobado` |
| `POST` | `/validaciones-procedencia/:idCaso/devolver` | `Devuelto` |
| `POST` | `/validaciones-procedencia/:idCaso/rechazar` | `Rechazado` |
| `GET` | `/validaciones-procedencia/caso/:idCaso` | Historial de validaciones |

### Acciones correctivas

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/acciones-correctivas` | Crear y asignar acción |
| `GET` | `/acciones-correctivas/caso/:idCaso` | Acciones de un caso |
| `GET` | `/acciones-correctivas/:id` | Detalle de acción |
| `PUT` | `/acciones-correctivas/:id` | Actualizar acción no cerrada |
| `POST` | `/acciones-correctivas/:id/iniciar` | Pasar a `En proceso` |
| `POST` | `/acciones-correctivas/:id/enviar-validacion` | Pasar a `En validación` |
| `POST` | `/acciones-correctivas/:id/cerrar` | Pasar a `Cerrada` |
| `POST` | `/acciones-correctivas/:id/devolver` | Pasar a `Devuelta` |

Una acción necesita al menos una evidencia para enviarse a validación.

### Evidencias

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/evidencias/caso/:idCaso` | Subir evidencia del caso |
| `POST` | `/evidencias/accion/:idAccion` | Subir evidencia de la acción |
| `GET` | `/evidencias/caso/:idCaso` | Evidencias del caso |
| `GET` | `/evidencias/accion/:idAccion` | Evidencias de la acción |
| `GET` | `/evidencias/:id/descargar` | Descargar archivo |

Formatos permitidos: JPEG, PNG, WEBP y PDF. Tamaño máximo: 5 MB.

### Cierre formal

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/cierre-casos/:idCaso/cerrar` | Cerrar caso con acciones cerradas |
| `POST` | `/cierre-casos/:idCaso/cerrar-sin-acciones` | Cerrar caso aprobado sin acciones |
| `POST` | `/cierre-casos/:idCaso/devolver-cierre` | Regresar a `Con acciones` |

### Notificaciones

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/notificaciones` | Listar notificaciones propias |
| `GET` | `/notificaciones?leida=false` | Filtrar por lectura |
| `GET` | `/notificaciones/resumen` | Total y no leídas |
| `PUT` | `/notificaciones/:id/leida` | Marcar una como leída |
| `PUT` | `/notificaciones/marcar-todas-leidas` | Marcar todas como leídas |

### Dashboard

Requiere uno de estos roles: Administrador, SYMA, Gestión y Control SYMA o Gerencia.

| Método | Endpoint |
|---|---|
| `GET` | `/dashboard/resumen` |
| `GET` | `/dashboard/casos-por-estado` |
| `GET` | `/dashboard/casos-por-area` |
| `GET` | `/dashboard/casos-por-criticidad` |
| `GET` | `/dashboard/acciones-vencidas` |
| `GET` | `/dashboard/ultimos-casos?limit=10` |

`limit` acepta valores entre 1 y 100.

## 7. Ejemplos de payloads

### Crear caso

```http
POST /casos
```

```json
{
  "idArea": 1,
  "idProceso": 1,
  "idTipoEvento": 1,
  "idCriticidad": 1,
  "fechaEvento": "2026-07-03T08:00:00.000Z",
  "lugar": "Bodega principal",
  "descripcion": "Se observó una condición insegura cerca del área de carga."
}
```

`titulo` es opcional. Si no se envía, se genera desde la descripción. El backend genera un correlativo como `SISCA-2026-000001`.

### Aprobar caso

```http
POST /validaciones-procedencia/1/aprobar
```

```json
{
  "observaciones": "El caso procede como casi-accidente."
}
```

El caso debe estar previamente en `En revisión`.

### Crear acción correctiva

```http
POST /acciones-correctivas
```

```json
{
  "idCaso": 1,
  "descripcion": "Colocar señalización permanente en el área de carga.",
  "idResponsable": 2,
  "fechaCompromiso": "2026-07-10T18:00:00.000Z"
}
```

El caso debe estar `Aprobado` o `Con acciones`.

### Subir evidencia

Las evidencias **no se envían como JSON**. El contenido conceptual es:

```json
{
  "archivo": "<File>",
  "descripcion": "Evidencia de ejecución de la acción"
}
```

Implementación Angular:

```ts
subirEvidenciaAccion(idAccion: number, archivo: File, descripcion?: string) {
  const formData = new FormData();
  formData.append('archivo', archivo);

  if (descripcion) {
    formData.append('descripcion', descripcion);
  }

  return this.http.post<ApiResponse<{ evidencia: Evidencia }>>(
    `${environment.apiUrl}/evidencias/accion/${idAccion}`,
    formData,
  );
}
```

No se debe definir manualmente `Content-Type`; el navegador agregará el boundary de `multipart/form-data`.

### Consultar dashboard

```http
GET /dashboard/resumen
```

Respuesta:

```json
{
  "success": true,
  "message": "Resumen del dashboard obtenido correctamente",
  "data": {
    "totalCasos": 25,
    "casosAbiertos": 17,
    "casosCerrados": 8,
    "casosEnRevision": 3,
    "accionesPendientes": 5,
    "accionesVencidas": 2,
    "accionesEnValidacion": 4
  }
}
```

## 8. Recomendaciones para Angular

### Modelo genérico de respuesta

```ts
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
}
```

### Interceptor JWT

Centraliza el header de autorización. No agregues JWT al login ni a rutas externas.

```ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (!token || !req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
```

Regístralo en la configuración de la aplicación:

```ts
provideHttpClient(withInterceptors([authInterceptor]));
```

El interceptor no debe establecer globalmente `Content-Type`, porque rompería las cargas con `FormData`.

### Manejo de sesión

- Guarda juntos el token y los datos mínimos del usuario.
- Al recargar la aplicación, llama a `GET /auth/me`.
- Si cualquier petición responde `401`, limpia la sesión y redirige a login.
- Un `403` no debe cerrar la sesión; muestra una pantalla o mensaje de acceso denegado.
- Para un prototipo puede utilizarse `localStorage`. En producción debe reducirse el riesgo XSS y evaluarse una estrategia de almacenamiento más segura.

### Guards

Se recomiendan dos guards:

1. `authGuard`: comprueba que exista una sesión válida.
2. `roleGuard`: compara los roles requeridos por la ruta con `usuario.roles[].nombre`.

Ejemplo de rutas:

```ts
{
  path: 'dashboard',
  canActivate: [authGuard, roleGuard],
  data: {
    roles: ['Administrador', 'SYMA', 'Gestión y Control SYMA', 'Gerencia'],
  },
  loadComponent: () => import('./dashboard/dashboard.component'),
}
```

Los guards mejoran la experiencia, pero no sustituyen la autorización del backend.

### Servicios por módulo

Estructura sugerida:

```text
core/
  interceptors/auth.interceptor.ts
  guards/auth.guard.ts
  guards/role.guard.ts
  services/auth.service.ts
  models/api-response.model.ts

features/
  usuarios/services/usuarios.service.ts
  catalogos/services/catalogos.service.ts
  casos/services/casos.service.ts
  reportes/services/reportes-iniciales.service.ts
  validaciones/services/validaciones-procedencia.service.ts
  acciones/services/acciones-correctivas.service.ts
  evidencias/services/evidencias.service.ts
  cierre/services/cierre-casos.service.ts
  notificaciones/services/notificaciones.service.ts
  dashboard/services/dashboard.service.ts
```

Evita un único servicio gigante para toda la API. Cada servicio debe encapsular sus endpoints y tipos de request/response.

### Estados y roles

- Usa los nombres devueltos por los catálogos; no fijes ids en el frontend.
- Conserva los ids únicamente para relaciones y payloads.
- Define constantes o tipos para nombres de roles y estados, evitando strings repetidos por toda la aplicación.
- Después de una transición, usa el caso devuelto por el backend o vuelve a consultar el expediente; no asumas localmente el nuevo estado.

### Errores y formularios

- Muestra `error.error.message` cuando esté disponible.
- Asocia errores `400` a validaciones del formulario o reglas de workflow.
- Para `404`, permite regresar al listado correspondiente.
- Deshabilita botones mientras una petición esté activa para evitar operaciones duplicadas.
- Envía fechas en ISO 8601 mediante `date.toISOString()`.

### Descarga de evidencias

La descarga devuelve contenido binario, no `ApiResponse<T>`:

```ts
descargarEvidencia(id: number) {
  return this.http.get(
    `${environment.apiUrl}/evidencias/${id}/descargar`,
    { responseType: 'blob', observe: 'response' },
  );
}
```

Usa `Content-Disposition` para obtener el nombre sugerido o conserva `nombreOriginal` desde el listado de evidencias.

## 9. Orden sugerido de implementación frontend

1. Configuración de entorno, modelos base e interceptor.
2. Login, restauración de sesión y guards.
3. Catálogos reutilizables.
4. Listado, creación y detalle de casos.
5. Expediente y reporte inicial.
6. Validación de procedencia.
7. Acciones correctivas y evidencias.
8. Cierre formal.
9. Notificaciones.
10. Dashboard.
