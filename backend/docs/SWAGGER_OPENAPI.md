# Swagger / OpenAPI en SISCA

## Propósito

SISCA publica una especificación OpenAPI 3.0.3 completa y una vista filtrada para el rol
`Extractor API`. Ambas interfaces permiten consultar contratos y ejecutar solicitudes contra los
mismos endpoints de Express; ninguna reemplaza sus validaciones, autenticación ni permisos.

## Instalación e inicio

Desde `backend/`:

```bash
npm install
npm run dev
```

Las dependencias de documentación son `swagger-jsdoc` y `swagger-ui-express`.

Con el backend local en el puerto predeterminado:

- Swagger UI completa: `http://localhost:3000/api/docs`
- OpenAPI JSON completo: `http://localhost:3000/api/openapi.json`
- Swagger UI del extractor: `http://localhost:3000/api/docs/extractor`
- OpenAPI JSON del extractor: `http://localhost:3000/api/openapi-extractor.json`
- Health check: `http://localhost:3000/api/health`

`/api/docs` y `/api/docs/extractor` redirigen a sus variantes con barra final para que Swagger UI
cargue correctamente sus recursos.

## Autenticación JWT

`POST /api/auth/login` y `GET /api/health` son públicos. Los demás endpoints documentados heredan
el esquema `bearerAuth`.

Para probar un endpoint protegido desde Swagger UI:

1. Abra `POST /auth/login`, seleccione **Try it out** e ingrese credenciales válidas de su entorno.
2. Ejecute la solicitud y copie `data.token` de la respuesta.
3. Presione **Authorize**.
4. Pegue únicamente el token, sin la palabra `Bearer`.
5. Confirme con **Authorize** y ejecute el endpoint protegido.

Swagger UI construye automáticamente el encabezado `Authorization: Bearer <token>`. Los valores
de ejemplo incluidos en OpenAPI son ilustrativos y no contienen credenciales ni secretos reales.

## Documentación completa y documentación del extractor

`/api/docs` muestra todos los módulos y operaciones documentados. Está destinada al desarrollo y
a la administración técnica interna; cada endpoint conserva sus requisitos reales de JWT y rol.

`/api/docs/extractor` se deriva automáticamente de la especificación completa mediante una
allowlist explícita de path y método HTTP. Muestra únicamente `POST /auth/login` y los GET de
Auth, Catálogos, Casos, Expedientes, Acciones Correctivas, Brigadas y Dashboard autorizados para
`Extractor API`. No muestra usuarios, roles, notificaciones, evidencias, reportes iniciales,
validaciones, cierres, `GET /brigadas/mis-brigadas` ni operaciones de escritura.

La visibilidad en Swagger es solo documentación. Los guards y middleware del backend continúan
siendo la seguridad efectiva: una operación oculta conserva sus respuestas `401` o `403` cuando
alguien intenta invocarla directamente.

## Solución CORS para Swagger local

`CORS_ORIGIN` acepta una lista de orígenes separados por comas. Para usar Angular y ejecutar
solicitudes desde Swagger UI local, incluya ambos orígenes en `backend/.env`:

```env
CORS_ORIGIN=http://localhost:4200,http://localhost:3000
```

También puede declarar las variantes con `127.0.0.1` cuando las use para abrir las aplicaciones:

```env
CORS_ORIGIN=http://localhost:4200,http://localhost:3000,http://127.0.0.1:4200,http://127.0.0.1:3000
```

Los espacios alrededor de cada elemento se eliminan y los valores repetidos se consolidan. En
desarrollo, el backend agrega automáticamente `http://localhost:<PORT>` y
`http://127.0.0.1:<PORT>` para Swagger local. En producción no se agregan orígenes implícitos:
todos deben estar definidos expresamente en `CORS_ORIGIN`, incluso el origen que publica Swagger
cuando `ENABLE_SWAGGER=true`. El comodín `*` no está permitido.

Después de modificar `.env`, reinicie el backend. Luego abra `POST /auth/login`, ejecute el login,
copie `data.token`, presione **Authorize** y pegue únicamente el token, sin la palabra `Bearer`;
Swagger agrega ese prefijo automáticamente.

## Organización de la documentación

- `src/config/swagger.js`: información general, servidor, tags, seguridad y ensamblado del documento.
- `src/docs/openapi.schemas.js`: schemas, parámetros y respuestas reutilizables.
- `src/docs/openapi.paths.js`: paths y operaciones de la API.
- `src/app.js`: exposición condicional de Swagger UI y OpenAPI JSON.

Los endpoints están agrupados por Auth, Usuarios, Roles, Catálogos, Casos, Expedientes, Reportes
Iniciales, Validaciones, Acciones Correctivas, Evidencias, Cierre de Casos, Notificaciones,
Brigadas, Dashboard y Health.

## Paginación de alto volumen

`GET /api/casos`, `GET /api/acciones-correctivas` y `GET /api/notificaciones` documentan `page`,
`limit`, `sortBy` y `sortDir`. La página predeterminada es 1, el límite predeterminado es 50 y el
máximo es 1000. Un límite superior responde HTTP 400.

`GET /api/brigadas` conserva su respuesta compatible cuando no recibe parámetros de paginación y
devuelve metadata cuando se envía `page`, `limit`, `sortBy` o `sortDir`.

La respuesta paginada incluye `pagination.page`, `limit`, `totalItems`, `totalPages`,
`hasNextPage` y `hasPreviousPage`.

## Documentar un endpoint nuevo

1. Agregue el path y su método en `src/docs/openapi.paths.js` con un `operationId` único.
2. Use uno de los tags existentes o agréguelo en `src/config/swagger.js`.
3. Reutilice `ApiResponse`, `ErrorResponse`, parámetros y schemas de `openapi.schemas.js`.
4. Si el contrato introduce una entidad estable, agregue un schema reutilizable en lugar de
   repetir sus campos en cada operación.
5. Mantenga la seguridad global para rutas protegidas. Use `security: []` únicamente en rutas
   realmente públicas.
6. Levante el backend y revise tanto Swagger UI como `/api/openapi.json`.

La documentación debe reflejar los nombres reales de parámetros, cuerpos y respuestas. No agregue
tokens, contraseñas, cadenas de conexión ni valores de `.env` como ejemplos.

## Desarrollo y producción

En desarrollo Swagger está habilitado automáticamente. En producción está deshabilitado por
defecto y se habilita de forma explícita:

```env
NODE_ENV=production
ENABLE_SWAGGER=true
```

Con `NODE_ENV=production` y `ENABLE_SWAGGER` ausente o distinto de `true`, `/api/docs`,
`/api/openapi.json`, `/api/docs/extractor` y `/api/openapi-extractor.json` responden 404. Reinicie
el proceso después de cambiar variables de entorno.

## Errores comunes

- **401 Token requerido o inválido:** obtenga un token nuevo e ingrese solo su valor en
  **Authorize**.
- **403 Sin permisos:** el token es válido, pero el usuario no posee uno de los roles requeridos
  por el endpoint. Swagger no modifica las reglas de autorización.
- **400 por paginación:** `page` y `limit` deben ser enteros positivos y `limit` no puede superar
  1000.
- **404 en documentación:** confirme el modo de ejecución y `ENABLE_SWAGGER` si está en producción.
- **La UI abre sin endpoints actualizados:** reinicie `npm run dev` y verifique que el path nuevo
  esté exportado desde `openapi.paths.js`.
- **Error al cargar Swagger UI:** abra la ruta con la barra final (`/api/docs/`) o permita la
  redirección desde `/api/docs`.
