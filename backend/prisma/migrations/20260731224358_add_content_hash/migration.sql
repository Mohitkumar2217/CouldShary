/*
  Warnings:

  - Added the required column `contentHash` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "File" ADD COLUMN     "contentHash" VARCHAR(64) NOT NULL;
