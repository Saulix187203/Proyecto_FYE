-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "correo" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_acceso" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(255),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios_roles" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "rol_id" INTEGER NOT NULL,
    "asignado_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "descripcion" VARCHAR(255),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procesos" (
    "id" SERIAL NOT NULL,
    "area_id" INTEGER NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" VARCHAR(255),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procesos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_evento" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "descripcion" VARCHAR(255),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "criticidades" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(255),
    "color" VARCHAR(20),
    "orden" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "criticidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estados_caso" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "descripcion" VARCHAR(255),
    "orden" INTEGER NOT NULL,
    "es_final" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estados_caso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estados_accion" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "descripcion" VARCHAR(255),
    "orden" INTEGER NOT NULL,
    "es_final" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estados_accion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "casi_accidentes" (
    "id" SERIAL NOT NULL,
    "correlativo" VARCHAR(30) NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha_hora_evento" TIMESTAMP(3) NOT NULL,
    "fecha_reporte" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ubicacion" VARCHAR(255),
    "area_id" INTEGER NOT NULL,
    "proceso_id" INTEGER NOT NULL,
    "tipo_evento_id" INTEGER NOT NULL,
    "criticidad_id" INTEGER NOT NULL,
    "estado_caso_id" INTEGER NOT NULL,
    "reportado_por_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "casi_accidentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reportes_iniciales" (
    "id" SERIAL NOT NULL,
    "casi_accidente_id" INTEGER NOT NULL,
    "descripcion_detallada" TEXT,
    "personas_involucradas" TEXT,
    "medidas_inmediatas" TEXT,
    "hubo_lesion" BOOLEAN NOT NULL DEFAULT false,
    "hubo_dano_material" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reportes_iniciales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validaciones_procedencia" (
    "id" SERIAL NOT NULL,
    "casi_accidente_id" INTEGER NOT NULL,
    "validador_id" INTEGER NOT NULL,
    "procedente" BOOLEAN NOT NULL,
    "observacion" TEXT,
    "fecha_validacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "validaciones_procedencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "divulgaciones_caso" (
    "id" SERIAL NOT NULL,
    "casi_accidente_id" INTEGER NOT NULL,
    "fecha_divulgacion" TIMESTAMP(3) NOT NULL,
    "medio" VARCHAR(100) NOT NULL,
    "audiencia" VARCHAR(255),
    "descripcion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "divulgaciones_caso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acciones_correctivas" (
    "id" SERIAL NOT NULL,
    "casi_accidente_id" INTEGER NOT NULL,
    "responsable_id" INTEGER NOT NULL,
    "estado_accion_id" INTEGER NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha_compromiso" TIMESTAMP(3) NOT NULL,
    "fecha_cierre" TIMESTAMP(3),
    "porcentaje_avance" INTEGER NOT NULL DEFAULT 0,
    "observacion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acciones_correctivas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidencias" (
    "id" SERIAL NOT NULL,
    "casi_accidente_id" INTEGER NOT NULL,
    "accion_correctiva_id" INTEGER,
    "subido_por_id" INTEGER,
    "nombre_archivo" VARCHAR(255) NOT NULL,
    "ruta_archivo" VARCHAR(500) NOT NULL,
    "tipo_mime" VARCHAR(100),
    "tamano_bytes" INTEGER,
    "descripcion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evidencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bitacora_casos" (
    "id" SERIAL NOT NULL,
    "casi_accidente_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "estado_anterior_id" INTEGER,
    "estado_nuevo_id" INTEGER,
    "accion_realizada" VARCHAR(150) NOT NULL,
    "observacion" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bitacora_casos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "casi_accidente_id" INTEGER,
    "tipo" VARCHAR(80),
    "titulo" VARCHAR(200) NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fecha_lectura" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comentarios_observacion" (
    "id" SERIAL NOT NULL,
    "casi_accidente_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "comentario" TEXT NOT NULL,
    "resuelto" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comentarios_observacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE INDEX "usuarios_roles_rol_id_idx" ON "usuarios_roles"("rol_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_roles_usuario_id_rol_id_key" ON "usuarios_roles"("usuario_id", "rol_id");

-- CreateIndex
CREATE UNIQUE INDEX "areas_nombre_key" ON "areas"("nombre");

-- CreateIndex
CREATE INDEX "procesos_area_id_idx" ON "procesos"("area_id");

-- CreateIndex
CREATE UNIQUE INDEX "procesos_area_id_nombre_key" ON "procesos"("area_id", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_evento_nombre_key" ON "tipos_evento"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "criticidades_nombre_key" ON "criticidades"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "criticidades_orden_key" ON "criticidades"("orden");

-- CreateIndex
CREATE UNIQUE INDEX "estados_caso_nombre_key" ON "estados_caso"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "estados_caso_orden_key" ON "estados_caso"("orden");

-- CreateIndex
CREATE UNIQUE INDEX "estados_accion_nombre_key" ON "estados_accion"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "estados_accion_orden_key" ON "estados_accion"("orden");

-- CreateIndex
CREATE UNIQUE INDEX "casi_accidentes_correlativo_key" ON "casi_accidentes"("correlativo");

-- CreateIndex
CREATE INDEX "casi_accidentes_area_id_idx" ON "casi_accidentes"("area_id");

-- CreateIndex
CREATE INDEX "casi_accidentes_proceso_id_idx" ON "casi_accidentes"("proceso_id");

-- CreateIndex
CREATE INDEX "casi_accidentes_tipo_evento_id_idx" ON "casi_accidentes"("tipo_evento_id");

-- CreateIndex
CREATE INDEX "casi_accidentes_criticidad_id_idx" ON "casi_accidentes"("criticidad_id");

-- CreateIndex
CREATE INDEX "casi_accidentes_estado_caso_id_idx" ON "casi_accidentes"("estado_caso_id");

-- CreateIndex
CREATE INDEX "casi_accidentes_reportado_por_id_idx" ON "casi_accidentes"("reportado_por_id");

-- CreateIndex
CREATE INDEX "casi_accidentes_fecha_reporte_idx" ON "casi_accidentes"("fecha_reporte");

-- CreateIndex
CREATE UNIQUE INDEX "reportes_iniciales_casi_accidente_id_key" ON "reportes_iniciales"("casi_accidente_id");

-- CreateIndex
CREATE INDEX "validaciones_procedencia_casi_accidente_id_idx" ON "validaciones_procedencia"("casi_accidente_id");

-- CreateIndex
CREATE INDEX "validaciones_procedencia_validador_id_idx" ON "validaciones_procedencia"("validador_id");

-- CreateIndex
CREATE INDEX "divulgaciones_caso_casi_accidente_id_idx" ON "divulgaciones_caso"("casi_accidente_id");

-- CreateIndex
CREATE INDEX "acciones_correctivas_casi_accidente_id_idx" ON "acciones_correctivas"("casi_accidente_id");

-- CreateIndex
CREATE INDEX "acciones_correctivas_responsable_id_idx" ON "acciones_correctivas"("responsable_id");

-- CreateIndex
CREATE INDEX "acciones_correctivas_estado_accion_id_idx" ON "acciones_correctivas"("estado_accion_id");

-- CreateIndex
CREATE INDEX "acciones_correctivas_fecha_compromiso_idx" ON "acciones_correctivas"("fecha_compromiso");

-- CreateIndex
CREATE INDEX "evidencias_casi_accidente_id_idx" ON "evidencias"("casi_accidente_id");

-- CreateIndex
CREATE INDEX "evidencias_accion_correctiva_id_idx" ON "evidencias"("accion_correctiva_id");

-- CreateIndex
CREATE INDEX "evidencias_subido_por_id_idx" ON "evidencias"("subido_por_id");

-- CreateIndex
CREATE INDEX "bitacora_casos_casi_accidente_id_fecha_idx" ON "bitacora_casos"("casi_accidente_id", "fecha");

-- CreateIndex
CREATE INDEX "bitacora_casos_usuario_id_idx" ON "bitacora_casos"("usuario_id");

-- CreateIndex
CREATE INDEX "bitacora_casos_estado_anterior_id_idx" ON "bitacora_casos"("estado_anterior_id");

-- CreateIndex
CREATE INDEX "bitacora_casos_estado_nuevo_id_idx" ON "bitacora_casos"("estado_nuevo_id");

-- CreateIndex
CREATE INDEX "notificaciones_usuario_id_leida_idx" ON "notificaciones"("usuario_id", "leida");

-- CreateIndex
CREATE INDEX "notificaciones_casi_accidente_id_idx" ON "notificaciones"("casi_accidente_id");

-- CreateIndex
CREATE INDEX "comentarios_observacion_casi_accidente_id_idx" ON "comentarios_observacion"("casi_accidente_id");

-- CreateIndex
CREATE INDEX "comentarios_observacion_usuario_id_idx" ON "comentarios_observacion"("usuario_id");

-- AddForeignKey
ALTER TABLE "usuarios_roles" ADD CONSTRAINT "usuarios_roles_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_roles" ADD CONSTRAINT "usuarios_roles_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procesos" ADD CONSTRAINT "procesos_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casi_accidentes" ADD CONSTRAINT "casi_accidentes_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casi_accidentes" ADD CONSTRAINT "casi_accidentes_proceso_id_fkey" FOREIGN KEY ("proceso_id") REFERENCES "procesos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casi_accidentes" ADD CONSTRAINT "casi_accidentes_tipo_evento_id_fkey" FOREIGN KEY ("tipo_evento_id") REFERENCES "tipos_evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casi_accidentes" ADD CONSTRAINT "casi_accidentes_criticidad_id_fkey" FOREIGN KEY ("criticidad_id") REFERENCES "criticidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casi_accidentes" ADD CONSTRAINT "casi_accidentes_estado_caso_id_fkey" FOREIGN KEY ("estado_caso_id") REFERENCES "estados_caso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casi_accidentes" ADD CONSTRAINT "casi_accidentes_reportado_por_id_fkey" FOREIGN KEY ("reportado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_iniciales" ADD CONSTRAINT "reportes_iniciales_casi_accidente_id_fkey" FOREIGN KEY ("casi_accidente_id") REFERENCES "casi_accidentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validaciones_procedencia" ADD CONSTRAINT "validaciones_procedencia_casi_accidente_id_fkey" FOREIGN KEY ("casi_accidente_id") REFERENCES "casi_accidentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validaciones_procedencia" ADD CONSTRAINT "validaciones_procedencia_validador_id_fkey" FOREIGN KEY ("validador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "divulgaciones_caso" ADD CONSTRAINT "divulgaciones_caso_casi_accidente_id_fkey" FOREIGN KEY ("casi_accidente_id") REFERENCES "casi_accidentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acciones_correctivas" ADD CONSTRAINT "acciones_correctivas_casi_accidente_id_fkey" FOREIGN KEY ("casi_accidente_id") REFERENCES "casi_accidentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acciones_correctivas" ADD CONSTRAINT "acciones_correctivas_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acciones_correctivas" ADD CONSTRAINT "acciones_correctivas_estado_accion_id_fkey" FOREIGN KEY ("estado_accion_id") REFERENCES "estados_accion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias" ADD CONSTRAINT "evidencias_casi_accidente_id_fkey" FOREIGN KEY ("casi_accidente_id") REFERENCES "casi_accidentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias" ADD CONSTRAINT "evidencias_accion_correctiva_id_fkey" FOREIGN KEY ("accion_correctiva_id") REFERENCES "acciones_correctivas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias" ADD CONSTRAINT "evidencias_subido_por_id_fkey" FOREIGN KEY ("subido_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bitacora_casos" ADD CONSTRAINT "bitacora_casos_casi_accidente_id_fkey" FOREIGN KEY ("casi_accidente_id") REFERENCES "casi_accidentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bitacora_casos" ADD CONSTRAINT "bitacora_casos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bitacora_casos" ADD CONSTRAINT "bitacora_casos_estado_anterior_id_fkey" FOREIGN KEY ("estado_anterior_id") REFERENCES "estados_caso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bitacora_casos" ADD CONSTRAINT "bitacora_casos_estado_nuevo_id_fkey" FOREIGN KEY ("estado_nuevo_id") REFERENCES "estados_caso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_casi_accidente_id_fkey" FOREIGN KEY ("casi_accidente_id") REFERENCES "casi_accidentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_observacion" ADD CONSTRAINT "comentarios_observacion_casi_accidente_id_fkey" FOREIGN KEY ("casi_accidente_id") REFERENCES "casi_accidentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_observacion" ADD CONSTRAINT "comentarios_observacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
