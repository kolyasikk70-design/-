# 🚀 Інструкція: Деплой сайту та бази даних на Cloudflare (Pages + D1)

Ця інструкція показує, як безкоштовно опублікувати сайт б'юті-студії та підключити облачну базу даних **Cloudflare D1 (SQLite)**.

---

## Варіант 1. Автоматичний деплой через Термінал (Рекомендований, 2 хвилини)

Для цього потрібні тільки `Node.js` та акаунт у [Cloudflare.com](https://dash.cloudflare.com).

### Крок 1. Увійдіть у Cloudflare через термінал
Введіть команду у командному рядку (PowerShell):
```bash
npx wrangler login
```
У браузері відкриється сторінка Cloudflare — натисніть **Allow**.

---

### Крок 2. Створіть базу даних D1
Виконайте команду:
```bash
npx wrangler d1 create beauty_db
```
У терміналі з'явиться вивід с `database_id`:
```
[[d1_databases]]
binding = "DB"
database_name = "beauty_db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```
Скопіюйте ваш `database_id` та вставте його у файл `wrangler.toml` у проекті.

---

### Крок 3. Примените структуру таблицы (schema.sql)
Виконайте команду для створення таблиць у вашій облачній БД:
```bash
npx wrangler d1 execute beauty_db --remote --file=./schema.sql
```

---

### Крок 4. Опублікуйте проект на Cloudflare Pages
Виконайте команду деплою:
```bash
npx wrangler pages deploy . --project-name=beauty-salon-kyiv
```

Вітаємо! Ваш сайт опубліковано на безкоштовному домені вида:
`https://beauty-salon-kyiv.pages.dev`

---

## Варіант 2. Через Панель Управління Cloudflare Dashboard (GUI)

1. Зайдіть у [Cloudflare Dashboard](https://dash.cloudflare.com) ➔ **Workers & Pages**.
2. Перейдіть у вкладинку **D1** ➔ Натисніть **Create Database** ➔ Назва `beauty_db`.
3. Зайдіть у створену БД ➔ Натисніть **Console** ➔ Вставте вміст файлу `schema.sql` ➔ Натисніть **Execute**.
4. Перейдіть у **Pages** ➔ **Create a project** ➔ Підключіть ваш GitHub репозиторій.
5. У налаштуваннях проекту (**Settings ➔ Functions ➔ D1 database bindings**):
   - **Variable name**: `DB`
   - **D1 database**: Оберіть `beauty_db`.

---

## 📊 Як переглядати записи клієнтів з сайту?

Всі записи потрапляють у базу даних D1. Ви можете переглядати їх прямо у панелі Cloudflare:
- [dash.cloudflare.com](https://dash.cloudflare.com) ➔ **Workers & Pages** ➔ **D1** ➔ **beauty_db** ➔ **Explore / Console**.
- Выполните SQL запрос:
  ```sql
  SELECT * FROM bookings ORDER BY created_at DESC;
  ```
