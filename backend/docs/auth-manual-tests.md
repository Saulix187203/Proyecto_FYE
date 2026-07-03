# Pruebas manuales de autenticación y usuarios

Inicia la API con `npm run dev`. Los ejemplos usan `curl.exe` en PowerShell para evitar el alias de `Invoke-WebRequest`.

## Login correcto

```powershell
curl.exe -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"correo":"admin@sisca.com","password":"Admin123*"}'
```

Copia el valor de `data.token` y guárdalo para las siguientes pruebas:

```powershell
$token = "PEGA_AQUI_EL_TOKEN"
```

## Login con contraseña incorrecta

```powershell
curl.exe -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"correo":"admin@sisca.com","password":"incorrecta"}'
```

Debe responder `401`.

## Usuario autenticado

```powershell
curl.exe http://localhost:3000/api/auth/me `
  -H "Authorization: Bearer $token"
```

## Usuarios sin token

```powershell
curl.exe http://localhost:3000/api/usuarios
```

Debe responder `401`.

## Usuarios con token administrador

```powershell
curl.exe http://localhost:3000/api/usuarios `
  -H "Authorization: Bearer $token"
```

## Consultar roles

```powershell
curl.exe http://localhost:3000/api/roles `
  -H "Authorization: Bearer $token"
```

Usa ids existentes en el arreglo `roles` al crear el usuario.

## Crear usuario

```powershell
curl.exe -X POST http://localhost:3000/api/usuarios `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"nombre":"Usuario Prueba","correo":"usuario@sisca.com","password":"Usuario123*","roles":[2,3]}'
```

## Actualizar usuario

```powershell
curl.exe -X PUT http://localhost:3000/api/usuarios/2 `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"nombre":"Usuario Actualizado","activo":true,"roles":[2]}'
```

## Desactivar usuario

```powershell
curl.exe -X DELETE http://localhost:3000/api/usuarios/2 `
  -H "Authorization: Bearer $token"
```

La operación es lógica: el registro permanece y su campo `activo` cambia a `false`.
