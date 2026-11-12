import express, { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Получить цифровые товары, доступные пользователю
router.get('/my-materials', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const accesses = await prisma.access.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        productOption: true,
        order: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
      orderBy: { grantedAt: 'desc' },
    });

    res.json(accesses);
  } catch (error) {
    console.error('Get my materials error:', error);
    res.status(500).json({ message: 'Ошибка при получении материалов' });
  }
});

// Получить всех пользователей (только админ)
router.get('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.user.count(),
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Ошибка при получении пользователей' });
  }
});

// Обновить роль пользователя (только админ)
router.patch('/:id/role', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Недопустимая роль' });
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Ошибка при обновлении роли пользователя' });
  }
});

export default router;
