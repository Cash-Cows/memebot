/*
  Warnings:

  - You are about to drop the column `terms` on the `Source` table. All the data in the column will be lost.
  - You are about to drop the `Search` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `description` to the `Source` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Source` DROP COLUMN `terms`,
    ADD COLUMN `description` VARCHAR(255) NOT NULL,
    ADD COLUMN `tags` JSON NULL,
    MODIFY `cid` VARCHAR(255) NULL,
    MODIFY `data` JSON NULL;

-- DropTable
DROP TABLE `Search`;
