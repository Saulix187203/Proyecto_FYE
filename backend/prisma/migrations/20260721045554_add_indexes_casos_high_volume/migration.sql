-- CreateIndex
CREATE INDEX "idx_casi_accidente_brigada_fecha" ON "casi_accidentes"("brigada_reportante_id", "fecha_reporte", "id");

-- CreateIndex
CREATE INDEX "idx_casi_accidente_fecha_evento" ON "casi_accidentes"("fecha_hora_evento", "id");
