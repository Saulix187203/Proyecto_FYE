# Guia local del backend SISCA

Este documento explica como ejecutar el backend de SISCA en una computadora local usando Node.js, Express, Prisma y PostgreSQL.

## Requisitos previos

- Node.js 20 o superior.
- npm.
- PostgreSQL.
- Git.
- Visual Studio Code recomendado.

## Pasos de instalacion

1. Clonar el repositorio:

```bash
git clone URL_DEL_REPOSITORIO
```

2. Entrar a la carpeta del backend:

```bash
cd sisca/backend
```

3. Ejecutar el instalador local para Windows:

```bat
setup-backend.bat
```

Este script ejecuta `npm install`, crea `.env` desde `.env.example` si no existe y genera Prisma Client con `npx prisma generate`.

4. Configurar el archivo `.env`.

Abre `backend/.env` y revisa principalmente la variable `DATABASE_URL`. Debe tener el usuario, password, host, puerto y nombre de base de datos correctos para tu PostgreSQL local.

5. Crear la base de datos `sisca_db` en PostgreSQL.

Puedes crearla desde pgAdmin, DBeaver, TablePlus o desde consola con:

```sql
CREATE DATABASE sisca_db;
```

6. Ejecutar migraciones de Prisma:

```bash
npx prisma migrate dev
```

7. Ejecutar el seed inicial:

```bash
npx prisma db seed
```

8. Iniciar el backend:

```bash
npm run dev
```

Tambien puedes usar:

```bat
start-backend.bat
```

## Ejemplo de `.env`

```env
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/sisca_db?schema=public"
JWT_SECRET="sisca_secret_key_dev"
JWT_EXPIRES_IN="8h"
PORT=3000
NODE_ENV="development"
CORS_ORIGIN=http://localhost:4200
```

Importante: el archivo `.env` real no debe versionarse. Usa `.env.example` como plantilla y no subas passwords reales al repositorio.

## URL local esperada

```text
http://localhost:3000/api
```

## Endpoint de prueba

```http
GET http://localhost:3000/api/health
```

## Usuario administrador inicial

```text
correo: admin@sisca.com
password: Admin123*
```

Este usuario se crea al ejecutar:

```bash
npx prisma db seed
```

## Problemas comunes

- Error de conexion a PostgreSQL: verifica que el servicio de PostgreSQL este iniciado.
- Password incorrecto en `DATABASE_URL`: reemplaza `TU_PASSWORD` por la password real del usuario `postgres` o el usuario que uses localmente.
- Base de datos no creada: crea manualmente la base `sisca_db` antes de ejecutar `npx prisma migrate dev`.
- Puerto 3000 ocupado: cambia `PORT` en `.env` o libera el puerto.
- Prisma Client desactualizado: ejecuta `npx prisma generate`.
- Error CORS si el frontend usa otro puerto: cambia `CORS_ORIGIN` en `.env`, por ejemplo `http://localhost:4200`.

## Comandos utiles

```bash
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```
