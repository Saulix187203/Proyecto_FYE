# Pruebas manuales - Brigadas Operativas

Base local:

```powershell
$baseUrl = "http://localhost:3000/api"
```

## Catálogo geográfico

El seed carga las cinco regiones operativas usadas por SISCA, los 22 departamentos de Guatemala y sus 340 municipios. La distribución operativa es:

| Región | Departamentos |
| --- | --- |
| Norte | Petén, Alta Verapaz y Baja Verapaz |
| Occidente | Huehuetenango, Quiché, San Marcos, Quetzaltenango, Totonicapán y Sololá |
| Centro | Guatemala, Sacatepéquez y Chimaltenango |
| Sur | Escuintla, Santa Rosa, Suchitepéquez y Retalhuleu |
| Oriente | Zacapa, Chiquimula, Jalapa, Jutiapa, El Progreso e Izabal |

La jerarquía persistida es `Region -> Departamento -> Municipio`. Cada registro cargado queda activo y usa códigos legibles como `NORTE`, `PET` y `PET-FLORES`. El archivo `prisma/data/geografia-guatemala.js` concentra los datos para facilitar ampliaciones o correcciones sin modificar la lógica del seed.

La carga es idempotente: regiones se identifican por nombre, departamentos por región y nombre, y municipios por departamento y nombre. Al ejecutar el seed nuevamente se actualizan código y estado activo sin cambiar los IDs ni eliminar registros existentes.

```powershell
npm run db:seed
npm run db:seed
```

Después de obtener un token, valide la navegación encadenada con los endpoints:

```powershell
$regiones = (Invoke-RestMethod "$baseUrl/catalogos/regiones" `
  -Headers @{ Authorization = "Bearer $token" }).data

foreach ($region in $regiones) {
  $departamentos = (Invoke-RestMethod "$baseUrl/catalogos/departamentos?regionId=$($region.id)" `
    -Headers @{ Authorization = "Bearer $token" }).data

  foreach ($departamento in $departamentos) {
    $municipios = (Invoke-RestMethod "$baseUrl/catalogos/municipios?departamentoId=$($departamento.id)" `
      -Headers @{ Authorization = "Bearer $token" }).data
    "{0} / {1}: {2} municipios" -f $region.nombre, $departamento.nombre, $municipios.Count
  }
}
```

El resultado esperado es 5 regiones, 22 departamentos y 340 municipios activos dentro del catálogo cargado.

## Obtener token

```powershell
$login = curl.exe -s -X POST "$baseUrl/auth/login" `
  -H "Content-Type: application/json" `
  -d "{\"correo\":\"admin@sisca.com\",\"password\":\"Admin123*\"}" | ConvertFrom-Json

$token = $login.data.token
```

## Listar regiones

```powershell
curl.exe -s "$baseUrl/catalogos/regiones" `
  -H "Authorization: Bearer $token"
```

## Listar departamentos por region

Use un `id` devuelto por regiones.

```powershell
$regionId = 1

curl.exe -s "$baseUrl/catalogos/departamentos?regionId=$regionId" `
  -H "Authorization: Bearer $token"
```

## Listar municipios por departamento

Use un `id` devuelto por departamentos.

```powershell
$departamentoId = 1

curl.exe -s "$baseUrl/catalogos/municipios?departamentoId=$departamentoId" `
  -H "Authorization: Bearer $token"
```

## Listar tipos de brigada

```powershell
curl.exe -s "$baseUrl/catalogos/tipos-brigada" `
  -H "Authorization: Bearer $token"
```

## Crear brigada

Ajuste los ids segun los catalogos de su base local.

```powershell
$body = @{
  numero = "PET-001"
  nombre = "Brigada Peten 1"
  tipoBrigadaId = 1
  regionId = 1
  departamentoId = 1
  municipioId = 1
} | ConvertTo-Json

$created = curl.exe -s -X POST "$baseUrl/brigadas" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $body | ConvertFrom-Json

$brigadaId = $created.data.brigada.id
$created
```

## Listar brigadas

```powershell
curl.exe -s "$baseUrl/brigadas?activo=true&texto=PET" `
  -H "Authorization: Bearer $token"
```

Filtros disponibles:

```text
activo=true|false
tipoBrigadaId=1
regionId=1
departamentoId=1
municipioId=1
texto=PET
```

## Consultar brigada por id

```powershell
curl.exe -s "$baseUrl/brigadas/$brigadaId" `
  -H "Authorization: Bearer $token"
```

## Editar brigada

```powershell
$updateBody = @{
  nombre = "Brigada Peten 1 actualizada"
  numero = "PET-001"
} | ConvertTo-Json

curl.exe -s -X PUT "$baseUrl/brigadas/$brigadaId" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $updateBody
```

## Desactivar brigada

```powershell
curl.exe -s -X DELETE "$baseUrl/brigadas/$brigadaId" `
  -H "Authorization: Bearer $token"
```

## Probar creacion sin token

```powershell
curl.exe -s -X POST "$baseUrl/brigadas" `
  -H "Content-Type: application/json" `
  -d "{\"numero\":\"SIN-TOKEN\",\"nombre\":\"Sin token\",\"tipoBrigadaId\":1,\"regionId\":1}"
```

Debe responder `401`.

## Probar creacion con rol no autorizado

Inicie sesion con un usuario que no tenga rol `Administrador`.

```powershell
$loginNoAdmin = curl.exe -s -X POST "$baseUrl/auth/login" `
  -H "Content-Type: application/json" `
  -d "{\"correo\":\"usuario.noadmin@sisca.com\",\"password\":\"Temporal123*\"}" | ConvertFrom-Json

$tokenNoAdmin = $loginNoAdmin.data.token

curl.exe -s -X POST "$baseUrl/brigadas" `
  -H "Authorization: Bearer $tokenNoAdmin" `
  -H "Content-Type: application/json" `
  -d "{\"numero\":\"NOADMIN-001\",\"nombre\":\"No autorizada\",\"tipoBrigadaId\":1,\"regionId\":1}"
```

Debe responder `403`.

## Crear caso sin brigada

Use ids validos de area, proceso, tipo de evento y criticidad.

```powershell
$casoSinBrigadaBody = @{
  idArea = 1
  idProceso = 1
  idTipoEvento = 1
  idCriticidad = 1
  fechaEvento = "2026-07-21T08:00:00.000Z"
  lugar = "Bodega principal"
  descripcion = "Caso creado sin brigada reportante para validar compatibilidad."
} | ConvertTo-Json

$casoSinBrigada = curl.exe -s -X POST "$baseUrl/casos" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $casoSinBrigadaBody | ConvertFrom-Json

$casoSinBrigada.data.caso.brigadaReportante
```

Debe permitir la creacion. Si el usuario autenticado pertenece a una sola brigada activa, puede autoasignarse.

## Crear caso con idBrigadaReportante

```powershell
$casoConBrigadaBody = @{
  idArea = 1
  idProceso = 1
  idTipoEvento = 1
  idCriticidad = 1
  idBrigadaReportante = $brigadaId
  fechaEvento = "2026-07-21T09:00:00.000Z"
  lugar = "Area operativa"
  descripcion = "Caso creado con brigada reportante."
} | ConvertTo-Json

$casoConBrigada = curl.exe -s -X POST "$baseUrl/casos" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $casoConBrigadaBody | ConvertFrom-Json

$casoId = $casoConBrigada.data.caso.id
$casoConBrigada.data.caso.brigadaReportante
```

Debe devolver la brigada reportante con tipo, region, departamento y municipio.

## Crear caso con asignacion automatica por una sola brigada

Inicie sesion con un usuario que sea miembro activo de exactamente una brigada activa.

```powershell
$loginMiembro = curl.exe -s -X POST "$baseUrl/auth/login" `
  -H "Content-Type: application/json" `
  -d "{\"correo\":\"miembro.brigada@sisca.com\",\"password\":\"Temporal123*\"}" | ConvertFrom-Json

$tokenMiembro = $loginMiembro.data.token

$casoAutoBody = @{
  idArea = 1
  idProceso = 1
  idTipoEvento = 1
  idCriticidad = 1
  fechaEvento = "2026-07-21T10:00:00.000Z"
  lugar = "Area operativa"
  descripcion = "Caso creado para validar asignacion automatica de brigada."
} | ConvertTo-Json

curl.exe -s -X POST "$baseUrl/casos" `
  -H "Authorization: Bearer $tokenMiembro" `
  -H "Content-Type: application/json" `
  -d $casoAutoBody
```

Debe asignar la brigada activa del usuario si tiene exactamente una.

## Intentar crear caso con brigada inexistente

```powershell
$casoBrigadaInexistenteBody = @{
  idArea = 1
  idProceso = 1
  idTipoEvento = 1
  idCriticidad = 1
  idBrigadaReportante = 999999
  fechaEvento = "2026-07-21T11:00:00.000Z"
  lugar = "Area operativa"
  descripcion = "Caso con brigada inexistente."
} | ConvertTo-Json

curl.exe -s -X POST "$baseUrl/casos" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $casoBrigadaInexistenteBody
```

Debe responder `404`.

## Intentar crear caso con brigada inactiva

Use el id de una brigada desactivada.

```powershell
$brigadaInactivaId = 999

$casoBrigadaInactivaBody = @{
  idArea = 1
  idProceso = 1
  idTipoEvento = 1
  idCriticidad = 1
  idBrigadaReportante = $brigadaInactivaId
  fechaEvento = "2026-07-21T12:00:00.000Z"
  lugar = "Area operativa"
  descripcion = "Caso con brigada inactiva."
} | ConvertTo-Json

curl.exe -s -X POST "$baseUrl/casos" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $casoBrigadaInactivaBody
```

Debe responder `404`.

## Intentar crear caso con usuario Brigada que no pertenece a esa brigada

Inicie sesion con un usuario con rol `Brigada` que no sea miembro activo de la brigada enviada.

```powershell
$loginBrigadaNoMiembro = curl.exe -s -X POST "$baseUrl/auth/login" `
  -H "Content-Type: application/json" `
  -d "{\"correo\":\"brigada.no.miembro@sisca.com\",\"password\":\"Temporal123*\"}" | ConvertFrom-Json

$tokenBrigadaNoMiembro = $loginBrigadaNoMiembro.data.token

curl.exe -s -X POST "$baseUrl/casos" `
  -H "Authorization: Bearer $tokenBrigadaNoMiembro" `
  -H "Content-Type: application/json" `
  -d $casoConBrigadaBody
```

Debe responder `403`.

## Listar casos y verificar brigadaReportante

```powershell
curl.exe -s "$baseUrl/casos" `
  -H "Authorization: Bearer $token"
```

Los casos con brigada deben incluir `brigadaReportante`.

## Filtrar casos por brigada

```powershell
curl.exe -s "$baseUrl/casos?brigada=$brigadaId" `
  -H "Authorization: Bearer $token"
```

## Filtrar casos por region

```powershell
curl.exe -s "$baseUrl/casos?region=$regionId" `
  -H "Authorization: Bearer $token"
```

## Filtrar casos por departamento

```powershell
curl.exe -s "$baseUrl/casos?departamento=$departamentoId" `
  -H "Authorization: Bearer $token"
```

## Filtrar casos por municipio

```powershell
curl.exe -s "$baseUrl/casos?municipio=1" `
  -H "Authorization: Bearer $token"
```

## Filtrar casos por tipoBrigada

```powershell
curl.exe -s "$baseUrl/casos?tipoBrigada=1" `
  -H "Authorization: Bearer $token"
```

## Consultar detalle de caso y verificar brigadaReportante

```powershell
curl.exe -s "$baseUrl/casos/$casoId" `
  -H "Authorization: Bearer $token"
```

Debe incluir `brigadaReportante`.

## Actualizar brigada reportante de un caso

```powershell
$updateCasoBrigadaBody = @{
  idBrigadaReportante = $brigadaId
} | ConvertTo-Json

curl.exe -s -X PUT "$baseUrl/casos/$casoId" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $updateCasoBrigadaBody
```

## Limpiar brigada reportante de un caso

Solo roles autorizados como `Administrador`, `PRL Contratista` o `SYMA`.

```powershell
$clearCasoBrigadaBody = @{
  idBrigadaReportante = $null
} | ConvertTo-Json

curl.exe -s -X PUT "$baseUrl/casos/$casoId" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $clearCasoBrigadaBody
```

## Consultar expediente y verificar brigadaReportante

```powershell
curl.exe -s "$baseUrl/expedientes/$casoId" `
  -H "Authorization: Bearer $token"
```

Debe incluir `brigadaReportante` dentro de `data.expediente.datosGenerales`.

## Probar municipio sin departamento

```powershell
curl.exe -s -X POST "$baseUrl/brigadas" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d "{\"numero\":\"ERR-MUN\",\"nombre\":\"Municipio sin departamento\",\"tipoBrigadaId\":1,\"regionId\":1,\"municipioId\":1}"
```

Debe responder `400` con mensaje indicando que `municipioId` requiere `departamentoId`.

## Probar departamento que no pertenece a region

Use un `regionId` y un `departamentoId` de regiones distintas.

```powershell
curl.exe -s -X POST "$baseUrl/brigadas" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d "{\"numero\":\"ERR-DEP\",\"nombre\":\"Departamento region incorrecta\",\"tipoBrigadaId\":1,\"regionId\":1,\"departamentoId\":3}"
```

Debe responder `400` con mensaje indicando que el departamento no pertenece a la region.

## Probar numero duplicado

Ejecute dos veces el mismo payload con la misma ubicacion, tipo y numero.

```powershell
$duplicateBody = @{
  numero = "DUP-001"
  nombre = "Brigada duplicada"
  tipoBrigadaId = 1
  regionId = 1
  departamentoId = 1
  municipioId = 1
} | ConvertTo-Json

curl.exe -s -X POST "$baseUrl/brigadas" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $duplicateBody

curl.exe -s -X POST "$baseUrl/brigadas" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $duplicateBody
```

La segunda llamada debe responder `400` con mensaje de duplicado.

## Listar miembros de una brigada

Use una brigada activa creada previamente.

```powershell
curl.exe -s "$baseUrl/brigadas/$brigadaId/miembros" `
  -H "Authorization: Bearer $token"
```

Filtro opcional:

```powershell
curl.exe -s "$baseUrl/brigadas/$brigadaId/miembros?activo=true" `
  -H "Authorization: Bearer $token"
```

## Agregar miembro

Use un `id` de usuario activo. Puede usar el administrador inicial para una prueba rapida.

```powershell
$usuarioId = 1

$miembroBody = @{
  idUsuario = $usuarioId
  cargoEnBrigada = "Integrante"
  esLider = $false
  fechaDesde = "2026-07-21T00:00:00.000Z"
} | ConvertTo-Json

$createdMember = curl.exe -s -X POST "$baseUrl/brigadas/$brigadaId/miembros" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $miembroBody | ConvertFrom-Json

$miembroId = $createdMember.data.miembro.id
$createdMember
```

## Intentar agregar miembro duplicado activo

```powershell
curl.exe -s -X POST "$baseUrl/brigadas/$brigadaId/miembros" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $miembroBody
```

Debe responder `400` indicando que el usuario ya es miembro activo de esa brigada.

## Agregar lider

Use otro usuario activo.

```powershell
$liderBody = @{
  idUsuario = 2
  cargoEnBrigada = "Lider"
  esLider = $true
  fechaDesde = "2026-07-21T00:00:00.000Z"
} | ConvertTo-Json

$createdLeader = curl.exe -s -X POST "$baseUrl/brigadas/$brigadaId/miembros" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $liderBody | ConvertFrom-Json

$liderId = $createdLeader.data.miembro.id
$createdLeader
```

## Intentar agregar segundo lider activo

Use un tercer usuario activo.

```powershell
$segundoLiderBody = @{
  idUsuario = 3
  cargoEnBrigada = "Lider suplente"
  esLider = $true
  fechaDesde = "2026-07-21T00:00:00.000Z"
} | ConvertTo-Json

curl.exe -s -X POST "$baseUrl/brigadas/$brigadaId/miembros" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $segundoLiderBody
```

Debe responder `400` indicando que ya existe un lider activo.

## Editar cargo de miembro

```powershell
$updateMemberBody = @{
  cargoEnBrigada = "Coordinador"
} | ConvertTo-Json

curl.exe -s -X PUT "$baseUrl/brigadas/$brigadaId/miembros/$miembroId" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $updateMemberBody
```

## Desactivar miembro

```powershell
curl.exe -s -X DELETE "$baseUrl/brigadas/$brigadaId/miembros/$miembroId" `
  -H "Authorization: Bearer $token"
```

Debe responder con `activo=false` y `fechaHasta` asignada.

## Consultar mis brigadas

Inicie sesion con el usuario agregado como miembro activo. Si uso el administrador inicial:

```powershell
curl.exe -s "$baseUrl/brigadas/mis-brigadas" `
  -H "Authorization: Bearer $token"
```

Debe devolver brigadas activas donde el usuario autenticado tenga membresia activa.

## Probar miembros sin token

```powershell
curl.exe -s "$baseUrl/brigadas/$brigadaId/miembros"
```

Debe responder `401`.

## Probar crear miembro con rol no autorizado

Inicie sesion con un usuario que no tenga rol `Administrador`.

```powershell
curl.exe -s -X POST "$baseUrl/brigadas/$brigadaId/miembros" `
  -H "Authorization: Bearer $tokenNoAdmin" `
  -H "Content-Type: application/json" `
  -d $miembroBody
```

Debe responder `403`.

## Probar editar miembro con rol no autorizado

```powershell
curl.exe -s -X PUT "$baseUrl/brigadas/$brigadaId/miembros/$miembroId" `
  -H "Authorization: Bearer $tokenNoAdmin" `
  -H "Content-Type: application/json" `
  -d $updateMemberBody
```

Debe responder `403`.

## Probar eliminar miembro con rol no autorizado

```powershell
curl.exe -s -X DELETE "$baseUrl/brigadas/$brigadaId/miembros/$miembroId" `
  -H "Authorization: Bearer $tokenNoAdmin"
```

Debe responder `403`.
