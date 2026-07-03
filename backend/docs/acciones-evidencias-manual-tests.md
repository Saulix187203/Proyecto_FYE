# Pruebas manuales de acciones correctivas y evidencias

Inicia la API con `npm run dev` y obtén un token JWT. El caso usado debe estar en estado `Aprobado`.

```powershell
$token = "PEGA_AQUI_DATA_TOKEN"
$idCaso = 1
$idResponsable = 1
```

## Crear acción correctiva

`POST /api/acciones-correctivas`

```json
{
  "idCaso": 1,
  "descripcion": "Colocar señalización permanente en el área de carga.",
  "idResponsable": 1,
  "fechaCompromiso": "2026-07-10T18:00:00.000Z"
}
```

El resultado inicia en `Pendiente` y el caso pasa de `Aprobado` a `Con acciones`. Conserva `data.accion.id`:

```powershell
$idAccion = 1
```

## Listar y consultar acciones

```powershell
curl.exe "http://localhost:3000/api/acciones-correctivas/caso/$idCaso" `
  -H "Authorization: Bearer $token"

curl.exe "http://localhost:3000/api/acciones-correctivas/$idAccion" `
  -H "Authorization: Bearer $token"
```

## Actualizar acción

`PUT /api/acciones-correctivas/:id`

```json
{
  "descripcion": "Nueva descripción de la acción.",
  "idResponsable": 1,
  "fechaCompromiso": "2026-07-15T18:00:00.000Z",
  "observaciones": "Se ajusta fecha por disponibilidad del área."
}
```

## Iniciar acción

```powershell
curl.exe -X POST "http://localhost:3000/api/acciones-correctivas/$idAccion/iniciar" `
  -H "Authorization: Bearer $token"
```

## Subir evidencia al caso

En Postman usa `Body → form-data`:

- `archivo`: tipo File, JPEG, PNG, WEBP o PDF.
- `descripcion`: texto opcional.

```powershell
curl.exe -X POST "http://localhost:3000/api/evidencias/caso/$idCaso" `
  -H "Authorization: Bearer $token" `
  -F "archivo=@C:\ruta\foto.png;type=image/png" `
  -F "descripcion=Vista general del caso"
```

## Subir evidencia a la acción

```powershell
curl.exe -X POST "http://localhost:3000/api/evidencias/accion/$idAccion" `
  -H "Authorization: Bearer $token" `
  -F "archivo=@C:\ruta\evidencia.pdf;type=application/pdf" `
  -F "descripcion=Evidencia de ejecución"
```

## Consultar evidencias

```powershell
curl.exe "http://localhost:3000/api/evidencias/caso/$idCaso" `
  -H "Authorization: Bearer $token"

curl.exe "http://localhost:3000/api/evidencias/accion/$idAccion" `
  -H "Authorization: Bearer $token"
```

## Enviar acción a validación

La acción debe estar `En proceso` o `Devuelta` y tener al menos una evidencia.

```powershell
curl.exe -X POST "http://localhost:3000/api/acciones-correctivas/$idAccion/enviar-validacion" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"observaciones":"Acción ejecutada, se adjuntan evidencias."}'
```

## Devolver acción

Las observaciones son obligatorias y se crea un comentario en el expediente.

```powershell
curl.exe -X POST "http://localhost:3000/api/acciones-correctivas/$idAccion/devolver" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"observaciones":"La evidencia no demuestra que la acción fue completada."}'
```

## Cerrar acción

La acción debe estar `En validación`.

```powershell
curl.exe -X POST "http://localhost:3000/api/acciones-correctivas/$idAccion/cerrar" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"observaciones":"Evidencia validada correctamente."}'
```

Cuando todas las acciones estén cerradas, el caso pasa a `En validación`.

## Descargar evidencia

```powershell
$idEvidencia = 1
curl.exe "http://localhost:3000/api/evidencias/$idEvidencia/descargar" `
  -H "Authorization: Bearer $token" `
  --output evidencia-descargada
```

## Archivo inválido

Intenta cargar un TXT, ejecutable u otro MIME no permitido. Debe responder `400`:

```powershell
curl.exe -X POST "http://localhost:3000/api/evidencias/caso/$idCaso" `
  -H "Authorization: Bearer $token" `
  -F "archivo=@C:\ruta\archivo.txt;type=text/plain"
```

## Archivo mayor de 5 MB

Carga un JPEG, PNG, WEBP o PDF superior a 5 MB. Debe responder `400` con el mensaje del límite.

## Sin token

```powershell
curl.exe "http://localhost:3000/api/evidencias/caso/$idCaso"
```

Debe responder `401`.

## Rol no autorizado

Usa un token de un usuario cuyo único rol sea `Gerencia` para crear acciones o subir evidencias. Debe responder `403` antes de guardar el archivo.

## Validar expediente y bitácora

```powershell
curl.exe "http://localhost:3000/api/expedientes/$idCaso" `
  -H "Authorization: Bearer $token"
```

Revisa `accionesCorrectivas`, `evidencias`, `comentariosObservacion` y `bitacora`.
