# Pruebas manuales de validación de procedencia

Inicia la API con `npm run dev`. Los ejemplos usan `curl.exe` desde PowerShell.

## Preparación

Obtén un token de un usuario con rol `Administrador`, `PRL Contratista` o `SYMA`:

```powershell
curl.exe -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"correo":"admin@sisca.com","password":"Admin123*"}'

$token = "PEGA_AQUI_DATA_TOKEN"
$idCaso = 1
```

El caso debe crearse previamente mediante `POST /api/casos` y comenzar en estado `Reportado`.

## Iniciar revisión

```powershell
curl.exe -X POST "http://localhost:3000/api/validaciones-procedencia/$idCaso/iniciar-revision" `
  -H "Authorization: Bearer $token"
```

Solo se permite desde `Reportado` o `Devuelto`; el nuevo estado será `En revisión`.

## Aprobar

```powershell
curl.exe -X POST "http://localhost:3000/api/validaciones-procedencia/$idCaso/aprobar" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"observaciones":"El caso procede como casi-accidente."}'
```

## Devolver

Usa otro caso en estado `En revisión`:

```powershell
curl.exe -X POST "http://localhost:3000/api/validaciones-procedencia/$idCaso/devolver" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"observaciones":"Falta ampliar la descripción del evento."}'
```

Las observaciones son obligatorias y también se registran como comentario del expediente. Un caso devuelto puede volver a `En revisión`.

## Rechazar

Con un caso en estado `En revisión`:

```powershell
curl.exe -X POST "http://localhost:3000/api/validaciones-procedencia/$idCaso/rechazar" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"observaciones":"El evento no aplica como casi-accidente."}'
```

## Consultar validaciones

```powershell
curl.exe "http://localhost:3000/api/validaciones-procedencia/caso/$idCaso" `
  -H "Authorization: Bearer $token"
```

El resultado se ordena desde la validación más reciente.

## Validar bitácora en el expediente

```powershell
curl.exe "http://localhost:3000/api/expedientes/$idCaso" `
  -H "Authorization: Bearer $token"
```

Revisa `data.expediente.bitacora`, `validacionesProcedencia` y `comentariosObservacion`.

## Aprobar sin token

```powershell
curl.exe -X POST "http://localhost:3000/api/validaciones-procedencia/$idCaso/aprobar" `
  -H "Content-Type: application/json" `
  -d '{"observaciones":"Prueba sin token."}'
```

Debe responder `401`.

## Aprobar con rol no autorizado

Usa el token de un usuario cuyo único rol sea, por ejemplo, `Gerencia`:

```powershell
$tokenSinPermiso = "TOKEN_USUARIO_GERENCIA"

curl.exe -X POST "http://localhost:3000/api/validaciones-procedencia/$idCaso/aprobar" `
  -H "Authorization: Bearer $tokenSinPermiso" `
  -H "Content-Type: application/json" `
  -d '{"observaciones":"Prueba sin rol autorizado."}'
```

Debe responder `403`.

## Aprobar fuera de revisión

Intenta aprobar un caso en estado `Reportado`, `Aprobado`, `Rechazado` o cualquier estado distinto de `En revisión`:

```powershell
curl.exe -X POST "http://localhost:3000/api/validaciones-procedencia/$idCaso/aprobar" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"observaciones":"Esta transición no debe permitirse."}'
```

Debe responder `400` sin crear validación ni bitácora.
