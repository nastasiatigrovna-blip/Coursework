import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение БД...');
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const masterPassword = process.env.SEED_MASTER_PASSWORD;
  if (!adminPassword || !masterPassword || adminPassword.length < 12 || masterPassword.length < 12) {
    throw new Error('Для демо-аккаунтов задайте SEED_ADMIN_PASSWORD и SEED_MASTER_PASSWORD (не менее 12 символов)');
  }

  // Админ
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rukodelniza.ru' },
    update: {},
    create: {
      email: 'admin@rukodelniza.ru',
      name: 'Администратор',
      password: await bcrypt.hash(adminPassword, 10),
      role: 'ADMIN',
    },
  });
  console.log('✅ Админ создан:', admin.email);

  // Мастер для демонстрационного каталога
  const master = await prisma.user.upsert({
    where: { email: 'master@rukodelniza.ru' },
    update: {},
    create: {
      email: 'master@rukodelniza.ru',
      name: 'Мастер Рукодельницы',
      password: await bcrypt.hash(masterPassword, 10),
      role: 'MASTER',
    },
  });
  console.log('✅ Мастер создан:', master.email);

  // Категории
  const cat1 = await prisma.category.upsert({
    where: { slug: 'izdeliya' },
    update: {},
    create: { name: 'Изделия', slug: 'izdeliya', description: 'Готовые изделия' },
  });

  const cat2 = await prisma.category.upsert({
    where: { slug: 'skhemy' },
    update: {},
    create: { name: 'Схемы', slug: 'skhemy', description: 'PDF-схемы' },
  });

  const cat3 = await prisma.category.upsert({
    where: { slug: 'video-mk' },
    update: {},
    create: { name: 'Видео МК', slug: 'video-mk', description: 'Видео' },
  });

  const cat4 = await prisma.category.upsert({
    where: { slug: 'komplekty' },
    update: {},
    create: { name: 'Комплекты', slug: 'komplekty', description: 'Изделие+схема+видео' },
  });

  console.log('✅ Категории созданы');

  // Демонстрационная работа с тремя отдельно покупаемыми вариантами.
  const demo = await prisma.product.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Мишка Тедди',
      description: 'Мягкий вязаный мишка. Можно заказать готовое изделие, приобрести схему и видеоурок по созданию игрушки.',
      categoryId: cat4.id,
      ownerId: master.id,
      imageUrl: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=900&q=85',
      status: 'APPROVED',
      options: { create: [
        { type: 'ITEM', price: 1000, stock: 5 },
        { type: 'PATTERN', price: 200, fileUrl: 'https://example.com/teddy-pattern.pdf' },
        { type: 'VIDEO', price: 100, fileUrl: 'https://www.youtube.com/' },
      ] },
    },
  });
  console.log('✅ Демонстрационная работа создана:', demo.name);
  console.log('✅ База данных заполнена!');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
