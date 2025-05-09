/*
  Warnings:

  - The primary key for the `JikanAnimeById` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `JikanAnimeById` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_JikanAnimeById" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "data" JSONB NOT NULL,
    "cachedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_JikanAnimeById" ("cachedAt", "data", "id") SELECT "cachedAt", "data", "id" FROM "JikanAnimeById";
DROP TABLE "JikanAnimeById";
ALTER TABLE "new_JikanAnimeById" RENAME TO "JikanAnimeById";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
