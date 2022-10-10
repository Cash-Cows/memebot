-- CreateTable
CREATE TABLE `Consumer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `walletAddress` VARCHAR(255) NOT NULL,
    `discordId` VARCHAR(255) NULL,
    `consumed` VARCHAR(191) NOT NULL DEFAULT '0',
    `images` JSON NOT NULL,

    UNIQUE INDEX `Consumer_walletAddress_key`(`walletAddress`),
    UNIQUE INDEX `Consumer_discordId_key`(`discordId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Search` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `request` VARCHAR(255) NOT NULL,
    `response` JSON NOT NULL,

    UNIQUE INDEX `Search_request_key`(`request`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Source` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `url` VARCHAR(255) NOT NULL,
    `cid` VARCHAR(255) NULL,
    `source` VARCHAR(255) NOT NULL,
    `tags` JSON NULL,
    `data` JSON NULL,
    `up` INTEGER NOT NULL DEFAULT 0,
    `down` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `Source_url_key`(`url`),
    UNIQUE INDEX `Source_cid_key`(`cid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Meme` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `url` VARCHAR(255) NOT NULL,
    `cid` VARCHAR(255) NOT NULL,
    `tags` JSON NULL,
    `up` INTEGER NOT NULL DEFAULT 0,
    `down` INTEGER NOT NULL DEFAULT 0,
    `sourceId` INTEGER NOT NULL,
    `consumerId` INTEGER NOT NULL,

    UNIQUE INDEX `Meme_url_key`(`url`),
    UNIQUE INDEX `Meme_cid_key`(`cid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Meme` ADD CONSTRAINT `Meme_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `Source`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Meme` ADD CONSTRAINT `Meme_consumerId_fkey` FOREIGN KEY (`consumerId`) REFERENCES `Consumer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
