# Carga segura de geografía de Guatemala

Este flujo está pensado para cargar de forma idempotente los catálogos geográficos de regiones, departamentos y municipios sin modificar el schema ni afectar los datos de estrés.

## Requisitos

- Tener configurada la variable `DATABASE_URL`.
- Tener instalada la dependencia de Prisma y el cliente generado.

## Comandos

### Verificación previa (dry run)

```bash
node prisma/seed-geografia.js --dry-run
```

### Aplicar carga

```bash
CONFIRM_GEOGRAPHY_SEED=YES node prisma/seed-geografia.js --apply
```

## Comportamiento

- Valida el archivo fuente antes de escribir.
- Usa `findFirst` + `create`/`update` para ser idempotente.
- No toca las tablas de brigadas ni otros catálogos no relacionados.
- Solo actualiza `codigo` y `activo` cuando los datos cambian.

## Seguridad

- No se ejecuta en producción sin `CONFIRM_PRODUCTION_GEOGRAPHY=YES`.
- El flujo exige confirmación explícita para aplicar.
