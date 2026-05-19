-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "reset_token" TEXT,
ADD COLUMN     "reset_token_exp" TIMESTAMP(3);
