/*
  Warnings:

  - You are about to drop the column `source` on the `Meme` table. All the data in the column will be lost.
  - Added the required column `sourceId` to the `Meme` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Meme` DROP COLUMN `source`,
    ADD COLUMN `sourceId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Meme` ADD CONSTRAINT `Meme_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `Source`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
