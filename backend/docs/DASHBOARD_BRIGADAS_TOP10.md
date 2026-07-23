# Top 10 del Dashboard de Brigadas

Fecha de validación: 22 de julio de 2026.

## Problema original

El Dashboard de Brigadas descargaba tres arreglos completos de 376 brigadas y Angular ordenaba o recortaba los primeros 10 elementos. La carga combinada medida fue de 161,958 bytes.

## Endpoints optimizados

- `GET /api/dashboard/brigadas/casos-por-brigada?limit=10`
- `GET /api/dashboard/brigadas/integrantes-por-brigada?limit=10`
- `GET /api/dashboard/brigadas/casos-abiertos-por-brigada?limit=10`

Los filtros `region`, `departamento`, `municipio` y `tipoBrigada` se mantienen sin cambios.

## Estrategia

Cuando se envía `limit`, Prisma ejecuta `groupBy`, ordenamiento agregado y `take` en PostgreSQL. Sólo se consultan los detalles de las brigadas seleccionadas. Node.js no recibe las 376 filas para recortarlas.

Orden estable:

1. Valor del indicador descendente.
2. `brigadaId` ascendente como desempate.

Las brigadas con cero se completan mediante una consulta limitada únicamente cuando los grupos con valor positivo no alcanzan el límite. Así se conserva el contrato visual sin desplazar valores positivos.

Los casos abiertos continúan excluyendo `Cerrado` y `Rechazado`, y los integrantes cuentan únicamente membresías activas.

## Parámetro `limit`

- Opcional para preservar compatibilidad con consumidores del listado completo.
- El frontend envía 10.
- Mínimo 1 y máximo 100.
- `0`, `101`, texto o valores no enteros devuelven HTTP 400.

## Contratos y permisos

La forma de respuesta no cambia: `data.items` contiene los mismos campos de cada ranking. Los permisos tampoco cambian: Administrador, SYMA, Gestión y Control SYMA, Gerencia y Extractor API conservan lectura. Sin token devuelve 401 y un rol fuera de la allowlist devuelve 403.

Los tres endpoints ya formaban parte de Swagger Extractor; continúan allí con `limit` documentado.

## Medición de solo lectura

| Ranking | Filas antes | Bytes antes | Tiempo antes | Filas Top 10 | Bytes Top 10 | Tiempo Top 10 | Reducción |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Casos por brigada | 376 | 67,975 | 117.7 ms | 10 | 1,921 | 80.1 ms | 97.17 % |
| Integrantes activos | 376 | 52,957 | 42.3 ms | 10 | 1,550 | 14.5 ms | 97.07 % |
| Casos abiertos | 376 | 41,026 | 177.8 ms | 10 | 1,185 | 150.7 ms | 97.11 % |
| Total transferido | 1,128 | 161,958 | — | 30 | 4,656 | — | 97.13 % |

Los tiempos dependen de caché y carga de PostgreSQL; el resultado estable es la reducción de filas y transferencia.

## Validación del ranking

- Casos por brigada: mismos IDs, valores y orden que el Top 10 anterior.
- Casos abiertos: mismos IDs, valores y orden que el Top 10 anterior.
- Integrantes: mismos valores; el dataset tiene numerosos empates en 3 integrantes, por lo que la selección cambia al aplicar el nuevo desempate estable por `brigadaId`.
- Ningún Top 10 global necesitó completar con valores cero en los datos actuales.

También se validaron `limit=1`, `limit=10`, `limit=100`, filtros combinados, permisos y errores. No se modificaron tarjetas, rankings geográficos, datos, esquema, migraciones ni roles.
