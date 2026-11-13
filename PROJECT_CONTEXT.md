# Контекст проекта «Рукодельница»

Этот файл сохраняет основные решения и состояние работы над курсовым проектом.

## Автор и курсовая

- Автор: Кузьмина А.М.
- Группа: 23-ИСбо-4а
- Дисциплина: Web-программирование
- Проект: «Рукодельница»
- Тема: маркетплейс изделий ручной работы, схем вязания и видео мастер-классов
- Дата защиты по плану: 13.11.2026

## Идея приложения

Одна карточка работы может содержать варианты покупки:

- Изделие;
- Схема;
- Видео.

Покупатель выбирает варианты галочками, а система суммирует цены, заданные мастером. Цена `0 ₽` означает бесплатный материал. Отсутствующий вариант не отображается.

Новые работы мастеров сначала получают статус `PENDING` и публикуются после одобрения администратора.

## Стек

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, Axios.
- Backend: Node.js, Express, TypeScript, Prisma ORM.
- Database: PostgreSQL.
- Авторизация: JWT и bcrypt.
- Деплой: Render.

## Роли

- `USER` — покупатель;
- `MASTER` — мастер, создающий работы;
- `ADMIN` — администратор, модерирующий работы и управляющий заказами.

## Основные страницы

```text
/                 Главная
/catalog          Каталог
/product/:id      Карточка работы
/cart             Корзина
/about            О проекте
/profile          Личный кабинет
/master           Кабинет мастера
/admin            Админ-панель
/order-success    Подтверждение заказа
```

## Функциональность

### Покупатель

- просмотр каталога;
- поиск и фильтрация по категории;
- фильтр и сортировка по сложности;
- просмотр карточки работы;
- выбор нескольких вариантов покупки;
- корзина;
- демонстрационное оформление заказа;
- история заказов;
- доступ к купленным схемам и видео.

### Мастер

- регистрация с ролью мастера;
- создание карточки работы;
- выбор категории и сложности;
- добавление вариантов изделия, схемы и видео;
- указание цен и количества изделий;
- отправка работы на модерацию;
- просмотр статуса работы.

### Администратор

- модерация работ;
- одобрение и отклонение публикаций;
- управление каталогом;
- просмотр и изменение статусов заказов;
- управление пользователями.

## База данных

Основные модели Prisma:

- `User`;
- `Category`;
- `Product`;
- `ProductOption`;
- `Order`;
- `OrderItem`;
- `OrderItemOption`;
- `Access`.

Миграции находятся в:

```text
backend/prisma/migrations/
```

## Локальный запуск

Нужны Node.js 20–22 LTS и PostgreSQL 15/16.

### Backend

```powershell
cd F:\coursework\backend
npm install
Copy-Item .env.example .env
```

В `backend/.env` необходимо указать:

```env
DATABASE_URL="postgresql://postgres:ВАШ_ПАРОЛЬ@localhost:5432/rukodelniza?schema=public"
JWT_SECRET="локальный-секрет"
PORT=5000
NODE_ENV=development
SEED_ADMIN_PASSWORD="пароль-администратора"
SEED_MASTER_PASSWORD="пароль-мастера"
```

Затем:

```powershell
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
node scripts/add-demo-catalog.cjs
npm run dev
```

### Frontend

В новом терминале:

```powershell
cd F:\coursework\frontend
npm install
npm run dev
```

Локальный адрес:

```text
http://localhost:3000
```

Проверка API:

```text
http://localhost:5000/api/health
```

## Production-сборка

```powershell
cd F:\coursework\backend
npm run build

cd F:\coursework\frontend
npm run build
```

## Деплой

Репозиторий GitHub:

```text
https://github.com/nastasiatigrovna-blip/Coursework
```

Конфигурация Render находится в:

```text
render.yaml
```

Render создаёт бесплатный Web Service и PostgreSQL. Для Blueprint нужно задать секретные переменные:

- `SEED_ADMIN_PASSWORD`;
- `SEED_MASTER_PASSWORD`.

`JWT_SECRET` генерируется Render автоматически, `DATABASE_URL` берётся из базы.

После изменений:

```powershell
git add .
git commit -m "Описание изменений"
git push origin main
```

В Render после push можно нажать **Manual Deploy → Deploy latest commit**.

Бесплатный Render Web Service засыпает после простоя, а первое открытие после сна может занимать около минуты. Бесплатная база Render предназначена для демонстрации и защиты и имеет ограниченный срок хранения.

## Важные файлы

- `README.md` — инструкция по проекту и запуску;
- `DEPLOY.md` — инструкция по Render;
- `render.yaml` — конфигурация деплоя;
- `backend/prisma/schema.prisma` — схема БД;
- `backend/src/server.ts` — сервер;
- `frontend/src/App.tsx` — маршрутизация клиента.

## Курсовая и макеты

Материалы пояснительной записки и локальные рабочие файлы исключены из GitHub и могут храниться отдельно на компьютере. Figma-макеты создавались отдельным плагином, который не входит в deploy-репозиторий.

## Безопасность

- не публиковать `backend/.env`;
- не добавлять пароли в README или GitHub;
- не присылать токены и пароли в чат;
- демонстрационная оплата не является реальной платёжной интеграцией.
