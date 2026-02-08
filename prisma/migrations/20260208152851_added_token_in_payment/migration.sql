/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `token` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "token" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_token_key" ON "Payment"("token");
