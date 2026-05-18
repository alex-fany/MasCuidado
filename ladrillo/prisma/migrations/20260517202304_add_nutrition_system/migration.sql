/*
  Warnings:

  - You are about to drop the `catalogo_ropa` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mascota_virtual` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mascota_virtual_item` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "mascota_virtual" DROP CONSTRAINT "mascota_virtual_id_mascota_fkey";

-- DropForeignKey
ALTER TABLE "mascota_virtual_item" DROP CONSTRAINT "mascota_virtual_item_id_mascota_virtual_fkey";

-- DropForeignKey
ALTER TABLE "mascota_virtual_item" DROP CONSTRAINT "mascota_virtual_item_id_prenda_fkey";

-- DropTable
DROP TABLE "catalogo_ropa";

-- DropTable
DROP TABLE "mascota_virtual";

-- DropTable
DROP TABLE "mascota_virtual_item";

-- CreateTable
CREATE TABLE "configuracion_nutricion" (
    "id_config_nutricion" TEXT NOT NULL,
    "id_mascota" TEXT NOT NULL,
    "porcion_diaria_gramos" INTEGER NOT NULL DEFAULT 0,
    "meta_agua_diaria" INTEGER NOT NULL DEFAULT 4,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_nutricion_pkey" PRIMARY KEY ("id_config_nutricion")
);

-- CreateTable
CREATE TABLE "inventario_alimento" (
    "id_inventario" TEXT NOT NULL,
    "id_mascota" TEXT NOT NULL,
    "marca" VARCHAR(100) NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "cantidad_total_gramos" INTEGER NOT NULL,
    "cantidad_restante_gramos" INTEGER NOT NULL,
    "fecha_compra" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "costo" DECIMAL(10,2),
    "estado" VARCHAR(20) NOT NULL DEFAULT 'Activo',

    CONSTRAINT "inventario_alimento_pkey" PRIMARY KEY ("id_inventario")
);

-- CreateTable
CREATE TABLE "registro_hidratacion" (
    "id_registro_agua" TEXT NOT NULL,
    "id_mascota" TEXT NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cantidad_tazones" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "registro_hidratacion_pkey" PRIMARY KEY ("id_registro_agua")
);

-- CreateIndex
CREATE UNIQUE INDEX "configuracion_nutricion_id_mascota_key" ON "configuracion_nutricion"("id_mascota");

-- CreateIndex
CREATE INDEX "registro_hidratacion_id_mascota_fecha_hora_idx" ON "registro_hidratacion"("id_mascota", "fecha_hora");

-- AddForeignKey
ALTER TABLE "configuracion_nutricion" ADD CONSTRAINT "configuracion_nutricion_id_mascota_fkey" FOREIGN KEY ("id_mascota") REFERENCES "mascota"("id_mascota") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_alimento" ADD CONSTRAINT "inventario_alimento_id_mascota_fkey" FOREIGN KEY ("id_mascota") REFERENCES "mascota"("id_mascota") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_hidratacion" ADD CONSTRAINT "registro_hidratacion_id_mascota_fkey" FOREIGN KEY ("id_mascota") REFERENCES "mascota"("id_mascota") ON DELETE CASCADE ON UPDATE CASCADE;
