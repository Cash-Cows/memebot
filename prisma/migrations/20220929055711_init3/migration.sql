/*
  Warnings:

  - A unique constraint covering the columns `[url]` on the table `Source` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Source_url_key` ON `Source`(`url`);
