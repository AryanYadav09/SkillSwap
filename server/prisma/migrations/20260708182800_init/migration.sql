-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `profileImage` VARCHAR(191) NULL,
    `bio` TEXT NULL,
    `college` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NOT NULL,
    `semester` VARCHAR(191) NOT NULL,
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `status` ENUM('ACTIVE', 'BANNED') NOT NULL DEFAULT 'ACTIVE',
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `refreshToken` TEXT NULL,
    `passwordResetToken` VARCHAR(191) NULL,
    `passwordResetTokenExpiry` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `skills` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `skills_name_category_key`(`name`, `category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_offered_skills` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `skillId` VARCHAR(191) NOT NULL,
    `level` ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_offered_skills_userId_skillId_key`(`userId`, `skillId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_learning_skills` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `skillId` VARCHAR(191) NOT NULL,
    `goal` TEXT NOT NULL,
    `currentLevel` ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_learning_skills_userId_skillId_key`(`userId`, `skillId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `match_requests` (
    `id` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `receiverId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `message` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `match_requests_senderId_receiverId_status_idx`(`senderId`, `receiverId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chats` (
    `id` VARCHAR(191) NOT NULL,
    `user1Id` VARCHAR(191) NOT NULL,
    `user2Id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `chats_user1Id_user2Id_key`(`user1Id`, `user2Id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` VARCHAR(191) NOT NULL,
    `chatId` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `message` TEXT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `isSeen` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `messages_chatId_createdAt_idx`(`chatId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(191) NOT NULL,
    `matchRequestId` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `sessionDate` DATETIME(3) NOT NULL,
    `duration` INTEGER NOT NULL,
    `status` ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `sessions_sessionDate_status_idx`(`sessionDate`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviews` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `reviewerId` VARCHAR(191) NOT NULL,
    `reviewedUserId` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `reviews_sessionId_reviewerId_key`(`sessionId`, `reviewerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `type` ENUM('MATCH_REQUEST', 'MATCH_ACCEPTED', 'MATCH_REJECTED', 'SESSION_SCHEDULED', 'REVIEW_ADDED', 'NEW_MESSAGE', 'SYSTEM') NOT NULL DEFAULT 'SYSTEM',
    `entityId` VARCHAR(191) NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `notifications_userId_isRead_idx`(`userId`, `isRead`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookmarks` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `bookmarkedUserId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `bookmarks_userId_bookmarkedUserId_key`(`userId`, `bookmarkedUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reports` (
    `id` VARCHAR(191) NOT NULL,
    `reporterId` VARCHAR(191) NOT NULL,
    `reportedUserId` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('PENDING', 'RESOLVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `adminNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `reports_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_offered_skills` ADD CONSTRAINT `user_offered_skills_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_offered_skills` ADD CONSTRAINT `user_offered_skills_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `skills`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_learning_skills` ADD CONSTRAINT `user_learning_skills_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_learning_skills` ADD CONSTRAINT `user_learning_skills_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `skills`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_requests` ADD CONSTRAINT `match_requests_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_requests` ADD CONSTRAINT `match_requests_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chats` ADD CONSTRAINT `chats_user1Id_fkey` FOREIGN KEY (`user1Id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chats` ADD CONSTRAINT `chats_user2Id_fkey` FOREIGN KEY (`user2Id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `chats`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_matchRequestId_fkey` FOREIGN KEY (`matchRequestId`) REFERENCES `match_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_reviewedUserId_fkey` FOREIGN KEY (`reviewedUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookmarks` ADD CONSTRAINT `bookmarks_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookmarks` ADD CONSTRAINT `bookmarks_bookmarkedUserId_fkey` FOREIGN KEY (`bookmarkedUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_reportedUserId_fkey` FOREIGN KEY (`reportedUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
