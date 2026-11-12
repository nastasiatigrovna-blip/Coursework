# Развёртывание «Рукодельницы» на Render

## Подготовлено

- `render.yaml` создаёт бесплатный Web Service и PostgreSQL;
- React собирается в `frontend/dist`;
- Express отдаёт React и REST API с одного адреса;
- миграции Prisma и демонстрационный каталог запускаются при деплое.

## Публикация через GitHub

1. Создайте новый GitHub-репозиторий.
2. Не загружайте `backend/.env` и секреты.
3. В PowerShell из `F:\coursework` выполните:

```powershell
git init
git add .
git commit -m "Prepare deployment"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/ВАШ_РЕПОЗИТОРИЙ.git
git push -u origin main
```

4. В Render выберите **New → Blueprint**.
5. Подключите GitHub и выберите репозиторий.
6. Render найдёт `render.yaml` и создаст сервис и базу.
7. Для переменных `SEED_ADMIN_PASSWORD` и `SEED_MASTER_PASSWORD` задайте **два разных пароля минимум по 12 символов**. Не публикуйте их в GitHub и не присылайте в чат.

Бесплатная база Render подходит для защиты и тестирования, но имеет ограниченный срок хранения. Для постоянной работы позже можно заменить её на Neon Free.

## Тестовые аккаунты

```text
Администратор: admin@rukodelniza.ru / пароль SEED_ADMIN_PASSWORD
Мастер: master@rukodelniza.ru / пароль SEED_MASTER_PASSWORD
```
