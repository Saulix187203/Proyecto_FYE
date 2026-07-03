# Pruebas manuales de cierre, notificaciones y dashboard

Inicia la API con `npm run dev` y define un token autorizado:

```powershell
$token = "PEGA_AQUI_DATA_TOKEN"
$idCaso = 1
```

## Cerrar caso con acciones

El caso debe estar `En validación`, tener al menos una acción y todas deben estar `Cerrada`.

```powershell
curl.exe -X POST "http://localhost:3000/api/cierre-casos/$idCaso/cerrar" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"observaciones":"Caso cerrado formalmente luego de validar acciones y evidencias."}'
```

## Cerrar caso sin acciones

El caso debe estar `Aprobado` y no tener acciones activas.

```powershell
curl.exe -X POST "http://localhost:3000/api/cierre-casos/$idCaso/cerrar-sin-acciones" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"observaciones":"Caso cerrado sin acciones porque no aplica seguimiento adicional."}'
```

## Devolver cierre

El caso debe estar `En validación`. Las observaciones son obligatorias.

```powershell
curl.exe -X POST "http://localhost:3000/api/cierre-casos/$idCaso/devolver-cierre" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"observaciones":"Se requiere ampliar la evidencia antes del cierre formal."}'
```

El caso vuelve a `Con acciones`, se crea un comentario y se notifica a los responsables.

## Listar notificaciones

```powershell
curl.exe http://localhost:3000/api/notificaciones `
  -H "Authorization: Bearer $token"

curl.exe "http://localhost:3000/api/notificaciones?leida=false" `
  -H "Authorization: Bearer $token"
```

El filtro `leida` solo acepta `true` o `false`.

## Marcar una notificación como leída

```powershell
$idNotificacion = 1
curl.exe -X PUT "http://localhost:3000/api/notificaciones/$idNotificacion/leida" `
  -H "Authorization: Bearer $token"
```

Solo el propietario puede modificarla.

## Marcar todas como leídas

```powershell
curl.exe -X PUT http://localhost:3000/api/notificaciones/marcar-todas-leidas `
  -H "Authorization: Bearer $token"
```

## Resumen de notificaciones

```powershell
curl.exe http://localhost:3000/api/notificaciones/resumen `
  -H "Authorization: Bearer $token"
```

Devuelve `total` y `noLeidas`.

## Dashboard

```powershell
curl.exe http://localhost:3000/api/dashboard/resumen -H "Authorization: Bearer $token"
curl.exe http://localhost:3000/api/dashboard/casos-por-estado -H "Authorization: Bearer $token"
curl.exe http://localhost:3000/api/dashboard/casos-por-area -H "Authorization: Bearer $token"
curl.exe http://localhost:3000/api/dashboard/casos-por-criticidad -H "Authorization: Bearer $token"
curl.exe http://localhost:3000/api/dashboard/acciones-vencidas -H "Authorization: Bearer $token"
curl.exe "http://localhost:3000/api/dashboard/ultimos-casos?limit=10" -H "Authorization: Bearer $token"
```

`casosAbiertos` excluye los estados terminales `Cerrado` y `Rechazado`. `limit` acepta valores entre 1 y 100.

## Sin token

```powershell
curl.exe http://localhost:3000/api/dashboard/resumen
```

Debe responder `401`.

## Rol no autorizado

Usa un token de un usuario cuyo único rol sea `Brigada` o `Responsable del Proceso`:

```powershell
$tokenSinPermiso = "TOKEN_SIN_ROL_AUTORIZADO"
curl.exe http://localhost:3000/api/dashboard/resumen `
  -H "Authorization: Bearer $tokenSinPermiso"
```

Debe responder `403`.

## Validar bitácora y expediente

```powershell
curl.exe "http://localhost:3000/api/expedientes/$idCaso" `
  -H "Authorization: Bearer $token"
```

Revisa los eventos `CIERRE_FORMAL_CASO`, `CIERRE_CASO_SIN_ACCIONES` o `DEVOLUCION_CIERRE_CASO`, además de comentarios, acciones, evidencias y notificaciones.
