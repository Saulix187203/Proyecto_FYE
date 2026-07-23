# Paginación de Notificaciones

## Hallazgo original

La base contiene aproximadamente 410,101 notificaciones y se midieron hasta 200 notificaciones para un mismo usuario. El backend ya entregaba páginas de 50 registros, pero el frontend no enviaba `page` ni `limit`, ignoraba `data.pagination` y no ofrecía navegación. Como resultado, únicamente eran accesibles las primeras 50 notificaciones.

## Contrato existente

`GET /api/notificaciones` consulta exclusivamente las notificaciones del usuario autenticado y devuelve:

```json
{
  "success": true,
  "message": "Notificaciones obtenidas correctamente",
  "data": {
    "notificaciones": [],
    "pagination": {
      "page": 1,
      "limit": 50,
      "totalItems": 200,
      "totalPages": 4,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "sort": {
      "sortBy": "createdAt",
      "sortDir": "desc"
    }
  }
}
```

## Parámetros

| Parámetro | Predeterminado | Validación |
| --- | --- | --- |
| `page` | `1` | Entero positivo |
| `limit` | `50` | Entero positivo, máximo compartido de `1000` |
| `leida` | Sin filtro | `true` o `false` |
| `fechaDesde` | Sin filtro | Fecha válida |
| `fechaHasta` | Sin filtro | Fecha válida y no anterior a `fechaDesde` |
| `sortBy` | `createdAt` | `id`, `createdAt` o `fechaLectura` |
| `sortDir` | `desc` | `asc` o `desc` |

La interfaz solicita explícitamente `page=1&limit=25` al iniciar y ofrece tamaños de 25, 50, 100 y 250. El valor predeterminado 50 del backend y el máximo 1000 de la utilidad compartida se conservan por compatibilidad; la interfaz nunca solicita más de 250.

## Permisos

- Requiere JWT válido.
- Cada usuario solo consulta sus propias notificaciones.
- Sin token devuelve HTTP 401.
- `Extractor API` devuelve HTTP 403.
- Este endpoint no aparece en Swagger Extractor.

## Ejemplos

```bash
curl -H "Authorization: Bearer $SISCA_TOKEN" \
  "https://sisca.aletechgt.com/api/notificaciones?page=2&limit=50&sortBy=createdAt&sortDir=desc"

curl -H "Authorization: Bearer $SISCA_TOKEN" \
  "https://sisca.aletechgt.com/api/notificaciones?leida=false&fechaDesde=2026-01-01&fechaHasta=2026-12-31&page=1&limit=25"
```

No registre ni comparta el token.

## Resultado

| Métrica | Antes | Después |
| --- | ---: | ---: |
| Notificaciones accesibles en interfaz para el usuario medido | 50 de 200 | 200 mediante 4 páginas |
| Registros transferidos por petición | 50 | 25, 50, 100 o 250 según selección |
| Tamaño con 50 registros | ~22.8 KB | ~22.8 KB |
| Tiempo HTTP local con 50 registros | 38–39 ms | 38–39 ms |
| Historial completo cargado en Angular | No, pero quedaba inaccesible | No; se consulta página por página |

La optimización corrige accesibilidad y navegación sin aumentar la transferencia por petición.

## Operaciones de lectura

Marcar una notificación como leída conserva página y filtros. Si se está mostrando el filtro `No leídas`, se recarga solamente la página actual y se retrocede si queda fuera del nuevo rango. Marcar todas como leídas también recarga únicamente la página actual. El contador global se mantiene mediante el servicio compartido de resumen.

No se modificaron datos para validar esta implementación, ni se ejecutaron seeds o migraciones.
