# Backend SISCA

API REST de SISCA - Sistema Inteligente de Seguimiento a Casi-Accidentes. Este backend gestiona autenticacion, usuarios, roles, catalogos, casos, reportes iniciales, expedientes, validaciones, acciones correctivas, evidencias, cierre de casos, notificaciones y dashboard.

## Tecnologias

- Node.js
- Express
- PostgreSQL
- Prisma ORM
- JWT
- bcrypt
- Multer
- dotenv

## Estructura de carpetas

```text
backend/
├── prisma/                 # schema.prisma, migraciones y seed
├── src/controllers/        # controladores HTTP
├── src/services/           # reglas de negocio y acceso Prisma
├── src/routes/             # definicion de rutas Express
├── src/middlewares/        # auth, roles, errores y carga de archivos
├── src/utils/              # helpers compartidos
├── uploads/evidencias/     # destino local de evidencias subidas
└── docs/                   # documentacion tecnica y pruebas manuales
```

## Instalacion

```bash
cd backend
npm install
copy .env.example .env
```

En Linux/macOS:

```bash
cp .env.example .env
```

## Configuracion `.env`

Edita `backend/.env` con los valores locales:

```env
NODE_ENV="development"
PORT=3000
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/sisca_db?schema=public"
CORS_ORIGIN=http://localhost:4200
JWT_SECRET="sisca_secret_key_dev"
JWT_EXPIRES_IN="8h"
```

Variables principales:

- `DATABASE_URL`: conexion PostgreSQL para Prisma.
- `JWT_SECRET`: secreto para firmar tokens.
- `JWT_EXPIRES_IN`: duracion del token JWT.
- `PORT`: puerto HTTP del backend.
- `NODE_ENV`: entorno de ejecucion.
- `CORS_ORIGIN`: origen permitido del frontend.

## Migraciones Prisma

Ejecuta las migraciones sobre la base de datos configurada:

```bash
npx prisma migrate dev
```

No borres ni edites migraciones existentes salvo que el equipo lo acuerde.

## Seed inicial

El seed crea catalogos base, roles base y el usuario administrador:

```bash
npx prisma db seed
```

Usuario inicial:

```text
correo: admin@sisca.com
password: Admin123*
```

## Comandos principales

```bash
npm install
npm run dev
npm start
npx prisma migrate dev
npx prisma db seed
npx prisma studio
```

## Endpoints principales por modulo

La base local de la API es `http://localhost:3000/api`.

- Health: `GET /api/health`
- Auth: `POST /api/auth/login`, `GET /api/auth/me`
- Usuarios: `/api/usuarios`
- Roles: `/api/roles`
- Catalogos: `/api/catalogos/*`
- Casos: `/api/casos`
- Reporte inicial: `/api/reportes-iniciales`
- Expediente: `/api/expedientes/:idCaso`
- Validacion de procedencia: `/api/validaciones-procedencia`
- Acciones correctivas: `/api/acciones-correctivas`
- Evidencias: `/api/evidencias`
- Cierre de casos: `/api/cierre-casos`
- Notificaciones: `/api/notificaciones`
- Dashboard: `/api/dashboard`

Consulta el detalle en `docs/API_ENDPOINTS.md`.

## Seguridad

- `authMiddleware`: valida el token JWT, usuario activo y roles actuales desde base de datos.
- `roleMiddleware`: restringe rutas por nombre de rol.
- JWT: se emite en login y se envia en `Authorization: Bearer <token>`.
- bcrypt: se usa para hashear contraseñas; nunca se devuelve el hash en respuestas.
- Las rutas administrativas de usuarios y roles requieren el rol `Administrador`.

## Manejo de evidencias con Multer

Las evidencias se suben con `multipart/form-data` en el campo `archivo`.

- Directorio local: `backend/uploads/evidencias/`
- Tipos permitidos: JPEG, PNG, WEBP y PDF.
- Tamano maximo: 5 MB.
- Los archivos reales subidos quedan ignorados por Git.
- Solo se conserva `.gitkeep` para mantener la carpeta en el repositorio.

## Roles base protegidos

Los siguientes roles son parte de las reglas de permisos del backend y frontend:

- Administrador
- Brigada
- PRL Contratista
- Responsable del Proceso
- SYMA
- Gestión y Control SYMA
- Gerencia

No se pueden eliminar ni renombrar. Si se permite actualizar su descripcion.
