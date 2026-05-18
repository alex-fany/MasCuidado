-- AlterTable
ALTER TABLE "configuracion_nutricion" ADD COLUMN     "reinicio_agua_dias" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "porcion_diaria" SET DEFAULT 0,
ALTER COLUMN "porcion_diaria" SET DATA TYPE DOUBLE PRECISION;
