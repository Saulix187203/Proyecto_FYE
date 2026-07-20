# Workflow de estados - SISCA

Este documento resume los estados principales de casos y acciones correctivas, junto con las transiciones esperadas del flujo funcional.

## Estados del caso

- Reportado
- En revisión
- Aprobado
- Devuelto
- Rechazado
- Con acciones
- En validación
- Cerrado

## Flujo de casos

```text
Reportado → En revisión
En revisión → Aprobado
En revisión → Devuelto
En revisión → Rechazado
Devuelto → En revisión
Aprobado → Con acciones
Aprobado → Cerrado sin acciones
Con acciones → En validación cuando todas las acciones estan cerradas
En validación → Cerrado
En validación → Con acciones si se devuelve cierre
```

## Descripcion de estados de caso

| Estado | Descripcion |
|---|---|
| Reportado | Caso recien creado, pendiente de revision. |
| En revisión | Caso enviado a evaluacion de procedencia. |
| Aprobado | Caso validado como procedente. |
| Devuelto | Caso requiere correcciones o informacion adicional. |
| Rechazado | Caso no procede como casi-accidente. |
| Con acciones | Caso aprobado con acciones correctivas asociadas. |
| En validación | Todas las acciones cerraron y el caso espera cierre formal. |
| Cerrado | Caso finalizado formalmente. |

## Estados de acciones correctivas

- Pendiente
- En proceso
- En validación
- Cerrada
- Devuelta

El seed tambien incluye `Vencida` como estado de apoyo para seguimiento visual y operativo.

## Flujo de acciones correctivas

```text
Pendiente → En proceso
Devuelta → En proceso
En proceso → En validación
Devuelta → En validación
En validación → Cerrada
En validación → Devuelta
```

## Descripcion de estados de accion

| Estado | Descripcion |
|---|---|
| Pendiente | Accion creada y asignada, aun no iniciada. |
| En proceso | Responsable ejecuta la accion. |
| En validación | Responsable envio la accion para validacion. |
| Cerrada | Accion aprobada y finalizada. |
| Devuelta | Accion requiere correccion o nueva evidencia. |
| Vencida | Estado operativo para identificar acciones fuera de fecha compromiso. |

## Reglas importantes

- Una accion debe tener evidencia antes de enviarse a validacion.
- Al cerrar todas las acciones de un caso, el caso puede pasar a `En validación`.
- El cierre formal del caso ocurre desde el modulo de cierre.
- Si se devuelve el cierre, el caso regresa a `Con acciones`.
- Las transiciones quedan registradas en bitacora del expediente.
- Eventos relevantes generan notificaciones a los usuarios involucrados.
