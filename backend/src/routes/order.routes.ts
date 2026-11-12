import express, { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Создать заказ
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { items, customerName, customerPhone, deliveryAddress } = req.body;
    const userId = req.user!.userId;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Корзина пуста' });
    }

    if (!customerName || !customerPhone) {
      return res.status(400).json({ message: 'ФИО и телефон обязательны' });
    }

    // Each cart line selects one or more explicitly priced options. Never trust client prices.
    let totalPrice = 0;
    const preparedItems: Array<{ productId: number; quantity: number; options: Array<{ id: number; type: string; price: number }> }> = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: Number(item.productId) }, include: { options: true } });

      if (!product || product.status !== 'APPROVED') return res.status(404).json({ message: 'Работа не найдена или ещё не опубликована' });
      const selectedIds: number[] = Array.isArray(item.optionIds) ? item.optionIds.map(Number) : [];
      if (!selectedIds.length || new Set(selectedIds).size !== selectedIds.length) return res.status(400).json({ message: `Выберите варианты покупки для «${product.name}»` });
      const selectedOptions = product.options.filter((option) => selectedIds.includes(option.id));
      if (selectedOptions.length !== selectedIds.length) return res.status(400).json({ message: 'Один из выбранных вариантов недоступен' });
      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
      if (selectedOptions.some((option) => option.type === 'ITEM' && option.stock !== null && option.stock < quantity)) return res.status(400).json({ message: `Недостаточно изделий «${product.name}» в наличии` });

      const itemTotal = selectedOptions.reduce((sum, option) => sum + Number(option.price), 0) * quantity;
      totalPrice += itemTotal;
      preparedItems.push({ productId: product.id, quantity, options: selectedOptions.map((option) => ({ id: option.id, type: option.type, price: Number(option.price) })) });
    }

    // Создание заказа и позиций в транзакции
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          status: 'PAID', // MVP: сразу "оплачен"
          totalPrice,
          customerName,
          customerPhone,
          deliveryAddress: deliveryAddress || null,
        },
      });

      for (const item of preparedItems) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: newOrder.id, productId: item.productId, quantity: item.quantity,
            price: item.options.reduce((sum, option) => sum + option.price, 0),
            productName: product!.name,
            options: { create: item.options.map((option) => ({ productOptionId: option.id, optionType: option.type as any, optionPrice: option.price })) },
          },
        });
        for (const option of item.options.filter((selected) => selected.type !== 'ITEM')) {
          await tx.access.upsert({
            where: { userId_productOptionId: { userId, productOptionId: option.id } },
            update: { orderId: newOrder.id },
            create: { userId, productId: item.productId, productOptionId: option.id, orderId: newOrder.id },
          });
        }
        if (item.options.some((option) => option.type === 'ITEM')) {
          const itemOption = item.options.find((option) => option.type === 'ITEM')!;
          await tx.productOption.updateMany({ where: { id: itemOption.id, stock: { not: null } }, data: { stock: { decrement: item.quantity } } });
        }
      }

      return newOrder;
    });

    res.status(201).json({
      message: 'Заказ успешно создан',
      order,
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Доступ к этому товару уже выдан' });
    }
    res.status(500).json({ message: 'Ошибка при создании заказа' });
  }
});

// Получить заказы текущего пользователя
router.get('/my', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
          orderItems: {
            include: {
              product: true,
              options: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ message: 'Ошибка при получении заказов' });
  }
});

// Получить все заказы (только админ)
router.get('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
          orderItems: {
            include: { product: true, options: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Ошибка при получении заказов' });
  }
});

// Обновить статус заказа (только админ)
router.patch('/:id/status', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Статус обязателен' });
    }

    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status },
    });

    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Ошибка при обновлении статуса заказа' });
  }
});

export default router;
