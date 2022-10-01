/*
  Warnings:

  - You are about to drop the column `terms` on the `Meme` table. All the data in the column will be lost.
  - Added the required column `description` to the `Meme` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source` to the `Meme` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Meme` DROP COLUMN `terms`,
    ADD COLUMN `description` VARCHAR(255) NOT NULL,
    ADD COLUMN `source` VARCHAR(255) NOT NULL,
    ADD COLUMN `tags` JSON NULL;
