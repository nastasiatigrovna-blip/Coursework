import express, { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Получить все категории
router.get('/', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Ошибка при получении категорий' });
  }
});

// Создать категорию (только админ)
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, slug, description } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ message: 'Название и slug обязательны' });
    }

    const category = await prisma.category.create({
      data: { name, slug, description },
    });

    res.status(201).json(category);
  } catch (error: any) {
    console.error('Create category error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Категория с таким slug уже существует' });
    }
    res.status(500).json({ message: 'Ошибка при создании категории' });
  }
});

// Обновить категорию (только админ)
router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, description } = req.body;

    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { name, slug, description },
    });

    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Ошибка при обновлении категории' });
  }
});

// Удалить категорию (только админ)
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.category.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Категория удалена' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Ошибка при удалении категории' });
  }
});

export default router;
