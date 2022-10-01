/*
  Warnings:

  - You are about to drop the column `balance` on the `Consumer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Consumer` DROP COLUMN `balance`,
    ADD COLUMN `consumed` VARCHAR(191) NOT NULL DEFAULT '0';
