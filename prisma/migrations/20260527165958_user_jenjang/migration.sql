-- AlterTable
ALTER TABLE `user` ADD COLUMN `jenjangId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `User_jenjangId_idx` ON `User`(`jenjangId`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_jenjangId_fkey` FOREIGN KEY (`jenjangId`) REFERENCES `JenjangPendidikan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
