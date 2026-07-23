# Carga de geografía de Guatemala

## Objetivo

Este proceso valida y sincroniza el catálogo geográfico base de SISCA en el
orden Región → Departamento → Municipio. Es idempotente: conserva los IDs
existentes, crea únicamente registros faltantes y actualiza solo `nombre`,
`codigo` y `activo` cuando la identidad del registro es inequívoca.

Nunca elimina registros ni mueve registros entre padres. Ante un conflicto de
identidad o jerarquía, termina con código distinto de cero antes de escribir.

## Fuente y estructura

La fuente es `prisma/data/geografia-guatemala.js`, un módulo CommonJS que
exporta un arreglo con esta estructura:

```text
Región { nombre, codigo, departamentos[] }
  Departamento { nombre, codigo, municipios[] }
    Municipio { nombre, codigo, codigoIne }
```

Conteos verificados del archivo:

- 5 regiones operativas de SISCA.
- 22 departamentos.
- 340 municipios.

`codigoIne` se valida como identificador único de cuatro dígitos, pero no se
persiste porque el modelo Prisma actual no posee ese campo. Los códigos
municipales persistidos se generan en el propio archivo fuente y respetan el
máximo de 30 caracteres del esquema.

## Normalización

La comparación de nombres aplica `trim`, reduce espacios consecutivos y compara
sin distinguir mayúsculas/minúsculas. Las tildes y los demás caracteres
oficiales se preservan y sí participan en la comparación. El valor almacenado
mantiene la ortografía oficial de la fuente; solo se normalizan espacios.

Los códigos se comparan sin distinguir mayúsculas/minúsculas. No se cambian IDs
ni claves foráneas existentes.

## Comandos

Ejecutar siempre desde `backend`.

Validación sin escritura:

```bash
npm run db:seed:geografia -- --dry-run
```

Aplicación en PowerShell:

```powershell
$env:CONFIRM_GEOGRAPHY_SEED = "YES"
npm run db:seed:geografia -- --apply
Remove-Item Env:CONFIRM_GEOGRAPHY_SEED
```

Aplicación en Linux o macOS:

```bash
CONFIRM_GEOGRAPHY_SEED=YES npm run db:seed:geografia -- --apply
```

El comando no asume un modo predeterminado: se debe indicar exactamente
`--dry-run` o `--apply`.

## Seguridad en producción

El proceso muestra `NODE_ENV`, host, puerto, base, esquema y modo, pero nunca
imprime `DATABASE_URL` completa ni sus credenciales.

En producción se requieren simultáneamente:

```powershell
$env:CONFIRM_GEOGRAPHY_SEED = "YES"
$env:CONFIRM_PRODUCTION_GEOGRAPHY = "YES"
npm run db:seed:geografia -- --apply
Remove-Item Env:CONFIRM_GEOGRAPHY_SEED
Remove-Item Env:CONFIRM_PRODUCTION_GEOGRAPHY
```

```bash
CONFIRM_GEOGRAPHY_SEED=YES \
CONFIRM_PRODUCTION_GEOGRAPHY=YES \
npm run db:seed:geografia -- --apply
```

La presencia de estas variables no dispara ninguna ejecución automática.

## Idempotencia y transacción

Las claves naturales utilizadas son:

- Región: nombre o código normalizado.
- Departamento: nombre o código normalizado dentro de la región.
- Municipio: nombre o código normalizado dentro del departamento.

Para registros nuevos se usa `upsert` con las restricciones únicas reales del
esquema. Para coincidencias normalizadas se actualiza por ID, evitando crear una
variante por diferencias de mayúsculas o espacios.

El modo `--apply` vuelve a leer y planificar dentro de una transacción Prisma
con aislamiento `Serializable`. Regiones, departamentos y municipios se
procesan en ese orden. Cualquier error revierte toda la sincronización
geográfica.

El esquema no tiene índices únicos que normalicen mayúsculas o espacios. La
transacción serializable y la validación previa reducen condiciones de carrera,
pero se recomienda ejecutar una sola instancia del seed a la vez.

## Tablas afectadas

El modo `--apply` puede insertar o actualizar exclusivamente:

- `regiones`: `nombre`, `codigo`, `activo`.
- `departamentos`: `nombre`, `codigo`, `activo` en creaciones o coincidencias
  bajo la misma región.
- `municipios`: `nombre`, `codigo`, `activo` en creaciones o coincidencias bajo
  el mismo departamento.

El proceso lee `brigadas` para validar integridad, pero no la modifica.

No afecta usuarios, roles, autenticación, brigadas, miembros, casos,
expedientes, reportes, acciones, evidencias ni ninguna tabla STRESS. No elimina,
desactiva ni modifica registros que no estén en la fuente.

## Validaciones

Antes de conectar o escribir se comprueba:

- Codificación UTF-8 válida.
- Tipos y campos obligatorios.
- Nombres y códigos no vacíos y dentro del tamaño permitido.
- Ausencia de espacios anómalos.
- Nombres no duplicados dentro de cada padre.
- Códigos geográficos y códigos INE no duplicados.
- Código INE de cuatro dígitos.
- Relaciones anidadas válidas.

Contra la base se comprueba:

- Duplicados por clave natural normalizada.
- Registros con nombre y código que apunten a identidades distintas.
- Códigos existentes bajo otro padre.
- Departamentos y municipios sin padre.
- Brigadas con región, departamento o municipio inexistente.
- Coincidencia entre región y departamento de cada brigada.
- Coincidencia entre departamento y municipio de cada brigada.

No se corrige automáticamente ninguna inconsistencia de brigadas.

## Integración con el seed normal

`prisma/seed.js` ya cargaba la geografía. La lógica se extrajo a
`prisma/lib/seed-geografia-lib.js` para que el seed normal y el comando
independiente compartan exactamente las mismas validaciones, resolución de
identidad y transacción. No se duplicó la carga.

Las confirmaciones adicionales corresponden al comando independiente. El seed
normal conserva su comportamiento explícito mediante `npm run db:seed`.

## Resultados verificados el 22 de julio de 2026

Dry-run local sobre `localhost`, base `sisca_db`, esquema `public`:

- Fuente: 5 regiones, 22 departamentos y 340 municipios.
- Base antes: 5 regiones, 22 departamentos y 340 municipios.
- Plan: 0 creaciones, 0 actualizaciones y 367 sin cambios.
- Conflictos: 0.
- Duplicados por clave natural: 0.
- Inconsistencias de brigadas: 0.
- Base después: 5 regiones, 22 departamentos y 340 municipios.
- El dry-run no produjo escrituras.

Prueba HTTP autenticada:

- `GET /api/catalogos/regiones`: 5 registros.
- `GET /api/catalogos/departamentos`: 22 registros.
- `GET /api/catalogos/municipios`: 340 registros.
- Filtros `regionId` y `departamentoId`: 22 y 340 registros acumulados,
  respectivamente, sin cruces de padre.
- IDs duplicados: 0.
- Orden alfabético dentro de cada nivel jerárquico: correcto.
- Se verificaron Petén/Norte, Guatemala/Centro, Escuintla/Sur y Jutiapa/Oriente.

Primera ejecución `--apply`: no ejecutada; pendiente de autorización expresa.

Segunda ejecución idempotente `--apply`: no ejecutada; depende de la primera y
de una autorización expresa.

## Resolución de errores

- `Debe indicar exactamente un modo`: use solo `--dry-run` o solo `--apply`.
- `CONFIRM_GEOGRAPHY_SEED=YES`: defina la variable únicamente cuando haya
  revisado el dry-run y quiera aplicar.
- `CONFIRM_PRODUCTION_GEOGRAPHY=YES`: confirmación adicional obligatoria cuando
  `NODE_ENV=production`.
- Error con una ruta como `geografiaGuatemala[...].departamentos[...]`: corrija
  la fuente en esa ruta después de revisar el nombre informado; no fuerce una
  carga parcial.
- Conflicto con otro padre: revise el registro existente. El proceso no cambia
  su región/departamento ni crea un duplicado silencioso.
- Error de conexión: confirme host, puerto, base y esquema mostrados, sin
  compartir la URL completa.

Después de resolver un error, vuelva a ejecutar primero `--dry-run`.
