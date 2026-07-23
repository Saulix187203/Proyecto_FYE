# Auditoría de paginación de módulos SISCA

Fecha: 22 de julio de 2026.

La auditoría revisó consultas Prisma, endpoints GET, consumidores Angular, selectores, tablas, agregaciones, permisos y OpenAPI. Las mediciones se realizaron con peticiones de solo lectura dentro del servidor.

## Matriz

| Módulo | Clasificación | Volumen real | Estado | Prioridad / acción |
| --- | --- | ---: | --- | --- |
| Usuarios | A | 5,624 | Implementado: página inicial 25 y selectores remotos | Completado |
| Casos | A | 1,110,103 | Backend y MatPaginator, página inicial 25 | Completado |
| Expedientes — bandeja | A | 1,110,103 | Reutiliza Casos paginado, página inicial 25 | Completado |
| Expediente — detalle | C | Máximo 6 eventos de bitácora | Liviano; existen solicitudes duplicadas | Revisar posteriormente |
| Acciones globales | A | 666,060 | Backend paginado; la ruta frontend no es bandeja | Definir necesidad funcional |
| Acciones por caso | C | Máximo 1 | Colección pequeña | Sin cambio |
| Notificaciones | A | 410,101; máximo 200 por usuario | MatPaginator, filtros y página inicial 25 | Completado localmente |
| Brigadas | B | 376 | Bandeja página inicial 25 y opciones remotas de 20 | Completado localmente |
| Miembros | C | 1,126; máximo 3 por brigada | Colección pequeña | Sin cambio |
| Evidencias | C | Máximo 1 | Colección pequeña; revisar metadata interna | Posterior |
| Validaciones | C | Máximo 1 | Colección pequeña | Sin cambio |
| Reporte inicial | C | Relación 1:1 por expediente | Acceso individual | Sin cambio |
| Bitácora | C | 1,110,111; máximo 6 por caso | Colección pequeña por expediente | Monitorizar |
| Dashboard general | D | 1.11 M casos | Usa conteos, agrupaciones y límites | Sin cambio |
| Dashboard brigadas | D | 376 × 3 respuestas | Implementado: PostgreSQL devuelve Top 10 | Completado localmente |
| Catálogos | C | 4–340 | Tamaño estable; filtros geográficos existentes | Sin cambio |
| Roles | C | 8 | Catálogo pequeño | Sin cambio |

## Notificaciones implementado

- Contrato backend existente preservado.
- Página inicial de 25 y opciones 25/50/100/250.
- Estado y fechas procesados por PostgreSQL.
- Orden `createdAt desc` seguro mediante allowlist.
- Página y filtros conservados tras navegación y actualizaciones.
- La campana continúa usando `/notificaciones/resumen` y no depende del listado.
- Extractor API continúa bloqueado.

## Brigadas implementado

- La bandeja administrativa usa MatPaginator y paginación real del servidor.
- Casos, Expedientes y Nuevo caso usan opciones remotas livianas; `mis-brigadas` conserva la lógica de membresía.
- El listado completo de referencia fue 200,847 B; página 50 fue 26,772 B y opciones 20 fue 5,638 B.
- Los filtros geográficos limpian la brigada seleccionada y limitan la búsqueda remota.
- Extractor API conserva `/brigadas` y queda bloqueado en `/brigadas/opciones`.
- La optimización de la bandeja administrativa no alteró el Dashboard; sus rankings se optimizaron posteriormente como se documenta en la sección siguiente.

## Estándar global de tablas

- Usuarios, Casos, Expedientes, Notificaciones y Brigadas solicitan explícitamente `page=1&limit=25` al iniciar.
- Las cinco bandejas ofrecen 25, 50, 100 y 250, conservan filtros al navegar y vuelven a la primera página al cambiar filtros o tamaño.
- `MatPaginatorIntl` se configura globalmente en español y habilita primera/última página en todas las bandejas grandes.
- Los valores predeterminados publicados por los endpoints no se cambiaron; el estándar se aplica mediante parámetros explícitos desde Angular.
- Autocompletes remotos continúan limitados a 20 y los Top 10 del Dashboard no usan paginador.
- La versión pública revisada todavía servía un bundle anterior de Brigadas sin `MatPaginator`; requiere un despliegue posterior para reflejar estos cambios.

## Top 10 del Dashboard de Brigadas implementado

- Los tres rankings aceptan `limit` entre 1 y 100; Angular envía 10.
- Prisma ejecuta `groupBy`, `orderBy` agregado y `take` en PostgreSQL.
- Casos y Casos abiertos conservaron exactamente IDs, valores y orden del Top 10 previo.
- Integrantes conserva valores; los empates ahora se resuelven por `brigadaId` ascendente.
- La transferencia combinada bajó de 161,958 B a 4,656 B, una reducción de 97.13 %.
- Tarjetas de resumen y gráficas geográficas permanecen sin cambios.

## Pendientes priorizados

1. Eliminar solicitudes duplicadas del detalle del expediente.
2. Reducir metadata interna de evidencias después de revisar consumidores.

No se proponen índices en esta etapa. Antes de cualquier migración se requiere medir con `EXPLAIN ANALYZE` las consultas que permanezcan lentas después de reducir respuestas.
