/*
  Warnings:

  - Added the required column `id_usuario` to the `recordatorio` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "recordatorio" ADD COLUMN     "descripcion" TEXT,
ADD COLUMN     "id_usuario" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "idx_recordatorio_usuario" ON "recordatorio"("id_usuario");

-- AddForeignKey
ALTER TABLE "recordatorio" ADD CONSTRAINT "recordatorio_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
