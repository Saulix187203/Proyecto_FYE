# Paginación y opciones remotas de Brigadas

Fecha de validación: 22 de julio de 2026.

## Problema original

`GET /api/brigadas?activo=true` devolvía las 376 brigadas activas con relaciones territoriales, tipo y conteo de miembros. La respuesta medida fue de 200,847 bytes y era descargada por la bandeja administrativa, los filtros de Casos y Expedientes y el formulario de Nuevo caso.

## Contratos

### Bandeja administrativa

`GET /api/brigadas` acepta `page`, `limit`, `texto`, `activo`, `tipoBrigadaId`, `regionId`, `departamentoId`, `municipioId`, `sortBy` y `sortDir`.

- Página inicial del frontend: `page=1&limit=25&sortBy=numero&sortDir=asc`.
- Límite máximo paginado: 500.
- Orden permitido: `id`, `numero`, `nombre`, `activo` y `createdAt`.
- La respuesta contiene `data.brigadas`, `data.pagination` y `data.sort`.
- Sin parámetros de paginación se conserva `data.brigadas` sin metadata para compatibilidad con integraciones existentes, incluido Extractor API.

La bandeja usa MatPaginator con tamaño inicial 25 y opciones 25, 50, 100 y 250. Buscar, filtrar, limpiar o cambiar el tamaño reinicia la página; editar, crear, administrar miembros o desactivar recarga sólo la página actual. Si esa página deja de existir, se consulta la última página válida.

### Opciones livianas

`GET /api/brigadas/opciones` acepta `page`, `limit`, `texto`, `activo`, `tipoBrigadaId`, `regionId`, `departamentoId` y `municipioId`.

- `activo=true`, `page=1` y `limit=20` por defecto.
- Límite máximo: 100.
- Usa `select` de Prisma.
- Devuelve id, número, nombre, tipo, región, departamento y municipio.
- No devuelve miembros, conteos, fechas, IDs administrativos ni relaciones profundas.

## Consumidores

| Consumidor | Contrato | Necesidad |
| --- | --- | --- |
| `/app/brigadas` | `/brigadas` paginado | Relaciones territoriales, tipo y conteo de miembros |
| `/app/casos` | `/brigadas/opciones` | Opción liviana filtrada geográficamente |
| `/app/expedientes` | `/brigadas/opciones` | Opción liviana filtrada geográficamente |
| `/app/casos/nuevo` | `/brigadas/mis-brigadas` y, para roles privilegiados, `/brigadas/opciones` | Mantener membresía y permitir búsqueda global autorizada |

El selector reutilizable usa `mat-autocomplete`, espera 400 ms, evita búsquedas repetidas y cancela la solicitud anterior mediante `switchMap`. Cada consulta remota solicita como máximo 20 opciones y mantiene visible la selección.

## Permisos

`/brigadas/opciones` usa los mismos roles funcionales que ya podían seleccionar o filtrar brigadas: Administrador, SYMA, PRL Contratista, Responsable del Proceso, Brigada, Gestión y Control SYMA y Gerencia. Extractor API está excluido y el endpoint no forma parte de Swagger Extractor.

`/brigadas` conserva el acceso de lectura previo de Extractor API.

## Medición de solo lectura

| Consulta | HTTP | Filas | Tamaño | Tiempo aproximado |
| --- | ---: | ---: | ---: | ---: |
| Listado completo activo de referencia | 200 | 376 | 200,847 B | 53.7 ms |
| Bandeja página 1, límite 25 | 200 | 25 | 13,459 B | 10 ms en validación local |
| Bandeja página 1, límite 50 | 200 | 50 | 26,772 B | 42.0 ms |
| Bandeja página 2, límite 50 | 200 | 50 | 26,924 B | 11.3 ms |
| Opciones, límite 20 | 200 | 20 | 5,638 B | 7.3 ms |
| Opciones por región, límite 20 | 200 | 20 de 56 | 5,615 B | 6.4 ms |
| Opciones con texto `peten` | 200 | 0 | 204 B | 7.6 ms |

La página inicial de 25 reduce aproximadamente 93.3 % del payload respecto del listado completo; el selector reduce aproximadamente 97.2 %.

## Validación

- `page=0`, `limit=501`, estado inválido, ID inválido, `sortBy` inválido y `sortDir` inválido: HTTP 400.
- `limit=0`: HTTP 400.
- Página 2 con límite 25 devolvió otros 25 IDs; la página 16 devolvió el único registro restante de un total de 376.
- `/opciones?limit=101`: HTTP 400.
- Sin token: HTTP 401.
- Extractor API: `/brigadas` HTTP 200 y `/brigadas/opciones` HTTP 403.
- Administrador, PRL Contratista y Brigada: `/brigadas/opciones` HTTP 200 con brigadas activas disponibles.
- SYMA, Responsable del Proceso, Gestión y Control SYMA y Gerencia quedaron validados por configuración de ruta; no había un usuario activo de cada rol para una prueba HTTP local.
- Prisma validate y generate: correctos.
- Build Angular: correcto con los warnings de budgets ya conocidos.

No se modificaron datos, Dashboard, autenticación, roles, `schema.prisma` ni migraciones.
