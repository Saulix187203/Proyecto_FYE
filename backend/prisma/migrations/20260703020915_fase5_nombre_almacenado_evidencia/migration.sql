/*
  Warnings:

  - Added the required column `nombre_almacenado` to the `evidencias` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "evidencias" ADD COLUMN     "nombre_almacenado" VARCHAR(255) NOT NULL;
