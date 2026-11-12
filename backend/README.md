# Backend «Рукодельница»

## 🚀 Быстрый старт

### 1. Установите зависимости
```bash
cd F:\coursework\backend
npm install
```

### 2. Настройте БД
Откройте `.env` и измените строку подключения, если ваш пароль PostgreSQL другой:
```
DATABASE_URL="postgresql://postgres:ВАШ_ПАРОЛЬ@localhost:5432/rukodelniza?schema=public"
```

### 3. Создайте таблицы в БД
```bash
npm run prisma:generate
npm run prisma:migrate
```

При запросе имени миграции введите: `init`

### 4. Заполните БД демо-данными
```bash
npm run prisma:seed
```

### 5. Запустите сервер
```bash
npm run dev
```

Сервер запустится на `http://localhost:5000`

## 📄 API Endpoints

### Авторизация (`/api/auth`)
- `POST /api/auth/register` — регистрация
- `POST /api/auth/login` — вход
- `GET /api/auth/me` — текущий пользователь (требует токен)

### Категории (`/api/categories`)
- `GET /api/categories` — все категории
- `POST /api/categories` — создать (только админ)
- `PUT /api/categories/:id` — обновить (только админ)
- `DELETE /api/categories/:id` — удалить (только админ)

### Товары (`/api/products`)
- `GET /api/products` — все товары (поддерживает фильтрацию: `?categoryId=1&type=PHYSICAL&search=свитер`)
- `GET /api/products/:id` — товар по ID
- `POST /api/products` — создать (только админ)
- `PUT /api/products/:id` — обновить (только админ)
- `DELETE /api/products/:id` — удалить (только админ)

### Заказы (`/api/orders`)
- `POST /api/orders` — создать заказ (требует токен)
- `GET /api/orders/my` — мои заказы (требует токен)
- `GET /api/orders` — все заказы (только админ)
- `PATCH /api/orders/:id/status` — изменить статус (только админ)

### Пользователи (`/api/users`)
- `GET /api/users/my-materials` — мои цифровые материалы (требует токен)
- `GET /api/users` — все пользователи (только админ)
- `PATCH /api/users/:id/role` — изменить роль (только админ)

## 🔐 Тестовые данные

После выполнения `npm run prisma:seed`:

**Админ:**
- Email: `admin@rukodelniza.ru`
- Пароль: `admin123`

**Пользователь:**
- Email: `user@example.com`
- Пароль: `user123`

**Товары:** 4 демо-товара (свитер, PDF, видео, комплект)

## 🛠 Полезные команды

```bash
# Разработка (hot reload)
npm run dev

# Сборка для production
npm run build
npm start

# Prisma
npm run prisma:generate  # Генерация Prisma Client
npm run prisma:migrate   # Создание миграции
npm run prisma:seed      # Заполнение БД

# Просмотр БД через Prisma Studio
npx prisma studio
```

## 📁 Структура

```
backend/
├── src/
│   ├── lib/
│   │   └── prisma.ts          # Prisma Client
│   ├── middleware/
│   │   └── auth.middleware.ts # JWT проверка
│   ├── routes/
│   │   ├── auth.routes.ts     # Регистрация/вход
│   │   ├── category.routes.ts # Категории
│   │   ├── product.routes.ts  # Товары
│   │   ├── order.routes.ts    # Заказы
│   │   └── user.routes.ts     # Пользователи
│   └── server.ts              # Точка входа
├── prisma/
│   ├── schema.prisma          # Prisma схема БД
│   └── seed.ts                # Seed-скрипт
├── .env                       # Переменные окружения
├── package.json
└── tsconfig.json
```

## ⚙️ Переменные окружения (.env)

```env
DATABASE_URL="postgresql://postgres:admin123@localhost:5432/rukodelniza?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=5000
NODE_ENV=development
```

## 🐛 Troubleshooting

**Ошибка подключения к БД:**
- Убедитесь, что PostgreSQL запущен
- Проверьте пароль в `.env`
- Убедитесь, что БД `rukodelniza` создана (создайте через pgAdmin)

**Prisma не находит БД:**
```bash
npm run prisma:generate
npm run prisma:migrate
```

**Ошибка "Cannot find module '@prisma/client'":**
```bash
npm run prisma:generate
```
