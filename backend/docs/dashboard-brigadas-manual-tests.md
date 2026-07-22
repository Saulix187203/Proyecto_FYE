# Pruebas manuales del dashboard de brigadas

Los endpoints requieren uno de los roles `Administrador`, `SYMA`, `Gestión y Control SYMA` o
`Gerencia`. Inicia la API con `npm run dev` antes de ejecutar las pruebas.

## Obtener token

El usuario administrador creado por el seed usa `admin@sisca.com`. Ajusta la contraseña si fue
modificada en tu ambiente.

```powershell
$login = curl.exe -s -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"correo":"admin@sisca.com","password":"Admin123*"}' | ConvertFrom-Json

$token = $login.data.token
```

## Consultar resumen

```powershell
curl.exe http://localhost:3000/api/dashboard/brigadas/resumen `
  -H "Authorization: Bearer $token"
```

`data` contiene `totalBrigadas`, `brigadasActivas`, `brigadasInactivas`,
`totalMiembrosActivos`, `totalCasosConBrigada`, `totalCasosSinBrigada` y
`brigadasConCasosAbiertos`.

## Consultar casos por región

```powershell
curl.exe http://localhost:3000/api/dashboard/brigadas/casos-por-region `
  -H "Authorization: Bearer $token"
```

## Consultar casos por departamento

```powershell
curl.exe http://localhost:3000/api/dashboard/brigadas/casos-por-departamento `
  -H "Authorization: Bearer $token"
```

Las brigadas sin departamento que tengan casos aparecen agrupadas como `Sin departamento`.

## Consultar casos por municipio

```powershell
curl.exe http://localhost:3000/api/dashboard/brigadas/casos-por-municipio `
  -H "Authorization: Bearer $token"
```

Las brigadas sin municipio que tengan casos aparecen agrupadas como `Sin municipio`.

## Consultar casos por brigada

```powershell
curl.exe http://localhost:3000/api/dashboard/brigadas/casos-por-brigada `
  -H "Authorization: Bearer $token"
```

Incluye brigadas sin casos con `totalCasos: 0` y ordena el resultado de mayor a menor.

## Consultar integrantes por brigada

```powershell
curl.exe http://localhost:3000/api/dashboard/brigadas/integrantes-por-brigada `
  -H "Authorization: Bearer $token"
```

Solo cuenta membresías con `activo: true`, separando el total de líderes activos.

## Consultar casos abiertos por brigada

```powershell
curl.exe http://localhost:3000/api/dashboard/brigadas/casos-abiertos-por-brigada `
  -H "Authorization: Bearer $token"
```

Los casos en estado `Cerrado` o `Rechazado` quedan excluidos.

## Filtros opcionales

Todos los endpoints aceptan `region`, `departamento`, `municipio` y `tipoBrigada` como IDs
enteros positivos:

```powershell
curl.exe "http://localhost:3000/api/dashboard/brigadas/resumen?departamento=1" `
  -H "Authorization: Bearer $token"

curl.exe "http://localhost:3000/api/dashboard/brigadas/casos-por-brigada?region=1&tipoBrigada=1" `
  -H "Authorization: Bearer $token"
```

Cuando el resumen recibe filtros geográficos o de tipo, `totalCasosSinBrigada` es `0` porque un
caso sin brigada no puede pertenecer al segmento solicitado. Las agrupaciones geográficas omiten
casos sin brigada; estos permanecen visibles en `totalCasosSinBrigada` del resumen sin filtros.

## Probar sin token

```powershell
curl.exe http://localhost:3000/api/dashboard/brigadas/resumen
```

Debe responder `401` con el mensaje `Token de autenticación requerido`.

## Probar con rol no autorizado

Obtén un token de un usuario cuyo único rol sea `Brigada` o `Responsable del Proceso`:

```powershell
$tokenSinPermiso = "TOKEN_SIN_ROL_AUTORIZADO"

curl.exe http://localhost:3000/api/dashboard/brigadas/resumen `
  -H "Authorization: Bearer $tokenSinPermiso"
```

Debe responder `403` con el mensaje `No tiene permisos para realizar esta operación`.

## Estructura estándar

El resumen devuelve los indicadores directamente dentro de `data`. Los demás endpoints devuelven
sus arreglos en `data.items`:

```json
{
  "success": true,
  "message": "Casos por brigada obtenidos correctamente",
  "data": {
    "items": []
  }
}
```
