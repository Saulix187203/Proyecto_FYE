# Guia frontend - SISCA

Esta guia resume la organizacion del frontend Angular y complementa `FRONTEND_INTEGRATION.md`.

## Ubicacion

```text
frontend/
```

## Tecnologias

- Angular 20
- Angular Material
- TypeScript
- SCSS
- Chart.js
- ng2-charts
- RxJS

## Estructura principal

```text
frontend/src/app/
├── core/
│   ├── guards/
│   ├── interceptors/
│   ├── models/
│   └── services/
├── layout/
│   ├── components/
│   └── main-layout/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── casos/
│   ├── expedientes/
│   ├── acciones-correctivas/
│   ├── evidencias/
│   ├── notificaciones/
│   ├── usuarios/
│   └── roles/
├── shared/
└── app.routes.ts
```

## Configuracion de API

Archivo:

```text
frontend/src/environments/environment.ts
```

Valor local esperado:

```ts
export const environment = {
  production: true,
  apiUrl: 'http://localhost:3000/api',
};
```

Si el backend cambia de puerto, actualiza `apiUrl`.

## Autenticacion en frontend

El login consume:

```text
POST /api/auth/login
```

El token se conserva mediante `StorageService` y el usuario actual se expone desde `AuthService`.

## Interceptor JWT

Archivo:

```text
frontend/src/app/core/interceptors/auth.interceptor.ts
```

Responsabilidad:

- Leer el token actual.
- Agregar `Authorization: Bearer <token>` a peticiones contra `environment.apiUrl`.
- No modificar peticiones externas.
- No forzar `Content-Type`, para no romper cargas con `FormData`.

## Guards

Archivos:

```text
frontend/src/app/core/guards/auth.guard.ts
frontend/src/app/core/guards/role.guard.ts
```

Uso:

- `authGuard`: protege el layout `/app`.
- `roleGuard`: protege rutas por roles declarados en `data.roles`.

Si el usuario no cumple el rol, se redirige a `/acceso-denegado`.

## Menu lateral por roles

Archivo:

```text
frontend/src/app/layout/components/sidebar/sidebar.ts
```

El menu usa los nombres de roles del usuario autenticado. Las opciones de administracion:

- `/app/usuarios`
- `/app/roles`

solo se muestran para `Administrador`.

## Rutas principales

| Ruta | Descripcion |
|---|---|
| `/login` | Inicio de sesion |
| `/app/dashboard` | Indicadores del sistema |
| `/app/casos` | Bandeja de casos |
| `/app/casos/nuevo` | Formulario de nuevo caso |
| `/app/expedientes/:idCaso` | Expediente digital |
| `/app/acciones-correctivas` | Bandeja/gestion de acciones |
| `/app/evidencias` | Consulta y gestion de evidencias |
| `/app/notificaciones` | Centro de notificaciones |
| `/app/usuarios` | Administracion de usuarios |
| `/app/roles` | Administracion de roles |

## Modulos funcionales

- `auth`: login.
- `dashboard`: resumen y graficas.
- `casos`: bandeja y formulario de caso.
- `expedientes`: vista consolidada del expediente.
- `acciones-correctivas`: creacion y seguimiento de acciones.
- `evidencias`: carga y consulta de archivos.
- `notificaciones`: listado, resumen y lectura de avisos.
- `usuarios`: administracion de usuarios, roles y passwords.
- `roles`: administracion de roles y proteccion visual de roles base.

## Angular Material

Se usa Angular Material para:

- `mat-card`
- `mat-table`
- `mat-dialog`
- `mat-form-field`
- `mat-select`
- `mat-chip`
- `mat-button`
- `mat-icon`
- `mat-slide-toggle`
- `mat-progress-spinner`
- `mat-snack-bar`

## Chart.js y ng2-charts

El dashboard usa `Chart.js` y `ng2-charts` para graficas por estado, area y criticidad. La configuracion global se registra en `app.config.ts`.

## Buenas practicas del frontend

- No usar IDs fijos de roles o estados para decisiones de permisos.
- Comparar roles por nombre exacto.
- Usar `ApiResponse<T>` para tipar respuestas.
- Mostrar `error.error.message` cuando el backend rechace una operacion.
- Deshabilitar botones mientras una operacion esta en proceso.
- Recargar datos despues de transiciones importantes del workflow.
- Usar `FormData` para subir evidencias.
