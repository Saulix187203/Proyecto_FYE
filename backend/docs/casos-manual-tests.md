# Pruebas manuales de casos y expedientes

Inicia la API con `npm run dev`. En PowerShell usa `curl.exe` para evitar el alias de `Invoke-WebRequest`.

## 1. Obtener token

```powershell
curl.exe -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"correo":"admin@sisca.com","password":"Admin123*"}'

$token = "PEGA_AQUI_DATA_TOKEN"
```

## 2. Consultar catálogos

```powershell
curl.exe http://localhost:3000/api/catalogos/areas -H "Authorization: Bearer $token"
curl.exe http://localhost:3000/api/catalogos/procesos -H "Authorization: Bearer $token"
curl.exe http://localhost:3000/api/catalogos/tipos-evento -H "Authorization: Bearer $token"
curl.exe http://localhost:3000/api/catalogos/criticidades -H "Authorization: Bearer $token"
curl.exe http://localhost:3000/api/catalogos/estados-caso -H "Authorization: Bearer $token"
curl.exe http://localhost:3000/api/catalogos/estados-accion -H "Authorization: Bearer $token"
```

Usa ids devueltos por estos endpoints. El `idArea` debe coincidir con `proceso.area.id`.

## 3. Crear caso

```powershell
curl.exe -X POST http://localhost:3000/api/casos `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"idArea":1,"idProceso":1,"idTipoEvento":1,"idCriticidad":1,"fechaEvento":"2026-07-03T08:00:00.000Z","lugar":"Bodega principal","descripcion":"Se observó una condición insegura cerca del área de carga."}'
```

El campo `titulo` es opcional; cuando se omite se genera desde la descripción. Conserva el `data.caso.id` retornado:

```powershell
$idCaso = 1
```

## 4. Listar y filtrar casos

```powershell
curl.exe "http://localhost:3000/api/casos" -H "Authorization: Bearer $token"
curl.exe "http://localhost:3000/api/casos?estado=Reportado&area=1&criticidad=1&fechaDesde=2026-07-01T00:00:00.000Z&fechaHasta=2026-07-31T23:59:59.999Z&texto=SISCA" `
  -H "Authorization: Bearer $token"
```

`estado`, `area` y `criticidad` aceptan id o nombre.

## 5. Obtener y actualizar un caso

```powershell
curl.exe "http://localhost:3000/api/casos/$idCaso" `
  -H "Authorization: Bearer $token"

curl.exe -X PUT "http://localhost:3000/api/casos/$idCaso" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"lugar":"Bodega principal, área de carga","descripcion":"Descripción actualizada del caso."}'
```

Este endpoint rechaza campos de estado. Los cambios de workflow se implementarán en una fase posterior.

## 6. Crear o actualizar reporte inicial

```powershell
curl.exe -X POST http://localhost:3000/api/reportes-iniciales `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d "{\"idCaso\":$idCaso,\"descripcionDetallada\":\"Descripción ampliada del evento.\",\"condicionDetectada\":\"Piso mojado sin señalización.\",\"accionInmediata\":\"Se colocó señalización temporal.\",\"observaciones\":\"Pendiente revisión por SYMA.\"}"

curl.exe "http://localhost:3000/api/reportes-iniciales/caso/$idCaso" `
  -H "Authorization: Bearer $token"
```

Enviar nuevamente `POST /api/reportes-iniciales` para el mismo caso actualiza el reporte existente.

## 7. Consultar expediente

```powershell
curl.exe "http://localhost:3000/api/expedientes/$idCaso" `
  -H "Authorization: Bearer $token"
```

## 8. Acceso sin token

```powershell
curl.exe http://localhost:3000/api/casos
```

Debe responder `401`.

## 9. Rol no autorizado

Inicia sesión con un usuario cuyo único rol sea `Gerencia` y usa su token:

```powershell
$tokenSinPermiso = "TOKEN_DE_USUARIO_GERENCIA"

curl.exe -X POST http://localhost:3000/api/casos `
  -H "Authorization: Bearer $tokenSinPermiso" `
  -H "Content-Type: application/json" `
  -d '{"idArea":1,"idProceso":1,"idTipoEvento":1,"idCriticidad":1,"fechaEvento":"2026-07-03T08:00:00.000Z","lugar":"Prueba","descripcion":"Intento sin permisos."}'
```

Debe responder `403`.
