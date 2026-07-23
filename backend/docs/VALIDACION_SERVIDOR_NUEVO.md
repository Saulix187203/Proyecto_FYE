# Validación técnica del servidor SISCA

## 1. Resumen ejecutivo

- **Fecha:** 2026-07-21 (America/Guatemala; el servidor registra UTC 2026-07-22).
- **Estado general:** **FUNCIONAL CON OBSERVACIONES**.
- **Servidor:** `srv004gua`, Ubuntu 24.04.4 LTS, x86-64, VM KVM/QEMU.
- **Instalación activa detectada:** `/opt/sisca`.
- **Arquitectura activa:** Docker Compose con Nginx, Node/Express y PostgreSQL.
- **URL LAN:** `http://192.168.88.117:8080`.
- **API:** `http://192.168.88.117:8080/api`.
- **Swagger:** `http://192.168.88.117:8080/api/docs/`.
- **Swagger Extractor:** `http://192.168.88.117:8080/api/docs/extractor/`.

Los tres servicios se encuentran saludables, la base migrada conserva los conteos esperados, Prisma está sincronizado y el frontend se reconstruye desde cero. Las pruebas autenticadas del usuario Extractor no se ejecutaron porque `API_EXTRACTOR_PASSWORD` no está configurada y no se usaron contraseñas hardcodeadas.

## 2. Matriz de validación

| Componente | Estado | Resultado |
|---|---|---|
| Entorno | Correcto | Ubuntu 24.04.4 LTS, Docker y Compose activos |
| PostgreSQL | Correcto | 18.4, saludable, 1.4 GB, acepta conexiones internas |
| Prisma | Correcto | 6.19.3; schema válido y cliente generado durante build |
| Migraciones | Correcto | 6 migraciones; base actualizada |
| Datos/seed base | Advertencia | Catálogos, roles y usuarios esperados existen; el seed no se ejecutó |
| Backend | Correcto | Contenedor saludable; `/api/health` HTTP 200 |
| Swagger | Correcto | OpenAPI 3.0.3, 64 rutas, HTTP 200 |
| Swagger Extractor | Correcto | OpenAPI 3.0.3, 34 rutas, HTTP 200 |
| CORS | Correcto | Un origen LAN permitido, sin wildcard; origen ajeno devuelve 403 |
| Usuario Extractor API | Advertencia | Usuario y rol existen; login no probado por falta de credencial segura |
| Permisos 200/400/403 | No probado | Requiere token real del Extractor; reglas revisadas en código |
| API de alto volumen | Advertencia | Servicios Prisma medidos; falta repetir por HTTP con token Extractor |
| Build frontend | Advertencia | Build correcto; 2 warnings esperados y 8 avisos de `npm audit` |
| Ejecución frontend | Correcto | Nginx HTTP 200; login visible; sin errores de consola |
| Casos | Advertencia | Servicio paginado validado; UI autenticada no probada |
| Expedientes | No probado | Ruta protegida redirige a login; falta sesión válida |
| Brigadas | Advertencia | Datos y servicio de dashboard validados; UI autenticada pendiente |
| Dashboard | Advertencia | Servicios medidos; interfaz autenticada pendiente |
| Acceso de red | Correcto | Disponible desde otro equipo de la LAN en `192.168.88.117:8080` |

## 3. Entorno y versiones

| Elemento | Versión/estado |
|---|---|
| Sistema operativo | Ubuntu 24.04.4 LTS |
| Kernel | 6.8.0-110-generic |
| Arquitectura | x86-64 |
| Docker | 29.4.1 |
| Docker Compose | 5.1.3 |
| Node.js en backend | 22.23.1 |
| npm | 10.9.8 |
| PostgreSQL | 18.4 |
| Prisma / Prisma Client | 6.19.3 / 6.19.3 |
| Angular CLI | 20.3.31 |
| Angular | 20.3.25 |
| TypeScript declarado | 5.9.x |
| Nginx | 1.31.3 |
| Disco raíz | 98 GB; 81 GB disponibles; 14 % usado |

`backend/package.json` requiere Node `>=20`; Node 22.23.1 es compatible. Node y Angular CLI no están instalados globalmente en Ubuntu: se ejecutan dentro de imágenes Docker, que es el comportamiento correcto para este despliegue.

## 4. Git y workspace

El paquete desplegado en `/opt/sisca` no contiene `.git`. El repositorio fuente se conserva en:

`D:\Proyectos\Area de trabajo\sisca`

- Rama: `main`.
- Remoto principal: `origin`.
- Se detectó un segundo remoto llamado `proyecto_fye`.
- El workspace ya tenía cambios sin commit asociados al despliegue Docker. No fueron descartados, sobrescritos ni confirmados.
- `backend/.env` está ignorado por Git.

## 5. Configuración y secretos

En el servidor no existe `backend/.env`; Docker Compose carga `/opt/sisca/.env` y entrega las variables necesarias al backend. Esta diferencia es intencional para el despliegue contenerizado.

| Variable de runtime | Estado |
|---|---|
| `DATABASE_URL` | configurada |
| `JWT_SECRET` | configurada |
| `JWT_EXPIRES_IN` | configurada |
| `PORT` | 3000 |
| `NODE_ENV` | production |
| `CORS_ORIGIN` | configurada con 1 origen |
| `ENABLE_SWAGGER` | true |
| `API_EXTRACTOR_PASSWORD` | **no configurada** |

El archivo `/opt/sisca/.env` tiene permisos `600` y no se imprimieron sus valores. El archivo `compose.yaml` tiene permisos `664`.

En la copia fuente local, `backend/.env` contiene las seis variables principales, pero no contiene `ENABLE_SWAGGER` ni `API_EXTRACTOR_PASSWORD`. `backend/.env.example` declara `ENABLE_SWAGGER`, pero tampoco declara `API_EXTRACTOR_PASSWORD`.

## 6. Dependencias

### Backend

Se realizó un build limpio, sin caché, en la imagen temporal `sisca-backend:audit`. El Dockerfile ejecutó `npm ci` y `prisma generate` correctamente.

Dependencias principales confirmadas:

- Express 5.2.1.
- Prisma Client 6.19.3.
- Prisma CLI 6.19.3.
- jsonwebtoken 9.0.3.
- bcrypt 6.0.0.
- cors 2.8.6.
- dotenv 17.4.2.
- swagger-jsdoc 6.3.0.
- swagger-ui-express 5.0.1.
- nodemon 3.1.14 declarado como dependencia de desarrollo.

`npm audit`: 0 vulnerabilidades.

### Frontend

Se realizó un build Angular limpio, sin caché, en la imagen temporal `sisca-frontend:audit`. `npm ci` instaló 551 paquetes y `npm run build` finalizó correctamente.

Warnings esperados:

- Bundle inicial: 565.01 kB frente a presupuesto de 500 kB.
- SCSS de expediente individual: 4.13 kB frente a presupuesto de 4 kB.

`npm audit` reportó 8 vulnerabilidades: 3 bajas, 3 moderadas y 2 altas. Los paquetes señalados incluyen `@angular/cli`, `@angular/compiler-cli`, dependencias transitivas de herramientas y dos vulnerabilidades altas transitivas en `brace-expansion` y `fast-uri`. Parte de la solución propuesta por npm requiere Angular CLI 21, una actualización mayor que no se aplicó.

El frontend productivo es contenido estático servido por Nginx; las dependencias de build no permanecen dentro del contenedor final, lo que reduce la exposición de runtime, pero los avisos deben revisarse.

## 7. PostgreSQL y Prisma

- PostgreSQL responde a `pg_isready`.
- Base activa: `sisca`.
- Tamaño: 1,443 MB.
- `npx prisma validate`: correcto.
- `npx prisma migrate status`: 6 migraciones; base actualizada.
- `prisma generate`: correcto durante el build y como root en una imagen aislada.
- No se ejecutó `migrate reset`, `db push`, `migrate dev` ni ninguna migración nueva.

Observación: repetir `prisma generate` como usuario `node` sobre una imagen ya construida devuelve `EACCES`, porque el cliente generado durante el build pertenece a root. No afecta la aplicación actual; la generación debe continuar como paso de build. Si se necesitara generación en runtime, habría que ajustar la propiedad de esos archivos de forma explícita.

### Conteos

| Entidad | Cantidad |
|---|---:|
| Usuarios | 5,624 |
| Roles | 8 |
| Casos | 1,110,103 |
| Brigadas | 376 |
| Miembros de brigada | 1,126 |
| Acciones correctivas | 666,060 |
| Reportes iniciales | 1,110,103 |
| Regiones | 5 |
| Departamentos | 22 |
| Municipios | 340 |
| Estados de caso | 8 |
| Áreas | 5 |
| Procesos | 5 |
| Tipos de evento | 6 |
| Criticidades | 4 |

Se confirmó, sin mostrar hashes ni datos personales:

- Rol `Administrador`: existe y está activo.
- Rol `Extractor API`: existe y está activo.
- `admin@sisca.com`: existe, activo, con rol Administrador.
- `tecnico.api@sisca.com`: existe, activo, con rol Extractor API.

Los índices de alto volumen existen en `schema.prisma` y en la migración `20260721045554_add_indexes_casos_high_volume`:

- `(brigada_reportante_id, fecha_reporte, id)`.
- `(fecha_hora_evento, id)`.

## 8. Backend y Swagger

El backend se ejecuta con `npm start` dentro de Docker, no con nodemon. El contenedor tiene healthcheck y política `restart: unless-stopped`.

| Prueba | HTTP | Tiempo aproximado |
|---|---:|---:|
| `/api/health` | 200 | 1.9 ms |
| `/api/docs` | 308 | 3.0 ms |
| `/api/docs/` | 200 | 2.2 ms |
| `/api/openapi.json` | 200 | 2.9 ms |
| `/api/docs/extractor` | 308 | 1.8 ms |
| `/api/docs/extractor/` | 200 | 2.1 ms |
| `/api/openapi-extractor.json` | 200 | 2.4 ms |

OpenAPI general: versión 3.0.3, 64 paths. OpenAPI Extractor: versión 3.0.3, 34 paths.

Sin JWT, `/api/auth/me`, `/api/casos` y `/api/usuarios` devolvieron 401, confirmando que la autenticación está activa.

## 9. Usuario Extractor y permisos

El usuario y rol existen, y el código incluye permisos de lectura y bloqueos explícitos para notificaciones, evidencias, operaciones administrativas y escrituras. No obstante, no se ejecutaron las pruebas HTTP autenticadas porque:

1. `API_EXTRACTOR_PASSWORD` no está configurada.
2. No se utilizó la contraseña de desarrollo incluida en el seed.
3. No se generó un JWT artificial ni se evitó el flujo de login.

Por tanto, los HTTP 200/400/403 solicitados deben considerarse **no probados en runtime** hasta configurar o proporcionar la credencial de forma segura.

### Riesgo del seed

El seed usa `DEVELOPMENT_EXTRACTOR_PASSWORD` cuando falta `API_EXTRACTOR_PASSWORD`, incluso si `NODE_ENV=production`; solo omite el warning en producción. Ejecutar el seed productivo sin la variable podría restablecer la contraseña técnica a un valor de desarrollo conocido. No se ejecutó el seed.

Recomendación: cambiar el seed para que falle explícitamente en producción cuando falte `API_EXTRACTOR_PASSWORD`. Al ser un cambio de seguridad, requiere aprobación separada.

## 10. API de alto volumen

Sin credencial Extractor, las consultas se midieron secuencialmente invocando las mismas funciones de servicio Prisma, en modo lectura:

| Prueba | Equivalente | Tiempo | Elementos | Total |
|---|---:|---:|---:|---:|
| Casos por defecto | 200 | 81.3 ms | 50 | 1,110,103 |
| Casos página 1, limit 50 | 200 | 88.2 ms | 50 | 1,110,103 |
| Casos página 100, limit 50 | 200 | 74.2 ms | 50 | 1,110,103 |
| Casos por rango de 7 días | 200 | 1,448.2 ms | 50 | 21,274 |
| Casos por brigada | 200 | 13.3 ms | 50 | 3,334 |
| Casos limit 1,000,000 | 400 | 0.2 ms | n/a | n/a |
| Acciones página 1, limit 50 | 200 | 249.6 ms | 50 | 666,060 |
| Dashboard resumen | 200 | 337.4 ms | n/a | n/a |
| Dashboard brigadas/resumen | 200 | 243.1 ms | n/a | n/a |
| Dashboard casos por brigada | 200 | 86.4 ms | 376 | n/a |

Se confirmó:

- `page=1` y `limit=50` por defecto.
- Límite máximo 1,000.
- Metadata de paginación.
- Orden estable por `fechaReporte` e `id`.
- Uso de `select` acotado para listado de casos.
- No se devuelven todos los registros.

El rango de fechas fue la consulta más lenta (~1.45 s) porque también calcula un conteo sobre 21 mil resultados. Conviene observarla con tráfico real antes de optimizar.

## 11. Frontend

- Build productivo correcto.
- Nginx sirve el frontend con HTTP 200.
- La pantalla `/login` muestra los campos Correo y Contraseña y el botón Entrar.
- No se observaron errores críticos en la consola del navegador.
- Sin sesión, todas las rutas protegidas comprobadas redirigieron correctamente a `/login`:
  - `/app/dashboard`
  - `/app/casos`
  - `/app/casos/nuevo`
  - `/app/expedientes`
  - `/app/brigadas`
  - `/app/acciones-correctivas`
  - `/app/notificaciones`
  - `/app/usuarios`
  - `/app/roles`

No se validaron menús por rol, contenido autenticado, expediente individual ni filtros geográficos por falta de una credencial segura.

## 12. CORS, puertos y red

- CORS permite exactamente `http://192.168.88.117:8080`.
- No se usa `*`.
- Preflight desde el origen permitido: HTTP 204, con `Access-Control-Allow-Origin` correcto.
- Preflight desde un origen no permitido: HTTP 403.
- Frontend y API usan el mismo origen mediante reverse proxy Nginx.

Puertos publicados en el host:

- `22/tcp`: SSH, en `0.0.0.0` y `::`.
- `8080/tcp`: Nginx/SISCA, en `0.0.0.0` y `::`.
- PostgreSQL 5432 y backend 3000 solo están disponibles en la red interna Docker.

El acceso desde otro equipo de la LAN fue validado con HTTP 200 para frontend, health y Swagger Extractor. UFW está inactivo. No se modificaron firewall, router ni red.

## 13. Uso como servidor

SISCA se ejecuta como servicio estable contenerizado:

- `NODE_ENV=production`.
- Nginx sirve el build Angular.
- Nginx actúa como reverse proxy para `/api`.
- Backend, frontend y DB usan `restart: unless-stopped`.
- Docker está habilitado y activo al arranque.
- Consumo observado: PostgreSQL ~601 MB, backend ~91 MB, frontend ~4 MB.

No son aplicables PM2, NSSM o IIS al sistema operativo detectado. Docker Compose ya es la opción adecuada para este servidor Ubuntu.

## 14. Riesgos y pendientes manuales

1. **Credencial Extractor:** falta `API_EXTRACTOR_PASSWORD`; no se pudo validar login ni permisos 200/400/403.
2. **Seed inseguro en producción:** puede usar la contraseña de desarrollo si falta la variable.
3. **Sin backups SISCA:** no se encontraron dumps, servicio de backup, cron ni timer de respaldo PostgreSQL.
4. **Sin HTTPS:** SISCA se publica por HTTP en la LAN.
5. **Firewall inactivo:** UFW no filtra conexiones; no se cambió por seguridad operativa.
6. **Swagger habilitado en producción:** útil para pruebas, pero aumenta superficie informativa. Deshabilitar cuando termine la etapa de pruebas.
7. **Frontend `npm audit`:** 8 avisos, incluidos 2 altos; revisar actualizaciones compatibles sin saltar automáticamente a Angular 21.
8. **Rendimiento por fecha:** ~1.45 s en la muestra; monitorear con tráfico real.
9. **Imágenes con tags móviles:** `postgres:18-alpine`, `nginx:alpine` y `node:22-bookworm-slim` pueden cambiar en reconstrucciones futuras. Considerar pin por digest o versión de parche.
10. **Código desplegado sin Git:** las actualizaciones deben realizarse desde el repositorio fuente y volver a desplegarse de forma controlada.
11. **Cambios locales sin commit:** deben revisarse y confirmarse manualmente cuando corresponda; no se hizo commit ni push.
12. **Logs:** se observaron dos cancelaciones de autovacuum durante la restauración inicial; no se repiten en operación normal.

## 15. Recomendaciones antes de producción

Prioridad alta:

1. Configurar una contraseña aleatoria para el usuario Extractor mediante un canal seguro y repetir todas las pruebas HTTP autenticadas.
2. Corregir el seed para exigir `API_EXTRACTOR_PASSWORD` en producción.
3. Implementar backups diarios cifrados y probar una restauración.
4. Configurar HTTPS mediante un dominio y reverse proxy/TLS.
5. Diseñar reglas UFW limitadas a SSH administrativo y acceso requerido, después de validar conectividad para no bloquear el servidor.

Prioridad media:

1. Revisar las vulnerabilidades de build del frontend dentro de Angular 20.
2. Desactivar Swagger en producción cuando concluyan las pruebas.
3. Pinnear imágenes Docker.
4. Añadir rotación y retención de logs.
5. Monitorizar tiempos de consultas por rango y crecimiento del volumen PostgreSQL.

## 16. Comandos de operación

Iniciar todos los servicios:

```bash
cd /opt/sisca
docker compose up -d
```

Iniciar por componente:

```bash
cd /opt/sisca
docker compose up -d db backend frontend
```

Verificar estado y logs:

```bash
cd /opt/sisca
docker compose ps
docker compose logs --tail=200 backend frontend db
```

Validar salud:

```bash
curl -fsS http://127.0.0.1:8080/api/health
```

Reconstruir después de cambios aprobados en el código:

```bash
cd /opt/sisca
docker compose build
docker compose up -d
```

No se recomienda `ng serve` ni `npm run dev` como ejecución permanente del servidor.

## 17. Comandos de diagnóstico ejecutados

Se ejecutaron, entre otros, los siguientes comandos lógicos:

```bash
hostnamectl
uname -m
df -hT /
docker --version
docker compose version
docker compose ps
docker stats --no-stream
docker build --no-cache ...
npm ci
npm ls --depth=0
npm audit --json
npm run build
npx ng version
npx prisma --version
npx prisma validate
npx prisma generate
npx prisma migrate status
pg_isready
psql (consultas SELECT y conteos)
curl (health, Swagger, OpenAPI, CORS y acceso LAN)
ss -lntup
ufw status verbose
git status --short --branch
git branch --show-current
git remote -v
```

Las consultas a PostgreSQL y Prisma fueron de solo lectura. La prueba de límite inválido se ejecutó directamente en la capa de servicio y no modificó datos.

## 18. Cambios realizados durante esta validación

- Creación de este informe.
- Creación de imágenes temporales de auditoría `sisca-backend:audit` y `sisca-frontend:audit` para instalaciones limpias aisladas.

No se modificó lógica de negocio, schema Prisma, migraciones, datos, CORS, firewall ni red durante esta validación. Swagger ya estaba habilitado al iniciar la auditoría.

## 19. Confirmaciones de seguridad

- No se ejecutó `prisma migrate reset`.
- No se ejecutó `prisma db push`.
- No se ejecutó `prisma migrate dev`.
- No se recreó ni eliminó la base.
- No se borraron datos.
- No se ejecutó el seed normal.
- No se ejecutó el seed de estrés.
- No se ejecutó `db:clear:stress`.
- No se imprimieron secretos ni hashes.
- No se modificó el firewall, router ni servicios del sistema.
- No se hizo commit ni push.

