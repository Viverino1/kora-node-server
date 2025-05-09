/*
  Warnings:

  - You are about to drop the column `data` on the `JikanAnimeById` table. All the data in the column will be lost.
  - Added the required column `json` to the `JikanAnimeById` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_JikanAnimeById" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "json" JSONB NOT NULL,
    "cachedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_JikanAnimeById" ("cachedAt", "id") SELECT "cachedAt", "id" FROM "JikanAnimeById";
DROP TABLE "JikanAnimeById";
ALTER TABLE "new_JikanAnimeById" RENAME TO "JikanAnimeById";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
