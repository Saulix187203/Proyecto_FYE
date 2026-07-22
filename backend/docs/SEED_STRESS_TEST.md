# Seed masivo para pruebas de rendimiento

## Objetivo y advertencia

`prisma/stress/seed-stress.js` genera datos falsos relacionados para probar extracción mediante APIs y rendimiento de PostgreSQL. Es independiente de `prisma/seed.js` y solo se ejecuta manualmente.

> Use este script únicamente en bases locales o de desarrollo. Nunca copie datos STRESS a un ambiente real ni defina `CONFIRM_STRESS_SEED=YES` de forma permanente.

El script se bloquea cuando `NODE_ENV=production`, exige `CONFIRM_STRESS_SEED=YES` y utiliza `DATABASE_URL` desde `backend/.env`. Todos los registros llevan identificadores como `stress.user.*@sisca.local`, `SISCA-STRESS-*`, `STR-*` o textos `[STRESS TEST]`.

## Requisitos previos

1. PostgreSQL local iniciado y `DATABASE_URL` configurada en `backend/.env`.
2. Dependencias instaladas con `npm install`.
3. Prisma Client generado con `npx prisma generate`.
4. Migraciones aplicadas y catálogos base cargados con `npm run db:seed`.
5. Espacio libre suficiente y respaldo si la base contiene información manual importante.

## Configuración

| Variable | Predeterminado | Descripción |
| --- | ---: | --- |
| `STRESS_RUN_ID` | Automático | Identificador alfanumérico de hasta 6 caracteres. Permite distinguir ejecuciones. |
| `STRESS_USERS` | 100 | Usuarios falsos. Debe ser al menos 1. |
| `STRESS_BRIGADAS` | 20 | Brigadas falsas. Puede ser 0. |
| `STRESS_MIEMBROS_POR_BRIGADA` | 3 | Miembros distintos por brigada; el primero es líder. |
| `STRESS_CASOS` | 1000 | Casos falsos. Debe ser al menos 1. |
| `STRESS_ACCIONES_POR_CASO` | 1 | Acciones creadas para cada caso seleccionado. |
| `STRESS_PORCENTAJE_CASOS_CON_ACCIONES` | 60 | Porcentaje de casos con acciones, entre 0 y 100. |
| `STRESS_PORCENTAJE_CASOS_CON_BRIGADA` | 75 | Porcentaje de casos con brigada reportante. El resto queda sin brigada. |
| `STRESS_NOTIFICACIONES` | Igual a casos | Cantidad total distribuida entre los casos. |
| `STRESS_BITACORA` | Igual a casos | Cantidad total de eventos distribuida entre los casos. |
| `STRESS_EVIDENCIAS` | 0 | Metadatos de evidencias dummy. No se duplican archivos físicos. |
| `BATCH_SIZE` | 1000 | Casos procesados por lote, entre 1 y 50000. |
| `CONFIRM_STRESS_SEED` | Sin valor | Debe ser exactamente `YES`. |

También se aceptan argumentos como `--users=20`, `--brigadas=5`, `--casos=100`, `--batch-size=50` y `--run-id=LOCAL1`. Las variables de entorno tienen prioridad sobre los predeterminados y los argumentos tienen prioridad sobre las variables.

La contraseña común de los usuarios falsos es `StressTest123*`. No debe reutilizarse para usuarios normales.

## Ejecución pequeña

Linux o macOS:

```bash
CONFIRM_STRESS_SEED=YES STRESS_USERS=20 STRESS_BRIGADAS=5 STRESS_CASOS=100 BATCH_SIZE=50 npm run db:seed:stress
```

Windows PowerShell:

```powershell
$env:CONFIRM_STRESS_SEED = "YES"
$env:STRESS_USERS = "20"
$env:STRESS_BRIGADAS = "5"
$env:STRESS_CASOS = "100"
$env:BATCH_SIZE = "50"
npm run db:seed:stress
```

La consola muestra el `runId`, configuración efectiva y avance acumulado de usuarios, brigadas, casos, reportes, acciones, bitácora, notificaciones y evidencias.

## Ejecución grande: un millón de casos

No ejecute este escenario antes de medir uno de 10 000 y otro de 100 000 casos.

> Antes de iniciar S1M, valide la paginación y los límites descritos en
> `docs/API_EXTRACCION_ALTO_VOLUMEN.md`. En particular, confirme que los listados usan un máximo de
> 1,000, que `GET /api/casos?limit=1000000` responde HTTP 400 y que los endpoints del dashboard no
> cargan todos los casos en memoria. Registre una línea base con el conjunto S100K y revise los
> planes de los filtros por fecha y brigada.

```powershell
$env:CONFIRM_STRESS_SEED = "YES"
$env:STRESS_USERS = "5000"
$env:STRESS_BRIGADAS = "300"
$env:STRESS_CASOS = "1000000"
$env:STRESS_ACCIONES_POR_CASO = "1"
$env:STRESS_NOTIFICACIONES = "300000"
$env:STRESS_BITACORA = "1000000"
$env:BATCH_SIZE = "5000"
npm run db:seed:stress
```

`BATCH_SIZE` define el lote lógico. Internamente cada `createMany` se subdivide según el número de columnas para mantenerse por debajo de un límite conservador de parámetros PostgreSQL.

## Limpieza

La limpieza elimina primero casos STRESS —sus relaciones usan borrado en cascada—, luego miembros y brigadas STRESS, roles de usuarios falsos y finalmente usuarios falsos. No elimina catálogos, usuarios normales ni el archivo dummy.

Eliminar todos los runs STRESS:

```powershell
$env:CONFIRM_CLEAR_STRESS = "YES"
Remove-Item Env:STRESS_RUN_ID -ErrorAction SilentlyContinue
npm run db:clear:stress
```

Eliminar solamente un run mostrado por el seed:

```powershell
$env:CONFIRM_CLEAR_STRESS = "YES"
$env:STRESS_RUN_ID = "ABC123"
$env:BATCH_SIZE = "1000"
npm run db:clear:stress
```

Si un dato normal fue relacionado manualmente con un usuario o brigada STRESS, las restricciones de claves foráneas pueden impedir su eliminación. El script informa el error y no fuerza el borrado de la referencia normal.

## Validación SQL

```sql
SELECT count(*) AS usuarios_stress
FROM usuarios
WHERE correo LIKE 'stress.user.%@sisca.local';

SELECT count(*) AS brigadas_stress
FROM brigadas
WHERE numero LIKE 'STR-%'
  AND nombre LIKE '[STRESS TEST %';

SELECT count(*) AS casos_stress
FROM casi_accidentes
WHERE correlativo LIKE 'SISCA-STRESS-%'
  AND descripcion LIKE '[STRESS TEST %';

SELECT count(*) AS reportes_stress
FROM reportes_iniciales ri
JOIN casi_accidentes ca ON ca.id = ri.casi_accidente_id
WHERE ca.correlativo LIKE 'SISCA-STRESS-%';

SELECT count(*) AS acciones_stress
FROM acciones_correctivas ac
JOIN casi_accidentes ca ON ca.id = ac.casi_accidente_id
WHERE ca.correlativo LIKE 'SISCA-STRESS-%';

SELECT count(*) AS casos_sin_brigada
FROM casi_accidentes
WHERE correlativo LIKE 'SISCA-STRESS-%'
  AND brigada_reportante_id IS NULL;
```

Para analizar consultas reales, use `EXPLAIN (ANALYZE, BUFFERS)` únicamente sobre sentencias `SELECT` conocidas y registre tamaño de base, hardware y concurrencia.

## Pruebas de APIs

Con el backend iniciado mediante `npm run dev`, valide:

```text
GET /api/health
GET /api/casos
GET /api/dashboard/resumen
GET /api/dashboard/brigadas/resumen
```

Salvo `/api/health`, agregue `Authorization: Bearer <token>`. Pruebe paginación y filtros por fecha, criticidad, estado, región, departamento, municipio y brigada. Registre tiempo, código HTTP, tamaño de respuesta y consumo de CPU/memoria.

## Recomendaciones de rendimiento

- Cierre herramientas que mantengan transacciones o conexiones innecesarias.
- Verifique espacio en disco; casos y relaciones pueden ocupar varios gigabytes.
- Empiece con 10 000 casos, mida, limpie y aumente a 100 000 antes de llegar a 1 000 000.
- Mantenga `BATCH_SIZE` entre 1000 y 5000; reduzca a 500 si aparecen timeouts o presión de memoria.
- No genere evidencias masivas. Todos los metadatos configurados reutilizan `prisma/stress/dummy-evidence.txt`.
- Ejecute `VACUUM (ANALYZE)` después de cargas o limpiezas grandes si las estadísticas de consultas quedan desactualizadas.
- No compare resultados entre equipos sin anotar versión de PostgreSQL, CPU, RAM, almacenamiento y configuración.

## Errores comunes

- `Confirmación requerida`: falta `CONFIRM_STRESS_SEED=YES` o `CONFIRM_CLEAR_STRESS=YES`.
- `NODE_ENV=production`: la operación está bloqueada intencionalmente.
- `Faltan catálogos requeridos`: ejecute `npm run db:seed` antes del stress seed.
- `Ya existen datos para STRESS_RUN_ID`: use otro identificador o limpie ese run.
- Error de conexión: revise `DATABASE_URL`, PostgreSQL y migraciones.
- Error de parámetros o memoria: reduzca `BATCH_SIZE`.
- Error de clave foránea al limpiar: existe una relación externa creada después del seed; revísela manualmente antes de volver a limpiar.
