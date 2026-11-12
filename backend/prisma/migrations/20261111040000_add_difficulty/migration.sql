-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('BEGINNER', 'EASY', 'MEDIUM', 'ADVANCED', 'EXPERT');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "difficulty" "Difficulty" NOT NULL DEFAULT 'BEGINNER';
