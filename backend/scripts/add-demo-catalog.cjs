require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const images = [
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a8/Amigurumi-bear.jpg/960px-Amigurumi-bear.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/50/Amigurumi_Cactus.jpg/960px-Amigurumi_Cactus.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7e/Amigurumi_Chick.jpg/960px-Amigurumi_Chick.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1a/Amigurumi_Halloween_Cat.jpg/960px-Amigurumi_Halloween_Cat.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8c/Crochet-amigurumi_equipment.jpg/960px-Crochet-amigurumi_equipment.jpg',
];

const works = [
    ['Зайчик Облачко', 'Нежный вязаный зайчик для подарка ребёнку.', 'izdeliya', 1400, 350, 200],
  ['Котёнок Рыжик', 'Милый котёнок в технике амигуруми.', 'izdeliya', 1200, 300, 150],
  ['Лисёнок Луна', 'Авторская работа с подробным описанием процесса.', 'izdeliya', 1600, 400, 250],
  ['Подвеска Сердечко', 'Небольшое декоративное изделие для дома.', 'izdeliya', 500, 150, 0],
  ['Шапка Северный узор', 'Тёплая шапка с жаккардовым орнаментом.', 'izdeliya', 1800, 450, 300],
  ['Кардиган Тёплый вечер', 'Уютный кардиган ручной работы.', 'izdeliya', 6500, 800, 500],
  ['Схема Амигуруми: Медвежонок', 'Подробная схема вязания медвежонка в PDF.', 'skhemy', null, 250, 0],
  ['Схема Вязаная корзинка', 'Схема для создания интерьерной корзинки.', 'skhemy', null, 180, 0],
  ['Схема Плед Волны', 'Описание узора и расчёты для пледа.', 'skhemy', null, 350, 0],
  ['Видео: Базовые петли', 'Обучающий урок для начинающих.', 'video-mk', null, 0, 250],
  ['Видео: Вяжем амигуруми', 'Пошаговый видеокурс создания игрушки.', 'video-mk', null, 300, 700],
  ['Видео: Жаккард без страха', 'Практический мастер-класс по жаккарду.', 'video-mk', null, 350, 600],
  ['Комплект Цветочный кот', 'Готовое изделие, схема и видеоурок.', 'komplekty', 2200, 450, 350],
  ['Комплект Домашний уют', 'Изделие для дома, схема и видео мастер-класс.', 'komplekty', 3100, 500, 400],
  ['Комплект Маленький сад', 'Набор из декоративных изделий и обучающих материалов.', 'komplekty', 1700, 300, 250],
];

async function main() {
  const master = await prisma.user.findUnique({ where: { email: 'master@rukodelniza.ru' } });
  if (!master) throw new Error('Сначала создайте master@rukodelniza.ru');

  for (let i = 0; i < works.length; i++) {
    const [name, description, categorySlug, itemPrice, patternPrice, videoPrice] = works[i];
    const difficulties = ['BEGINNER', 'EASY', 'MEDIUM', 'ADVANCED', 'EXPERT'];
    const categoryNames = { izdeliya: 'Изделия', skhemy: 'Схемы', 'video-mk': 'Видео МК', komplekty: 'Комплекты' };
    const category = await prisma.category.upsert({
      where: { slug: categorySlug },
      update: {},
      create: { name: categoryNames[categorySlug], slug: categorySlug, description: categoryNames[categorySlug] },
    });
    const exists = await prisma.product.findFirst({ where: { name } });
    if (exists) continue;
    const options = [];
    if (itemPrice !== null) options.push({ type: 'ITEM', price: itemPrice, stock: 5 });
    if (patternPrice !== null) options.push({ type: 'PATTERN', price: patternPrice, fileUrl: 'https://example.com/materials/pattern.pdf' });
    if (videoPrice !== null) options.push({ type: 'VIDEO', price: videoPrice, fileUrl: 'https://www.youtube.com/' });
    await prisma.product.create({
      data: {
        name, description, categoryId: category.id, ownerId: master.id,
        imageUrl: images[i % images.length], status: 'APPROVED',
        difficulty: difficulties[i % difficulties.length],
        options: { create: options },
      },
    });
  }
  console.log(`Добавлено демонстрационных работ: ${works.length}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
