/*
  Warnings:

  - Added the required column `maxCapacity` to the `Subject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nrCursuri` to the `Subject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nrLectii` to the `Subject` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "maxCapacity" INTEGER NOT NULL,
ADD COLUMN     "nrCursuri" INTEGER NOT NULL,
ADD COLUMN     "nrLectii" INTEGER NOT NULL;
