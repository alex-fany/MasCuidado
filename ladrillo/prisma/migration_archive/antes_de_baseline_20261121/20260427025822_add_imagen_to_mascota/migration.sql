/*
  Warnings:

  - You are about to drop the column `raza` on the `mascota` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "mascota" DROP COLUMN "raza",
ADD COLUMN     "imagen" TEXT;
