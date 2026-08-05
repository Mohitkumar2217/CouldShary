/*
  Warnings:

  - A unique constraint covering the columns `[resetPasswordTokenHash]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetPasswordExpireAt" TIMESTAMP(3),
ADD COLUMN     "resetPasswordTokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_resetPasswordTokenHash_key" ON "User"("resetPasswordTokenHash");
