# API para extracción de alto volumen

## Objetivo

Esta guía describe los límites y filtros disponibles para consultar SISCA sin cargar grandes
volúmenes en una sola respuesta. Las APIs normales entregan JSON paginado; no están diseñadas
para descargar cientos de miles de filas en una sola llamada.

Todos los endpoints descritos, salvo `/api/health`, requieren `Authorization: Bearer <token>`.

## Autenticación para extracción

Use la cuenta técnica `tecnico.api@sisca.com`, con el rol de solo lectura `Extractor API`. Créela
de forma idempotente mediante `API_EXTRACTOR_PASSWORD` y `npm run db:seed`; no use ni comparta la
cuenta administradora. El flujo es: `POST /api/auth/login`, copiar `data.token`, enviar
`Authorization: Bearer TOKEN` y consumir los endpoints paginados permitidos. El rol técnico no
accede a notificaciones ni evidencias y no puede ejecutar operaciones de escritura. Consulte
`docs/USUARIO_TECNICO_API.md` para la lista completa de permisos y ejemplos.

## Endpoints revisados

| Endpoint | Protección aplicada o validada |
| --- | --- |
| `GET /api/casos` | Paginación obligatoria, máximo 1,000, filtros y selección liviana de campos. |
| `GET /api/casos/:id` | Detalle por identificador; conserva las relaciones del caso. |
| `GET /api/expedientes/:idCaso` | Detalle por identificador; no realiza una consulta global. |
| `GET /api/acciones-correctivas` | Listado general paginado, máximo 1,000 y filtros. |
| `GET /api/acciones-correctivas/caso/:idCaso` | Listado acotado a un caso; conserva el contrato existente. |
| `GET /api/notificaciones` | Paginación obligatoria por usuario, máximo 1,000 y filtros. |
| `GET /api/brigadas` | Paginación opcional para mantener compatibilidad. |
| `GET /api/dashboard/resumen` | Usa conteos en PostgreSQL; no carga casos en memoria. |
| `GET /api/dashboard/brigadas/resumen` | Usa `count` y `groupBy` en PostgreSQL. |
| `GET /api/dashboard/brigadas/casos-por-brigada` | Agrupa casos en PostgreSQL y procesa solamente las brigadas. |
| `GET /api/dashboard/acciones-vencidas` | Paginado, 100 elementos por defecto y máximo 1,000. |

No se agregaron endpoints `/api/export/*`. Para una extracción de un millón de filas conviene
diseñar una exportación asíncrona a CSV/NDJSON o almacenamiento de objetos, con cursor y estado de
trabajo, en vez de producir un arreglo JSON gigante dentro de una solicitud HTTP.

## Estándar de paginación

Los listados grandes aceptan:

| Parámetro | Valor predeterminado | Regla |
| --- | ---: | --- |
| `page` | `1` | Entero positivo. |
| `limit` | `50` | Entero entre 1 y 1,000. En acciones vencidas el valor predeterminado es 100. |
| `sortBy` | Depende del recurso | Solamente campos incluidos en la lista permitida. |
| `sortDir` | Depende del recurso | `asc` o `desc`. |

Un `limit` mayor que 1,000 devuelve HTTP `400`:

```json
{
  "success": false,
  "message": "limit no puede ser mayor que 1000"
}
```

Las respuestas conservan la clave histórica del recurso y agregan metadata. Ejemplo:

```json
{
  "success": true,
  "message": "Casos obtenidos correctamente",
  "data": {
    "casos": [],
    "pagination": {
      "page": 1,
      "limit": 50,
      "totalItems": 100000,
      "totalPages": 2000,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "sort": {
      "sortBy": "fechaReporte",
      "sortDir": "desc"
    }
  }
}
```

Todos los ordenamientos agregan `id` como segundo criterio cuando es necesario, por lo que son
estables aun cuando varias filas tienen la misma fecha.

### Campos permitidos para ordenar

- Casos: `id`, `correlativo`, `fechaEvento`, `fechaReporte`, `createdAt`.
- Acciones: `id`, `fechaCompromiso`, `fechaCierre`, `porcentajeAvance`, `createdAt`.
- Notificaciones: `id`, `createdAt`, `fechaLectura`.
- Brigadas paginadas: `id`, `numero`, `nombre`, `activo`, `createdAt`.

## Filtros

### Casos

`GET /api/casos` admite:

- `texto`: correlativo, título, descripción o ubicación; máximo 200 caracteres.
- `estado`, `area`, `criticidad`: identificador numérico o nombre exacto sin distinguir
  mayúsculas.
- `fechaDesde`, `fechaHasta`: rango sobre la fecha del evento.
- `brigada` o `brigadaReportante`: identificador de la brigada.
- `region`, `departamento`, `municipio`, `tipoBrigada`: identificadores geográficos o de tipo.

El listado no incluye los textos largos `descripcion` y `titulo`, ni colecciones hijas. Conserva
los campos de catálogo que usa el cliente actual. El detalle completo permanece en
`GET /api/casos/:id`.

### Acciones correctivas

`GET /api/acciones-correctivas` admite:

- `estado`: identificador o nombre exacto.
- `responsable`: identificador o texto contenido en nombre/correo.
- `caso`: identificador o correlativo exacto.
- `fechaDesde`, `fechaHasta`: rango sobre `fechaCompromiso`.
- `vencidas=true|false`.

El listado general no carga evidencias. El detalle continúa disponible en
`GET /api/acciones-correctivas/:id`.

### Notificaciones

`GET /api/notificaciones` admite `leida=true|false`, `fechaDesde` y `fechaHasta`. La consulta
siempre queda restringida al usuario autenticado.

### Brigadas

Se conservan `activo`, `tipoBrigadaId`, `regionId`, `departamentoId`, `municipioId` y `texto`.
Para no romper clientes existentes:

- sin `page`, `limit`, `sortBy` ni `sortDir`, `data.brigadas` mantiene el comportamiento anterior;
- al enviar cualquiera de esos parámetros, se agregan `data.pagination` y `data.sort`, y se aplica
  el máximo de 1,000.

## Ejemplos de consumo

### Preparar el token en PowerShell

```powershell
$baseUrl = "http://localhost:3000/api"
$loginBody = @{ correo = "tecnico.api@sisca.com"; password = $env:API_EXTRACTOR_PASSWORD } |
  ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/login" `
  -ContentType "application/json" -Body $loginBody
$headers = @{ Authorization = "Bearer $($login.data.token)" }
```

### Consultar páginas

```powershell
Invoke-RestMethod -Uri "$baseUrl/casos?page=1&limit=50" -Headers $headers
Invoke-RestMethod -Uri "$baseUrl/casos?page=100&limit=50" -Headers $headers
Invoke-RestMethod -Uri "$baseUrl/casos?brigada=7&page=1&limit=100" -Headers $headers
Invoke-RestMethod -Uri "$baseUrl/casos?fechaDesde=2026-01-01T00:00:00Z&fechaHasta=2026-01-31T23:59:59.999Z&page=1&limit=100" -Headers $headers
Invoke-RestMethod -Uri "$baseUrl/acciones-correctivas?vencidas=true&page=1&limit=100" -Headers $headers
Invoke-RestMethod -Uri "$baseUrl/brigadas?activo=true&page=1&limit=100" -Headers $headers
```

Con `curl.exe`:

```powershell
curl.exe -s "$baseUrl/casos?page=1&limit=50" `
  -H "Authorization: Bearer $($login.data.token)"

curl.exe -i "$baseUrl/casos?limit=1000000" `
  -H "Authorization: Bearer $($login.data.token)"
```

### Extraer todas las páginas

Este ejemplo mantiene cada página separada en memoria. En un proceso real, escriba cada lote a
disco o envíelo al consumidor antes de solicitar el siguiente.

```powershell
$page = 1
$limit = 1000

do {
  $response = Invoke-RestMethod `
    -Uri "$baseUrl/casos?page=$page&limit=$limit&sortBy=id&sortDir=asc" `
    -Headers $headers

  $response.data.casos | ForEach-Object {
    # Procesar o persistir cada elemento; no acumular todas las páginas en un arreglo.
    $_
  }

  $hasNext = $response.data.pagination.hasNextPage
  $page++
} while ($hasNext)
```

La paginación por desplazamiento (`page`/`skip`) es apropiada para navegación y extracciones
moderadas. Para recorrer un millón de filas, una futura API de exportación debería usar cursor
(`id > ultimoId`) para evitar el costo creciente de páginas muy profundas y para definir mejor el
comportamiento si se insertan datos durante la extracción.

## Índices aplicados

El esquema ya contiene índices simples sobre claves de búsqueda importantes:

- casos: `areaId`, `procesoId`, `tipoEventoId`, `criticidadId`, `estadoCasoId`,
  `reportadoPorId`, `brigadaReportanteId` y `fechaReporte`;
- acciones: `casiAccidenteId`, `responsableId`, `estadoAccionId` y `fechaCompromiso`;
- notificaciones: `(usuarioId, leida)` y `casiAccidenteId`;
- brigadas: tipo, región, departamento, municipio, activo y un índice geográfico compuesto.

Para las consultas de casos con alto volumen se aplicó la migración
`20260721045554_add_indexes_casos_high_volume`, que crea exclusivamente estos índices B-tree:

- `idx_casi_accidente_brigada_fecha` sobre `(brigada_reportante_id, fecha_reporte, id)`: beneficia
  `GET /api/casos?brigada=...` y satisface en el mismo índice el filtro y el orden predeterminado.
- `idx_casi_accidente_fecha_evento` sobre `(fecha_hora_evento, id)`: beneficia rangos
  `fechaDesde`/`fechaHasta`, especialmente el conteo exacto usado por la metadata de paginación.

En una medición local secuencial con 1,110,103 casos, cinco muestras por consulta y comparación de
medianas, se obtuvo:

| Consulta | Antes | Después |
| --- | ---: | ---: |
| Página 1, 50 filas | 366.27 ms | 76.01 ms |
| Página 100, 50 filas | 312.85 ms | 78.96 ms |
| Brigada 7, 100 filas | 2,950.86 ms | 6.12 ms |
| Rango 2026, 100 filas | 455.50 ms | 64.55 ms |

Los tiempos son orientativos y dependen de caché, hardware y actividad concurrente. La mejora de
páginas sin filtro no debe atribuirse a estos índices; la evidencia directa está en los planes:
PostgreSQL usa `idx_casi_accidente_brigada_fecha` para el listado por brigada y
`idx_casi_accidente_fecha_evento` para el conteo por rango. Estos índices están justificados para
entornos de alto volumen, pero aumentan el espacio ocupado y el costo de inserción/actualización.

No se aplicaron otros índices. Como trabajo futuro, sujeto a métricas reales, se puede evaluar:

- `Notificacion @@index([usuarioId, leida, createdAt, id])`: cubriría usuario, estado de lectura y
  orden cronológico; habría que revisar si sustituye al índice `(usuarioId, leida)` para evitar
  redundancia.
- Índices compuestos de acciones como
   `(estadoAccionId, createdAt, id)` o `(responsableId, createdAt, id)`. No conviene crear ambos
   sin observar las consultas reales porque cada índice aumenta espacio y costo de escritura.

Los filtros de texto usan `contains` sin distinguir mayúsculas y no aprovechan un B-tree normal.
Si se convierten en una carga frecuente, evaluar PostgreSQL `pg_trgm` e índices GIN mediante una
migración SQL revisada. No aplicarlos solamente por existir el parámetro `texto`.

## Recomendaciones para 100K y 1M

- Para 100K, use páginas de 100 a 500; reserve 1,000 para integraciones controladas.
- Para 1M, no aumente el máximo de la API. Use lotes, orden estable y procesamiento incremental.
- Restrinja por fecha, brigada u otra dimensión cuando el consumidor no necesita el histórico
  completo.
- No ejecute muchas extracciones completas en paralelo: cada página realiza también un conteo
  exacto para construir la metadata.
- Registre duración, código HTTP, tamaño de respuesta, CPU, memoria y conexiones de PostgreSQL.
- Ejecute `VACUUM (ANALYZE)` después de una carga masiva para actualizar estadísticas.
- Defina timeouts, cancelación y límites de concurrencia antes de habilitar consumidores BI.

## Riesgos y pendientes

- Una respuesta JSON con demasiadas filas presiona simultáneamente memoria de PostgreSQL, Node.js
  y navegador; el máximo evita ese escenario en listados principales.
- Los detalles de expediente contienen varias colecciones hijas. Están acotados a un caso, pero si
  un caso puede acumular miles de elementos se deberán separar y paginar esas colecciones.
- Los conteos exactos sobre tablas grandes tienen costo. Una futura API por cursor puede devolver
  el total solamente en la primera solicitud o hacerlo opcional.
- Falta diseñar el contrato, permisos, auditoría y formato de una exportación asíncrona para BI.
- Antes de aplicar índices adicionales, repetir planes con estadísticas actualizadas y una mezcla
  de filtros representativa; después medir también su costo de inserción.

## Lista mínima de validación

```powershell
npx prisma validate
npx prisma generate
npm run dev
```

Con la API iniciada, medir como mínimo `/api/health`, las páginas 1 y 100 de casos, casos por fecha
y brigada, los tres endpoints principales del dashboard y el rechazo de `limit=1000000`.
