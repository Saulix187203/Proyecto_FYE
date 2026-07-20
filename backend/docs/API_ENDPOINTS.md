# API Endpoints - SISCA

Base local:

```text
http://localhost:3000/api
```

Formato exitoso estandar:

```json
{
  "success": true,
  "message": "Operacion realizada correctamente",
  "data": {}
}
```

Las rutas protegidas requieren:

```text
Authorization: Bearer <token>
```

## Health

Modulo de verificacion basica del backend.

| Metodo | Ruta | Token | Roles |
|---|---|---|---|
| GET | `/api/health` | No | Publico |

## Auth

Modulo de autenticacion y sesion.

| Metodo | Ruta | Token | Roles |
|---|---|---|---|
| POST | `/api/auth/login` | No | Publico |
| GET | `/api/auth/me` | Si | Usuario autenticado |

Body para login:

```json
{
  "correo": "admin@sisca.com",
  "password": "Admin123*"
}
```

## Usuarios

Administracion de usuarios. Todo el modulo requiere rol `Administrador`.

| Metodo | Ruta | Token | Roles |
|---|---|---|---|
| GET | `/api/usuarios` | Si | Administrador |
| GET | `/api/usuarios/:id` | Si | Administrador |
| POST | `/api/usuarios` | Si | Administrador |
| PUT | `/api/usuarios/:id` | Si | Administrador |
| PUT | `/api/usuarios/:id/roles` | Si | Administrador |
| PUT | `/api/usuarios/:id/password` | Si | Administrador |
| DELETE | `/api/usuarios/:id` | Si | Administrador |

Crear usuario:

```json
{
  "nombre": "Juan Perez",
  "correo": "juan.perez@sisca.com",
  "password": "Temporal123*",
  "roles": ["Brigada", "Responsable del Proceso"]
}
```

Actualizar usuario:

```json
{
  "nombre": "Juan Perez",
  "correo": "juan.perez@sisca.com",
  "activo": true
}
```

Reemplazar roles:

```json
{
  "roles": ["Brigada", "SYMA"]
}
```

Cambiar password:

```json
{
  "password": "Nueva123*"
}
```

`DELETE /api/usuarios/:id` desactiva logicamente al usuario.

## Roles

Administracion de roles. Todo el modulo requiere rol `Administrador`.

| Metodo | Ruta | Token | Roles |
|---|---|---|---|
| GET | `/api/roles` | Si | Administrador |
| POST | `/api/roles` | Si | Administrador |
| PUT | `/api/roles/:id` | Si | Administrador |
| DELETE | `/api/roles/:id` | Si | Administrador |

Crear rol:

```json
{
  "nombre": "Auditor",
  "descripcion": "Rol de auditoria"
}
```

Actualizar rol:

```json
{
  "nombre": "Auditor",
  "descripcion": "Rol de auditoria actualizado"
}
```

Reglas importantes:

- Los roles base no se pueden renombrar ni eliminar.
- Los roles base si permiten actualizar descripcion.
- Un rol asignado a usuarios no se puede eliminar.

## Catalogos

Catalogos base para formularios y filtros. Requieren usuario autenticado.

| Metodo | Ruta | Token | Roles |
|---|---|---|---|
| GET | `/api/catalogos/areas` | Si | Usuario autenticado |
| GET | `/api/catalogos/procesos` | Si | Usuario autenticado |
| GET | `/api/catalogos/tipos-evento` | Si | Usuario autenticado |
| GET | `/api/catalogos/criticidades` | Si | Usuario autenticado |
| GET | `/api/catalogos/estados-caso` | Si | Usuario autenticado |
| GET | `/api/catalogos/estados-accion` | Si | Usuario autenticado |

## Casos

Modulo para registrar, consultar y actualizar datos basicos de casos.

| Metodo | Ruta | Token | Roles |
|---|---|---|---|
| GET | `/api/casos` | Si | Usuario autenticado |
| GET | `/api/casos/:id` | Si | Usuario autenticado |
| POST | `/api/casos` | Si | Administrador, Brigada, PRL Contratista, SYMA |
| PUT | `/api/casos/:id` | Si | Administrador, Brigada, PRL Contratista, SYMA |

Crear caso:

```json
{
  "idArea": 1,
  "idProceso": 1,
  "idTipoEvento": 1,
  "idCriticidad": 1,
  "fechaEvento": "2026-07-03T08:00:00.000Z",
  "lugar": "Bodega principal",
  "descripcion": "Se observo una condicion insegura cerca del area de carga."
}
```

Filtros de listado:

```text
GET /api/casos?estado=Reportado&area=1&criticidad=Alta&texto=SISCA&fechaDesde=2026-07-01&fechaHasta=2026-07-31
```

## Reporte inicial

Modulo para ampliar la informacion inicial del caso.

| Metodo | Ruta | Token | Roles |
|---|---|---|---|
| POST | `/api/reportes-iniciales` | Si | Administrador, Brigada, PRL Contratista, SYMA |
| GET | `/api/reportes-iniciales/caso/:idCaso` | Si | Usuario autenticado |

Crear o actualizar reporte:

```json
{
  "idCaso": 1,
  "descripcionDetallada": "Descripcion ampliada del evento.",
  "condicionDetectada": "Piso mojado sin senalizacion.",
  "accionInmediata": "Se coloco senalizacion temporal.",
  "observaciones": "Pendiente revision."
}
```

## Expediente

Consulta consolidada del caso, reporte inicial, validaciones, acciones, evidencias, bitacora y comentarios.

| Metodo | Ruta | Token | Roles |
|---|---|---|---|
| GET | `/api/expedientes/:idCaso` | Si | Usuario autenticado |

## Validacion de procedencia

Modulo para revisar si un reporte procede como casi-accidente.

| Metodo | Ruta | Token | Roles |
|---|---|---|---|
| POST | `/api/validaciones-procedencia/:idCaso/iniciar-revision` | Si | Administrador, PRL Contratista, SYMA |
| POST | `/api/validaciones-procedencia/:idCaso/aprobar` | Si | Administrador, PRL Contratista, SYMA |
| POST | `/api/validaciones-procedencia/:idCaso/devolver` | Si | Administrador, PRL Contratista, SYMA |
| POST | `/api/validaciones-procedencia/:idCaso/rechazar` | Si | Administrador, PRL Contratista, SYMA |
| GET | `/api/validaciones-procedencia/caso/:idCaso` | Si | Usuario autenticado |

Body para aprobar, devolver o rechazar:

```json
{
  "observaciones": "El caso procede como casi-accidente."
}
```

## Acciones correctivas

Modulo para gestionar acciones derivadas de un caso aprobado.

| Metodo | Ruta | Token | Roles |
|---|---|---|---|
| POST | `/api/acciones-correctivas` | Si | Administrador, PRL Contratista, Responsable del Proceso, SYMA |
| GET | `/api/acciones-correctivas/caso/:idCaso` | Si | Usuario autenticado |
| GET | `/api/acciones-correctivas/:id` | Si | Usuario autenticado |
| PUT | `/api/acciones-correctivas/:id` | Si | Administrador, PRL Contratista, Responsable del Proceso, SYMA |
| POST | `/api/acciones-correctivas/:id/iniciar` | Si | Administrador, Responsable del Proceso, PRL Contratista |
| POST | `/api/acciones-correctivas/:id/enviar-validacion` | Si | Administrador, Responsable del Proceso, PRL Contratista |
| POST | `/api/acciones-correctivas/:id/cerrar` | Si | Administrador, SYMA, Gestión y Control SYMA |
| POST | `/api/acciones-correctivas/:id/devolver` | Si | Administrador, SYMA, Gestión y Control SYMA |

Crear accion:

```json
{
  "idCaso": 1,
  "descripcion": "Colocar senalizacion permanente en el area de carga.",
  "idResponsable": 2,
  "fechaCompromiso": "2026-07-10T18:00:00.000Z"
}
```

Enviar, cerrar o devolver:

```json
{
  "observaciones": "Accion ejecutada y validada con evidencia."
}
```

## Evidencias

Modulo para adjuntar y descargar archivos.

| Metodo | Ruta | Token | Roles |
|---|---|---|---|
| POST | `/api/evidencias/caso/:idCaso` | Si | Administrador, Brigada, PRL Contratista, Responsable del Proceso, SYMA |
| POST | `/api/evidencias/accion/:idAccion` | Si | Administrador, PRL Contratista, Responsable del Proceso, SYMA |
| GET | `/api/evidencias/caso/:idCaso` | Si | Usuario autenticado |
| GET | `/api/evidencias/accion/:idAccion` | Si | Usuario autenticado |
| GET | `/api/evidencias/:id/descargar` | Si | Usuario autenticado |

La carga usa `multipart/form-data`:

```text
archivo: File
descripcion: texto opcional
```

Tipos permitidos: JPEG, PNG, WEBP y PDF. Tamano maximo: 5 MB.

## Cierre de casos

Modulo para cierre formal o devolucion del cierre.

| Metodo | Ruta | Token | Roles |
|---|---|---|---|
| POST | `/api/cierre-casos/:idCaso/cerrar` | Si | Administrador, SYMA, Gestión y Control SYMA |
| POST | `/api/cierre-casos/:idCaso/cerrar-sin-acciones` | Si | Administrador, SYMA, Gestión y Control SYMA |
| POST | `/api/cierre-casos/:idCaso/devolver-cierre` | Si | Administrador, SYMA, Gestión y Control SYMA |

Body:

```json
{
  "observaciones": "Se valida el cierre formal del caso."
}
```

## Notificaciones

Modulo de avisos para usuarios autenticados.

| Metodo | Ruta | Token | Roles |
|---|---|---|---|
| GET | `/api/notificaciones` | Si | Usuario autenticado |
| GET | `/api/notificaciones/resumen` | Si | Usuario autenticado |
| PUT | `/api/notificaciones/:id/leida` | Si | Usuario autenticado |
| PUT | `/api/notificaciones/marcar-todas-leidas` | Si | Usuario autenticado |

Filtro opcional:

```text
GET /api/notificaciones?leida=false
```

## Dashboard

Modulo de indicadores.

| Metodo | Ruta | Token | Roles |
|---|---|---|---|
| GET | `/api/dashboard/resumen` | Si | Administrador, SYMA, Gestión y Control SYMA, Gerencia |
| GET | `/api/dashboard/casos-por-estado` | Si | Administrador, SYMA, Gestión y Control SYMA, Gerencia |
| GET | `/api/dashboard/casos-por-area` | Si | Administrador, SYMA, Gestión y Control SYMA, Gerencia |
| GET | `/api/dashboard/casos-por-criticidad` | Si | Administrador, SYMA, Gestión y Control SYMA, Gerencia |
| GET | `/api/dashboard/acciones-vencidas` | Si | Administrador, SYMA, Gestión y Control SYMA, Gerencia |
| GET | `/api/dashboard/ultimos-casos?limit=10` | Si | Administrador, SYMA, Gestión y Control SYMA, Gerencia |

`limit` acepta valores entre 1 y 100.
