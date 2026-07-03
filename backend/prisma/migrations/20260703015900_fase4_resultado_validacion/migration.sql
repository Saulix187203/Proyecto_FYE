/*
  Warnings:

  - Added the required column `resultado` to the `validaciones_procedencia` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "validaciones_procedencia" ADD COLUMN     "resultado" VARCHAR(50) NOT NULL;
