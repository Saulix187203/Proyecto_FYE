# Pruebas manuales - SISCA

Esta guia propone un recorrido manual de punta a punta para validar SISCA desde la interfaz web y, cuando aplique, con apoyo de la API.

## Datos sugeridos

Usuario administrador inicial:

```text
correo: admin@sisca.com
password: Admin123*
```

Datos de caso sugeridos:

```text
Area: Bodega
Proceso: Recepcion y despacho
Tipo de evento: Condicion insegura
Criticidad: Media o Alta
Lugar: Bodega principal
Descripcion: Se detecto piso mojado sin senalizacion cerca del area de carga.
```

Usuario de prueba sugerido:

```text
Nombre: Usuario Prueba SISCA
Correo: usuario.prueba@sisca.com
Password temporal: Usuario123*
Roles: Brigada, Responsable del Proceso
```

## 1. Login

1. Abrir `http://localhost:4200`.
2. Ingresar `admin@sisca.com` y `Admin123*`.
3. Verificar que cargue el layout principal.
4. Confirmar que el menu muestre opciones administrativas.

Resultado esperado: login exitoso y token almacenado por el frontend.

## 2. Crear caso

1. Ir a `/app/casos/nuevo`.
2. Seleccionar area, proceso, tipo de evento y criticidad.
3. Completar fecha, lugar y descripcion.
4. Guardar.

Resultado esperado: caso creado en estado `Reportado` con correlativo automatico.

## 3. Crear reporte inicial

1. Abrir el expediente del caso.
2. Completar o actualizar el reporte inicial.
3. Guardar descripcion detallada, condicion detectada, accion inmediata y observaciones.

Resultado esperado: reporte inicial disponible en el expediente.

## 4. Ver bandeja de casos

1. Ir a `/app/casos`.
2. Confirmar que el caso creado aparezca en la tabla.
3. Abrir detalle o expediente.

Resultado esperado: el caso aparece con estado, area, proceso, criticidad y usuario que reporta.

## 5. Filtrar casos

1. Usar filtros por texto, estado, area, criticidad o fecha.
2. Ejecutar busqueda.
3. Limpiar filtros.

Resultado esperado: la tabla cambia segun filtros y vuelve al listado general al limpiar.

## 6. Ver expediente

1. Ir a `/app/expedientes/:idCaso`.
2. Revisar informacion del caso, reporte inicial, acciones, evidencias, bitacora y comentarios.

Resultado esperado: expediente consolidado y trazable.

## 7. Iniciar revision

1. Desde el expediente, iniciar revision de procedencia.
2. Agregar observacion si el formulario lo permite.

Resultado esperado: caso pasa de `Reportado` a `En revisión`.

## 8. Aprobar caso

1. Con rol autorizado, aprobar la procedencia.
2. Escribir observaciones.

Resultado esperado: caso pasa a `Aprobado` y se registra la validacion.

Tambien se puede probar devolucion o rechazo en casos separados.

## 9. Crear accion correctiva

1. En el expediente de un caso `Aprobado`, crear accion correctiva.
2. Asignar responsable.
3. Definir fecha compromiso y descripcion.

Resultado esperado: accion creada en `Pendiente` y caso pasa a `Con acciones`.

## 10. Iniciar accion

1. Seleccionar la accion.
2. Ejecutar iniciar.

Resultado esperado: accion pasa a `En proceso`.

## 11. Subir evidencia

1. Subir PDF, JPEG, PNG o WEBP menor a 5 MB.
2. Agregar descripcion.
3. Descargar la evidencia para validar que el archivo existe.

Resultado esperado: evidencia listada en el expediente o en la accion.

## 12. Enviar accion a validacion

1. Con evidencia cargada, enviar accion a validacion.
2. Agregar observaciones.

Resultado esperado: accion pasa a `En validación`.

## 13. Cerrar accion

1. Con rol validador, cerrar la accion.
2. Agregar observaciones.

Resultado esperado: accion pasa a `Cerrada`. Si todas las acciones del caso estan cerradas, el caso puede pasar a `En validación`.

## 14. Cerrar caso

1. En el expediente, ejecutar cierre formal.
2. Agregar observaciones.

Resultado esperado: caso pasa a `Cerrado`.

Tambien probar `cerrar sin acciones` para un caso aprobado sin acciones.

## 15. Ver notificaciones

1. Ir a `/app/notificaciones`.
2. Revisar total y no leidas.
3. Marcar una notificacion como leida.
4. Marcar todas como leidas.

Resultado esperado: el resumen cambia correctamente.

## 16. Crear usuario

1. Ir a `/app/usuarios`.
2. Crear usuario con nombre, correo, password temporal y roles.
3. Confirmar que aparezca en la tabla.

Resultado esperado: usuario activo y con roles asignados.

## 17. Asignar roles

1. En `/app/usuarios`, abrir asignacion de roles.
2. Cambiar los roles del usuario de prueba.
3. Guardar.

Resultado esperado: los roles se reemplazan por los seleccionados.

## 18. Cambiar contraseña

1. En `/app/usuarios`, abrir cambio de contraseña.
2. Ingresar nueva contraseña y confirmacion.
3. Guardar.
4. Probar login con la nueva contraseña.

Resultado esperado: login correcto con nueva contraseña y sin exponer hash.

## 19. Probar menu por rol

1. Crear o usar un usuario sin rol `Administrador`.
2. Iniciar sesion.
3. Verificar que no aparezcan `Usuarios` ni `Roles`.
4. Intentar acceder manualmente a `/app/usuarios` o `/app/roles`.

Resultado esperado: redireccion a `/acceso-denegado` o vista de acceso denegado.

## 20. Probar proteccion de roles base

1. Ir a `/app/roles`.
2. Confirmar chip `Rol base` en:
   - Administrador
   - Brigada
   - PRL Contratista
   - Responsable del Proceso
   - SYMA
   - Gestión y Control SYMA
   - Gerencia
3. Editar un rol base.
4. Confirmar que el campo nombre este bloqueado.
5. Actualizar solo descripcion.
6. Confirmar que no exista boton eliminar para roles base.

Resultado esperado: descripcion actualizada, nombre intacto y eliminacion no disponible.

Prueba adicional por API: intentar eliminar un rol base debe responder error con mensaje amigable.

## Pruebas negativas recomendadas

- Login con password incorrecto: debe responder error.
- Crear usuario con correo duplicado: debe responder error.
- Crear usuario sin roles: debe responder error.
- Enviar accion a validacion sin evidencia: debe responder error.
- Subir archivo no permitido: debe responder error.
- Eliminar rol asignado a usuarios: debe responder error.
- Acceder a endpoints administrativos con usuario no Administrador: debe responder `403`.

## Documentacion complementaria

Existen guias manuales por modulo en:

- `auth-manual-tests.md`
- `casos-manual-tests.md`
- `validaciones-procedencia-manual-tests.md`
- `acciones-evidencias-manual-tests.md`
- `cierre-notificaciones-dashboard-manual-tests.md`
