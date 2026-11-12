-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProductOptionType" AS ENUM ('ITEM', 'PATTERN', 'VIDEO');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'MASTER';

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_categoryId_fkey";

-- DropIndex
DROP INDEX "accesses_userId_productId_key";

-- DropIndex
DROP INDEX "products_type_idx";

-- AlterTable
ALTER TABLE "accesses" ADD COLUMN     "productOptionId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "pdfFileUrl",
DROP COLUMN "price",
DROP COLUMN "stock",
DROP COLUMN "type",
DROP COLUMN "videoUrl",
ADD COLUMN     "moderationNote" TEXT,
ADD COLUMN     "ownerId" INTEGER NOT NULL,
ADD COLUMN     "status" "ProductStatus" NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "ProductType";

-- CreateTable
CREATE TABLE "product_options" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "type" "ProductOptionType" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item_options" (
    "id" SERIAL NOT NULL,
    "orderItemId" INTEGER NOT NULL,
    "productOptionId" INTEGER NOT NULL,
    "optionType" "ProductOptionType" NOT NULL,
    "optionPrice" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "order_item_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_options_productId_idx" ON "product_options"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_options_productId_type_key" ON "product_options"("productId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "order_item_options_orderItemId_productOptionId_key" ON "order_item_options"("orderItemId", "productOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "accesses_userId_productOptionId_key" ON "accesses"("userId", "productOptionId");

-- CreateIndex
CREATE INDEX "products_ownerId_idx" ON "products"("ownerId");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_options" ADD CONSTRAINT "order_item_options_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_options" ADD CONSTRAINT "order_item_options_productOptionId_fkey" FOREIGN KEY ("productOptionId") REFERENCES "product_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accesses" ADD CONSTRAINT "accesses_productOptionId_fkey" FOREIGN KEY ("productOptionId") REFERENCES "product_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;
