-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Decklist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "colors" JSONB,
    "showcasedDeckCardId" TEXT,
    "showcasedArt" TEXT,
    "format" TEXT NOT NULL DEFAULT 'standard',
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Decklist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Decklist_showcasedDeckCardId_fkey" FOREIGN KEY ("showcasedDeckCardId") REFERENCES "DeckCard" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Decklist" ("colors", "createdAt", "format", "id", "name", "showcasedArt", "showcasedDeckCardId", "updatedAt", "userId") SELECT "colors", "createdAt", "format", "id", "name", "showcasedArt", "showcasedDeckCardId", "updatedAt", "userId" FROM "Decklist";
DROP TABLE "Decklist";
ALTER TABLE "new_Decklist" RENAME TO "Decklist";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
