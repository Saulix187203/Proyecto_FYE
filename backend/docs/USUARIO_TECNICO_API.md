# Usuario técnico para extracción por API

## Objetivo

El rol `Extractor API` permite consultar información de SISCA mediante JWT sin usar una cuenta
administradora. Es un rol técnico de solo lectura: no administra usuarios o roles, no modifica
datos y no accede a notificaciones personales ni a evidencias.

El seed crea la cuenta sugerida `tecnico.api@sisca.com`, activa y asociada exclusivamente con el
rol `Extractor API`. No comparta una cuenta administradora con integraciones o consumidores
externos.

## Configurar y crear la cuenta

Antes de ejecutar el seed, configure una contraseña propia del entorno mediante
`API_EXTRACTOR_PASSWORD`. No guarde el valor real en documentación, código fuente ni control de
versiones.

Ejemplo para la sesión actual de PowerShell:

```powershell
$env:API_EXTRACTOR_PASSWORD = Read-Host "Contraseña del usuario técnico"
cd backend
npm run db:seed
```

El seed es idempotente: crea o actualiza el rol y la cuenta sin duplicarlos. También asegura que
la cuenta técnica tenga únicamente el rol `Extractor API`. Si la variable no existe, el seed usa
una contraseña temporal conocida únicamente para desarrollo y muestra una advertencia sin
imprimirla. Cambie esa contraseña antes de habilitar el acceso en cualquier entorno real.

Cada ejecución de `npm run db:seed` actualiza el hash de la cuenta técnica con el valor vigente de
`API_EXTRACTOR_PASSWORD` (o con la alternativa temporal de desarrollo). Por ello, ejecute el seed
con la variable correcta del entorno.

## Autenticación

1. Envíe las credenciales técnicas a `POST /api/auth/login`.
2. Copie `data.token` de la respuesta.
3. Envíe el token en `Authorization: Bearer TOKEN`.
4. Renueve el token repitiendo el login cuando expire.

Ejemplo en PowerShell, sin exponer la contraseña en el script:

```powershell
$baseUrl = "http://localhost:3000/api"
$loginBody = @{
  correo = "tecnico.api@sisca.com"
  password = $env:API_EXTRACTOR_PASSWORD
} | ConvertTo-Json

$login = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/login" `
  -ContentType "application/json" -Body $loginBody
$headers = @{ Authorization = "Bearer $($login.data.token)" }

Invoke-RestMethod -Uri "$baseUrl/auth/me" -Headers $headers
```

Entregue preferentemente al técnico la documentación específica en `/api/docs/extractor`, no la
documentación completa. Allí debe ejecutar primero `POST /auth/login`, copiar `data.token`,
seleccionar **Authorize** y pegar únicamente el token. Swagger agrega el prefijo `Bearer`.

La vista del extractor muestra solo las operaciones autorizadas para facilitar un uso seguro, pero
no sustituye los permisos reales: los guards y middleware del backend continúan aplicándose aunque
alguien invoque directamente una ruta que no aparece en Swagger.

## Extracción paginada de casos

`GET /api/casos` usa `page=1` y `limit=50` por defecto. `limit` debe ser un entero entre 1 y 1,000;
un valor mayor devuelve HTTP `400`.

```powershell
Invoke-RestMethod -Uri "$baseUrl/casos?page=1&limit=50" -Headers $headers
```

Para recorrer todas las páginas, procese cada lote antes de solicitar el siguiente:

```powershell
$page = 1
$limit = 1000

do {
  $response = Invoke-RestMethod `
    -Uri "$baseUrl/casos?page=$page&limit=$limit&sortBy=id&sortDir=asc" `
    -Headers $headers

  $response.data.casos | ForEach-Object {
    # Persistir o procesar el registro sin acumular todo el histórico en memoria.
    $_
  }

  $hasNextPage = $response.data.pagination.hasNextPage
  $page++
} while ($hasNextPage)
```

Use filtros por fecha, brigada o catálogo cuando no necesite todo el histórico. Para más detalles,
consulte `docs/API_EXTRACCION_ALTO_VOLUMEN.md`.

## Endpoints permitidos

Autenticación:

- `POST /api/auth/login`
- `GET /api/auth/me`

Catálogos:

- `GET /api/catalogos/areas`
- `GET /api/catalogos/procesos`
- `GET /api/catalogos/tipos-evento`
- `GET /api/catalogos/criticidades`
- `GET /api/catalogos/estados-caso`
- `GET /api/catalogos/estados-accion`
- `GET /api/catalogos/regiones`
- `GET /api/catalogos/departamentos`
- `GET /api/catalogos/municipios`
- `GET /api/catalogos/tipos-brigada`

Casos y expedientes:

- `GET /api/casos`
- `GET /api/casos/:id`
- `GET /api/expedientes/:idCaso`

Acciones correctivas:

- `GET /api/acciones-correctivas`
- `GET /api/acciones-correctivas/caso/:idCaso`
- `GET /api/acciones-correctivas/:id`

Brigadas:

- `GET /api/brigadas`
- `GET /api/brigadas/:id`
- `GET /api/brigadas/:id/miembros`

Dashboard:

- `GET /api/dashboard/resumen`
- `GET /api/dashboard/casos-por-estado`
- `GET /api/dashboard/casos-por-area`
- `GET /api/dashboard/casos-por-criticidad`
- `GET /api/dashboard/acciones-vencidas`
- `GET /api/dashboard/ultimos-casos`
- `GET /api/dashboard/brigadas/resumen`
- `GET /api/dashboard/brigadas/casos-por-region`
- `GET /api/dashboard/brigadas/casos-por-departamento`
- `GET /api/dashboard/brigadas/casos-por-municipio`
- `GET /api/dashboard/brigadas/casos-por-brigada`
- `GET /api/dashboard/brigadas/integrantes-por-brigada`
- `GET /api/dashboard/brigadas/casos-abiertos-por-brigada`

`GET /api/health` continúa siendo público y no requiere el rol.

## Endpoints no permitidos

El usuario técnico recibe HTTP `403` en las operaciones protegidas fuera de su alcance, entre
ellas:

- creación o modificación de casos;
- creación, modificación, eliminación o gestión de miembros de brigadas;
- creación, modificación, inicio, envío a validación, cierre o devolución de acciones correctivas;
- cierre o devolución de casos;
- validaciones de procedencia y reportes iniciales;
- administración de usuarios y roles;
- notificaciones personales, incluso sus operaciones de lectura/marcado;
- listado, carga y descarga de evidencias;
- `GET /api/brigadas/mis-brigadas`;
- cualquier `PUT` o `DELETE` disponible en la API.

La descarga de evidencias no se habilita por defecto. Si aparece una necesidad real, debe
diseñarse y revisarse como un permiso separado, con controles de confidencialidad y auditoría.

## Entrega segura del acceso

- Defina `API_EXTRACTOR_PASSWORD` con una contraseña exclusiva y robusta antes del seed final.
- Entregue la contraseña por un canal seguro y solicite su cambio o rotación antes del uso real.
- No reutilice ni comparta credenciales de `Administrador`.
- Restrinja red, CORS, vigencia de JWT y frecuencia de extracción según el entorno.
- Rote la contraseña y vuelva a ejecutar el seed si se sospecha exposición.
