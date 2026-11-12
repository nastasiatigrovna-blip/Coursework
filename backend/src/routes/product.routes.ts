import express, { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const optionTypes = ['ITEM', 'PATTERN', 'VIDEO'] as const;

function canManage(user: Express.Request['user'], ownerId: number) {
  return user?.role === 'ADMIN' || (user?.role === 'MASTER' && user.userId === ownerId);
}

// Public catalog: only approved cards are visible.
router.get('/', async (req: Request, res: Response) => {
  try {
    const { categoryId, search, difficulty, sort = 'newest', page = '1', limit = '12' } = req.query;
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(limit) || 12));
    const where: any = { status: 'APPROVED' };
    if (categoryId && Number.isInteger(Number(categoryId))) where.categoryId = Number(categoryId);
    if (search) where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { description: { contains: String(search), mode: 'insensitive' } },
    ];
    if (difficulty) where.difficulty = difficulty;
    const orderBy = sort === 'name' ? { name: 'asc' as const } : sort === 'difficulty' ? { difficulty: 'asc' as const } : { createdAt: 'desc' as const };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, owner: { select: { id: true, name: true } }, options: true },
        orderBy,
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);
    res.json({ products, pagination: { page: pageNumber, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) } });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Ошибка при получении товаров' });
  }
});

// Current master's own submissions, including pending/rejected.
router.get('/mine', authMiddleware, async (req: Request, res: Response) => {
  if (req.user!.role !== 'MASTER' && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Раздел доступен мастерам' });
  }
  const products = await prisma.product.findMany({
    where: req.user!.role === 'ADMIN' ? undefined : { ownerId: req.user!.userId },
    include: { category: true, options: true, owner: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(products);
});

router.get('/admin/all', authMiddleware, adminMiddleware, async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    include: { category: true, options: true, owner: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(products);
});

// Admin moderation queue.
router.get('/moderation', authMiddleware, adminMiddleware, async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    where: { status: 'PENDING' },
    include: { category: true, options: true, owner: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  });
  res.json(products);
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: 'Некорректный ID' });
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, owner: { select: { id: true, name: true } }, options: true },
    });
    if (!product || product.status !== 'APPROVED') {
      // The owner and admin can view their unpublished cards.
      const token = req.headers.authorization?.split(' ')[1];
      if (!product || !token) return res.status(404).json({ message: 'Работа не найдена' });
      const jwt = await import('jsonwebtoken');
      try {
        const payload = jwt.default.verify(token, process.env.JWT_SECRET!) as { userId: number; role: string };
        if (!canManage(payload as any, product.ownerId)) return res.status(404).json({ message: 'Работа не найдена' });
      } catch { return res.status(404).json({ message: 'Работа не найдена' }); }
    }
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Ошибка при получении работы' });
  }
});

// Masters create a work card with one or more priced options. Price 0 means free.
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'MASTER' && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Создавать работы могут только мастера' });
    }
    const { name, description, categoryId, imageUrl, difficulty, options } = req.body;
    if (!name?.trim() || !description?.trim() || !Number.isInteger(Number(categoryId)) || !imageUrl?.trim()) {
      return res.status(400).json({ message: 'Заполните название, описание, категорию и ссылку на фото' });
    }
    if (!['BEGINNER', 'EASY', 'MEDIUM', 'ADVANCED', 'EXPERT'].includes(difficulty)) return res.status(400).json({ message: 'Выберите сложность работы' });
    if (!Array.isArray(options) || options.length === 0 || options.some((o: any) => !optionTypes.includes(o.type) || !Number.isFinite(Number(o.price)) || Number(o.price) < 0)) {
      return res.status(400).json({ message: 'Укажите доступные варианты и их неотрицательные цены' });
    }
    if (new Set(options.map((o: any) => o.type)).size !== options.length) {
      return res.status(400).json({ message: 'Вариант нельзя указать несколько раз' });
    }
    const product = await prisma.product.create({
      data: {
        name: name.trim(), description: description.trim(), categoryId: Number(categoryId), imageUrl: imageUrl.trim(), difficulty,
        ownerId: req.user!.userId,
        status: 'PENDING',
        options: { create: options.map((o: any) => ({ type: o.type, price: Number(o.price), stock: o.type === 'ITEM' && o.stock !== '' && o.stock != null ? Number(o.stock) : null, fileUrl: o.type === 'PATTERN' || o.type === 'VIDEO' ? (o.fileUrl?.trim() || null) : null })) },
      },
      include: { category: true, options: true },
    });
    res.status(201).json({ message: 'Работа отправлена администратору на проверку', product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Не удалось отправить работу на проверку' });
  }
});

// Owner can edit their card; changed cards return to moderation.
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const current = await prisma.product.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ message: 'Работа не найдена' });
    if (!canManage(req.user, current.ownerId)) return res.status(403).json({ message: 'Нет прав на редактирование' });
    const { name, description, categoryId, imageUrl, difficulty, options } = req.body;
    if (!name?.trim() || !description?.trim() || !imageUrl?.trim() || !['BEGINNER', 'EASY', 'MEDIUM', 'ADVANCED', 'EXPERT'].includes(difficulty) || !Array.isArray(options) || options.length === 0 || options.some((o: any) => !optionTypes.includes(o.type) || !Number.isFinite(Number(o.price)) || Number(o.price) < 0)) {
      return res.status(400).json({ message: 'Проверьте поля работы и варианты покупки' });
    }
    const product = await prisma.$transaction(async (tx) => {
      await tx.productOption.deleteMany({ where: { productId: id } });
      return tx.product.update({
        where: { id },
        data: {
          name: name.trim(), description: description.trim(), imageUrl: imageUrl.trim(),
          categoryId: Number(categoryId), difficulty, status: req.user!.role === 'ADMIN' ? current.status : 'PENDING',
          moderationNote: null,
          options: { create: options.map((o: any) => ({ type: o.type, price: Number(o.price), stock: o.type === 'ITEM' && o.stock !== '' && o.stock != null ? Number(o.stock) : null, fileUrl: o.type !== 'ITEM' ? (o.fileUrl?.trim() || null) : null })) },
        }, include: { category: true, options: true },
      });
    });
    res.json({ message: product.status === 'PENDING' ? 'Изменения отправлены на проверку' : 'Работа обновлена', product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Ошибка при обновлении работы' });
  }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ message: 'Работа не найдена' });
    if (!canManage(req.user, product.ownerId)) return res.status(403).json({ message: 'Нет прав на удаление' });
    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Работа удалена' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Не удалось удалить работу. Возможно, она уже есть в заказах.' });
  }
});

router.patch('/:id/moderation', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status, moderationNote } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) return res.status(400).json({ message: 'Выберите решение модерации' });
    const product = await prisma.product.update({ where: { id }, data: { status, moderationNote: status === 'REJECTED' ? String(moderationNote || '').trim() : null } });
    res.json(product);
  } catch (error) {
    console.error('Moderation error:', error);
    res.status(500).json({ message: 'Ошибка модерации' });
  }
});

export default router;
