/*
  Warnings:

  - You are about to drop the `JikanAnimeById` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "JikanAnimeById";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "JikanGetAnimeById" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "json" JSONB NOT NULL,
    "cachedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AnimePaheGetIdFromTitle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "json" JSONB NOT NULL,
    "cachedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AnimePaheGetAnime" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "json" JSONB NOT NULL,
    "cachedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
