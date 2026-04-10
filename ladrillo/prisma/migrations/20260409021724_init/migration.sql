-- CreateTable
CREATE TABLE "catalogo_especie" (
    "id_especie" SERIAL NOT NULL,
    "nombre_especie" VARCHAR(50) NOT NULL,

    CONSTRAINT "catalogo_especie_pkey" PRIMARY KEY ("id_especie")
);

-- CreateTable
CREATE TABLE "catalogo_ropa" (
    "id_prenda" SERIAL NOT NULL,
    "nombre_prenda" VARCHAR(100) NOT NULL,
    "categoria" VARCHAR(50),
    "url_asset" VARCHAR(255),

    CONSTRAINT "catalogo_ropa_pkey" PRIMARY KEY ("id_prenda")
);

-- CreateTable
CREATE TABLE "clinica_favorita" (
    "id_clinica_fav" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "google_place_id" VARCHAR(255) NOT NULL,
    "nombre_clinica" VARCHAR(150),
    "notas_usuario" TEXT,

    CONSTRAINT "clinica_favorita_pkey" PRIMARY KEY ("id_clinica_fav")
);

-- CreateTable
CREATE TABLE "historial_medico" (
    "id_evento" SERIAL NOT NULL,
    "id_mascota" INTEGER NOT NULL,
    "tipo_evento" VARCHAR(100),
    "fecha_evento" DATE NOT NULL,
    "descripcion" TEXT,
    "veterinario_clinica" VARCHAR(150),
    "peso_kg" DECIMAL(5,2),

    CONSTRAINT "historial_medico_pkey" PRIMARY KEY ("id_evento")
);

-- CreateTable
CREATE TABLE "mascota" (
    "id_mascota" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_especie" INTEGER NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "raza" VARCHAR(100),
    "fecha_nacimiento" DATE,
    "sexo" CHAR(1),
    "color" VARCHAR(100),
    "senas_particulares" TEXT,

    CONSTRAINT "mascota_pkey" PRIMARY KEY ("id_mascota")
);

-- CreateTable
CREATE TABLE "mascota_virtual" (
    "id_mascota_virtual" SERIAL NOT NULL,
    "id_mascota" INTEGER NOT NULL,

    CONSTRAINT "mascota_virtual_pkey" PRIMARY KEY ("id_mascota_virtual")
);

-- CreateTable
CREATE TABLE "mascota_virtual_item" (
    "id_registro" SERIAL NOT NULL,
    "id_mascota_virtual" INTEGER NOT NULL,
    "id_prenda" INTEGER NOT NULL,
    "slot" VARCHAR(50) NOT NULL,

    CONSTRAINT "mascota_virtual_item_pkey" PRIMARY KEY ("id_registro")
);

-- CreateTable
CREATE TABLE "recordatorio" (
    "id_recordatorio" SERIAL NOT NULL,
    "id_mascota" INTEGER NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "fecha_hora" TIMESTAMP(6) NOT NULL,
    "id_evento_google" VARCHAR(255),
    "estado" BOOLEAN DEFAULT false,

    CONSTRAINT "recordatorio_pkey" PRIMARY KEY ("id_recordatorio")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id_usuario" SERIAL NOT NULL,
    "nombre_completo" VARCHAR(150) NOT NULL,
    "correo" VARCHAR(150) NOT NULL,
    "password" VARCHAR(255),
    "google_id" VARCHAR(255),
    "google_refresh_token" TEXT,
    "telefono" VARCHAR(20),
    "direccion" VARCHAR(255),
    "fecha_registro" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "vacuna" (
    "id_vacuna" SERIAL NOT NULL,
    "id_mascota" INTEGER NOT NULL,
    "nombre_vacuna" VARCHAR(150) NOT NULL,
    "fecha_aplicacion" DATE NOT NULL,
    "proxima_dosis" DATE,
    "lote" VARCHAR(100),

    CONSTRAINT "vacuna_pkey" PRIMARY KEY ("id_vacuna")
);

-- CreateIndex
CREATE UNIQUE INDEX "catalogo_especie_nombre_especie_key" ON "catalogo_especie"("nombre_especie");

-- CreateIndex
CREATE INDEX "idx_historial_mascota" ON "historial_medico"("id_mascota");

-- CreateIndex
CREATE INDEX "idx_mascota_usuario" ON "mascota"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "mascota_virtual_id_mascota_key" ON "mascota_virtual"("id_mascota");

-- CreateIndex
CREATE UNIQUE INDEX "mascota_virtual_item_id_mascota_virtual_slot_key" ON "mascota_virtual_item"("id_mascota_virtual", "slot");

-- CreateIndex
CREATE INDEX "idx_recordatorio_mascota" ON "recordatorio"("id_mascota");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_correo_key" ON "usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_google_id_key" ON "usuario"("google_id");

-- CreateIndex
CREATE INDEX "idx_vacuna_mascota" ON "vacuna"("id_mascota");

-- AddForeignKey
ALTER TABLE "clinica_favorita" ADD CONSTRAINT "clinica_favorita_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "historial_medico" ADD CONSTRAINT "historial_medico_id_mascota_fkey" FOREIGN KEY ("id_mascota") REFERENCES "mascota"("id_mascota") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mascota" ADD CONSTRAINT "mascota_id_especie_fkey" FOREIGN KEY ("id_especie") REFERENCES "catalogo_especie"("id_especie") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mascota" ADD CONSTRAINT "mascota_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mascota_virtual" ADD CONSTRAINT "mascota_virtual_id_mascota_fkey" FOREIGN KEY ("id_mascota") REFERENCES "mascota"("id_mascota") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mascota_virtual_item" ADD CONSTRAINT "mascota_virtual_item_id_mascota_virtual_fkey" FOREIGN KEY ("id_mascota_virtual") REFERENCES "mascota_virtual"("id_mascota_virtual") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mascota_virtual_item" ADD CONSTRAINT "mascota_virtual_item_id_prenda_fkey" FOREIGN KEY ("id_prenda") REFERENCES "catalogo_ropa"("id_prenda") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recordatorio" ADD CONSTRAINT "recordatorio_id_mascota_fkey" FOREIGN KEY ("id_mascota") REFERENCES "mascota"("id_mascota") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vacuna" ADD CONSTRAINT "vacuna_id_mascota_fkey" FOREIGN KEY ("id_mascota") REFERENCES "mascota"("id_mascota") ON DELETE CASCADE ON UPDATE NO ACTION;
