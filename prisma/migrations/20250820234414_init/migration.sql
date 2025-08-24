/*
  Warnings:

  - You are about to drop the column `userId` on the `CollectionItem` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `WishlistItem` table. All the data in the column will be lost.
  - Added the required column `collectionId` to the `CollectionItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `CollectionItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Decklist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `WishlistItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wishlistId` to the `WishlistItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT 'Main',
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WishlistList" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "WishlistList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CollectionChangeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "scryfallId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "totalAfter" INTEGER NOT NULL,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CollectionChangeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CollectionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scryfallId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "dateAdded" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "priceHistory" JSONB NOT NULL,
    "collectionId" TEXT NOT NULL,
    CONSTRAINT "CollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CollectionItem" ("dateAdded", "id", "priceHistory", "quantity", "scryfallId") SELECT "dateAdded", "id", "priceHistory", "quantity", "scryfallId" FROM "CollectionItem";
DROP TABLE "CollectionItem";
ALTER TABLE "new_CollectionItem" RENAME TO "CollectionItem";
CREATE INDEX "CollectionItem_collectionId_idx" ON "CollectionItem"("collectionId");
CREATE INDEX "CollectionItem_scryfallId_idx" ON "CollectionItem"("scryfallId");
CREATE UNIQUE INDEX "CollectionItem_collectionId_scryfallId_key" ON "CollectionItem"("collectionId", "scryfallId");
CREATE TABLE "new_DeckCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scryfallId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "allocated" INTEGER NOT NULL DEFAULT 0,
    "deckId" TEXT NOT NULL,
    CONSTRAINT "DeckCard_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Decklist" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DeckCard" ("deckId", "id", "quantity", "scryfallId") SELECT "deckId", "id", "quantity", "scryfallId" FROM "DeckCard";
DROP TABLE "DeckCard";
ALTER TABLE "new_DeckCard" RENAME TO "DeckCard";
CREATE TABLE "new_Decklist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "colors" JSONB,
    "showcasedCard" TEXT,
    "format" TEXT NOT NULL DEFAULT 'standard',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Decklist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Decklist" ("createdAt", "id", "name", "userId") SELECT "createdAt", "id", "name", "userId" FROM "Decklist";
DROP TABLE "Decklist";
ALTER TABLE "new_Decklist" RENAME TO "Decklist";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "id", "image", "name") SELECT "createdAt", "email", "emailVerified", "id", "image", "name" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "new_WishlistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scryfallId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "dateAdded" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "wishlistId" TEXT NOT NULL,
    CONSTRAINT "WishlistItem_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "WishlistList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WishlistItem" ("dateAdded", "id", "scryfallId") SELECT "dateAdded", "id", "scryfallId" FROM "WishlistItem";
DROP TABLE "WishlistItem";
ALTER TABLE "new_WishlistItem" RENAME TO "WishlistItem";
CREATE INDEX "WishlistItem_scryfallId_idx" ON "WishlistItem"("scryfallId");
CREATE UNIQUE INDEX "WishlistItem_wishlistId_scryfallId_key" ON "WishlistItem"("wishlistId", "scryfallId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Collection_userId_idx" ON "Collection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_userId_name_key" ON "Collection"("userId", "name");

-- CreateIndex
CREATE INDEX "WishlistList_userId_idx" ON "WishlistList"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistList_userId_name_key" ON "WishlistList"("userId", "name");

-- CreateIndex
CREATE INDEX "CollectionChangeLog_userId_idx" ON "CollectionChangeLog"("userId");

-- CreateIndex
CREATE INDEX "CollectionChangeLog_scryfallId_idx" ON "CollectionChangeLog"("scryfallId");
