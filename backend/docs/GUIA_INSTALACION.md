# Guia de instalacion - SISCA

Esta guia permite instalar SISCA en un entorno local para desarrollo, pruebas o entrega academica.

## 1. Clonar repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd sisca
```

## 2. Instalar backend

```bash
cd backend
npm install
```

## 3. Configurar PostgreSQL

Instala PostgreSQL y confirma que el servicio este activo. Puedes usar pgAdmin, psql o cualquier cliente compatible.

## 4. Crear base de datos

Crea una base de datos local, por ejemplo:

```sql
CREATE DATABASE sisca_db;
```

## 5. Configurar `.env`

Copia la plantilla:

```bash
copy .env.example .env
```

En Linux/macOS:

```bash
cp .env.example .env
```

Edita:

```env
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/sisca_db?schema=public"
JWT_SECRET="sisca_secret_key_dev"
JWT_EXPIRES_IN="8h"
PORT=3000
NODE_ENV="development"
CORS_ORIGIN=http://localhost:4200
```

## 6. Ejecutar migraciones

```bash
npx prisma migrate dev
```

Esto crea las tablas segun `prisma/schema.prisma`.

## 7. Ejecutar seed

```bash
npx prisma db seed
```

El seed carga roles, catalogos base, estados y el usuario administrador.

Usuario inicial:

```text
correo: admin@sisca.com
password: Admin123*
```

## 8. Levantar backend

```bash
npm run dev
```

URL esperada:

```text
http://localhost:3000/api
```

Verificacion:

```text
GET http://localhost:3000/api/health
```

## 9. Instalar frontend

Desde otra terminal:

```bash
cd frontend
npm install
```

## 10. Levantar frontend

```bash
npm start
```

URL esperada:

```text
http://localhost:4200
```

Si Angular indica otro puerto, usa el que muestre la terminal.

## 11. Probar login

Abre el navegador:

```text
http://localhost:4200
```

Ingresa:

```text
correo: admin@sisca.com
password: Admin123*
```

Debe cargar el layout principal y mostrar el menu de Administrador.

## 12. Problemas comunes

### Puerto ocupado

Si el backend no puede usar `3000`, cambia `PORT` en `.env`. Si cambia el puerto del backend, actualiza `frontend/src/environments/environment.ts`.

Si Angular no puede usar `4200`, acepta el puerto alternativo sugerido o libera el puerto.

### Error `DATABASE_URL`

Revisa:

- Usuario de PostgreSQL.
- Password.
- Nombre de base de datos.
- Puerto `5432`.
- Que PostgreSQL este iniciado.

### Error CORS

Si Angular usa otro puerto, por ejemplo `4201`, actualiza en backend:

```env
CORS_ORIGIN=http://localhost:4201
```

Reinicia el backend.

### Backend apagado

Si el frontend muestra errores de conexion, confirma que el backend este activo con:

```text
http://localhost:3000/api/health
```

### Token expirado

Si el token vence, cierra sesion e inicia de nuevo. El tiempo se configura en:

```env
JWT_EXPIRES_IN="8h"
```

### Angular usa otro puerto como 4201

Actualiza `CORS_ORIGIN` del backend para coincidir con el origen real del frontend.

### Prisma Client desactualizado

Si aparecen errores de Prisma despues de instalar o cambiar migraciones:

```bash
npx prisma generate
```

### Evidencias no se suben

Revisa:

- Archivo JPEG, PNG, WEBP o PDF.
- Tamano maximo 5 MB.
- Campo `archivo` en `multipart/form-data`.
- Carpeta `backend/uploads/evidencias/` existente.
