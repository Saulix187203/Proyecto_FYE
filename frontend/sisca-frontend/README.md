# README técnico - Sisca Frontend

## Resumen del Frontend

### Estado actual
- [x] Módulos completados
- [x] Funcionalidades implementadas
- [x] Bugs conocidos / puntos delicados identificados

Este frontend corresponde a la interfaz web del sistema SISCA para la gestión de casos, acciones correctivas, validaciones, evidencias, notificaciones y dashboard ejecutivo. Está desarrollado con Angular 20 y está pensado para integrarse con el backend Node.js/Express del mismo proyecto.

## Estructura del proyecto

```text
src/
  app/
    app.routes.ts              # Rutas principales y guards de acceso
    app.config.ts              # Configuración global de la aplicación
    core/
      guards/                  # AuthGuard y RoleGuard
      interceptors/           # Interceptores HTTP (autenticación)
      models/                  # Modelos compartidos del dominio
      services/                # Servicios transversales
    features/
      auth/                    # Login y autenticación
      dashboard/               # Panel principal y métricas
      notificaciones/          # Gestión de notificaciones
      casos/                   # Módulo completo de casos, expediente y acciones
      usuarios/                # Gestión de usuarios
    environments/
      environment.ts          # Configuración de desarrollo
      environment.prod.ts     # Configuración de producción
  public/                      # Recursos estáticos
```

## Tecnologías stack

- Framework: Angular 20
- Lenguaje: TypeScript
- Estilos: SCSS + Bootstrap 5
- UI: Bootstrap Icons
- Gráficos: Chart.js + ng2-charts
- Manejo de datos asíncronos: RxJS
- Herramientas: Angular CLI, Karma/Jasmine para pruebas

## Guía rápida de desarrollo

### Comandos disponibles

Desde la carpeta del frontend:

```bash
npm install
npm start
npm run build
npm run watch
npm test
```

### Cómo correr en desarrollo

```bash
cd frontend/sisca-frontend
npm install
npm start
```

La aplicación queda disponible en:

```text
http://localhost:4200/
```

### Cómo construir para producción

```bash
cd frontend/sisca-frontend
npm run build
```

Los artefactos generados se almacenan en la carpeta `dist/`.

## Decisiones de diseño importantes

- Arquitectura por módulos y features: cada dominio del negocio vive en su carpeta bajo `src/app/features`.
- Separación entre `core` y `features`: el directorio `core` agrupa servicios, guards e interceptores reutilizables.
- Rutas protegidas: la navegación se controla con guards de autenticación y roles.
- Integración con backend mediante servicios HTTP centralizados, evitando lógica duplicada en componentes.
- Configuración por entorno: los endpoints del backend se definen en `environment.ts` y `environment.prod.ts`.
- Uso de interceptores para adjuntar el token JWT a las solicitudes del backend.

## Dependencias críticas

Las siguientes dependencias merecen atención al hacer mantenimiento o actualizaciones:

- `@angular/core` y `@angular/cli` (versionado principal de la aplicación)
- `rxjs` para el manejo de streams y peticiones asíncronas
- `bootstrap` y `@popperjs/core` para el layout y componentes visuales
- `chart.js` y `ng2-charts` para los dashboards
- `sass` por el uso de estilos personalizados

## Áreas de mejora identificadas

- Agregar pruebas unitarias reales para módulos críticos como casos, auth y dashboard.
- Consolidar un manejo de errores más uniforme entre servicios y componentes.
- Revisar el uso de `environment.prod.ts` y dejar configurada la URL real de producción.
- Mejorar estados de carga, vacío y errores en formularios y listas.
- Evaluar la posibilidad de centralizar modelos de respuesta y mapeos de API.
- Revisar componentes grandes para dividirlos en subcomponentes reutilizables.

## Puntos de integración con backend

El frontend consume el backend a través de servicios REST. Los puntos más importantes son:

- Autenticación:
  - `POST /api/auth/login`
  - uso de token JWT en el header `Authorization`
- Casos:
  - `GET /api/casos`
  - `POST /api/casos`
  - `GET /api/casos/:id`
  - `PUT /api/casos/:id`
- Acciones correctivas:
  - `GET /api/acciones-correctivas/caso/:idCaso`
  - `POST /api/acciones-correctivas`
- Evidencias:
  - `POST /api/evidencias/caso/:idCaso`
  - `GET /api/evidencias/caso/:idCaso`
- Validaciones de procedencia:
  - `POST /api/validaciones-procedencia/:idCaso/iniciar-revision`
- Dashboard:
  - `GET /api/dashboard/resumen`
  - `GET /api/dashboard/casos-por-estado`
- Notificaciones:
  - `GET /api/notificaciones`
  - `PUT /api/notificaciones/:id/leida`

La base URL por defecto para desarrollo es:

```ts
http://localhost:3000/api
```

## Cómo contribuir

- Mantener la estructura por features y no mezclar lógica de negocio en componentes.
- Preferir servicios para comunicación HTTP y reutilización de lógica.
- Usar nombres descriptivos para componentes, servicios y modelos.
- Antes de enviar cambios, validar con:

```bash
npm run build
npm test
```

- Documentar cambios de rutas, integraciones con backend y decisiones de diseño cuando afecten al flujo del sistema.
