/*
  Warnings:

  - You are about to drop the column `direccion` on the `usuario` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "usuario" DROP COLUMN "direccion";

-- CreateTable
CREATE TABLE "user_settings" (
    "id_settings" TEXT NOT NULL,
    "id_usuario" TEXT NOT NULL,
    "theme" VARCHAR(20) NOT NULL DEFAULT 'light',
    "language" VARCHAR(10) NOT NULL DEFAULT 'es',

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id_settings")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_id_usuario_key" ON "user_settings"("id_usuario");

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
