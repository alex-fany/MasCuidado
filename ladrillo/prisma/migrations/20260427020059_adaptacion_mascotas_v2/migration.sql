/*
  Warnings:

  - The primary key for the `clinica_favorita` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id_usuario` on the `clinica_favorita` table. All the data in the column will be lost.
  - The primary key for the `historial_medico` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `mascota` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `usuario` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `id_mascota` to the `clinica_favorita` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "clinica_favorita" DROP CONSTRAINT "clinica_favorita_id_usuario_fkey";

-- DropForeignKey
ALTER TABLE "historial_medico" DROP CONSTRAINT "historial_medico_id_mascota_fkey";

-- DropForeignKey
ALTER TABLE "mascota" DROP CONSTRAINT "mascota_id_usuario_fkey";

-- DropForeignKey
ALTER TABLE "mascota_virtual" DROP CONSTRAINT "mascota_virtual_id_mascota_fkey";

-- DropForeignKey
ALTER TABLE "mascota_virtual_item" DROP CONSTRAINT "mascota_virtual_item_id_mascota_virtual_fkey";

-- DropForeignKey
ALTER TABLE "recordatorio" DROP CONSTRAINT "recordatorio_id_mascota_fkey";

-- DropForeignKey
ALTER TABLE "vacuna" DROP CONSTRAINT "vacuna_id_mascota_fkey";

-- AlterTable
ALTER TABLE "clinica_favorita" DROP CONSTRAINT "clinica_favorita_pkey",
DROP COLUMN "id_usuario",
ADD COLUMN     "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "direccion" VARCHAR(255),
ADD COLUMN     "id_mascota" TEXT NOT NULL,
ALTER COLUMN "id_clinica_fav" DROP DEFAULT,
ALTER COLUMN "id_clinica_fav" SET DATA TYPE TEXT,
ADD CONSTRAINT "clinica_favorita_pkey" PRIMARY KEY ("id_clinica_fav");
DROP SEQUENCE "clinica_favorita_id_clinica_fav_seq";

-- AlterTable
ALTER TABLE "historial_medico" DROP CONSTRAINT "historial_medico_pkey",
ADD COLUMN     "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "id_evento" DROP DEFAULT,
ALTER COLUMN "id_evento" SET DATA TYPE TEXT,
ALTER COLUMN "id_mascota" SET DATA TYPE TEXT,
ADD CONSTRAINT "historial_medico_pkey" PRIMARY KEY ("id_evento");
DROP SEQUENCE "historial_medico_id_evento_seq";

-- AlterTable
ALTER TABLE "mascota" DROP CONSTRAINT "mascota_pkey",
ADD COLUMN     "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "genero" TEXT,
ADD COLUMN     "peso" DOUBLE PRECISION,
ADD COLUMN     "tipo" VARCHAR(50),
ALTER COLUMN "id_mascota" DROP DEFAULT,
ALTER COLUMN "id_mascota" SET DATA TYPE TEXT,
ALTER COLUMN "id_usuario" SET DATA TYPE TEXT,
ALTER COLUMN "id_especie" DROP NOT NULL,
ADD CONSTRAINT "mascota_pkey" PRIMARY KEY ("id_mascota");
DROP SEQUENCE "mascota_id_mascota_seq";

-- AlterTable
ALTER TABLE "mascota_virtual" ALTER COLUMN "id_mascota" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "recordatorio" ALTER COLUMN "id_mascota" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "usuario" DROP CONSTRAINT "usuario_pkey",
ALTER COLUMN "id_usuario" DROP DEFAULT,
ALTER COLUMN "id_usuario" SET DATA TYPE TEXT,
ADD CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_usuario");
DROP SEQUENCE "usuario_id_usuario_seq";

-- AlterTable
ALTER TABLE "vacuna" ALTER COLUMN "id_mascota" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "clinica_favorita" ADD CONSTRAINT "clinica_favorita_id_mascota_fkey" FOREIGN KEY ("id_mascota") REFERENCES "mascota"("id_mascota") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_medico" ADD CONSTRAINT "historial_medico_id_mascota_fkey" FOREIGN KEY ("id_mascota") REFERENCES "mascota"("id_mascota") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mascota" ADD CONSTRAINT "mascota_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mascota_virtual" ADD CONSTRAINT "mascota_virtual_id_mascota_fkey" FOREIGN KEY ("id_mascota") REFERENCES "mascota"("id_mascota") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mascota_virtual_item" ADD CONSTRAINT "mascota_virtual_item_id_mascota_virtual_fkey" FOREIGN KEY ("id_mascota_virtual") REFERENCES "mascota_virtual"("id_mascota_virtual") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recordatorio" ADD CONSTRAINT "recordatorio_id_mascota_fkey" FOREIGN KEY ("id_mascota") REFERENCES "mascota"("id_mascota") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacuna" ADD CONSTRAINT "vacuna_id_mascota_fkey" FOREIGN KEY ("id_mascota") REFERENCES "mascota"("id_mascota") ON DELETE CASCADE ON UPDATE CASCADE;
