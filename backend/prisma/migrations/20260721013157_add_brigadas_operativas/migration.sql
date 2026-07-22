-- AlterTable
ALTER TABLE "casi_accidentes" ADD COLUMN     "brigada_reportante_id" INTEGER;

-- CreateTable
CREATE TABLE "regiones" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "codigo" VARCHAR(30) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departamentos" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "codigo" VARCHAR(30) NOT NULL,
    "region_id" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "municipios" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "codigo" VARCHAR(30) NOT NULL,
    "departamento_id" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "municipios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_brigada" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "descripcion" VARCHAR(255),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_brigada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brigadas" (
    "id" SERIAL NOT NULL,
    "numero" VARCHAR(30) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "tipo_brigada_id" INTEGER NOT NULL,
    "region_id" INTEGER NOT NULL,
    "departamento_id" INTEGER,
    "municipio_id" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brigadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brigadas_miembros" (
    "id" SERIAL NOT NULL,
    "brigada_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "cargo_en_brigada" VARCHAR(120),
    "es_lider" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_desde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_hasta" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brigadas_miembros_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "regiones_nombre_key" ON "regiones"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "regiones_codigo_key" ON "regiones"("codigo");

-- CreateIndex
CREATE INDEX "departamentos_region_id_idx" ON "departamentos"("region_id");

-- CreateIndex
CREATE UNIQUE INDEX "departamentos_region_id_nombre_key" ON "departamentos"("region_id", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "departamentos_region_id_codigo_key" ON "departamentos"("region_id", "codigo");

-- CreateIndex
CREATE INDEX "municipios_departamento_id_idx" ON "municipios"("departamento_id");

-- CreateIndex
CREATE UNIQUE INDEX "municipios_departamento_id_nombre_key" ON "municipios"("departamento_id", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "municipios_departamento_id_codigo_key" ON "municipios"("departamento_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_brigada_nombre_key" ON "tipos_brigada"("nombre");

-- CreateIndex
CREATE INDEX "brigadas_tipo_brigada_id_idx" ON "brigadas"("tipo_brigada_id");

-- CreateIndex
CREATE INDEX "brigadas_region_id_idx" ON "brigadas"("region_id");

-- CreateIndex
CREATE INDEX "brigadas_departamento_id_idx" ON "brigadas"("departamento_id");

-- CreateIndex
CREATE INDEX "brigadas_municipio_id_idx" ON "brigadas"("municipio_id");

-- CreateIndex
CREATE INDEX "brigadas_activo_idx" ON "brigadas"("activo");

-- CreateIndex
CREATE INDEX "brigadas_tipo_brigada_id_region_id_departamento_id_municipi_idx" ON "brigadas"("tipo_brigada_id", "region_id", "departamento_id", "municipio_id", "numero");

-- CreateIndex
CREATE INDEX "brigadas_miembros_brigada_id_idx" ON "brigadas_miembros"("brigada_id");

-- CreateIndex
CREATE INDEX "brigadas_miembros_usuario_id_idx" ON "brigadas_miembros"("usuario_id");

-- CreateIndex
CREATE INDEX "brigadas_miembros_brigada_id_usuario_id_activo_idx" ON "brigadas_miembros"("brigada_id", "usuario_id", "activo");

-- CreateIndex
CREATE INDEX "casi_accidentes_brigada_reportante_id_idx" ON "casi_accidentes"("brigada_reportante_id");

-- AddForeignKey
ALTER TABLE "departamentos" ADD CONSTRAINT "departamentos_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "municipios" ADD CONSTRAINT "municipios_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brigadas" ADD CONSTRAINT "brigadas_tipo_brigada_id_fkey" FOREIGN KEY ("tipo_brigada_id") REFERENCES "tipos_brigada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brigadas" ADD CONSTRAINT "brigadas_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brigadas" ADD CONSTRAINT "brigadas_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brigadas" ADD CONSTRAINT "brigadas_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "municipios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brigadas_miembros" ADD CONSTRAINT "brigadas_miembros_brigada_id_fkey" FOREIGN KEY ("brigada_id") REFERENCES "brigadas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brigadas_miembros" ADD CONSTRAINT "brigadas_miembros_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casi_accidentes" ADD CONSTRAINT "casi_accidentes_brigada_reportante_id_fkey" FOREIGN KEY ("brigada_reportante_id") REFERENCES "brigadas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
