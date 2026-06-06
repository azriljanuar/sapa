-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN_JENJANG') NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JenjangPendidikan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `singkatan` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TahunAjaran` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `TahunAjaran_nama_key`(`nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Semester` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` ENUM('GANJIL', 'GENAP') NOT NULL,
    `tahunAjaranId` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Semester_tahunAjaranId_nama_key`(`tahunAjaranId`, `nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Guru` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `nip` VARCHAR(191) NOT NULL,
    `jenjangId` INTEGER NOT NULL,

    UNIQUE INDEX `Guru_nip_key`(`nip`),
    INDEX `Guru_jenjangId_idx`(`jenjangId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Santri` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nisn` VARCHAR(191) NOT NULL,
    `namaLengkap` VARCHAR(191) NOT NULL,
    `statusMukim` BOOLEAN NOT NULL DEFAULT false,
    `riwayatKesehatan` TEXT NULL,
    `jenjangId` INTEGER NOT NULL,

    UNIQUE INDEX `Santri_nisn_key`(`nisn`),
    INDEX `Santri_jenjangId_idx`(`jenjangId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KelasFormal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `namaKelas` VARCHAR(191) NOT NULL,
    `jenjangId` INTEGER NOT NULL,
    `waliKelasId` INTEGER NOT NULL,

    INDEX `KelasFormal_waliKelasId_idx`(`waliKelasId`),
    UNIQUE INDEX `KelasFormal_jenjangId_namaKelas_key`(`jenjangId`, `namaKelas`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Semester` ADD CONSTRAINT `Semester_tahunAjaranId_fkey` FOREIGN KEY (`tahunAjaranId`) REFERENCES `TahunAjaran`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Guru` ADD CONSTRAINT `Guru_jenjangId_fkey` FOREIGN KEY (`jenjangId`) REFERENCES `JenjangPendidikan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Santri` ADD CONSTRAINT `Santri_jenjangId_fkey` FOREIGN KEY (`jenjangId`) REFERENCES `JenjangPendidikan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KelasFormal` ADD CONSTRAINT `KelasFormal_jenjangId_fkey` FOREIGN KEY (`jenjangId`) REFERENCES `JenjangPendidikan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KelasFormal` ADD CONSTRAINT `KelasFormal_waliKelasId_fkey` FOREIGN KEY (`waliKelasId`) REFERENCES `Guru`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
