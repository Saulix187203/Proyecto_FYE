# Paginación y búsqueda de usuarios

## Motivo

La bandeja administrativa obtenía los 5,624 usuarios en una sola petición. La respuesta medía aproximadamente 1.39 MB y Angular intentaba renderizar 5,624 filas, unas 39,368 celdas y más de 28,000 controles Material. PostgreSQL respondía entre 163 y 268 ms; el cuello de botella principal era la transferencia y el renderizado.

La solución implementa paginación real en PostgreSQL/Prisma y mantiene en el navegador únicamente la página visible.

La bandeja Angular solicita explícitamente `page=1&limit=25` al iniciar y permite 25, 50, 100 o 250 elementos. El valor predeterminado `limit=50` del endpoint se conserva para no cambiar el contrato de integraciones existentes.

## Listado administrativo

`GET /api/usuarios` requiere autenticación y rol `Administrador`.

Parámetros:

| Parámetro | Predeterminado | Validación |
| --- | --- | --- |
| `page` | `1` | Entero positivo |
| `limit` | `50` | Entero positivo, máximo `500` |
| `texto` | Sin filtro | Coincidencia parcial por nombre o correo, sin distinguir mayúsculas |
| `activo` | Sin filtro | `true` o `false` |
| `rol` | Sin filtro | ID entero positivo |
| `sortBy` | `nombre` | `id`, `nombre`, `correo`, `activo`, `ultimoAcceso` o `createdAt` |
| `sortDir` | `asc` | `asc` o `desc` |

Un `limit` mayor que 500 o parámetros inválidos producen HTTP 400. Los valores de ordenamiento se resuelven mediante una lista permitida; no se pasan campos libres a Prisma.

La respuesta conserva el envoltorio estándar:

```json
{
  "success": true,
  "message": "Usuarios obtenidos correctamente",
  "data": {
    "usuarios": [],
    "pagination": {
      "page": 1,
      "limit": 50,
      "totalItems": 5624,
      "totalPages": 113,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "sort": {
      "sortBy": "nombre",
      "sortDir": "asc"
    }
  }
}
```

Los datos y el total se obtienen en una transacción Prisma. La proyección excluye el hash de contraseña y limita cada usuario a los campos necesarios para la bandeja y sus roles.

## Opciones para selectores remotos

`GET /api/usuarios/opciones` evita usar el listado administrativo completo en los selectores de miembros de brigada y responsables de acciones correctivas.

- Predeterminados: `page=1`, `limit=20`, `activo=true`.
- Máximo: `limit=100`.
- Búsqueda: `texto` por nombre o correo.
- Proyección: únicamente `id`, `nombre` y `correo`.
- Roles admitidos: `Administrador`, `PRL Contratista`, `Responsable del Proceso` y `SYMA`.
- `Extractor API` no tiene acceso y este endpoint no aparece en Swagger Extractor.

## Ejemplos

Con un JWT válido almacenado en una variable local:

```bash
curl -H "Authorization: Bearer $SISCA_TOKEN" \
  "https://sisca.aletechgt.com/api/usuarios?page=2&limit=50&activo=true&sortBy=nombre&sortDir=asc"

curl -H "Authorization: Bearer $SISCA_TOKEN" \
  "https://sisca.aletechgt.com/api/usuarios/opciones?texto=ana&page=1&limit=20"
```

No registre ni comparta el valor del token.

## Resultado medido el 22 de julio de 2026

| Escenario | Estado | Elementos | Tamaño | Tiempo HTTP local aproximado |
| --- | ---: | ---: | ---: | ---: |
| Antes: listado completo | 200 | 5,624 | ~1.39 MB | 163–268 ms de consulta, más transferencia/renderizado |
| Página 1 predeterminada | 200 | 50 | 12,653 bytes | 94.9 ms en primera petición |
| Página 2 | 200 | 50 | 12,710 bytes | 16.7 ms |
| Búsqueda `stress` | 200 | 50 | 12,711 bytes | 25.7 ms |
| Filtro activo | 200 | 50 | 12,653 bytes | 17.6 ms |
| Filtro de rol | 200 | 50 | 12,679 bytes | 27.0 ms |
| Opciones | 200 | 20 | 2,053 bytes | 12.1 ms |

La respuesta predeterminada reduce aproximadamente 99.1% los registros y el tamaño transferidos. Los tiempos incluyen autenticación, consulta, serialización y HTTP dentro del contenedor.

## Índices revisados

- `Usuario.correo` tiene restricción única e índice asociado.
- `UsuarioRol` tiene clave única compuesta por usuario/rol e índice por rol.
- No existe un índice específico para `Usuario.nombre` o `Usuario.activo`.

No se agregó ningún índice: con 5,624 usuarios los tiempos son adecuados y una búsqueda `contains` case-insensitive no aprovecharía un B-tree convencional. Si el volumen crece y las mediciones lo justifican, se puede evaluar `pg_trgm` y un índice GIN con aprobación previa.

## Pruebas de seguridad

- Administrador en `/usuarios`: HTTP 200.
- Extractor API en `/usuarios`: HTTP 403.
- Extractor API en `/usuarios/opciones`: HTTP 403.
- Rol no autorizado en `/usuarios`: HTTP 403.
- `limit=10000`: HTTP 400.
- `page=0`: HTTP 400.

No se modificaron autenticación, operaciones de escritura, esquema Prisma, migraciones ni datos.
