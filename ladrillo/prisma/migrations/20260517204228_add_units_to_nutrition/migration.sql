/*
  Warnings:

  - You are about to drop the column `porcion_diaria_gramos` on the `configuracion_nutricion` table. All the data in the column will be lost.
  - You are about to drop the column `cantidad_restante_gramos` on the `inventario_alimento` table. All the data in the column will be lost.
  - You are about to drop the column `cantidad_total_gramos` on the `inventario_alimento` table. All the data in the column will be lost.
  - Added the required column `cantidad_restante` to the `inventario_alimento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cantidad_total` to the `inventario_alimento` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "configuracion_nutricion" DROP COLUMN "porcion_diaria_gramos",
ADD COLUMN     "porcion_diaria" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unidad_medida" VARCHAR(10) NOT NULL DEFAULT 'g';

-- AlterTable
ALTER TABLE "inventario_alimento" DROP COLUMN "cantidad_restante_gramos",
DROP COLUMN "cantidad_total_gramos",
ADD COLUMN     "cantidad_restante" INTEGER NOT NULL,
ADD COLUMN     "cantidad_total" INTEGER NOT NULL,
ADD COLUMN     "unidad_medida" VARCHAR(10) NOT NULL DEFAULT 'g';
