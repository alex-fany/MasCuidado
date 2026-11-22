-- AlterTable
ALTER TABLE "inventario_alimento" ALTER COLUMN "cantidad_restante" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "cantidad_total" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "compartir_alimento" (
    "id_compartir" TEXT NOT NULL,
    "id_inventario" TEXT NOT NULL,
    "id_mascota" TEXT NOT NULL,

    CONSTRAINT "compartir_alimento_pkey" PRIMARY KEY ("id_compartir")
);

-- CreateIndex
CREATE UNIQUE INDEX "compartir_alimento_id_inventario_id_mascota_key" ON "compartir_alimento"("id_inventario", "id_mascota");

-- AddForeignKey
ALTER TABLE "compartir_alimento" ADD CONSTRAINT "compartir_alimento_id_inventario_fkey" FOREIGN KEY ("id_inventario") REFERENCES "inventario_alimento"("id_inventario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compartir_alimento" ADD CONSTRAINT "compartir_alimento_id_mascota_fkey" FOREIGN KEY ("id_mascota") REFERENCES "mascota"("id_mascota") ON DELETE CASCADE ON UPDATE CASCADE;
