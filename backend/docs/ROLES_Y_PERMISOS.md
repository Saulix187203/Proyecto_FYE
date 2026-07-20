# Roles y permisos - SISCA

SISCA usa autorizacion por nombre de rol. El frontend puede ocultar opciones para mejorar la experiencia, pero el backend siempre valida permisos con `authMiddleware` y `roleMiddleware`.

## Roles del sistema

- Administrador
- Brigada
- PRL Contratista
- Responsable del Proceso
- SYMA
- Gestión y Control SYMA
- Gerencia

## Permisos generales

### Administrador

- Acceso completo al sistema.
- Administra usuarios.
- Administra roles.
- Puede ejecutar todos los flujos funcionales.
- Puede consultar dashboard, casos, expedientes, acciones, evidencias y notificaciones.

### Brigada

- Crear casos.
- Crear o actualizar reporte inicial.
- Subir evidencias al caso.
- Consultar casos, expedientes y notificaciones.

### PRL Contratista

- Crear casos.
- Crear o actualizar reporte inicial.
- Validar procedencia.
- Crear y gestionar acciones correctivas.
- Iniciar acciones y enviarlas a validacion.
- Subir evidencias.
- Consultar casos, expedientes y notificaciones.
- Consultar dashboard si la ruta correspondiente lo habilita.

### Responsable del Proceso

- Gestionar acciones correctivas.
- Iniciar acciones y enviarlas a validacion.
- Subir evidencias de acciones.
- Consultar casos, expedientes y notificaciones.

### SYMA

- Crear casos.
- Crear o actualizar reporte inicial.
- Validar procedencia.
- Crear y gestionar acciones correctivas.
- Validar acciones.
- Cerrar acciones.
- Cerrar casos.
- Subir evidencias.
- Consultar dashboard.
- Consultar casos, expedientes y notificaciones.

### Gestión y Control SYMA

- Cierre formal de casos.
- Devolucion de cierre.
- Validacion de acciones.
- Dashboard.
- Consulta de casos, expedientes y notificaciones.

### Gerencia

- Dashboard.
- Consulta de casos y expedientes.
- Consulta de notificaciones.

## Roles base protegidos

Los siguientes roles estan amarrados a permisos del backend y frontend. No pueden eliminarse ni renombrarse:

- Administrador
- Brigada
- PRL Contratista
- Responsable del Proceso
- SYMA
- Gestión y Control SYMA
- Gerencia

Si se puede actualizar su descripcion desde el modulo administrativo de roles.

## Reglas de administracion de roles

- Solo `Administrador` puede acceder a `/api/roles`.
- Se pueden crear roles nuevos.
- Los roles nuevos se pueden editar.
- Los roles nuevos se pueden eliminar solo si no estan asignados a usuarios.
- Si un rol tiene usuarios asociados, el backend rechaza la eliminacion.
- Las respuestas del backend incluyen `esBase` para identificar visualmente roles base en el frontend.

## Reglas de administracion de usuarios

- Solo `Administrador` puede acceder a `/api/usuarios`.
- Al crear un usuario se exige nombre, correo, password y al menos un rol.
- Los roles se asignan por nombre, no por IDs fijos.
- El cambio de roles usa `PUT /api/usuarios/:id/roles`.
- El cambio de contraseña usa `PUT /api/usuarios/:id/password`.
- El borrado de usuario es una desactivacion logica.
