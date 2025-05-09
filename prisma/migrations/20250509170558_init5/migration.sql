/*
  Warnings:

  - You are about to drop the `AnimePaheGetAnime` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AnimePaheGetIdFromTitle` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `JikanGetAnimeById` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AnimePaheGetAnime";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AnimePaheGetIdFromTitle";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "JikanGetAnimeById";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "CacheJSON" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "cachedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "json" JSONB NOT NULL
);
